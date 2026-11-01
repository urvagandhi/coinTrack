#!/usr/bin/env node
/**
 * Backwards-compatibility wrapper for auto-update.mjs
 * Delegates directly to the global unified updater at scripts/auto-update.mjs
 */
import { fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.resolve(__dirname, '../../scripts/auto-update.mjs');

const child = fork(TARGET, process.argv.slice(2), { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
