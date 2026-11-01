#!/usr/bin/env node
/**
 * auto-update.mjs — Understand Anything Auto-Update Runner
 *
 * Incrementally updates the knowledge graph (.ua/knowledge-graph.json)
 * and structural fingerprints (.ua/fingerprints.json) when code changes.
 * Can be invoked by:
 *   1. Git post-commit hook (.git/hooks/post-commit)
 *   2. File watcher daemon (.ua/scripts/watch.mjs)
 *   3. Direct CLI invocation: node .ua/scripts/auto-update.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const PROJECT_ROOT = process.cwd();
const UA_DIR = path.join(PROJECT_ROOT, '.ua');
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(process.env.HOME || '', '.understand-anything-plugin');
const SKILL_DIR = path.join(PLUGIN_ROOT, 'skills/understand');

function log(msg) {
  console.log(`[understand auto-update] ${msg}`);
}

function runCmd(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
  } catch (err) {
    const out = err.stdout?.trim() || err.stderr?.trim() || err.message;
    throw new Error(`Command failed: ${cmd}\n${out}`);
  }
}

async function main() {
  if (!fs.existsSync(UA_DIR)) {
    log('Data directory .ua does not exist. Run /understand first.');
    return;
  }

  const configPath = path.join(UA_DIR, 'config.json');
  const metaPath = path.join(UA_DIR, 'meta.json');
  const graphPath = path.join(UA_DIR, 'knowledge-graph.json');

  if (!fs.existsSync(metaPath) || !fs.existsSync(graphPath)) {
    log('Baseline knowledge-graph.json or meta.json missing. Run /understand first.');
    return;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const lastCommit = meta.gitCommitHash;
  const currentHead = runCmd('git rev-parse HEAD');

  log(`Preparing incremental analysis (base: ${lastCommit.slice(0, 7)}, HEAD: ${currentHead.slice(0, 7)})...`);

  // Ensure intermediate and tmp directories exist
  fs.mkdirSync(path.join(UA_DIR, 'intermediate'), { recursive: true });
  fs.mkdirSync(path.join(UA_DIR, 'tmp'), { recursive: true });

  // Run prepare-incremental.mjs
  const prepareCmd = `node "${path.join(SKILL_DIR, 'prepare-incremental.mjs')}" "${PROJECT_ROOT}" "${lastCommit}"`;
  try {
    execSync(prepareCmd, { cwd: PROJECT_ROOT, stdio: 'inherit' });
  } catch (err) {
    log(`prepare-incremental failed: ${err.message}`);
    return;
  }

  const planPath = path.join(UA_DIR, 'intermediate/incremental-plan.json');
  if (!fs.existsSync(planPath)) {
    log('incremental-plan.json was not generated.');
    return;
  }

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  log(`Plan action: ${plan.action} (reanalyze: ${plan.filesToReanalyze?.length || 0}, deleted: ${plan.deletedFiles?.length || 0})`);

  if (plan.action === 'SKIP') {
    // Run finalizer for SKIP action
    runCmd(`node "${path.join(SKILL_DIR, 'finalize-incremental.mjs')}" "${PROJECT_ROOT}"`);
    log('Graph is up-to-date with working tree and commit.');
    return;
  }

  if (plan.action === 'FULL_UPDATE') {
    log('Massive structural shift detected. Triggering full graph update...');
    execSync(`node "${path.join(UA_DIR, 'tmp/process-all-batches.mjs')}"`, { stdio: 'inherit' });
    execSync(`python3 "${path.join(SKILL_DIR, 'merge-batch-graphs.py')}" "${PROJECT_ROOT}"`, { stdio: 'inherit' });
    execSync(`node "${path.join(UA_DIR, 'tmp/finalize-pipeline.mjs')}"`, { stdio: 'inherit' });
    return;
  }

  // PARTIAL_UPDATE or ARCHITECTURE_UPDATE
  if (plan.filesToReanalyze && plan.filesToReanalyze.length > 0) {
    log(`Re-analyzing ${plan.filesToReanalyze.length} changed files...`);
    const changedFilesArg = `--changed-files="${path.join(UA_DIR, 'intermediate/changed-files.json')}"`;
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
            filePath: f.path,
            lineRange: [1, lines],
            summary: `Source component ${path.basename(f.path)} implementing ${ext.replace('.', '')} logic.`,
            tags: [f.fileCategory, ext.replace('.', '') || 'code'],
            complexity
          };
          addNode(fileNode);

          for (const cls of res.classes || []) {
            const classNodeId = `class:${f.path}:${cls.name}`;
            addNode({
              id: classNodeId,
              type: 'class',
              name: cls.name,
              filePath: f.path,
              lineRange: [cls.startLine || 1, cls.endLine || lines],
              summary: `${cls.name} class defining domain state and logic.`,
              tags: ['class', ext.replace('.', '')],
              complexity: 'moderate'
            });
            edges.push({ source: fileNodeId, target: classNodeId, type: 'contains', direction: 'forward', weight: 1.0 });
          }

          for (const fn of res.functions || []) {
            if ((fn.endLine - fn.startLine >= 10) || (res.exports && res.exports.some(e => e.name === fn.name))) {
              const funcNodeId = `function:${f.path}:${fn.name}`;
              addNode({
                id: funcNodeId,
                type: 'function',
                name: fn.name,
                filePath: f.path,
                lineRange: [fn.startLine || 1, fn.endLine || lines],
                summary: `${fn.name} operation executing routines.`,
                tags: ['function', ext.replace('.', '')],
                complexity: 'simple'
              });
              edges.push({ source: fileNodeId, target: funcNodeId, type: 'contains', direction: 'forward', weight: 1.0 });
            }
          }

          for (const imp of (batch.batchImportData && batch.batchImportData[f.path]) || []) {
            edges.push({ source: fileNodeId, target: `file:${imp}`, type: 'imports', direction: 'forward', weight: 0.7 });
          }
        }

        const batchFilePath = path.join(UA_DIR, `intermediate/batch-${batch.batchIndex}.json`);
        fs.writeFileSync(batchFilePath, JSON.stringify({ nodes, edges }, null, 2));
      }
    }
  }

  // Merge batch results with batch-existing.json
  log('Merging batch changes into assembled graph...');
  runCmd(`python3 "${path.join(SKILL_DIR, 'merge-batch-graphs.py')}" "${PROJECT_ROOT}"`);

  // Finalize incremental update
  log('Finalizing incremental graph, updating fingerprints and metadata...');
  runCmd(`node "${path.join(SKILL_DIR, 'finalize-incremental.mjs')}" "${PROJECT_ROOT}"`);

  log('Incremental update complete! Knowledge graph is in sync with latest changes.');
}

main().catch(err => {
  console.error('[understand auto-update] Error:', err);
  process.exit(1);
});
