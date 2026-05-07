const { spawnSync } = require('child_process');
const fs = require('fs');

const syntaxFiles = [
  'app.js',
  'SmartSchoolHub_Worker.js',
  'GoogleOAuth_Worker.js',
  'workers/google-oauth-core.mjs',
  'netlify/functions/google-oauth.mjs',
  'service-worker.js',
  'runtime-config.js',
  'scripts/build-icons.js',
  'scripts/build-www.js',
  'scripts/verify-before-push.js'
];

const checks = [
  {
    name: 'JavaScript syntax',
    run: runSyntaxCheck
  },
  {
    name: 'Dependency audit',
    command: 'npm',
    args: ['audit', '--audit-level=moderate']
  },
  {
    name: 'Web build',
    command: 'npm',
    args: ['run', 'build:web']
  },
  {
    name: 'Whitespace hygiene',
    command: 'git',
    args: ['diff', '--check', 'origin/main..HEAD']
  },
  {
    name: 'Tracked secret scan',
    run: runSecretScan
  },
  {
    name: 'Untracked file check',
    command: 'git',
    args: ['ls-files', '--others', '--exclude-standard']
  }
];

const secretPatterns = [
  /AIza[0-9A-Za-z_-]{35}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (RSA|OPENSSH|PRIVATE) KEY-----/
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options
  });

  return {
    code: result.status || 0,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function runSyntaxCheck() {
  const failures = [];

  for (const file of syntaxFiles) {
    const result = run('node', ['--check', file]);
    if (result.code !== 0) {
      failures.push(`${file}\n${result.stdout}${result.stderr}`.trim());
    }
  }

  return {
    code: failures.length ? 1 : 0,
    stdout: '',
    stderr: failures.join('\n\n')
  };
}

function printResult(name, result) {
  if (result.code === 0) {
    console.log(`[ok] ${name}`);
    return;
  }

  console.error(`[fail] ${name}`);
  if (result.stdout.trim()) console.error(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
}

function runSecretScan() {
  const listed = run('git', ['ls-files']);
  if (listed.code !== 0) {
    return listed;
  }

  const files = listed.stdout.split(/\r?\n/).filter(Boolean);
  const findings = [];

  for (const file of files) {
    let content = '';
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (secretPatterns.some((pattern) => pattern.test(line))) {
        findings.push(`${file}:${index + 1}`);
      }
    });
  }

  if (findings.length) {
    return {
      code: 1,
      stdout: '',
      stderr: findings.map((finding) => `  ${finding}`).join('\n')
    };
  }

  return { code: 0, stdout: '', stderr: '' };
}

if (process.argv.includes('--secret-scan-only')) {
  const result = runSecretScan();
  printResult('Tracked secret scan', result);
  process.exit(result.code);
}

let failed = false;

for (const check of checks) {
  const result = check.run ? check.run() : run(check.command, check.args);

  if (check.name === 'Untracked file check') {
    const untracked = result.stdout.trim();
    if (result.code !== 0 || untracked) {
      printResult(check.name, {
        code: result.code === 0 ? 1 : result.code,
        stdout: '',
        stderr: untracked || result.stderr
      });
      failed = true;
    } else {
      console.log('[ok] Untracked file check');
    }
    continue;
  }

  printResult(check.name, result);
  if (result.code !== 0) failed = true;
}

if (failed) {
  console.error('Verification failed.');
  process.exit(1);
}

console.log('Verification passed.');
