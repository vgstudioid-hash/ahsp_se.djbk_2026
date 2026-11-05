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
