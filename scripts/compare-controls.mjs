import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const shellPackage = resolve(root, 'apps/shell/package.json');
const pluginFile = resolve(root, 'node_modules/piral-cli-vite8/lib/vite8/pilet.js');
const names = ['table-one', 'table-two'];
const evidence = resolve(root, 'evidence');
const shellPackageOriginal = await readFile(shellPackage, 'utf8');
const pluginOriginal = await readFile(pluginFile, 'utf8');
const originalPiletBundles = new Map();
for (const name of names) originalPiletBundles.set(name, await readFile(resolve(root, `pilets/${name}/dist/index.js`)));

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: process.env });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`);
}

async function buildPilets(label) {
  for (const name of names) {
    run('npm', ['run', 'build'], resolve(root, `pilets/${name}`));
    const bundle = resolve(root, `pilets/${name}/dist/index.js`);
    await copyFile(bundle, resolve(evidence, label, `${name}.js`));
    await copyFile(bundle, resolve(root, `apps/shell/dist/release/pilets/${name}/index.js`));
  }
}

await mkdir(resolve(evidence, 'case-b-bundled'), { recursive: true });
await mkdir(resolve(evidence, 'case-d-patched'), { recursive: true });
try {
  const unshared = JSON.parse(shellPackageOriginal);
  delete unshared.importmap.imports['react-table'];
  await writeFile(shellPackage, JSON.stringify(unshared, null, 2) + '\n');
  console.log('Building control: React Table bundled, React shared.');
  await buildPilets('case-b-bundled');

  await writeFile(shellPackage, shellPackageOriginal);
  let patched = `import { esmExternalRequirePlugin } from 'vite';\n${pluginOriginal}`;
  patched = patched.replace('                    external,\n', '');
  patched = patched.replace('            plugins: [\n                ...config.plugins,', '            plugins: [\n                esmExternalRequirePlugin({ external }),\n                ...config.plugins,');
  if (!patched.includes('esmExternalRequirePlugin({ external })') || patched.includes('                    external,\n')) {
    throw new Error('Could not apply the documented Vite 8 plugin patch cleanly');
  }
  await writeFile(pluginFile, patched);
  console.log('Building control: esmExternalRequirePlugin patch.');
  await buildPilets('case-d-patched');
} finally {
  await writeFile(shellPackage, shellPackageOriginal);
  await writeFile(pluginFile, pluginOriginal);
  for (const name of names) await writeFile(resolve(root, `pilets/${name}/dist/index.js`), originalPiletBundles.get(name));
  run('node', ['scripts/assemble-feed.mjs']);
}

console.log('Control bundles saved under evidence/. Browser outcomes are recorded in the committed browser logs.');
