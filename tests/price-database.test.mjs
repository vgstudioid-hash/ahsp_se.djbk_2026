import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {norm} from '../scripts/price-source-matching.mjs';
const root=new URL('../',import.meta.url),load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
test('source matching joins OCR word spacing while retaining separate numbers, fractions and dimensions',()=>{
 assert.equal(norm('Concrete Vibrator'),norm('ConcreteVibrator'));assert.notEqual(norm('Baja D1 3'),norm('Baja D13'));assert.notEqual(norm('Kaso 5/7 cm'),norm('Kaso 5/10 cm'));assert.notEqual(norm('Pipa 1/2 inci'),norm('Pipa 12 inci'));assert.notEqual(norm('Pasir Beton'),norm('Pasir Pasang'));
});
test('all AHS and all regions have a coverage result independent of the UPVC example',async()=>{
 const data=await load('public/reports/audit-harga-semua-ahs.json'),catalog=await load('public/data/ahs-catalog.json'),db=await load('public/data/price-database-summary.json'),prices=await load('public/data/regional-price-catalog.json');assert.equal(data.allAhs,catalog.length);assert.equal(data.scopeCount,11);assert.equal(data.ahsScopeChecks,catalog.length*11);for(const r of data.summary)assert.equal(r.complete+r.partial+r.withoutPrice+r.withoutComponents,catalog.length);assert.equal(db.automaticPrices,prices.records.length);assert.equal(db.pricedIdentities,new Set(prices.records.map(r=>r.identity)).size);assert(db.sourcePriceRows>40000);assert(db.byGroup.Bahan>800);assert(db.byGroup.Peralatan>0);assert(db.byGroup['Tenaga kerja']>0);
});
test('downloaded SQLite archive has integrity, provenance, all resources and a complete selected-price index',()=>{
 const file=new URL('../public/data/price-database.zip',import.meta.url).pathname;
 const result=spawnSync('python3',['-c',`import zipfile,sqlite3,tempfile,json,sys,pathlib\nwith tempfile.TemporaryDirectory() as folder:\n z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;z.extract('price-database.sqlite',folder);db=sqlite3.connect(str(pathlib.Path(folder)/'price-database.sqlite'));assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok';assert not db.execute('PRAGMA foreign_key_check').fetchall();s=json.loads(z.read('summary.json'));assert db.execute('SELECT COUNT(*) FROM resources').fetchone()[0]==s['resourceIdentities'];assert db.execute('SELECT COUNT(*) FROM prices').fetchone()[0]==s['automaticPrices'];assert db.execute('SELECT COUNT(*) FROM source_prices').fetchone()[0]==s['sourcePriceRows'];assert db.execute('SELECT COUNT(*) FROM unpriced_resources').fetchone()[0]==s['resourceIdentities']-s['pricedIdentities'];assert db.execute('SELECT COUNT(*) FROM sources').fetchone()[0]==53;print('ok')`,file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/ok/);
});
test('wage selection uses actual regional law ahead of the workbook and retains specialist estimation limits',async()=>{
 const data=await load('public/data/regional-price-catalog.json');for(const sub of ['Purwakarta','Kab. Bekasi','Kota Bekasi','Kota Bandung','Kab. Bogor','Indramayu','Subang']){const r=data.records.find(r=>r.subRegion===sub&&r.name==='Mandor'&&r.unit.toLowerCase()==='oh');assert(r);assert.equal(r.evidence.authority,'regional-regulation');assert.equal(r.evidence.sourceId,'1KXEj1gp7afNY_GGnOMWWmk6MRW7UgaQP');assert.match(r.remarks,/swakelola/);}for(const r of data.records.filter(r=>r.escalation?.kind==='regional-cpi-rental-proxy')){assert.equal(r.evidence.priceKind,'rental');assert.equal(r.group,'Peralatan');assert.match(r.remarks,/bukan indeks harga sewa alat/);}
});

test('authorized nearest-area references preserve provenance and never copy wages, cross provinces, override local records or recurse',async()=>{
 const data=await load('public/data/regional-price-catalog.json'),refs=data.records.filter(r=>r.regionalReference);assert(refs.length>1000);const ids=new Map(data.records.map(r=>[r.id,r]));for(const r of refs){const ref=r.regionalReference,source=ids.get(ref.sourceRecordId);assert(source);assert(!source.regionalReference);assert.equal(source.group,r.group);assert(['Bahan','Peralatan'].includes(r.group));assert.equal(source.region,r.region);assert.notEqual(source.subRegion,r.subRegion);assert.equal(source.price,r.price);assert.equal(source.identity,r.identity);assert.equal(r.priceKind,'estimate');assert.match(r.remarks,/bukan survei harga setempat/);assert(r.sourceText.includes(source.subRegion));assert(!data.records.some(s=>!s.regionalReference&&s.identity===r.identity&&s.region===r.region&&s.subRegion===r.subRegion));}
});

test('compact runtime catalog preserves every price, scope, provenance text and replacement lineage while rejecting unsafe references',async()=>{
 const {createPriceCatalog,compactPriceCatalog}=await import('../price-catalog.js'),data=await load('public/data/regional-price-catalog.json'),compact=compactPriceCatalog(data),full=createPriceCatalog(data),runtime=createPriceCatalog(compact);assert.equal(full.size,runtime.size);for(const [key,rows]of full){const other=runtime.get(key);assert(other);for(const field of ['id','price','sourceText','remarks','replaces'])assert.deepEqual(other[0][field],rows[0][field],key+' '+field);}assert(JSON.stringify(compact).length<JSON.stringify(data).length/2);
 const source=compact.records.find(r=>r.group==='Bahan'),ref={id:'test-ref',sourceRecordId:source.id,region:source.region,subRegion:source.subRegion==='Purwakarta'?'Karawang':'Purwakarta',referenceNotice:'Estimasi uji'};assert.throws(()=>createPriceCatalog({schemaVersion:2,records:[source,{...ref,region:'Lampung',subRegion:'Lampung'}]}),/Acuan/);assert.throws(()=>createPriceCatalog({schemaVersion:2,records:[{...source,group:'Tenaga kerja'},ref]}),/Acuan/);assert.throws(()=>createPriceCatalog({schemaVersion:2,records:[ref]}),/Acuan/);
});

test('legacy price endpoint remains schema1 while the new application endpoint carries equivalent compact data',async()=>{
 const legacy=await load('public/data/regional-price-catalog.json'),runtime=await load('public/data/regional-price-runtime.json'),{createPriceCatalog}=await import('../price-catalog.js');assert.equal(legacy.schemaVersion,1);assert.equal(runtime.schemaVersion,2);assert.equal(createPriceCatalog(legacy).size,createPriceCatalog(runtime).size);assert.equal(legacy.records.length,runtime.records.length);
});
