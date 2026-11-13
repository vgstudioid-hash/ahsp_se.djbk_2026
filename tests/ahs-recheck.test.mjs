import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {configureResourceCatalog,applyCatalogCorrections,calculateItem,rateKey,resources} from '../rab-core.js';
import {cleanResourceName,normalizedResourceUnit,resourceIdentity} from '../resource-cleanup.js';
const load=async file=>JSON.parse(await readFile(new URL('../public/data/'+file,import.meta.url),'utf8'));
const [raw,corrections,sources]=await Promise.all([load('ahs-catalog.json'),load('ahs-corrections.json'),load('ahs-source.json')]);
test('every corrected component is grounded in a named numeric row of its retained PDF source',()=>{
 assert(Object.keys(corrections.entries).length>500);for(const [id,entry]of Object.entries(corrections.entries)){const a=raw.find(a=>a.id===id);assert(a);assert.equal(a.sourcePages.length,1);assert.notEqual(a.extractionStatus,'verified');const text=sources[id].replace(/\s+/g,' ');for(const c of entry.components.filter(c=>entry.groups.includes(c.group))){assert(text.includes(c.name),id+': '+c.name);assert(text.includes(c.sourceCoefficient),id+': '+c.sourceCoefficient);const token=c.sourceCoefficient,comma=/\s(?:0|1),\d+/.test(sources[id]);const expected=Number((token.includes(',')||comma&&/^[1-9]\d{0,2}(?:\.\d{3})+$/.test(token)?token.replaceAll('.',''):token).replace(',','.'));assert.equal(c.coefficient,expected,id+': '+token);assert(c.unit);}}
 const sample=corrections.entries['v:table:624:189'];assert.equal(raw.find(a=>a.id==='v:table:624:189').components.length,0);assert.equal(sample.components.length,8);
});
test('source corrections update unchanged project copies once and preserve deliberate adjusted components',()=>{
 const before=raw.find(a=>a.id==='v:table:624:189'),catalog=configureResourceCatalog(raw,corrections.entries),p={items:[{...structuredClone(before),volume:1},{...structuredClone(before),adjusted:true,components:[]} ]};assert.equal(applyCatalogCorrections(p,raw,catalog),1);assert.equal(p.items[0].components.length,8);assert.equal(p.items[1].components.length,0);assert.equal(applyCatalogCorrections(p,raw,catalog),0);configureResourceCatalog([]);
});
test('unified naming reads legacy material prices without merging technical specifications or different trades',()=>{
 assert.equal(cleanResourceName('PC: Portland Cement'),'Semen Portland');assert.equal(cleanResourceName('Portland Cement'),'Semen Portland');assert.equal(cleanResourceName('Semen Portland (PC)'),'Semen Portland');assert.equal(cleanResourceName('Exavator (Standar)'),'Excavator (Standar)');assert.equal(normalizedResourceUnit('Ltr'),'liter');
 const c={name:'PC: Portland Cement',group:'Bahan',unit:'kg',coefficient:2},item={docId:'iv',volume:1,components:[c]},rates={[JSON.stringify(['iv','Bahan','pc: portland cement','kg'])]:100};assert.equal(calculateItem(item,rates,0).direct,200);assert.equal(resourceIdentity({group:'Bahan',name:'Baja D 13 Ø 8 mm',unit:'kg'}),resourceIdentity({group:'Bahan',name:'Baja D13 ø 8mm',unit:'kg'}));assert.notEqual(resourceIdentity({...c,name:'Pasir Beton'}),resourceIdentity({...c,name:'Pasir Pasang'}));
});
