import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const piletDist = process.env.REPRO_PILET_DIR || 'dist';
const names = ['table-one', 'table-two'];
const shared = new Set(['react', 'react-table']);
for (const name of names) {
  const dir = resolve(root, `pilets/${name}/${piletDist}`);
  const files = await readdir(dir).catch(() => []);
  console.log(`\n${name}:`);
  for (const file of files.filter(file => file.endsWith('.js'))) {
    const code = await readFile(resolve(dir, file), 'utf8');
    const requireCalls = [...code.matchAll(/__require\((['"])([^'"]+)\1\)/g)].map(match => match[2]);
    const sysDeps = code.match(/System\.register\((\[[^\]]*\])/s)?.[1] || '(not found)';
    console.log(`  file: ${file}`);
    console.log(`  __require calls: ${requireCalls.length} [${requireCalls.join(', ') || 'none'}]`);
    console.log(`  shared dependency requires: ${requireCalls.filter(dep => shared.has(dep)).length}`);
    console.log(`  System.register dependencies: ${sysDeps}`);
    console.log(`  react referenced: ${sysDeps.includes('"react"') || requireCalls.includes('react')}`);
    console.log(`  react-table referenced: ${sysDeps.includes('"react-table"') || requireCalls.includes('react-table')}`);
    console.log(`  module log present: ${code.includes(`[${name}] module evaluated`)}`);
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) if (lines[i].includes('__require(')) {
      console.log(`  ${file}:${i + 1}: ${lines[i].trim().slice(0, 220)}`);
    }
  }
}
