import {test} from 'node:test';import assert from 'node:assert/strict';
import {quantityShapes,quantityRowValue,quantitySummary,newQuantityRow,validateQuantityRows} from '../quantity-core.js';
import {validateProject,calculateProject,rateKey} from '../rab-core.js';
const row=(shape,dimensions,extra={})=>({...newQuantityRow(shape),dimensions,...extra});
test('All supported area shapes use the expected geometric formulas',()=>{
 const examples=[['square',{a:3},9],['rectangle',{l:3,w:4},12],['triangle',{b:6,h:4},12],['trapezoid',{a:3,b:5,h:4},16],['parallelogram',{b:6,h:4},24],['rhombus',{d1:6,d2:4},12],['kite',{d1:6,d2:4},12],['circle',{r:2},4*Math.PI],['ellipse',{a:3,b:2},6*Math.PI]];
 for(const [shape,d,expected] of examples)assert(Math.abs(quantityRowValue(row(shape,d)).value-expected)<1e-10,shape);
});
test('Count, length and solid volumes calculate independently and support repetition',()=>{
 assert.equal(quantitySummary([row('count',{n:6},{multiplier:3})],'buah').total,18);
 assert.equal(quantitySummary([row('length',{l:250},{dimensionUnit:'cm',multiplier:4})],"m'").total,10);
 const examples=[['box',{l:2,w:3,h:4},24],['cube',{a:3},27],['cylinder',{r:2,h:3},12*Math.PI],['triangularPrism',{b:2,h:3,l:4},12],['trapezoidalPrism',{a:2,b:4,h:3,l:4},36],['cone',{r:3,h:4},12*Math.PI],['sphere',{r:3},36*Math.PI]];
 for(const [shape,d,expected] of examples)assert(Math.abs(quantityRowValue(row(shape,d)).value-expected)<1e-10,shape);
});
test('Mixed area shapes sum with deductions and metric conversion, including RAB cm² output',()=>{
 const rows=[row('rectangle',{l:400,w:300},{dimensionUnit:'cm'}),row('triangle',{b:4,h:2}),row('rectangle',{l:100,w:200},{dimensionUnit:'cm',sign:-1})];
 assert.equal(quantitySummary(rows,'m²').total,14);assert.equal(quantitySummary(rows,'cm2').total,140000);
 assert.equal(quantitySummary([row('box',{l:1000,w:2000,h:3000},{dimensionUnit:'mm'})],'m3').total,6);
});
test('Incompatible measurement types, negative totals, invalid dimensions and unknown shapes are rejected',()=>{
 assert.throws(()=>quantitySummary([row('rectangle',{l:2,w:3})],'m³'));
 assert.throws(()=>quantitySummary([row('rectangle',{l:2,w:3}),row('length',{l:3})],'m²'));
 assert.throws(()=>quantitySummary([row('length',{l:3},{sign:-1})],'m'));
 assert.throws(()=>quantitySummary([row('length',{l:3})],''));
 assert.throws(()=>validateQuantityRows([row('square',{a:-1})]));assert.throws(()=>validateQuantityRows([row('square',{a:Infinity})]));assert.throws(()=>newQuantityRow('eval(1)'));
});
test('Linked quantities restore their computed volume and correct RAB cost, while manual overrides preserve their volume and basis',()=>{
 const item={id:'i',code:'Empiris',empirical:true,manual:true,note:'Pengamatan',title:'Luas lantai',unit:'m²',group:'Lantai',volume:999,quantityRows:[row('rectangle',{l:4,w:3})],quantityLinked:true,components:[{group:'Tenaga kerja',name:'Pekerja',unit:'OH',coefficient:1}]};
 const p={name:'Proyek',owner:'',location:'',date:'2026-11-05',items:[item],smkk:[],rates:{[rateKey(item,item.components[0])]:100000},overhead:10,tax:0};
 const restored=validateProject(p);assert.equal(restored.items[0].volume,12);assert.equal(calculateProject(restored).total,1320000);assert.equal(restored.items[0].quantityRows[0].dimensions.l,4);
 item.quantityLinked=false;item.volume=7;const manual=validateProject(p);assert.equal(manual.items[0].volume,7);assert.equal(manual.items[0].quantityRows.length,1);
});

test('Quantity segment groups and raster illustrations survive validation and reject unsafe image formats',()=>{
 const row={...newQuantityRow('rectangle'),groupId:'calculation-1',image:'data:image/png;base64,aGVsbG8='};
 const [clean]=validateQuantityRows([row]);assert.equal(clean.groupId,'calculation-1');assert.equal(clean.image,row.image);
 assert.throws(()=>validateQuantityRows([{...row,image:'data:image/svg+xml;base64,aGVsbG8='}]));
 assert.throws(()=>validateQuantityRows([{...row,image:'https://untrusted.example/image.png'}]));
 assert.throws(()=>validateQuantityRows([{...row,image:'data:image/png;base64,'+'A'.repeat(400001)}]));
});
