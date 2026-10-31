// Compile the public frontend and resolve its local ES module imports without execution.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { saveFinalEvidence } = require('../tools/final-evidence.cjs');
const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const failures = [], files = walk(frontend).filter(file => file.endsWith('.js'));
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  try {
    const module = new vm.SourceTextModule(source, { identifier: file });
    for (const specifier of module.dependencySpecifiers) {
      if (specifier.startsWith('.') && !fs.existsSync(path.resolve(path.dirname(file), specifier))) failures.push({ file: path.relative(root, file), missingImport: specifier });
    }
  } catch (error) { failures.push({ file: path.relative(root, file), error: error.message }); }
}
const suites = [
  ['tests/monitor-navigation.cjs'],
  ['--experimental-vm-modules', 'tests/phase47-private-views.cjs'],
].map(args => {
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 30000 });
  return { args, exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
});
const evidence = { date: new Date().toISOString(), scope: 'Public JS compilation, static ES imports, existing monitor navigation and private-view doubles. Does not execute backend or prove E2E.', modules: files.length, failures, suites, pass: !failures.length && suites.every(suite => suite.exitCode === 0) };
saveFinalEvidence('FRONTEND_REFRESH_SOURCE.json', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.pass) process.exitCode = 1;
