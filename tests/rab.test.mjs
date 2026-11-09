import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateProject, calculateItem, rateKey, resources, toCsv, importRates, validateProject } from '../rab-core.js';
const root = new URL('../public/data/',import.meta.url);
const catalog = JSON.parse(await readFile(new URL('ahs-catalog.json',root),'utf8'));
function fixture(){return {name:'Tes RAB',location:'Jakarta',owner:'Pemilik',date:'2026-11-05',overhead:10,tax:11,rates:{},items:[{...structuredClone(catalog[0]),id:'i1',group:'Persiapan',volume:100}],smkk:[{id:'s1',name:'Helm keselamatan',unit:'buah',volume:2,price:50000}]};}
test('RAB follows actual AHS coefficients, applies overhead once, SMKK separately, and tax to the configured base',()=>{
 const p=fixture(),i=p.items[0];p.rates[rateKey(i,i.components[0])]=100000;p.rates[rateKey(i,i.components[1])]=150000;
 const r=calculateProject(p);
 assert.equal(r.items[0].direct,5750);assert.equal(r.items[0].margin,575);assert.equal(r.items[0].unitPrice,6325);
 assert.equal(r.subtotal,632500);assert.equal(r.smkk,100000);assert.equal(r.taxBase,732500);assert.equal(r.tax,80575);assert.equal(r.total,813075);assert.equal(r.incomplete,false);
 assert.equal(resources(p).find(c=>c.name==='Pekerja').quantity,5);
});
test('Missing rates are incomplete; explicit zero rates are valid; zero-volume and empty projects remain drafts',()=>{
 const p=fixture();assert.equal(calculateProject(p).missing,2);assert.equal(calculateProject(p).incomplete,true);
 for(const c of p.items[0].components)p.rates[rateKey(p.items[0],c)]=0;
 assert.equal(calculateProject(p).missing,0);assert.equal(calculateProject(p).incomplete,false);
 p.items[0].volume=0;assert.equal(calculateProject(p).incomplete,true);p.items=[];assert.equal(calculateProject(p).incomplete,true);
});
test('Shared resource prices recalculate all matching items while trades, fields, and units remain distinct',()=>{
 const p=fixture();p.items.push({...structuredClone(p.items[0]),id:'i2',volume:20});
 const c=p.items[0].components[0],key=rateKey(p.items[0],c);p.rates[key]=200000;
 assert.equal(calculateProject(p).items[1].breakdown[0].price,200000);
 assert.equal(resources(p).find(c=>c.name==='Pekerja').quantity,6);
 assert.notEqual(key,rateKey(p.items[0],{...c,unit:'jam'}));assert.notEqual(key,rateKey({...p.items[0],docId:'vi'},c));
 assert.notEqual(rateKey(p.items[0],{...c,name:'Tukang Kayu'}),rateKey(p.items[0],{...c,name:'Tukang batu'}));
});
test('CSV prices round-trip quoted JSON keys; imports are atomic and reject invalid/negative rates',()=>{
 const p=fixture(),res=resources(p);const csv=toCsv([['kunci','nama','satuan','kelompok','harga'],...res.map(c=>[c.key,c.name,c.unit,c.group,'100000,50'])]);
 const out=importRates(csv,p);assert.equal(out.count,2);assert.equal(out.rates[res[0].key],100000.5);assert.deepEqual(p.rates,{});
 assert.throws(()=>importRates(toCsv([['kunci','harga'],[res[0].key,-1]]),p));assert.throws(()=>importRates('kunci;harga\nunknown;100',p));
 assert(toCsv([['=HYPERLINK("bad")']]).includes("'=HYPERLINK"));
});
test('Backup schema rejects invalid quantities and component types and preserves rates for valid projects',()=>{
 const p=fixture();const restored=validateProject(p);assert.equal(restored.items[0].volume,100);
 p.items[0].volume=-1;assert.throws(()=>validateProject(p));p.items[0].volume=1;p.items[0].components[0].group='Unknown';assert.throws(()=>validateProject(p));
});
test('Every curated AHS coefficient and code is present in its declared source page',async()=>{
 assert.equal(catalog.length,18);
 const cache={};for(const a of catalog){cache[a.docId]??=JSON.parse(await readFile(new URL(`${a.docId}.json`,root),'utf8'));const text=cache[a.docId][a.page-1];
 assert(text, a.id);if(a.docId!=='v')assert(text.includes(a.code),a.id);
 for(const c of a.components){assert(text.includes(c.sourceCoefficient),`${a.id}: ${c.name} ${c.sourceCoefficient}`);assert.equal(c.coefficient,Number(c.sourceCoefficient.replace(',','.')));}
 }
});

