import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root), { recursive: true });
const assets=['styles.css','rab.css','app.js','rab-app.js','rab-core.js','workbook-forms.js','quantity-core.js','quantity-ui.js','search-worker.js','search-core.js'];
const sources=new Map(await Promise.all(assets.map(async file=>[file,await readFile(new URL(file,root),'utf8')])));
// All module URLs change together, including transitive dependencies and workers.
const buildId=createHash('sha256').update([...sources].map(([file,body])=>file+'\0'+body).join('\0')).digest('hex').slice(0,12);
const manifest=Object.fromEntries(assets.map(file=>[file,file.replace(/\.(js|css)$/,`.${buildId}.$1`)]));
const rewrite=body=>{
  for(const [file,target] of Object.entries(manifest)) body=body.replaceAll('./'+file,'./'+target);
  return body;
};
for(const [file,body] of sources){
  const content=rewrite(body);
  await writeFile(new URL(`dist/${manifest[file]}`,root),content);
  // Keep legacy paths available for an older HTML document during publication.
  await writeFile(new URL(`dist/${file}`,root),content);
}
for(const file of ['index.html','references.html']){
  let html=await readFile(new URL(file,root),'utf8');
  for(const [asset,target] of Object.entries(manifest)) html=html.replaceAll(`="${asset}"`,`="${target}"`);
  html=html.replace('</head>',`  <meta name="rab-build" content="${buildId}">\n</head>`);
  await writeFile(new URL(`dist/${file}`,root),html);
}
await cp(new URL('favicon.svg',root),new URL('dist/favicon.svg',root));
await cp(new URL('public/', root), new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/.nojekyll', root), '');
await writeFile(new URL('dist/build-info.json',root),JSON.stringify({buildId,assets:manifest},null,2));
console.log(`Build selesai: dist/ (versi ${buildId}, aset dengan penanda versi).`);
