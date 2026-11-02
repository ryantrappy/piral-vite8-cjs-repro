import { mkdir, readFile, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, process.env.REPRO_OUTPUT_DIR || 'apps/shell/dist/release');
const publicDir = resolve(root, 'apps/shell/src/public');
const piletDist = process.env.REPRO_PILET_DIST || 'dist';
const pilets = ['table-one', 'table-two'];
const feed = [];

for (const name of pilets) {
  const source = resolve(root, `pilets/${name}/${piletDist}/index.js`);
  const targetDir = resolve(out, 'pilets', name);
  await mkdir(targetDir, { recursive: true });
  await copyFile(source, resolve(targetDir, 'index.js'));
  feed.push({ name, version: '1.0.0', spec: 'v2', link: `/pilets/${name}/index.js`, dependencies: {}, config: {} });
}

await writeFile(resolve(out, 'feed.json'), JSON.stringify(feed, null, 2) + '\n');
if (!process.env.REPRO_OUTPUT_DIR) {
  for (const name of pilets) {
    const targetDir = resolve(publicDir, 'pilets', name);
    await mkdir(targetDir, { recursive: true });
    await copyFile(resolve(root, `pilets/${name}/${piletDist}/index.js`), resolve(targetDir, 'index.js'));
  }
  await writeFile(resolve(publicDir, 'feed.json'), JSON.stringify(feed, null, 2) + '\n');
}
console.log(`Assembled ${feed.length} v2 pilets into ${out}`);
