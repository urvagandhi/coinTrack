#!/usr/bin/env node
/**
 * watch.mjs — Real-Time Unified Knowledge Graph Watcher
 *
 * Watches codebase files, skills, configs, and documentation.
 * Debounces changes (default 2500ms) and runs `scripts/auto-update.mjs`
 * so BOTH Understand Anything and Graphify graphs stay fresh live as you code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const AUTO_UPDATE_SCRIPT = path.join(PROJECT_ROOT, 'scripts/auto-update.mjs');

const WATCH_DIRS = [
  path.join(PROJECT_ROOT, 'backend/src'),
  path.join(PROJECT_ROOT, 'frontend/src'),
  path.join(PROJECT_ROOT, '.agents'),
  path.join(PROJECT_ROOT, 'local'),
  path.join(PROJECT_ROOT, 'scripts')
].filter(d => fs.existsSync(d));

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'target',
  'build',
  'dist',
  '.ua',
  'graphify-out',
  '.trash',
  '.DS_Store'
];

let debounceTimer = null;
let isUpdating = false;
let pendingTrigger = false;
const changedPaths = new Set();

function shouldIgnore(filepath) {
  return IGNORE_PATTERNS.some(p => filepath.includes(p));
}

function runAutoUpdate() {
  if (isUpdating) {
    pendingTrigger = true;
    return;
  }

  isUpdating = true;
  console.log(`\n[watch] Detected code changes (${changedPaths.size} files buffered). Triggering unified auto-update...`);
  changedPaths.clear();

  const child = fork(AUTO_UPDATE_SCRIPT, [], { stdio: 'inherit' });
  child.on('exit', (code) => {
    isUpdating = false;
    if (code === 0) {
      console.log('[watch] Unified knowledge graphs successfully refreshed.');
    } else {
      console.error(`[watch] Auto-update finished with exit code ${code}.`);
    }

    if (pendingTrigger) {
      pendingTrigger = false;
      debounceTimer = setTimeout(runAutoUpdate, 1500);
    }
  });
}

function onFileEvent(eventType, filename, baseDir) {
  if (!filename) return;
  const fullPath = path.join(baseDir, filename);

  if (shouldIgnore(fullPath)) return;

  const ext = path.extname(filename).toLowerCase();
  const relevantExts = [
    '.java', '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.yml', '.yaml',
    '.md', '.sql', '.toml', '.sh'
  ];

  if (relevantExts.includes(ext) || filename.startsWith('Dockerfile')) {
    changedPaths.add(fullPath);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      runAutoUpdate();
    }, 2500);
  }
}

console.log('[watch] Starting Unified Knowledge Graph Watcher (Understand Anything + Graphify)...');
console.log(`[watch] Watching directories in: ${PROJECT_ROOT}`);

for (const dir of WATCH_DIRS) {
  try {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      onFileEvent(eventType, filename, dir);
    });
    console.log(`  ✓ Watching: ${path.relative(PROJECT_ROOT, dir)}`);
  } catch (err) {
    console.error(`  ✗ Failed to watch ${dir}:`, err.message);
  }
}

console.log('[watch] Ready. Any file modifications in watched dirs will trigger updates.\n');
