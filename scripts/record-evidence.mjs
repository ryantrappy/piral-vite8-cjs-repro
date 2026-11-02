import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const evidence = resolve(root, 'evidence');
const require = createRequire(import.meta.url);
await mkdir(evidence, { recursive: true });
const packages = ['piral-cli', 'piral-cli-vite8', 'vite', 'rolldown', 'piral', 'piral-base', 'react', 'react-dom', 'react-table'];
const versionLines = [`Command: npm run record:evidence`, `Node: ${process.version}`, `npm: ${(process.env.npm_config_user_agent || 'npm version not exposed').split(' ')[0]}`];
for (const name of packages) versionLines.push(`${name}: ${require(`${name}/package.json`).version}`);
await writeFile(resolve(evidence, 'versions.txt'), versionLines.join('\n') + '\n');

const pkg = require('react-table/package.json');
const reactTableEntry = await readFile(require.resolve('react-table'), 'utf8');
const reactDist = await readFile(resolve(root, 'node_modules/react-table/dist/react-table.development.js'), 'utf8');
const cjsStart = reactDist.split('\n').slice(0, 5).join('\n');
const packageAnalysis = [
  `react-table package: ${pkg.version}`,
  `main: ${pkg.main}`,
  `module: ${pkg.module ?? '(not declared)'}`,
  `exports: ${pkg.exports ? JSON.stringify(pkg.exports) : '(not declared)'}`,
  `Resolved by Node: ${require.resolve('react-table')}`,
  `Node-selected wrapper:`, reactTableEntry.trim().split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n'),
  `Development distribution prefix:`, cjsStart.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n'),
  `CJS react require in package entry/distribution: ${reactTableEntry.includes("require('./dist/") && reactDist.includes("require('react')")}`,
  `Package dependencies: ${JSON.stringify(pkg.dependencies ?? {})}`,
  `Peer dependencies: ${JSON.stringify(pkg.peerDependencies ?? {})}`,
  'No package-level ESM module entry is declared; package.json routes Node and bundlers resolving the package root through index.js, which selects a CommonJS dist file based on NODE_ENV.',
].join('\n');
await writeFile(resolve(evidence, 'react-table-package.txt'), packageAnalysis + '\n');

const targets = [
  ['Case A (shared React and React Table)', resolve(root, 'pilets/table-one/dist/index.js')],
  ['Case B (React Table bundled)', resolve(evidence, 'case-b-bundled/table-one.js')],
  ['Case D (patched plugin)', resolve(evidence, 'case-d-patched/table-one.js')],
];
const reports = [];
const caseReports = [];
for (const [label, path] of targets) {
  const source = await readFile(path, 'utf8');
  const lines = source.split('\n');
  const calls = [...source.matchAll(/__require\((['"])([^'"]+)\1\)/g)].map(match => ({ name: match[2], index: source.slice(0, match.index).split('\n').length - 1 }));
  const deps = source.match(/System\.register\((\[[^\]]*\])/s)?.[1] ?? '(no System.register dependency array found)';
  const caseLines = [`${label}\nfile: ${path.replace(root + '/', '')}\nSystem.register dependencies: ${deps}\n__require calls: ${calls.length}${calls.length ? ` (${calls.map(call => call.name).join(', ')})` : ''}`];
  for (const call of calls) {
    caseLines.push(lines.slice(Math.max(0, call.index - 2), Math.min(lines.length, call.index + 3)).map((line, i) => `${Math.max(1, call.index - 1) + i}: ${line}`).join('\n'));
  }
  caseReports.push(caseLines.join('\n\n'));
  reports.push(...caseLines);
}
const report = reports.join('\n\n') + '\n';
await writeFile(resolve(evidence, 'bundle-inspection.txt'), report);
await writeFile(resolve(evidence, 'before-patch.txt'), caseReports.slice(0, 2).join('\n\n') + '\n');
await writeFile(resolve(evidence, 'after-patch.txt'), caseReports[2] + '\n');

const shellPackage = JSON.parse(await readFile(resolve(root, 'apps/shell/package.json'), 'utf8'));
const piletPackage = JSON.parse(await readFile(resolve(root, 'pilets/table-one/package.json'), 'utf8'));
const shellBundle = await readFile(resolve(root, 'apps/shell/dist/release/index.html'), 'utf8');
const outputFiles = await readdir(resolve(root, 'apps/shell/dist/release'));
const jsFile = outputFiles.find(file => /^index\..+\.js$/.test(file));
const js = jsFile ? await readFile(resolve(root, 'apps/shell/dist/release', jsFile), 'utf8') : '';
const registryIndex = js.indexOf('e[`react-table`]=');
const registryExcerpt = registryIndex >= 0 ? js.slice(registryIndex, registryIndex + 240) : 'Generated registry mapping not found';
const sharing = [
  'Shell package importmap:', JSON.stringify(shellPackage.importmap, null, 2),
  '', 'Pilet inheritance:', JSON.stringify(piletPackage.importmap, null, 2),
  '', `Shell production HTML exists: ${shellBundle.includes('<!doctype html>')}`,
  `Shell generated shared module registrations:\n${registryExcerpt}`,
  '', 'Feed metadata:', await readFile(resolve(root, 'apps/shell/dist/release/feed.json'), 'utf8'),
].join('\n');
await writeFile(resolve(evidence, 'shared-dependencies.txt'), sharing + '\n');

const caseBLog = await readFile(resolve(evidence, 'browser-errors-case-b.txt'), 'utf8');
const patchedLog = await readFile(resolve(evidence, 'browser-errors-patched.txt'), 'utf8');
const baselineLog = await readFile(resolve(evidence, 'browser-errors.txt'), 'utf8');
const hasFailure = text => text.includes('Calling `require` for "react"');
const table = [
  'Configuration | Build result | Browser result | Explanation',
  '--- | --- | --- | ---',
  `Vite 8, shared React + React Table | Success | ${hasFailure(baselineLog) ? 'Both pilets fail' : 'See browser log'} | Shared imports are in System.register; bundled JSX runtime keeps __require("react").`,
  `Vite 8, React Table bundled | Success | ${hasFailure(caseBLog) ? 'Both pilets fail' : 'See browser log'} | Adds a second bundled CJS consumer: react-table’s UMD wrapper also requires shared React.`,
  `Vite 8, shared React Table control | Success | ${hasFailure(baselineLog) ? 'Fails through jsx-runtime' : 'See browser log'} | React Table is external here; the same failure comes from bundled react/jsx-runtime.`,
  `Vite 8 with esmExternalRequirePlugin patch | Success | ${patchedLog.includes('"employeeRows": 3') && patchedLog.includes('"productRows": 3') ? 'Both tables render three rows' : 'See browser log'} | Plugin turns external CJS requires into SystemJS-resolvable ESM dependencies.`,
].join('\n');
await writeFile(resolve(evidence, 'control-experiments.txt'), table + '\n');
