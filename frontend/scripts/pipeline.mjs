import { spawn } from 'child_process';
import process from 'process';

const steps = [
  { name: '1. ESLint Code Quality Inspection', command: 'npx', args: ['eslint', '.'] },
  { name: '2. Prettier Formatting Verification', command: 'npx', args: ['prettier', '--check', '"**/*.{js,jsx,ts,tsx,json,css,md}"'] },
  { name: '3. Automated Unit Testing', command: 'npx', args: ['jest', '--passWithNoTests'] },
  { name: '4. Next.js Production Build', command: 'npx', args: ['next', 'build', '--webpack'] },
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function logBox(title, color = colors.cyan) {
  const line = '═'.repeat(64);
  console.log(`\n${color}╔${line}╗${colors.reset}`);
  console.log(`${color}║ ${title.padEnd(62)} ║${colors.reset}`);
  console.log(`${color}╚${line}╝${colors.reset}\n`);
}

function runStep(step) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`${colors.bright}${colors.cyan}▶ Executing: ${step.name}${colors.reset}`);

    const proc = spawn(step.command, step.args, {
      stdio: 'inherit',
      shell: false,
    });

    proc.on('close', code => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`${colors.green}✔ ${step.name} passed cleanly in ${duration}s${colors.reset}\n`);
        resolve({ step: step.name, duration, success: true });
      } else {
        console.error(`${colors.red}✖ ${step.name} failed with exit code ${code} (${duration}s)${colors.reset}\n`);
        reject(new Error(`Step "${step.name}" failed.`));
      }
    });
  });
}

async function main() {
  const overallStart = Date.now();
  logBox('⚡ STARTING END-TO-END FRONTEND PRODUCTION PIPELINE', colors.magenta);

  const results = [];
  try {
    for (const step of steps) {
      const res = await runStep(step);
      results.push(res);
    }

    const totalTime = ((Date.now() - overallStart) / 1000).toFixed(2);
    logBox('🎉 ALL PIPELINE PHASES PASSED! FRONTEND IS PRODUCTION READY', colors.green);

    console.log(`${colors.bright}${colors.blue}Pipeline Summary Report:${colors.reset}`);
    results.forEach(r => {
      console.log(`  ✔ ${r.step.padEnd(40)} : ${colors.green}PASSED${colors.reset} (${r.duration}s)`);
    });
    console.log(`\n${colors.bright}Total Duration:${colors.reset} ${totalTime}s\n`);
  } catch (err) {
    logBox('💥 PIPELINE FAILED - PLEASE RESOLVE ERRORS BEFORE DEPLOYING', colors.red);
    process.exit(1);
  }
}

main();
