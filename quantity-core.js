// Quantities use metres as the geometry base; no spreadsheet formulas or eval.
export const quantityShapes = {
 count:{label:'Jumlah',category:'count',fields:[['n','Jumlah (satuan pekerjaan)']],formula:'Jumlah',calc:d=>d.n},
 length:{label:'Panjang',category:'length',fields:[['l','Panjang']],formula:'L',calc:d=>d.l},
 square:{label:'Luas · Persegi',category:'area',fields:[['a','Sisi']],formula:'s × s',calc:d=>d.a*d.a},
 rectangle:{label:'Luas · Persegi panjang',category:'area',fields:[['l','Panjang'],['w','Lebar']],formula:'p × l',calc:d=>d.l*d.w},
 triangle:{label:'Luas · Segitiga',category:'area',fields:[['b','Alas'],['h','Tinggi tegak lurus']],formula:'½ × alas × tinggi',calc:d=>d.b*d.h/2},
 trapezoid:{label:'Luas · Trapesium',category:'area',fields:[['a','Sisi sejajar a'],['b','Sisi sejajar b'],['h','Tinggi tegak lurus']],formula:'½ × (a + b) × tinggi',calc:d=>(d.a+d.b)*d.h/2},
 parallelogram:{label:'Luas · Jajar genjang',category:'area',fields:[['b','Alas'],['h','Tinggi tegak lurus']],formula:'alas × tinggi',calc:d=>d.b*d.h},
 rhombus:{label:'Luas · Belah ketupat',category:'area',fields:[['d1','Diagonal 1'],['d2','Diagonal 2']],formula:'½ × d₁ × d₂',calc:d=>d.d1*d.d2/2},
 kite:{label:'Luas · Layang-layang',category:'area',fields:[['d1','Diagonal 1'],['d2','Diagonal 2']],formula:'½ × d₁ × d₂',calc:d=>d.d1*d.d2/2},
 circle:{label:'Luas · Lingkaran',category:'area',fields:[['r','Jari-jari']],formula:'π × r²',calc:d=>Math.PI*d.r*d.r},
 ellipse:{label:'Luas · Elips',category:'area',fields:[['a','Setengah sumbu panjang'],['b','Setengah sumbu pendek']],formula:'π × a × b',calc:d=>Math.PI*d.a*d.b},
 box:{label:'Volume · Balok',category:'volume',fields:[['l','Panjang'],['w','Lebar'],['h','Tinggi / tebal']],formula:'p × l × t',calc:d=>d.l*d.w*d.h},
 cube:{label:'Volume · Kubus',category:'volume',fields:[['a','Sisi']],formula:'s³',calc:d=>d.a**3},
 cylinder:{label:'Volume · Tabung',category:'volume',fields:[['r','Jari-jari'],['h','Tinggi']],formula:'π × r² × tinggi',calc:d=>Math.PI*d.r*d.r*d.h},
 triangularPrism:{label:'Volume · Prisma segitiga',category:'volume',fields:[['b','Alas penampang'],['h','Tinggi penampang'],['l','Panjang prisma']],formula:'½ × alas × tinggi × panjang',calc:d=>d.b*d.h*d.l/2},
 trapezoidalPrism:{label:'Volume · Prisma trapesium',category:'volume',fields:[['a','Sisi sejajar a'],['b','Sisi sejajar b'],['h','Tinggi penampang'],['l','Panjang prisma']],formula:'½ × (a + b) × tinggi × panjang',calc:d=>(d.a+d.b)*d.h*d.l/2},
 cone:{label:'Volume · Kerucut',category:'volume',fields:[['r','Jari-jari'],['h','Tinggi']],formula:'⅓ × π × r² × tinggi',calc:d=>Math.PI*d.r*d.r*d.h/3},
 sphere:{label:'Volume · Bola',category:'volume',fields:[['r','Jari-jari']],formula:'⁴⁄₃ × π × r³',calc:d=>4*Math.PI*d.r**3/3}
};
const categoryNames={count:'Jumlah',length:'Panjang',area:'Luas',volume:'Volume'};
export const quantityCategoryNames=categoryNames;
const metric={m:1,cm:0.01,mm:0.001};
export function quantityUnit(unit) {
 const u=String(unit||'').toLowerCase().replace(/\s/g,'').replace(/²/g,'2').replace(/³/g,'3').replace(/\^/g,'').replace(/[’'′¹]/g,'');
 const match=u.match(/^(m|cm|mm)([123]?)$/);
 if(match){const power=Number(match[2]||1);return {category:power===1?'length':power===2?'area':'volume',factor:metric[match[1]]**power,baseUnit:power===1?'m':power===2?'m²':'m³'};}
 if(!u)throw Error('Pilih AHS atau isi satuan pekerjaan sebelum menerapkan Quantity.');
 return {category:'count',factor:1,baseUnit:unit};
}
function num(value){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e12)throw Error('Dimensi, jumlah, dan faktor harus angka 0–10¹².');return value;}
export function validateQuantityRows(rows) {
 if(!Array.isArray(rows)||rows.length>500)throw Error('Maksimal 500 rincian Quantity per pekerjaan.');
 return rows.map(row=>{
  const shape=quantityShapes[row.shape];
  if(!shape||typeof row.label!=='string'||row.label.length>1000||!Object.hasOwn(metric,row.dimensionUnit)||![1,-1].includes(row.sign))throw Error('Rincian Quantity tidak valid.');
  const dimensions={};for(const [key] of shape.fields)dimensions[key]=num(row.dimensions?.[key]);
  return {shape:row.shape,label:row.label,dimensionUnit:row.dimensionUnit,sign:row.sign,multiplier:num(row.multiplier),dimensions};
 });
}
export function quantityRowValue(row) {
 const [clean]=validateQuantityRows([row]),shape=quantityShapes[clean.shape],power={count:0,length:1,area:2,volume:3}[shape.category];
 const raw=shape.calc(clean.dimensions)*clean.multiplier;
 const value=raw*(metric[clean.dimensionUnit]**power)*clean.sign;
 if(!Number.isFinite(value)||Math.abs(value)>1e15)throw Error('Hasil Quantity melampaui batas perhitungan.');
 return {value,raw:raw*clean.sign,category:shape.category,baseUnit:{count:'satuan pekerjaan',length:'m',area:'m²',volume:'m³'}[shape.category],formula:shape.formula};
}
export function quantitySummary(rows,unit) {
 if(!rows.length)throw Error('Tambahkan rincian perhitungan Quantity.');
 const target=quantityUnit(unit),results=rows.map(quantityRowValue);
 if(results.some(r=>r.category!==target.category))throw Error(`Jenis perhitungan harus ${categoryNames[target.category].toLowerCase()} agar sesuai satuan RAB ${unit}.`);
 const baseTotal=results.reduce((n,r)=>n+r.value,0);
 if(baseTotal < -1e-10)throw Error('Jumlah pengurang melebihi jumlah penambah.');
 const total=Math.round((Math.max(0,baseTotal)/target.factor+Number.EPSILON)*1e6)/1e6;
 if(!Number.isFinite(total)||total>1e15)throw Error('Hasil Quantity melampaui batas volume RAB.');
 return {total,baseTotal:Math.max(0,baseTotal),unit,category:target.category,results};
}
export function newQuantityRow(shape='count') {
 if(!Object.hasOwn(quantityShapes,shape))throw Error('Bentuk Quantity tidak valid.');
 return {shape,label:'',dimensionUnit:'m',sign:1,multiplier:1,dimensions:Object.fromEntries(quantityShapes[shape].fields.map(([key])=>[key,0]))};
}
