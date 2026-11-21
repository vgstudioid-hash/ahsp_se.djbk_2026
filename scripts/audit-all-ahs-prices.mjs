import {readFile,writeFile} from 'node:fs/promises';
import {configureResourceCatalog,priceRegions,priceProfileKey,toCsv} from '../rab-core.js';
import {resourceIdentity} from '../resource-cleanup.js';
import {createPriceCatalog} from '../price-catalog.js';
const root=new URL('../',import.meta.url),load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const catalog=configureResourceCatalog(await load('public/data/ahs-catalog.json'),(await load('public/data/ahs-corrections.json')).entries),prices=await load('public/data/regional-price-catalog.json'),idx=createPriceCatalog(prices),scopes=Object.entries(priceRegions).flatMap(([region,subs])=>subs.map(subRegion=>({region,subRegion}))),groups=['Tenaga kerja','Bahan','Peralatan','Lain-lain'];
const rows=[],summary=[];
for(const scope of scopes){const counts={...scope,ahs:catalog.length,complete:0,partial:0,withoutPrice:0,withoutComponents:0,byGroup:Object.fromEntries(groups.map(g=>[g,{components:0,priced:0}]))};
 for(const a of catalog){let priced=0;const missing=[];for(const c of a.components){const candidates=idx.get(priceProfileKey(scope.region,scope.subRegion)+'\0'+resourceIdentity(c))||[],ok=candidates.length===1;priced+=Number(ok);const g=counts.byGroup[c.group];if(g){g.components++;g.priced+=Number(ok);}if(!ok)missing.push(c.name+' ['+c.unit+']');}const state=!a.components.length?'Tanpa rincian komponen':priced===a.components.length?'Harga lengkap':priced?'Sebagian harga tersedia':'Belum ada harga';if(!a.components.length)counts.withoutComponents++;else if(priced===a.components.length)counts.complete++;else if(priced)counts.partial++;else counts.withoutPrice++;rows.push([scope.region,scope.subRegion,a.docId,a.code,a.title,a.page,a.components.length,priced,a.components.length-priced,state,missing.join(' | ')]);}
 summary.push(counts);
}
await writeFile(new URL('public/reports/audit-harga-semua-ahs.csv',root),toCsv([['Region','Sub Region','Lampiran','Kode AHS','Uraian','Halaman sumber','Jumlah komponen','Komponen dengan harga','Komponen belum tersedia','Status harga','Nama komponen belum tersedia'],...rows]));
await writeFile(new URL('public/reports/audit-harga-semua-ahs.json',root),JSON.stringify({preparedOn:'2026-11-21',allAhs:catalog.length,scopeCount:scopes.length,ahsScopeChecks:rows.length,summary},null,2));console.log(JSON.stringify(summary.map(({byGroup,...x})=>x),null,2));