test('WBS headings do not add costs; unlinked work stays draft; row descriptions and remarks survive backup',async()=>{
 const {wbsNumbers}=await import('../rab-core.js');
 const p=fixture();for(const c of p.items[0].components)p.rates[rateKey(p.items[0],c)]=0;
 const heading={id:'h',code:'',title:'Persiapan',group:'WBS',unit:'',volume:0,components:[],heading:true,wbsLevel:1,remarks:'Judul'};
 p.items.unshift(heading);p.items[1].wbsLevel=2;p.items[1].remarks='Sesuai gambar kerja';
 assert.equal(calculateProject(p).incomplete,false);
 const restored=validateProject(p);assert.equal(restored.items[0].heading,true);assert.equal(restored.items[1].remarks,'Sesuai gambar kerja');
 p.items.push({...heading,heading:false,wbsLevel:3,title:'Pekerjaan belum dipilih',id:'u'});assert.equal(calculateProject(p).incomplete,true);
 assert.deepEqual(wbsNumbers([{wbsLevel:1},{wbsLevel:2},{wbsLevel:3},{wbsLevel:4},{wbsLevel:3},{wbsLevel:2},{wbsLevel:1},{wbsLevel:2}]),['A','1','a','•','b','2','B','1']);
});

test('Workbook HSD metadata round-trips without replacing actual prices with SHB or copying sample discounts',()=>{
 const p=fixture(),c=resources(p)[0];
 const csv=toCsv([['kunci','kode','harga shb','harga','keterangan'],[c.key,'L.01','200000','175000','Harga setempat, per OH']]);
 const result=importRates(csv,p);assert.equal(result.rates[c.key],175000);assert.equal(result.resourceMeta[c.key].shb,200000);assert.equal(result.resourceMeta[c.key].code,'L.01');
 const restored=validateProject({...p,rates:result.rates,resourceMeta:result.resourceMeta,year:'2026',coordinates:'Koordinat proyek',documentType:'HPS'});
 assert.equal(restored.resourceMeta[c.key].remarks,'Harga setempat, per OH');assert.equal(restored.year,'2026');assert.equal(restored.documentType,'HPS');
 assert.throws(()=>importRates(toCsv([['kunci','harga shb','harga'],[c.key,'-1','123']]),p));assert.deepEqual(p.rates,{});
});
test('Workbook fourth AHS group is included in direct cost and overhead once',()=>{
 const p=fixture(),i=p.items[0];i.components=[{group:'Lain-lain',name:'Biaya tambahan terukur',unit:'buah',coefficient:2}];p.rates[rateKey(i,i.components[0])]=1000;
 const r=calculateItem(i,p.rates,10);assert.equal(r.direct,2000);assert.equal(r.margin,200);assert.equal(r.unitPrice,2200);
});

test('Empirical AHS uses fixed Empiris code, preserves independent rates and basis through backup, and contributes to RAB',()=>{
 const p=fixture(),i=p.items[0];Object.assign(i,{code:'Empiris',docId:'',page:1,empirical:true,manual:true,note:'Pengamatan 2 OH untuk hasil 4 m²',components:[{group:'Tenaga kerja',name:'Pekerja',unit:'OH',coefficient:0.5}],volume:3});p.smkk=[];p.tax=0;p.rates[rateKey(i,i.components[0])]=100000;
 assert.equal(calculateProject(p).total,165000);const restored=validateProject(p);assert.equal(restored.items[0].empirical,true);assert.equal(restored.items[0].code,'Empiris');assert.equal(calculateProject(restored).total,165000);
 assert.notEqual(rateKey(i,i.components[0]),rateKey({...i,empirical:false},i.components[0]));
 assert.throws(()=>validateProject({...p,items:[{...i,code:'A.1'}]}));assert.throws(()=>validateProject({...p,items:[{...i,docId:'iv'}]}));assert.throws(()=>validateProject({...p,items:[{...i,note:''}]}));
});

