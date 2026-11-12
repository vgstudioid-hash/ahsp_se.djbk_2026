import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root), { recursive: true });
const assets=['button-navigation.js','theme.css','smkk-core.js','quantity-illustration.js','quantity-calculator.js','ai-ui.js','styles.css','rab.css','app.js','rab-app.js','rab-core.js','workbook-forms.js','quantity-core.js','quantity-ui.js','search-worker.js','search-core.js'];
const iconSources=(await Promise.all(['edit','delete','close'].map(name=>readFile(new URL('public/icons/'+name+'.svg',root),'utf8')))).join('\0');
const loaderSource=await readFile(new URL('asset-loader.js',root),'utf8');
const sources=new Map(await Promise.all(assets.map(async file=>[file,await readFile(new URL(file,root),'utf8')])));
// All module URLs change together, including transitive dependencies and workers.
const unitsMetadata=(await Promise.all(['work-units.json','ahs-catalog.json','ahs-coverage.json','ahs-source.json','ahs-inventory.json','smkk-templates.json'].map(file=>readFile(new URL('public/data/'+file,root),'utf8')))).join('\0');
const buildId=createHash('sha256').update([...sources].map(([file,body])=>file+'\0'+body).join('\0')).update('\0'+unitsMetadata).update('\0'+loaderSource).update('\0'+iconSources).digest('hex').slice(0,12);
const manifest=Object.fromEntries(assets.map(file=>[file,file.replace(/\.(js|css)$/,`.${buildId}.$1`)]));
const rewrite=body=>{
  for(const [file,target] of Object.entries(manifest)) body=body.replaceAll('./'+file,'./'+target);
  return body.replace(/icons\/(edit|delete|close)\.svg/g,`icons/$1.svg?v=${buildId}`);
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
  for(const asset of ['styles.css','rab.css','theme.css']) html=html.replace(`href="${manifest[asset]}"`,`data-asset="${asset}" href="${manifest[asset]}"`);
  const entry=file==='index.html'?'rab-app.js':'app.js';
  const loader=loaderSource.replace('__ASSET_MANIFEST__',JSON.stringify(manifest)).replace('__ASSET_ENTRY__',JSON.stringify(entry)).replace('__BUILD_ID__',JSON.stringify(buildId));
  html=html.replace(`<script type="module" src="${manifest[entry]}"></script>`,`<script type="module">${loader}</script>`);
  html=html.replace('</head>',`  <meta name="rab-build" content="${buildId}">\n</head>`);
  await writeFile(new URL(`dist/${file}`,root),html);
}
await cp(new URL('favicon.svg',root),new URL('dist/favicon.svg',root));
await cp(new URL('public/', root), new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/.nojekyll', root), '');
await writeFile(new URL('dist/build-info.json',root),JSON.stringify({buildId,assets:manifest},null,2));
console.log(`Build selesai: dist/ (versi ${buildId}, aset dengan penanda versi).`);
