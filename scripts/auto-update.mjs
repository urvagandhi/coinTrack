#!/usr/bin/env node
/**
 * auto-update.mjs — Unified Knowledge Graph Auto-Update Pipeline
 *
 * Simultaneously keeps both codebase knowledge graphs in sync with code changes:
 *   1. Understand Anything (.ua/knowledge-graph.json & .ua/fingerprints.json)
 *   2. Graphify (graphify-out/graph.json, graphify-out/graph.html, graphify-out/GRAPH_REPORT.md)
 *
 * Can be run from:
 *   - Git post-commit hook (.git/hooks/post-commit)
 *   - Continuous file watcher (scripts/watch.mjs)
 *   - Global CLI / terminal command (graph-auto-update or node scripts/auto-update.mjs)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ARGS = process.argv.slice(2);
const UA_ONLY = ARGS.includes('--ua-only');
const GRAPHIFY_ONLY = ARGS.includes('--graphify-only');
const FORCE_FULL = ARGS.includes('--force');

function resolveProjectRoot() {
  const customPath = ARGS.find(arg => !arg.startsWith('--'));
  if (customPath && fs.existsSync(customPath)) {
    return path.resolve(customPath);
  }
  if (process.env.PROJECT_ROOT && fs.existsSync(process.env.PROJECT_ROOT)) {
    return path.resolve(process.env.PROJECT_ROOT);
  }
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel 2>/dev/null', { encoding: 'utf8' }).trim();
    if (gitRoot && fs.existsSync(gitRoot)) return gitRoot;
  } catch (e) {}

  let curr = process.cwd();
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, '.git')) || fs.existsSync(path.join(curr, '.ua')) || fs.existsSync(path.join(curr, 'graphify-out'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

const PROJECT_ROOT = resolveProjectRoot();
const UA_DIR = path.join(PROJECT_ROOT, '.ua');
const GRAPHIFY_DIR = path.join(PROJECT_ROOT, 'graphify-out');
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(process.env.HOME || '', '.understand-anything-plugin');
const SKILL_DIR = path.join(PLUGIN_ROOT, 'skills/understand');

function log(module, msg) {
  console.log(`[${module}] ${msg}`);
}

function runCmd(cmd, cwd = PROJECT_ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` } }).trim();
  } catch (err) {
    const out = err.stdout?.trim() || err.stderr?.trim() || err.message;
    throw new Error(`Command failed: ${cmd}\n${out}`);
  }
}

async function updateUnderstandAnything() {
  if (!fs.existsSync(UA_DIR)) {
    log('understand', 'Data directory .ua not found. Skipping Understand Anything update.');
    return;
  }

  const metaPath = path.join(UA_DIR, 'meta.json');
  const graphPath = path.join(UA_DIR, 'knowledge-graph.json');

  if (!fs.existsSync(metaPath) || !fs.existsSync(graphPath)) {
    log('understand', 'Baseline knowledge-graph.json or meta.json missing. Skipping Understand Anything.');
    return;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const lastCommit = meta.gitCommitHash;
  let currentHead = 'HEAD';
  try {
    currentHead = runCmd('git rev-parse HEAD');
  } catch (e) {}

  log('understand', `Preparing incremental analysis (base: ${lastCommit?.slice(0, 7) || 'initial'}, HEAD: ${currentHead.slice(0, 7)})...`);

  fs.mkdirSync(path.join(UA_DIR, 'intermediate'), { recursive: true });
  fs.mkdirSync(path.join(UA_DIR, 'tmp'), { recursive: true });

  let plan = null;
  if (!FORCE_FULL && lastCommit) {
    const prepareCmd = `node "${path.join(SKILL_DIR, 'prepare-incremental.mjs')}" "${PROJECT_ROOT}" "${lastCommit}"`;
    try {
      execSync(prepareCmd, { cwd: PROJECT_ROOT, stdio: 'inherit' });
      const planPath = path.join(UA_DIR, 'intermediate/incremental-plan.json');
      if (fs.existsSync(planPath)) {
        plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      }
    } catch (err) {
      log('understand', `Incremental plan fallback: ${err.message?.split('\n')[0] || err.message}. Triggering FULL_UPDATE.`);
    }
  }

  if (!plan) {
    plan = { action: 'FULL_UPDATE' };
  }

  log('understand', `Plan action: ${plan.action} (reanalyze: ${plan.filesToReanalyze?.length || 0}, deleted: ${plan.deletedFiles?.length || 0})`);

  if (plan.action === 'SKIP') {
    runCmd(`node "${path.join(SKILL_DIR, 'finalize-incremental.mjs')}" "${PROJECT_ROOT}"`);
    log('understand', 'Knowledge graph is up-to-date with working tree and commit.');
    return;
  }

  const isFull = plan.action === 'FULL_UPDATE';
  if (isFull || (plan.filesToReanalyze && plan.filesToReanalyze.length > 0)) {
    if (isFull) {
      log('understand', 'Scanning project structure for full baseline refresh...');
      const scanOut = path.join(UA_DIR, 'intermediate/scan-result.json');
      runCmd(`node "${path.join(SKILL_DIR, 'scan-project.mjs')}" "${PROJECT_ROOT}" "${scanOut}"`);
    } else {
      log('understand', `Re-analyzing ${plan.filesToReanalyze.length} changed files...`);
    }

    const changedFilesArg = isFull ? '' : `--changed-files="${path.join(UA_DIR, 'intermediate/changed-files.json')}"`;
    runCmd(`node "${path.join(SKILL_DIR, 'compute-batches.mjs')}" "${PROJECT_ROOT}" ${changedFilesArg}`);

    const batchesJsonPath = path.join(UA_DIR, 'intermediate/batches.json');
    if (fs.existsSync(batchesJsonPath)) {
      const batchesData = JSON.parse(fs.readFileSync(batchesJsonPath, 'utf8'));
      
      for (const batch of batchesData.batches || []) {
        const inPath = path.join(UA_DIR, `tmp/ua-file-analyzer-input-${batch.batchIndex}.json`);
        const outPath = path.join(UA_DIR, `tmp/ua-file-extract-results-${batch.batchIndex}.json`);
        
        fs.writeFileSync(inPath, JSON.stringify({
          projectRoot: PROJECT_ROOT,
          batchFiles: batch.files,
          batchImportData: batch.batchImportData
        }));

        execSync(`node "${path.join(SKILL_DIR, 'extract-structure.mjs')}" "${inPath}" "${outPath}"`);
        const extractData = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        const resultsByPath = new Map();
        for (const r of extractData.results || []) resultsByPath.set(r.path, r);

        const nodes = [];
        const edges = [];
        const seen = new Set();
        function addNode(n) { if (!seen.has(n.id)) { seen.add(n.id); nodes.push(n); } }

        for (const f of batch.files) {
          const ext = path.extname(f.path).toLowerCase();
          const res = resultsByPath.get(f.path) || { totalLines: f.sizeLines || 20, nonEmptyLines: f.sizeLines || 20, functions: [], classes: [], callGraph: [] };
          const lines = res.totalLines || f.sizeLines || 20;
          const complexity = lines < 50 ? 'simple' : lines <= 200 ? 'moderate' : 'complex';
          
          let type = 'file';
          if (f.fileCategory === 'config') type = 'config';
          else if (f.fileCategory === 'docs') type = 'document';
          else if (f.fileCategory === 'infra') {
            type = (f.path.includes('Docker') || f.path.includes('compose')) ? 'service' : (f.path.includes('.github') ? 'pipeline' : 'resource');
          } else if (f.fileCategory === 'data') {
            type = f.path.endsWith('.sql') ? 'table' : 'schema';
          }

          const fileNodeId = `${type}:${f.path}`;
          const fileNode = {
            id: fileNodeId,
            type,
            name: path.basename(f.path),
            path: f.path,
            language: ext.slice(1) || 'unknown',
            summary: `${f.fileCategory || 'source'} component with ${lines} lines (${complexity}).`,
            lines,
            complexity,
            reasoning: `Extracted via AST structural analysis.`
          };
          addNode(fileNode);

          for (const fn of res.functions || []) {
            const fnId = `function:${f.path}#${fn.name}`;
            addNode({
              id: fnId,
              type: 'function',
              name: fn.name,
              path: f.path,
              language: fileNode.language,
              summary: `Function ${fn.name} in ${path.basename(f.path)} (${fn.lines || 1} lines).`,
              lines: fn.lines || 1,
              complexity: (fn.lines || 1) > 50 ? 'complex' : 'simple',
              startLine: fn.startLine,
              endLine: fn.endLine
            });
            edges.push({
              source: fileNodeId,
              target: fnId,
              relation: 'contains',
              confidence: 1.0,
              weight: 0.9,
              reason: 'File contains function definition'
            });
          }

          for (const cls of res.classes || []) {
            const clsId = `class:${f.path}#${cls.name}`;
            addNode({
              id: clsId,
              type: 'class',
              name: cls.name,
              path: f.path,
              language: fileNode.language,
              summary: `Class ${cls.name} in ${path.basename(f.path)} (${cls.lines || 1} lines).`,
              lines: cls.lines || 1,
              complexity: (cls.lines || 1) > 100 ? 'complex' : 'moderate',
              startLine: cls.startLine,
              endLine: cls.endLine
            });
            edges.push({
              source: fileNodeId,
              target: clsId,
              relation: 'contains',
              confidence: 1.0,
              weight: 0.9,
              reason: 'File contains class definition'
            });
          }

          if (batch.batchImportData && batch.batchImportData[f.path]) {
            for (const imp of batch.batchImportData[f.path]) {
              if (imp.resolvedPath) {
                edges.push({
                  source: fileNodeId,
                  target: `file:${imp.resolvedPath}`,
                  relation: 'imports',
                  confidence: 0.95,
                  weight: 0.7,
                  reason: `Imports from ${imp.source}`
                });
              }
            }
          }
        }

        const batchOutput = {
          batchIndex: batch.batchIndex,
          totalBatches: batchesData.batches.length,
          filesAnalyzed: batch.files.length,
          nodes,
          edges
        };

        const batchFile = path.join(UA_DIR, `intermediate/batch-${batch.batchIndex}.json`);
        fs.writeFileSync(batchFile, JSON.stringify(batchOutput, null, 2));
      }

      log('understand', 'Merging batch updates into assembled graph...');
      runCmd(`python3 "${path.join(SKILL_DIR, 'merge-batch-graphs.py')}" "${PROJECT_ROOT}"`);
    }
  }

  // Preserve layers and tours from baseline
  try {
    const currentKg = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const intermediateLayers = path.join(UA_DIR, 'intermediate/layers.json');
    const intermediateTour = path.join(UA_DIR, 'intermediate/tour.json');
    if (!fs.existsSync(intermediateLayers) && currentKg.layers) {
      fs.writeFileSync(intermediateLayers, JSON.stringify(currentKg.layers, null, 2));
    }
    if (!fs.existsSync(intermediateTour) && currentKg.tour) {
      fs.writeFileSync(intermediateTour, JSON.stringify(currentKg.tour, null, 2));
    }
  } catch (e) {}

  if (isFull) {
    log('understand', 'Finalizing full graph update from assembled graph...');
    const assembledPath = path.join(UA_DIR, 'intermediate/assembled-graph.json');
    const assembled = JSON.parse(fs.readFileSync(assembledPath, 'utf8'));
    const prevKg = fs.existsSync(graphPath) ? JSON.parse(fs.readFileSync(graphPath, 'utf8')) : {};
    
    const newKg = {
      ...prevKg,
      nodes: assembled.nodes,
      edges: assembled.edges,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...(prevKg.metadata || {}),
        lastCommit: currentHead,
        lastCommitTime: new Date().toISOString(),
        nodeCount: assembled.nodes.length,
        edgeCount: assembled.edges.length
      }
    };
    fs.writeFileSync(graphPath, JSON.stringify(newKg, null, 2));

    const scanResult = JSON.parse(fs.readFileSync(path.join(UA_DIR, 'intermediate/scan-result.json'), 'utf8'));
    const fpInputPath = path.join(UA_DIR, 'intermediate/fingerprint-input.json');
    fs.writeFileSync(fpInputPath, JSON.stringify({
      projectRoot: PROJECT_ROOT,
      gitCommitHash: currentHead,
      filePaths: scanResult.files.map(f => f.path)
    }, null, 2));
    runCmd(`node "${path.join(SKILL_DIR, 'build-fingerprints.mjs')}" "${fpInputPath}"`);
    fs.copyFileSync(graphPath, path.join(UA_DIR, 'intermediate/incremental-baseline.json'));
    
    const metaObj = {
      lastAnalyzedAt: new Date().toISOString(),
      gitCommitHash: currentHead,
      version: '1.0.0',
      fileCount: scanResult.files.length,
      nodeCount: assembled.nodes.length,
      edgeCount: assembled.edges.length
    };
    fs.writeFileSync(metaPath, JSON.stringify(metaObj, null, 2));
    log('understand', 'Full update complete! Understand Anything graph is now synchronized.');
  } else {
    log('understand', 'Finalizing incremental graph, updating fingerprints and metadata...');
    runCmd(`node "${path.join(SKILL_DIR, 'finalize-incremental.mjs')}" "${PROJECT_ROOT}"`);
    log('understand', 'Incremental update complete! Understand Anything graph is now synchronized.');
  }
}

async function updateGraphify() {
  if (!fs.existsSync(GRAPHIFY_DIR)) {
    log('graphify', 'graphify-out directory not found. Run /graphify first to initialize.');
    return;
  }

  log('graphify', 'Updating Graphify knowledge graph (AST symbol & dependency analysis)...');
  try {
    const out = runCmd('graphify update .');
    log('graphify', out.split('\n').filter(l => l.includes('Rebuilt:') || l.includes('updated in')).join(' | ') || 'Graphify graph updated successfully.');
  } catch (err) {
    log('graphify', `Note: Graphify update failed or skipped: ${err.message?.split('\n')[0]}`);
  }
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`[Unified Knowledge Graph Auto-Update]`);
  console.log(`Project root: ${PROJECT_ROOT}`);
  console.log(`======================================================`);

  if (!GRAPHIFY_ONLY) {
    try {
      await updateUnderstandAnything();
    } catch (err) {
      console.error('[understand] Error during update:', err.message);
    }
  }

  if (!UA_ONLY) {
    try {
      await updateGraphify();
    } catch (err) {
      console.error('[graphify] Error during update:', err.message);
    }
  }

  console.log(`[Unified Knowledge Graph] All knowledge graphs synchronized.\n`);
}

main().catch(err => {
  console.error('[auto-update] Unexpected error:', err);
  process.exit(1);
});
