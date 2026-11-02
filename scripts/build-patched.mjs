import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pluginFile = resolve(root, 'node_modules/piral-cli-vite8/lib/vite8/pilet.js');
const original = await readFile(pluginFile, 'utf8');

function run(args, cwd, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', stdio: 'inherit', env });
  if (result.status !== 0) throw new Error(`${args.join(' ')} failed with status ${result.status}`);
}

try {
  let patched = `import { esmExternalRequirePlugin } from 'vite';\n${original}`;
  patched = patched.replace('                    external,\n', '');
  patched = patched.replace('            plugins: [\n                ...config.plugins,', '            plugins: [\n                esmExternalRequirePlugin({ external }),\n                ...config.plugins,');
  if (!patched.includes('esmExternalRequirePlugin({ external })') || patched.includes('                    external,\n')) {
    throw new Error('Could not apply esmExternalRequirePlugin patch to this Vite 8 integration version');
  }
  await writeFile(pluginFile, patched);
  run([resolve(root, 'node_modules/piral-cli/lib/piral-cli.js'), 'build', '--type', 'release', '--target', 'dist/patched'], resolve(root, 'apps/shell'));
  for (const name of ['table-one', 'table-two']) {
    const target = `dist/patched/index.js`;
    run([resolve(root, 'node_modules/piral-cli/lib/pilet-cli.js'), 'build', '--target', target, '--minify', 'false', '--schema', 'v2'], resolve(root, `pilets/${name}`));
  }
  run([resolve(root, 'scripts/assemble-feed.mjs')], root, {
    ...process.env,
    REPRO_OUTPUT_DIR: 'apps/shell/dist/patched/release',
    REPRO_PILET_DIST: 'dist/patched',
  });
} finally {
  await writeFile(pluginFile, original);
}
