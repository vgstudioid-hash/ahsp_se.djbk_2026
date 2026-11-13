import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceRegions,selectPriceRegion,snapshotPriceProfile,validateProject,calculateProject,rateKey,importRates,toCsv} from '../rab-core.js';
const component={name:'Pekerja',unit:'OH',group:'Tenaga kerja',coefficient:2};
const item={id:'work',docId:'iv',code:'AHS-1',title:'Pekerjaan',unit:'m³',group:'Pekerjaan',volume:3,components:[component]};
const key=rateKey(item,component);
const fixture=()=>({name:'Harga wilayah',location:'',owner:'',date:'2026-11-13',overhead:0,tax:0,rates:{[key]:90000},resourceMeta:{[key]:{remarks:'Harga lama'}},items:[structuredClone(item)],smkk:[]});
test('regional HSD preserves legacy prices and isolates labour prices, zero, missing values and metadata',()=>{
 const p=fixture();selectPriceRegion(p,'Jawa Barat');assert.deepEqual(p.rates,{});assert.equal(p.priceSubRegion,'');selectPriceRegion(p,'Jawa Barat','Purwakarta');assert.deepEqual(p.rates,{});p.rates[key]=100000;p.resourceMeta[key]={remarks:'Purwakarta',shb:110000};assert.equal(calculateProject(p).subtotal,600000);
 selectPriceRegion(p,'Jawa Barat','Karawang');assert.equal(p.rates[key],undefined);p.rates[key]=150000;assert.equal(calculateProject(p).subtotal,900000);selectPriceRegion(p,'Jawa Barat','Purwakarta');assert.equal(p.rates[key],100000);assert.equal(p.resourceMeta[key].remarks,'Purwakarta');delete p.rates[key];selectPriceRegion(p,'Jakarta','Jakarta');p.rates[key]=0;selectPriceRegion(p,'Jawa Barat','Purwakarta');assert.equal(p.rates[key],undefined);selectPriceRegion(p,'Jakarta','Jakarta');assert.equal(p.rates[key],0);selectPriceRegion(p,'');assert.equal(p.rates[key],90000);assert.equal(p.resourceMeta[key].remarks,'Harga lama');
});
test('regional backup/reload retains all banks, active selection and current edits',()=>{
 const p=fixture();selectPriceRegion(p,'Banten','Banten');p.rates[key]=123;p.resourceMeta[key]={priceSource:'Sumber Banten',kdn:'80%'};snapshotPriceProfile(p);const restored=validateProject(JSON.parse(JSON.stringify(p)));assert.equal(restored.priceRegion,'Banten');assert.equal(restored.rates[key],123);selectPriceRegion(restored,'');assert.equal(restored.rates[key],90000);selectPriceRegion(restored,'Banten','Banten');assert.equal(restored.resourceMeta[key].kdn,'80%');
 assert.throws(()=>validateProject({...p,priceSubRegion:'Karawang'}),/Sub Region/);assert.throws(()=>selectPriceRegion(p,'Jawa Barat','Jakarta'),/Sub Region/);assert.equal(p.priceRegion,'Banten');assert.throws(()=>validateProject({...p,priceProfiles:{bad:{rates:{}}}}),/wilayah/);
});
test('regional CSV sorts multiple regions atomically and leaves active bank intact',()=>{
 const p=fixture();selectPriceRegion(p,'Jawa Barat','Purwakarta');const csv=toCsv([['kunci','harga','region','sub region','sumber harga'],[key,100000,'Jawa Barat','Purwakarta','Sumber P'],[key,120000,'Jawa Barat','Karawang','Sumber K'],[key,0,'Jakarta','Jakarta','Sumber J']]);const result=importRates(csv,p);assert.equal(result.count,3);assert.equal(result.rates[key],100000);Object.assign(p,result);selectPriceRegion(p,'Jawa Barat','Karawang');assert.equal(p.rates[key],120000);assert.equal(p.resourceMeta[key].priceSource,'Sumber K');selectPriceRegion(p,'Jakarta','Jakarta');assert.equal(p.rates[key],0);const before=JSON.stringify(p);assert.throws(()=>importRates(csv+'\n'+toCsv([[key,-1,'Banten','Banten','']]),p));assert.equal(JSON.stringify(p),before);
 selectPriceRegion(p,'Jawa Barat');assert.throws(()=>importRates(toCsv([['kunci','harga'],[key,1]]),p),/Sub Region/);assert.equal(Object.keys(priceRegions).length,4);
});
