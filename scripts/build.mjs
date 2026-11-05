import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root), { recursive: true });
for (const file of ['index.html', 'references.html', 'styles.css', 'rab.css', 'app.js', 'rab-app.js', 'rab-core.js', 'search-worker.js', 'search-core.js', 'favicon.svg']) await cp(new URL(file, root), new URL(`dist/${file}`, root));
await cp(new URL('public/', root), new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/.nojekyll', root), '');
console.log('Build selesai: dist/ (website statis beserta PDF dan indeks pencarian).');
