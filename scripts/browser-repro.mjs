import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const caseName = process.env.REPRO_CASE || 'shared';
const baseUrl = process.env.REPRO_URL || 'http://127.0.0.1:4173';
const evidence = resolve(root, 'evidence');
await mkdir(evidence, { recursive: true });
const server = process.env.REPRO_URL ? undefined : spawn(process.execPath, [resolve(root, 'scripts/serve.mjs')], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let serverOutput = '';
server?.stdout.on('data', chunk => { serverOutput += chunk; });
server?.stderr.on('data', chunk => { serverOutput += chunk; });
const errors = [];
const logs = [];
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { ready = (await fetch(`${baseUrl}/`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error(`Piral server did not start: ${serverOutput}`);
  console.log('Server is responding; launching headless Chrome.');
  const options = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  browser = await chromium.launch(options);
  console.log(`Chrome ${browser.version()} launched; loading Piral shell.`);
  const page = await browser.newPage();
  page.on('console', message => {
    const line = `console.${message.type()}: ${message.text()}`;
    logs.push(line);
    if (message.type() === 'error') errors.push(line);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.stack || error.message}`));
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  console.log('Shell DOM loaded; collecting runtime state.');
  await page.waitForTimeout(1200);
  const bodyText = await page.locator('body').innerText();
  const employeeRows = await page.locator('section[aria-labelledby="one-heading"] table tbody tr').count();
  const productRows = await page.locator('section[aria-labelledby="two-heading"] table tbody tr').count();
  const visible = {
    shellHeading: bodyText.match(/Piral Vite 8 CommonJS Reproduction/)?.[0] || null,
    tableOneHeading: await page.getByText('Table One — Employees', { exact: true }).count(),
    tableTwoHeading: await page.getByText('Table Two — Products', { exact: true }).count(),
    employeeRows,
    productRows,
    employeeValues: employeeRows ? await page.locator('section[aria-labelledby="one-heading"] table tbody').innerText() : '',
    productValues: productRows ? await page.locator('section[aria-labelledby="two-heading"] table tbody').innerText() : '',
    setupLogs: logs.filter(line => line.includes('setup called')),
    moduleLogs: logs.filter(line => line.includes('module evaluated')),
  };
  const screenshotName = caseName === 'shared' ? 'screenshot.png' : `screenshot-${caseName}.png`;
  const logName = caseName === 'shared' ? 'browser-errors.txt' : `browser-errors-${caseName}.txt`;
  await page.screenshot({ path: resolve(evidence, screenshotName), fullPage: true });
  console.log('Browser state and screenshot captured.');
  const output = [
    `Command: npm run ${process.env.npm_lifecycle_event || 'test:repro'}`,
    `Browser: ${browser.version()}`,
    `Server: ${serverOutput.trim() || `using ${baseUrl}`}`,
    `Visible state: ${JSON.stringify(visible, null, 2)}`,
    '', 'Browser console:', ...logs.map(line => `  ${line}`),
    '', 'Captured exceptions:', ...(errors.length ? errors.map(line => `  ${line}`) : ['  none']),
  ].join('\n') + '\n';
  await writeFile(resolve(evidence, logName), output);
  console.log(output);
  console.log(`Screenshot saved to ${resolve(evidence, screenshotName)}`);
  const reproduced = errors.some(line => line.includes('Calling `require` for "react"')) &&
    visible.employeeRows === 0 && visible.productRows === 0 && visible.setupLogs.length === 0;
  const fixed = errors.every(line => !line.includes('Calling `require` for')) &&
    visible.tableOneHeading === 1 && visible.tableTwoHeading === 1 && visible.employeeRows === 3 && visible.productRows === 3;
  if (caseName === 'patched' ? !fixed : !reproduced) {
    throw new Error(`Browser outcome did not match the expected ${caseName} case`);
  }
} finally {
  await browser?.close();
  server?.kill('SIGTERM');
}
