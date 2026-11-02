import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = resolve(projectRoot, process.env.REPRO_SHELL_DIST || 'apps/shell/dist/release');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.map': 'application/json', '.css': 'text/css' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname === '/favicon.ico') {
    response.writeHead(204).end();
    return;
  }
  const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!path.startsWith(root + sep) && path !== root) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'access-control-allow-origin': '*' });
    response.end(await readFile(path));
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(4173, '127.0.0.1', () => console.log('Piral production build: http://127.0.0.1:4173'));