test('Adjusted AHS component insertion/removal recalculates costs and preserves source catalog and backup flags',()=>{
 const p=fixture(),item=p.items[0];p.smkk=[];p.tax=0;for(const c of item.components)p.rates[rateKey(item,c)]=0;
 const original=JSON.stringify(catalog[0]);
 for(const group of ['Tenaga kerja','Bahan','Peralatan','Lain-lain']){
  const c={group,name:'Tambahan '+group,unit:'buah',coefficient:2};item.components.push(c);p.rates[rateKey(item,c)]=1000;
 }
 item.adjusted=true;item.manual=true;
 assert.equal(calculateProject(p).subtotal,880000);const restored=validateProject(p);assert.equal(restored.items[0].adjusted,true);assert.equal(restored.items[0].manual,true);
 item.components.splice(2,4);assert.equal(calculateProject(p).subtotal,0);assert.equal(JSON.stringify(catalog[0]),original);
});

test('Reviewed WBS format uses uppercase scope titles, uppercase/lowercase alphabetic numbering and bullets',async()=>{
 const {wbsNumbers,wbsTitle}=await import('../rab-core.js');
 assert.equal(wbsTitle({title:'Lingkup pekerjaan beton',wbsLevel:1}),'LINGKUP PEKERJAAN BETON');assert.equal(wbsTitle({title:'Uraian pekerjaan',wbsLevel:2}),'Uraian pekerjaan');
 const items=Array.from({length:28},()=>({wbsLevel:1}));assert.equal(wbsNumbers(items)[26],'AA');assert.equal(wbsNumbers(items)[27],'AB');
 assert.deepEqual(wbsNumbers([{wbsLevel:1},{wbsLevel:2},{wbsLevel:3},{wbsLevel:4},{wbsLevel:4}]),['A','1','a','•','•']);
 const p=fixture();p.items.unshift({id:'scope',code:'',title:'pekerjaan persiapan',unit:'',group:'Lingkup',volume:0,heading:true,wbsLevel:1,components:[]});assert.equal(validateProject(p).items[0].title,'PEKERJAAN PERSIAPAN');
});

test('Scope recap uses level-1 boundaries, preserves ungrouped work and duplicate scope names, and matches RAB totals',async()=>{
 const {summarizeScopes}=await import('../rab-core.js');const p=fixture();p.overhead=10;p.tax=10;p.smkk=[{id:'s',name:'SMKK',unit:'ls',volume:1,price:20}];
 const work=n=>({...structuredClone(p.items[0]),id:'work'+n,volume:n,wbsLevel:2,components:[{group:'Tenaga kerja',name:'Pekerja',unit:'OH',coefficient:1}]});
 const heading=id=>({id,code:'',title:'LINGKUP SAMA',group:'Lingkup',unit:'',volume:0,components:[],heading:true,wbsLevel:1});
 p.items=[work(1),heading('scopeA'),work(2),{...heading('sub'),wbsLevel:2},heading('scopeB'),{...work(3),wbsLevel:3}];p.rates={[rateKey(p.items[0],p.items[0].components[0])]:100};
 const r=summarizeScopes(p);assert.deepEqual(r.scopes.map(s=>s.amount),[110,220,330]);assert.deepEqual(r.scopes.map(s=>s.count),[1,1,1]);assert.deepEqual(r.scopes.map(s=>s.number),['—','A','B']);assert.equal(r.scopes[0].id,null);assert.equal(r.scopes[1].title,r.scopes[2].title);assert.notEqual(r.scopes[1].id,r.scopes[2].id);assert.equal(r.subtotal,660);assert.equal(r.smkk,20);assert.equal(r.tax,68);assert.equal(r.total,748);assert.equal(r.scopes.reduce((n,s)=>n+s.amount,0),calculateProject(p).subtotal);
});
test('Scope recap reports partial prices, unlinked work and empty scopes without inventing totals',async()=>{
 const {summarizeScopes}=await import('../rab-core.js');const p=fixture();p.items.unshift({id:'h',code:'',title:'LINGKUP A',group:'Lingkup',unit:'',volume:0,components:[],heading:true,wbsLevel:1});p.items.push({id:'empty',code:'',title:'LINGKUP B',group:'Lingkup',unit:'',volume:0,components:[],heading:true,wbsLevel:1});const r=summarizeScopes(p);assert.equal(r.scopes[0].incomplete,true);assert.equal(r.scopes[0].missing,2);assert.equal(r.scopes[1].count,0);assert.equal(r.scopes[1].amount,0);assert.equal(r.incomplete,true);
});

