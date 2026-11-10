import { handleAI } from './ai-api.mjs';
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const port = Number(option('--port') || process.env.PORT || 3000);
const host = option('--host') || '0.0.0.0';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    if (await handleAI(req,res)) return;
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const roots = relative.startsWith('documents/') || relative.startsWith('data/') ? [resolve(root, 'public')] : [root];
    const base = roots[0];
    const path = resolve(base, relative);
    if (!path.startsWith(base + sep) || relative.split('/').some(x => x.startsWith('.')) || (!relative.startsWith('documents/') && !relative.startsWith('data/') && !['quantity-illustration.js','quantity-calculator.js','ai-ui.js','index.html','references.html','app.js','rab-app.js','rab-core.js','workbook-forms.js','quantity-core.js','quantity-ui.js','rab.css','styles.css','search-worker.js','search-core.js','favicon.svg'].includes(relative))) { res.writeHead(404).end(); return; }
    const meta = await stat(path);
    if (!meta.isFile()) { res.writeHead(404).end(); return; }
    const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    const match = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start = 0, end = meta.size - 1, status = 200;
    if (match) {
      start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end;
      if (start > end || start >= meta.size) { res.writeHead(416, { 'Content-Range': `bytes */${meta.size}` }).end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${meta.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') res.end(); else createReadStream(path, { start, end }).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404).end('Tidak ditemukan'); }
});
server.listen(port, host, () => console.log(`Pustaka AHSP berjalan pada port ${port}`));
