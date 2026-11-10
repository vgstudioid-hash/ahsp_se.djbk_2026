import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createSmkkRows,updateSmkkDefaults,riskQuantityText} from '../smkk-core.js';
import {calculateProject,validateProject,summarizeScopes,smkkRowResult} from '../rab-core.js';
const templates=JSON.parse(await readFile(new URL('../public/data/smkk-templates.json',import.meta.url),'utf8'));
const settings={workers:101,months:6,insuredValue:1000000000,highway:false};
const get=(rows,code)=>rows.find(r=>code==='5.a.utama'?r.sourceKey?.endsWith(':5.a.utama'):r.sourceCode===code);
const project=rows=>({name:'SMKK',location:'',owner:'',date:'2026-11-10',overhead:15,tax:12,taxScheme:'dpp11of12',items:[],rates:{},smkk:rows});
test('SMKK templates preserve all nine source groups, actual table labels/pages, and distinct repeated-code specialists',async()=>{
 assert.equal(templates.pdfSha256,createHash('sha256').update(await readFile(new URL('../public/documents/iii.pdf',import.meta.url))).digest('hex'));
 assert.equal(templates.tables.small.rows.length,45);assert.equal(templates.tables.mediumHigh.rows.length,140);
 for(const t of Object.values(templates.tables)){assert.equal(Object.keys(t.groups).length,9);assert.equal(new Set(t.rows.map(r=>r.key)).size,t.rows.length);for(const r of t.rows){assert(r.page>=t.startPage&&r.page<=t.endPage);assert(r.name.length>3);assert.equal(typeof r.quantityText,'string');}}
 const small=createSmkkRows(templates,'Kecil',settings),medium=createSmkkRows(templates,'Sedang',settings),high=createSmkkRows(templates,'Tinggi',settings);
 assert.match(get(small,'1.a').name,/RKK dan RMPK/);assert.match(get(medium,'1.a').name,/RKPPL, RMLLP/);assert(medium.every(r=>r.sourceTable==='III.2'));assert(high.every(r=>r.sourceTable==='III.2'));assert.equal(get(high,'3.b.6').unit,'');assert.equal(get(high,'3.b.6').enabled,false);
 assert.equal(medium.filter(r=>r.sourceCode==='8.i').length,3);assert.throws(()=>createSmkkRows(templates,'Lainnya',settings));
});
test('Source risk quantities adapt for frequency, workers, person-months, senior experts, and minimum CAR premium',()=>{
 const small=createSmkkRows(templates,'Kecil',settings),medium=createSmkkRows(templates,'Sedang',settings),high=createSmkkRows(templates,'Tinggi',settings);
 assert.equal(get(small,'1.a').volume,6);assert.equal(get(small,'5.a').volume,12);assert.equal(get(medium,'5.b').volume,18);assert.equal(get(high,'5.b').volume,18);assert.equal(get(medium,'2.c').volume,12);assert.equal(get(high,'2.c').volume,24);assert.equal(get(medium,'7.e').volume,8);assert.equal(get(high,'7.e').volume,15);
 assert.equal(get(high,'5.a').volume,6);assert.equal(get(high,'5.a.utama').volume,6);assert.equal(get(medium,'5.a.utama'),undefined);assert.equal(get(high,'4.a').price,1000000);assert.equal(get(high,'4.a').volume,1);
 assert.equal(get(createSmkkRows(templates,'Tinggi',{...settings,workers:100}),'5.a.utama').enabled,false);
 assert.equal(get(createSmkkRows(templates,'Sedang',{...settings,workers:80}),'5.b').volume,12);assert.equal(get(createSmkkRows(templates,'Tinggi',{...settings,workers:81}),'5.b').volume,18);
 assert.match(riskQuantityText(get(high,'2.c').quantityText,'Tinggi'),/minimal 4/);
});
test('Missing prices and project-specific quantities are not invented or silently treated as a complete zero budget',()=>{
 const rows=createSmkkRows(templates,'Sedang',{});assert.equal(get(rows,'5.b').volume,null);assert.equal(get(rows,'4.a').price,null);assert.equal(get(rows,'3.b.2').volume,null);assert.equal(get(rows,'3.b.2').enabled,false);assert.equal(get(rows,'1.a').price,null);
 const r=calculateProject(project(rows));assert.equal(r.smkk,0);assert(r.smkkMissing>0);assert.equal(r.incomplete,true);const scope=summarizeScopes(project(rows)).scopes.at(-1);assert.equal(scope.incomplete,true);assert.equal(scope.missing,r.smkkMissing);
 assert.deepEqual(smkkRowResult({unit:'buah',volume:2,price:100,enabled:false}),{enabled:false,missing:false,amount:0});assert.equal(smkkRowResult({unit:'buah',volume:1,price:0}).missing,false);
});
test('Manual edits survive automatic parameter updates and risk settings/source references survive backup',()=>{
 let rows=createSmkkRows(templates,'Sedang',settings);const edited=get(rows,'2.c');edited.volume=99;edited.price=150000;edited.manualVolume=true;edited.manualPrice=true;edited.enabled=false;edited.manualEnabled=true;
 rows=updateSmkkDefaults(rows,'Sedang',{...settings,months:8});assert.equal(get(rows,'2.c').volume,99);assert.equal(get(rows,'2.c').price,150000);assert.equal(get(rows,'2.c').enabled,false);assert.equal(get(rows,'2.d').volume,16);
 const p={...project(rows),smkkRisk:'Sedang',smkkSettings:settings,smkkDrafts:{Kecil:createSmkkRows(templates,'Kecil',settings)}};const restored=validateProject(JSON.parse(JSON.stringify(p)));assert.equal(restored.smkkRisk,'Sedang');assert.equal(restored.smkkSettings.workers,101);assert.equal(restored.smkkDrafts.Kecil.length,45);assert.equal(get(restored.smkk,'2.c').volume,99);assert.equal(get(restored.smkk,'2.c').sourcePage,41);assert.equal(get(restored.smkk,'5.b').sourceGroup,'5');assert.equal(get(restored.smkk,'1.a').price,null);
 assert.throws(()=>validateProject({...p,smkkRisk:'Besar'}));assert.throws(()=>validateProject({...p,smkkSettings:{workers:1.5}}));assert.throws(()=>validateProject({...p,smkkDrafts:{unknown:[]}}));
});
test('Highway-specific components and quantities change only when highway parameters apply',()=>{
 const ordinary=createSmkkRows(templates,'Tinggi',settings),highway=createSmkkRows(templates,'Tinggi',{...settings,highway:true});assert.equal(get(ordinary,'6.j').enabled,false);assert.equal(get(highway,'6.j').enabled,true);assert.equal(get(highway,'6.j').volume,12);assert.equal(get(highway,'7.i').volume,500);assert.equal(get(highway,'7.f').volume,96);assert.equal(get(highway,'2.k').volume,10000);assert.equal(get(highway,'5.f').volume,72);
});
