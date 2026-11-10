import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateProject} from '../rab-core.js';
const root=new URL('../public/data/',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name+'.json',root),'utf8'));
const catalog=await read('ahs-catalog'),coverage=await read('ahs-coverage'),inventory=await read('ahs-inventory'),evidence=await read('ahs-source');
test('Catalog includes every independently counted source cost table and every inventory code, including duplicate source codes',async()=>{
 assert(catalog.length>5500);assert.equal(new Set(catalog.map(a=>a.id)).size,catalog.length);
 for(const report of coverage.documents){
  const raw=await readFile(new URL(report.docId+'.json',root),'utf8'),pages=JSON.parse(raw),entries=catalog.filter(a=>a.docId===report.docId);
  assert.equal(createHash('sha256').update(raw).digest('hex'),report.sourceSha256);
  let count=0;pages.forEach((text,index)=>{const expected=[...text.matchAll(/^\s*A[.\s]+(?:TENAGA|PEKERJA|UNIT\s+PEKERJAAN)/gim)].length;assert.equal(entries.filter(a=>a.tableOrdinal&&a.page===index+1).length,expected,`${report.docId} p${index+1}`);count+=expected;});
  assert.equal(report.detectedTables,count);assert.equal(report.catalogTables,count);
  assert.equal(inventory[report.docId].length,report.tocRows);assert.deepEqual(report.missingTocCodes,[]);
  for(const row of inventory[report.docId])assert(entries.some(a=>a.code===row.code||a.aliases?.includes(row.code)),`${report.docId} missing ${row.code}`);
 }
});
test('Every extracted coefficient retains its full numeric source token and source page; schema accepts complete numeric entries',async()=>{
 const pages={};for(const report of coverage.documents)pages[report.docId]=await read(report.docId);
 for(const a of catalog){
  assert(pages[a.docId][a.page-1]);assert(['verified','extracted','review','reference'].includes(a.extractionStatus));
  if(a.tableOrdinal)assert(evidence[a.id]);
  for(const c of a.components){assert(Number.isFinite(c.coefficient)&&c.coefficient>=0);assert.equal(c.coefficient,Number(c.sourceCoefficient.replaceAll('.','').replace(',','.')));assert(pages[a.docId][(c.sourcePage||a.page)-1].includes(c.sourceCoefficient),`${a.id} ${c.name}`);}
  if(a.unit&&a.components.length){const project={name:'Source audit',location:'',owner:'',date:'2026-11-10',overhead:10,tax:12,rates:{},smkk:[],items:[{...a,group:'Pekerjaan',volume:1}]};assert.doesNotThrow(()=>validateProject(project),a.id);}
 }
});
test('Multiline trade names and high precision BM coefficients are not truncated; unresolved formulas remain marked for review',()=>{
 const bm=catalog.find(a=>a.docId==='v'&&a.page===49&&a.tableOrdinal);assert.equal(bm.components.find(c=>c.name==='Pekerja').coefficient,.2914);
 const ck=catalog.find(a=>a.docId==='vi'&&a.page===1031&&a.code==='5.4.5.19');assert(ck.components.some(c=>c.name==='Tukang Listrik / Elektronik'&&c.coefficient===.04));
 assert(ck.components.some(c=>c.name==='Pipa HDPE Conduit 20 mm dan aksesoris'));
 const variable=catalog.find(a=>a.docId==='iv'&&a.page===1200);assert.equal(variable.extractionStatus,'review');assert(variable.issues.some(i=>i.includes('nonnumerik')));
 assert(catalog.some(a=>a.extractionStatus==='reference'&&a.components.length===0));
});

test('Repeated codes retain at least one catalog entry per distinct source inventory row',()=>{
 for(const [doc,rows]of Object.entries(inventory)){
  const counts=new Map();for(const row of rows)counts.set(row.code,(counts.get(row.code)||0)+1);
  for(const [code,count]of counts)if(count>1)assert(catalog.filter(a=>a.docId===doc&&a.code===code).length>=count,`${doc} ${code} lost a repeated-code variant`);
 }
});
