#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const shouldBuild = !args.includes('--skip-build');
const builderArgs = args.filter((arg) => arg !== '--skip-build');
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function quoteWindowsArg(value) {
  if (value.length === 0) {
    return '""';
  }

  if (!/[\s"]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1')}"`;
}

function run(command, commandArgs, options = {}) {
  const spawnOptions = {
    cwd: projectRoot,
    stdio: 'inherit',
    ...options
  };

  const result =
    process.platform === 'win32'
      ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', [command, ...commandArgs].map(quoteWindowsArg).join(' ')], spawnOptions)
      : spawnSync(command, commandArgs, spawnOptions);

  if (result.error) {
    console.error(`Failed to run command: ${command} ${commandArgs.join(' ')}`);
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function prepareDeployDirectory() {
  const tempRoot = path.join(projectRoot, '.tmp');
  const stageRoot = path.join(tempRoot, 'packaged-app');
  const lockfilePath = path.join(projectRoot, 'pnpm-lock.yaml');

  fs.mkdirSync(tempRoot, { recursive: true });
  const stageDir = fs.mkdtempSync(`${stageRoot}-`);

  run(pnpmCommand, ['--filter', '.', 'deploy', '--legacy', '--prod', stageDir]);

  if (fs.existsSync(lockfilePath)) {
    fs.copyFileSync(lockfilePath, path.join(stageDir, 'pnpm-lock.yaml'));
  }

  const packageJsonPath = path.join(stageDir, 'package.json');
  const packageJson = readJson(packageJsonPath);
  const electronPackageJson = readJson(path.join(projectRoot, 'node_modules', 'electron', 'package.json'));

  packageJson.build = packageJson.build ?? {};
  packageJson.build.directories = packageJson.build.directories ?? {};
  packageJson.build.directories.output = path.join(projectRoot, 'release', '${version}');
  packageJson.build.electronVersion = electronPackageJson.version;

  writeJson(packageJsonPath, packageJson);

  return stageDir;
}

if (shouldBuild) {
  run(pnpmCommand, ['run', 'build']);
}

const stageDir = prepareDeployDirectory();
run(pnpmCommand, ['exec', 'electron-builder', '--projectDir', stageDir, ...builderArgs]);
