import {readFile,writeFile} from 'node:fs/promises';
import {norm,unit} from './price-source-matching.mjs';
const root=new URL('../',import.meta.url),dir=process.argv[2]||'/workspace/price-sources';
const year=process.argv.includes('--year=2023')?2023:2025;
const inv=JSON.parse(await readFile(new URL('public/reports/inventaris-sumber-daya-harga.json',root),'utf8')).resources,rows=JSON.parse(await readFile(dir+'/journal-database-'+year+'.json','utf8')).rows,index=new Map();
for(const r of inv){const key=norm(r.name)+'|'+unit(r.unit,r.group)+'|'+r.group;if(!index.has(key))index.set(key,[]);index.get(key).push(r);}
const found=rows.filter(r=>index.has(norm(r.name)+'|'+unit(r.unit,r.group)+'|'+r.group));await writeFile(dir+'/journal-exact-matches'+(year===2023?'-2023':'')+'.json',JSON.stringify(found,null,2));console.log(JSON.stringify({matchedRows:found.length,pages:new Set(found.map(r=>r.page)).size,byGroup:Object.fromEntries(['Bahan','Peralatan'].map(g=>[g,found.filter(r=>r.group===g).length]))}));
