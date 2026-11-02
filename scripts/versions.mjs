import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const names = ['piral-cli', 'piral-cli-vite8', 'vite', 'rolldown', 'piral', 'piral-base', 'react', 'react-dom', 'react-table'];
console.log(`node ${process.version}`);
for (const name of names) {
  try { console.log(`${name} ${require(`${name}/package.json`).version}`); }
  catch { console.log(`${name}: not directly resolvable from workspace root`); }
}
