#!/usr/bin/env node
/**
 * watch.mjs — Real-Time Knowledge Graph Watcher
 *
 * Watches code, skills, local files, checklists, and documentation.
 * Debounces modifications (default 2500ms) and runs the incremental
 * auto-update pipeline so the graph stays updated live as you code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';

const PROJECT_ROOT = process.cwd();
const AUTO_UPDATE_SCRIPT = path.join(PROJECT_ROOT, '.ua/scripts/auto-update.mjs');

const WATCH_DIRS = [
  path.join(PROJECT_ROOT, 'backend/src'),
  path.join(PROJECT_ROOT, 'frontend/src'),
  path.join(PROJECT_ROOT, '.agents'),
  path.join(PROJECT_ROOT, 'agents'),
  path.join(PROJECT_ROOT, 'commands'),
  path.join(PROJECT_ROOT, 'references'),
  path.join(PROJECT_ROOT, 'local')
].filter(d => fs.existsSync(d));

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'target',
  'build',
  'dist',
  '.ua',
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
  console.log(`\n[watch] Triggering incremental graph update (${changedPaths.size} changed files buffered)...`);
  changedPaths.clear();

  const child = fork(AUTO_UPDATE_SCRIPT, [], { stdio: 'inherit' });
  child.on('exit', (code) => {
    isUpdating = false;
    if (code === 0) {
      console.log('[watch] Knowledge graph successfully refreshed.');
    } else {
      console.error(`[watch] Auto-update exited with code ${code}.`);
    }

    if (pendingTrigger) {
      pendingTrigger = false;
      debounceTimer = setTimeout(runAutoUpdate, 1000);
    }
  });
}

function handleChange(eventType, filename) {
  if (!filename || shouldIgnore(filename)) return;
  const ext = path.extname(filename).toLowerCase();
  const validExts = new Set(['.java', '.js', '.jsx', '.ts', '.tsx', '.sql', '.yml', '.yaml', '.properties', '.xml', '.json', '.md', '.toml', '.sh']);
  if (!validExts.has(ext)) return;

  changedPaths.add(filename);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runAutoUpdate, 2500);
}

console.log('[watch] Starting Understand Anything real-time file watcher...');
for (const dir of WATCH_DIRS) {
  try {
    fs.watch(dir, { recursive: true }, handleChange);
    console.log(`[watch] Watching ${path.relative(PROJECT_ROOT, dir)}/ for changes...`);
  } catch (err) {
    console.error(`[watch] Could not watch ${dir}: ${err.message}`);
  }
}

// Watch root files (README.md, AGENTS.md, etc.)
try {
  fs.watch(PROJECT_ROOT, { recursive: false }, (eventType, filename) => {
    if (filename && filename.endsWith('.md')) handleChange(eventType, filename);
  });
  console.log('[watch] Watching root markdown files (README.md, AGENTS.md, etc.)...');
} catch (err) {}

console.log('[watch] Ready. Any change in code, skills, local, or docs will auto-update the graph.\n');
