import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPriceCatalog,applyPriceCatalog,markPriceFieldManual,escalateByIndex} from '../price-catalog.js';
import {rateKey,validateProject,selectPriceRegion,resourceMetadata,resources,calculateProject,importRates,toCsv} from '../rab-core.js';
import {resourceIdentity} from '../resource-cleanup.js';
const c={name:'Pekerja',unit:'OH',group:'Tenaga kerja',coefficient:2};
const item={id:'w',docId:'iv',code:'A',title:'Pekerjaan',unit:'m3',group:'Pekerjaan',volume:3,components:[c]};
const fixture=()=>({name:'Harga',location:'',owner:'',date:'2026-11-21',overhead:0,tax:0,items:[structuredClone(item),{...structuredClone(item),id:'v',docId:'vi'}],rates:{},resourceMeta:{},smkk:[],priceRegion:'Jawa Barat',priceSubRegion:'Karawang'});
const record={id:'official-k',identity:resourceIdentity(c),region:'Jawa Barat',subRegion:'Karawang',basisYear:2026,price:138000,status:'verified',sourceText:'SHS Karawang 2026 PDF 231',remarks:'Sumber upah harian'};
const catalog=(rows=[record])=>createPriceCatalog({schemaVersion:1,records:rows});
test('verified regional prices fill shared AHS/HSD aliases and recalculate without modifying coefficients',()=>{
 const p=fixture(),before=structuredClone(p.items);assert.equal(applyPriceCatalog(p,catalog()),1);assert.equal(p.rates[rateKey(p.items[0],c)],138000);assert.equal(p.rates[rateKey(p.items[1],c)],138000);assert.equal(calculateProject(p).subtotal,1656000);assert.deepEqual(p.items,before);assert.equal(applyPriceCatalog(p,catalog()),0);
});
test('autofill preserves manual and zero prices, manual blanks, metadata and region isolation through backup',()=>{
 const p=fixture(),key=rateKey(item,c);p.rates[key]=0;assert.equal(applyPriceCatalog(p,catalog()),0);delete p.rates[key];markPriceFieldManual(p,key,'price');assert.equal(applyPriceCatalog(p,catalog()),0);
 const restored=validateProject(p);assert.equal(applyPriceCatalog(restored,catalog()),0);selectPriceRegion(restored,'Jawa Barat','Purwakarta');assert.equal(applyPriceCatalog(restored,catalog()),0);selectPriceRegion(restored,'Jawa Barat','Karawang');assert.equal(applyPriceCatalog(restored,catalog()),0);
 const q=fixture();markPriceFieldManual(q,key,'priceSource');q.resourceMeta[key].remarks='Catatan sendiri';assert.equal(applyPriceCatalog(q,catalog()),1);const m=resourceMetadata(q,resources(q)[0]);assert.equal(m.priceSource,undefined);assert.equal(m.remarks,'Catatan sendiri');assert.equal(m.catalogPriceYear,2026);assert.equal(m.kdn,undefined);
});
test('no automatic provincial fallback, incomplete selection, technical/unit mismatch or conflicting price choice',()=>{
 const p=fixture();p.priceRegion='';p.priceSubRegion='';assert.equal(applyPriceCatalog(p,catalog()),0);p.priceRegion='Jawa Barat';assert.equal(applyPriceCatalog(p,catalog()),0);p.priceSubRegion='Karawang';assert.equal(applyPriceCatalog(p,catalog([{...record,identity:resourceIdentity({...c,unit:'OJ'})}])),0);assert.equal(applyPriceCatalog(p,catalog([record,{...record,id:'other',price:150000}])),0);
 p.rates[rateKey(p.items[0],c)]=110000;p.rates[rateKey(p.items[1],c)]=120000;assert.equal(applyPriceCatalog(p,catalog()),0);assert.equal(Object.values(p.rates).length,2);
});
test('CSV user edits remain manual and catalog origins survive profile validation',()=>{
 const p=fixture(),key=rateKey(item,c);applyPriceCatalog(p,catalog());const result=importRates(toCsv([['kunci','harga','sumber harga'],[key,170000,'Survei sendiri']]),p);Object.assign(p,result);markPriceFieldManual(p,key,'price');delete p.rates[key];delete p.rates[rateKey(p.items[1],c)];const q=validateProject(p);assert.equal(applyPriceCatalog(q,catalog()),0);assert.equal(q.resourceMeta[key].priceSource,'Survei sendiri');assert.equal(q.resourceMeta[key].catalogPriceId,'official-k');assert.throws(()=>validateProject({...p,resourceMeta:{[key]:{catalogManual:['bad']}}}),/manual/);
});
test('BPS escalation uses comparable official index ratios, accepts deflation and rejects mixed bases or missing provenance',()=>{
 const base={series:'Semen',baseYear:2023,value:101.49,period:'2025 annual',url:'https://www.bps.go.id/table'},target={...base,value:108.96,period:'2026-10'};
 assert.equal(escalateByIndex(1000,base,target).price,1073.6);assert.equal(escalateByIndex(1000,target,base).price,931.44);assert.throws(()=>escalateByIndex(1000,base,{...target,baseYear:2018}));assert.throws(()=>escalateByIndex(1000,base,{...target,series:'Upah'}));assert.throws(()=>escalateByIndex(1000,{...base,url:''},target));
});
test('published prices have exact inventoried identities, complete permitted regions and traceable source evidence',async()=>{
 const load=async file=>JSON.parse(await readFile(new URL('../public/'+file,import.meta.url),'utf8'));const data=await load('data/regional-price-catalog.json'),inventory=await load('reports/inventaris-sumber-daya-harga.json'),indices=await load('data/bps-price-indices.json');const ids=new Set(inventory.resources.map(r=>r.identity));const scopes=new Set();assert(data.records.length>800);createPriceCatalog(data);
 for(const r of data.records){assert(ids.has(r.identity));const k=r.region+'|'+r.subRegion+'|'+r.identity;assert(!scopes.has(k));scopes.add(k);assert(r.evidence.sourceUrl.startsWith('https://drive.google.com/file/d/'));assert(r.evidence.locator);assert.equal(r.basisYear,2026);if(r.sourceYear<2026){assert(r.evidence.reviewed);assert(r.escalation);if(r.escalation.kind==='regional-cpi-wage-proxy'){assert.equal(r.group,'Tenaga kerja');assert.equal(r.subRegion,'Kota Bekasi');assert.equal(r.evidence.hoursPerDay,8);assert.equal(r.price,Math.round(r.evidence.sourcePrice*(r.evidence.unitConversion?.factor??1)*1.0221*100)/100);assert(r.remarks.includes('bukan indeks upah konstruksi'));}else{const b=indices.commodities.find(x=>x.id===r.evidence.bpsCommodity);assert.equal(r.price,Math.round(r.evidence.sourcePrice*b.oct2026/b.annual2025*100)/100);assert.notEqual(r.group,'Tenaga kerja');}}else if(r.group==='Tenaga kerja')assert.equal(r.price,r.evidence.sourcePrice);assert.equal(r.tkdn,undefined);}
});
test('TKDN requires product/certificate evidence, remains independent of manual price, and never fills expired or manually cleared values',()=>{
 const material={...c,group:'Bahan',name:'Produk spesifik uji',unit:'kg'},materialRecord={...record,identity:resourceIdentity(material)};
 const make=()=>{const p=fixture();for(const i of p.items)i.components=[structuredClone(material)];return p;};
 const cert={number:'CERT-TEST',manufacturer:'Produsen uji',product:'Produk spesifik uji',url:'https://tkdn.kemenperin.go.id/sertifikat/test',validThrough:'2028-12-31',verifiedOn:'2026-11-21'};
 assert.throws(()=>catalog([{...materialRecord,tkdn:80}]),/sertifikat/);assert.throws(()=>catalog([{...materialRecord,tkdn:101,tkdnCertificate:cert}]),/sertifikat/);
 const p=make(),key=rateKey(p.items[0],material);p.year='2027';p.rates[key]=177000;applyPriceCatalog(p,catalog([{...materialRecord,tkdn:80,tkdnCertificate:cert}]));assert.equal(p.rates[key],177000);assert.equal(p.resourceMeta[key].kdn,'80%');assert.equal(validateProject(p).resourceMeta[key].catalogTkdnId,'CERT-TEST');
 const q=make();q.year='2027';applyPriceCatalog(q,catalog([{...materialRecord,tkdn:80,tkdnCertificate:{...cert,validThrough:'2026-12-31'}}]));assert.equal(q.resourceMeta[key].kdn,undefined);markPriceFieldManual(q,key,'kdn');applyPriceCatalog(q,catalog([{...materialRecord,tkdn:80,tkdnCertificate:cert}]));assert.equal(q.resourceMeta[key].kdn,undefined);
});
test('Mandor Kota Bekasi uses the confirmed 2025 source and transparent 2026 CPI planning estimate for OH and OJ',async()=>{
 const data=JSON.parse(await readFile(new URL('../public/data/regional-price-catalog.json',import.meta.url),'utf8')),idx=createPriceCatalog(data),p=fixture();p.items=[{...structuredClone(item),components:[{...c,name:'Mandor',coefficient:1},{...c,name:'Mandor',unit:'OJ',coefficient:1}]}];selectPriceRegion(p,'Jawa Barat','Kota Bekasi');assert.equal(applyPriceCatalog(p,idx),2);const res=resources(p);assert.equal(res.find(c=>c.unit==='OH').price,298657.62);assert.equal(res.find(c=>c.unit==='OJ').price,37332.2);for(const r of res){const m=resourceMetadata(p,r);assert.match(m.priceSource,/2025/);assert.match(m.priceSource,/2\.2100/);assert.match(m.remarks,/proksi IHK/);}
 selectPriceRegion(p,'Jawa Barat','Kab. Bekasi');assert.equal(applyPriceCatalog(p,idx),0);assert.equal(resources(p)[0].price,null);selectPriceRegion(p,'Jawa Barat','Kota Bekasi');assert.equal(resources(p)[0].price,298657.62);
});