test('DPP 11/12 with PPN 12% adds 11% effective tax while keeping the full contract value in the final total',()=>{
 const p=fixture();p.taxScheme='dpp11of12';p.tax=12;p.smkk=[];p.overhead=0;p.items[0].volume=1;p.items[0].components=[{group:'Lain-lain',name:'Biaya pekerjaan',unit:'ls',coefficient:1}];p.rates={[rateKey(p.items[0],p.items[0].components[0])]:1200000};
 const r=calculateProject(p);assert.equal(r.beforeTax,1200000);assert.equal(r.taxBase,1100000);assert.equal(r.tax,132000);assert.equal(r.total,1332000);assert.notEqual(r.total,r.taxBase+r.tax);
 const restored=validateProject(p);assert.equal(restored.taxScheme,'dpp11of12');assert.equal(calculateProject(restored).total,1332000);
 p.smkk=[{id:'s',name:'SMKK',unit:'ls',volume:1,price:120000}];const smkk=calculateProject(p);assert.equal(smkk.beforeTax,1320000);assert.equal(smkk.taxBase,1210000);assert.equal(smkk.tax,145200);assert.equal(smkk.total,1465200);
});
test('Legacy tax settings and explicit zero tax are preserved; invalid DPP schemes are rejected',()=>{
 const p=fixture();p.tax=0;delete p.taxScheme;const old=validateProject(p);assert.equal(old.taxScheme,'full');assert.equal(old.tax,0);p.taxScheme='dpp11of12';p.tax=0;const exempt=validateProject(p);assert.equal(calculateProject(exempt).tax,0);p.taxScheme='unknown';assert.throws(()=>validateProject(p));
});

test('General Information requires all six blanks and validates budget/year without dropping MA/Sub MA or Unit Kerja',async()=>{
 const {projectInformationErrors}=await import('../rab-core.js');const p=fixture();Object.assign(p,{name:'',ma:'',subMa:'',workUnit:'',year:'',budget:null});assert.equal(Object.keys(projectInformationErrors(p)).length,6);
 Object.assign(p,{name:'Pekerjaan',ma:'001',subMa:'002',workUnit:'Unit A',year:'2026',budget:1000000});assert.deepEqual(projectInformationErrors(p),{});
 for(const key of ['name','ma','subMa','workUnit','year','budget']){const bad={...p,[key]:key==='budget'?null:' '};assert(Object.hasOwn(projectInformationErrors(bad),key));}
 assert(projectInformationErrors({...p,year:'20xx'}).year);assert(projectInformationErrors({...p,budget:-1}).budget);assert(projectInformationErrors({...p,budget:0}).budget);
 const restored=validateProject(p);assert.equal(restored.ma,'001');assert.equal(restored.subMa,'002');assert.equal(restored.workUnit,'Unit A');assert.equal(restored.budget,1000000);
 p.year='';assert.equal(validateProject(p).year,'');assert.throws(()=>validateProject({...p,budget:-1}));
});
