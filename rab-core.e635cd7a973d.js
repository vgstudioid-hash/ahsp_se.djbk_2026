import { validateQuantityRows, quantitySummary } from './quantity-core.e635cd7a973d.js';
export const groups = ['Tenaga kerja', 'Bahan', 'Peralatan', 'Lain-lain'];
export const moneyRound = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function nonnegative(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (value === '' || value == null || !Number.isFinite(n) || n < 0 || n > 1e15) throw new Error('Angka harus bernilai 0 atau lebih dan tidak melebihi 10^15.');
  return n;
}
export function rateKey(item, component) {
  // Codes such as L.02 cover multiple trades; units OH and jam must stay distinct.
  return JSON.stringify([item.empirical ? 'empiris' : item.docId || 'manual', component.group, component.name.toLocaleLowerCase('id').replace(/\s+/g, ' ').trim(), component.unit.toLocaleLowerCase('id').trim()]);
}
export function calculateItem(item, rates, overhead) {
  const breakdown = item.components.map(c => {
    const key = rateKey(item, c), price = Object.hasOwn(rates, key) ? rates[key] : null;
    return { ...c, key, price, cost: price == null ? null : moneyRound(c.coefficient * price) };
  });
  const missing = breakdown.filter(c => c.price == null).length;
  const direct = moneyRound(breakdown.reduce((sum, c) => sum + (c.cost ?? 0), 0));
  const margin = moneyRound(direct * overhead / 100);
  const unitPrice = moneyRound(direct + margin);
  return { breakdown, missing, unlinked: !item.heading && !item.components.length, direct, margin, unitPrice, amount: item.heading ? 0 : moneyRound(unitPrice * item.volume) };
}
export function smkkRowResult(row){
 const enabled=row.enabled!==false,missing=enabled&&(row.volume==null||row.price==null||!row.unit.trim());
 return {enabled,missing,amount:enabled&&!missing?moneyRound(row.volume*row.price):0};
}
export function calculateProject(project) {
  const items = project.items.map(item => ({ item, ...calculateItem(item, project.rates, project.overhead) }));
  const subtotal = moneyRound(items.reduce((n, r) => n + r.amount, 0));
  const smkkResults=project.smkk.map(smkkRowResult);
  const smkk=moneyRound(smkkResults.reduce((n,r)=>n+r.amount,0));
  const smkkMissing=smkkResults.filter(r=>r.missing).length;
  const beforeTax = moneyRound(subtotal + smkk);
  const taxFactor = project.taxScheme === 'dpp11of12' ? 11/12 : 1;
  const taxBase = moneyRound(beforeTax * taxFactor);
  const tax = moneyRound(taxBase * project.tax / 100);
  const missingKeys = new Set(items.flatMap(i => i.breakdown.filter(c => c.price == null).map(c => c.key)));
  const work = items.filter(i => !i.item.heading);
  const incomplete = smkkMissing>0 || !work.length || missingKeys.size > 0 || work.some(i => i.unlinked || i.item.volume <= 0 || !i.item.title.trim());
  const total=moneyRound(beforeTax+tax);
  const roundedTotal=Math.round(total/100)*100;
  return { items, subtotal, smkk, beforeTax, taxFactor, taxBase, tax, total, roundedTotal, smkkMissing, missing: missingKeys.size, incomplete };
}

// SMKK is projected as a fixed level-1 scope; stored costs remain in project.smkk.
export function smkkScope(project,result=calculateProject(project)){
 const number=wbsNumbers([...project.items,{wbsLevel:1,heading:true}]).at(-1);
 return {id:'__smkk__',kind:'smkk',wbsLevel:1,number,title:'BIAYA PENERAPAN SMKK',count:project.smkk.filter(r=>r.enabled!==false).length,amount:result.smkk,incomplete:result.smkkMissing>0,missing:result.smkkMissing};
}
// Scope boundaries follow level-1 WBS rows in sheet order, not duplicate titles.
export function summarizeScopes(project) {
  const result=calculateProject(project),numbers=wbsNumbers(project.items),scopes=[];
  let current=null;
  result.items.forEach((row,index)=>{
    const item=row.item;
    if((item.wbsLevel??2)===1){
      current={id:item.id,number:numbers[index],title:wbsTitle(item)||'LINGKUP BELUM DIBERI NAMA',count:0,amount:0,incomplete:false,missingKeys:new Set()};
      scopes.push(current);
    }
    if(item.heading)return;
    if(!current){current={id:null,number:'—',title:'BELUM DIKELOMPOKKAN KE LINGKUP',count:0,amount:0,incomplete:false,missingKeys:new Set()};scopes.push(current);}
    current.count++;
    current.amount=moneyRound(current.amount+row.amount);
    current.incomplete ||= row.missing>0||row.unlinked||item.volume<=0||!item.title.trim();
    row.breakdown.filter(c=>c.price==null).forEach(c=>current.missingKeys.add(c.key));
  });
  return {...result,scopeSubtotal:result.beforeTax,scopes:[...scopes.map(({missingKeys,...scope})=>({...scope,missing:missingKeys.size})),smkkScope(project,result)]};
}
// Package quantities belong to the recap; source RAB quantities and AHS remain unchanged.
export function summarizeScopePackages(project) {
 const result=summarizeScopes(project);
 const scopes=result.scopes.map(scope=>{
  const raw=scope.kind==='smkk'?project.smkkRecapVolume:scope.id?project.items.find(i=>i.id===scope.id)?.recapVolume:project.recapUnassignedVolume;
  const volume=raw==null?1:nonnegative(raw);
  return {...scope,volume,unit:'paket',unitPrice:scope.amount,packageAmount:moneyRound(volume*scope.amount)};
 });
 const beforeTax=moneyRound(scopes.reduce((n,s)=>n+s.packageAmount,0));
 const taxBase=moneyRound(beforeTax*result.taxFactor),tax=moneyRound(taxBase*project.tax/100),total=moneyRound(beforeTax+tax);
 return {...result,scopes,scopeSubtotal:beforeTax,beforeTax,taxBase,tax,total,roundedTotal:Math.round(total/100)*100};
}
export function resources(project) {
  const map = new Map();
  for (const item of project.items) for (const c of item.components) {
    const key = rateKey(item, c);
    if (!map.has(key)) map.set(key, { ...c, key, docId: item.empirical ? 'empiris' : item.docId, quantity: 0, price: Object.hasOwn(project.rates, key) ? project.rates[key] : null });
    map.get(key).quantity += c.coefficient * item.volume;
  }
  return [...map.values()].sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || a.name.localeCompare(b.name, 'id'));
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function toCsv(rows) { return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n'); }
export function readCsv(text) {
  const separator = text.split(/\r?\n/)[0].includes(';') ? ';' : ',';
  const rows = [], row = []; let value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else if (!quoted && value.trim()) throw Error('Format kutipan CSV tidak valid.');
      else quoted = !quoted;
    } else if (char === separator && !quoted) { row.push(value); value = ''; }
    else if (char === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push([...row]); row.length = 0; value = ''; }
    else value += char;
  }
  if (quoted) throw Error('Kutipan CSV belum ditutup.');
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim())).map(r => r.map(c => c.replace(/^\uFEFF/, '')));
}
export function importRates(text, project) {
  const rows = readCsv(text);
  if (!rows.length) throw Error('CSV kosong.');
  const header = rows.shift().map(c => c.trim().toLowerCase());
  const keyIndex = header.indexOf('kunci'), priceIndex = header.indexOf('harga');
  if (keyIndex < 0 || priceIndex < 0) throw Error('Gunakan template CSV dengan kolom kunci dan harga.');
  const allowed = new Set(resources(project).map(c => c.key)), rates = { ...project.rates }, resourceMeta = structuredClone(project.resourceMeta || {});
  let count = 0;
  for (const row of rows) {
    const key = row[keyIndex], raw = row[priceIndex]?.trim();
    if (!allowed.has(key)) throw Error('CSV memuat sumber daya yang tidak ada pada proyek ini.');
    for (const [column,field,max] of [['kode','code',100],['keterangan','remarks',4000]]) {
      const index=header.indexOf(column);
      if(index>=0){const value=row[index]||'';if(value.length>max)throw Error('Kode/keterangan HSD terlalu panjang.');resourceMeta[key]??={};resourceMeta[key][field]=value;}
    }
    const shbIndex=header.indexOf('harga shb');
    if(shbIndex>=0 && row[shbIndex]?.trim()){
      const value=row[shbIndex].trim();if(!/^\d+(?:[.,]\d+)?$/.test(value))throw Error('Harga SHB harus angka tanpa pemisah ribuan.');
      resourceMeta[key]??={};resourceMeta[key].shb=nonnegative(value.replace(',','.'));
    }
    if (raw === '' || raw == null) continue;
    // CSV template uses decimal dot; Indonesian decimal comma is accepted without thousands separators.
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) throw Error('Harga harus angka tanpa pemisah ribuan. Contoh: 150000 atau 150000,50.');
    rates[key] = nonnegative(raw.replace(',', '.')); count++;
  }
  return { rates, resourceMeta, count };
}
export function validateProject(p) {
  if (!p || typeof p !== 'object' || !Array.isArray(p.items) || !Array.isArray(p.smkk) || p.items.length > 1000 || p.smkk.length > 1000) throw Error('Data proyek tidak valid.');
  if(p.items.reduce((n,i)=>n+(Array.isArray(i.quantityRows)?i.quantityRows.reduce((sum,r)=>sum+(typeof r.image==='string'?r.image.length:0),0):0),0)>2000000)throw Error('Total gambar proyek maksimal 2 MB.');
  for (const field of ['name', 'location', 'owner', 'date']) if (typeof p[field] !== 'string' || p[field].length > 1000) throw Error('Identitas proyek tidak valid.');
  for (const field of ['overhead', 'tax']) if (nonnegative(p[field]) > 100) throw Error('Persentase harus 0–100.');
  if (!p.rates || typeof p.rates !== 'object' || Array.isArray(p.rates)) throw Error('Harga dasar tidak valid.');
  const rates = {};
  for (const [key, value] of Object.entries(p.rates)) { if (key.length > 3000) throw Error('Kunci harga terlalu panjang.'); rates[key] = nonnegative(value); }
  const resourceMeta = {};
  if (p.resourceMeta != null && (typeof p.resourceMeta !== 'object' || Array.isArray(p.resourceMeta))) throw Error('Metadata harga dasar tidak valid.');
  for (const [key,m] of Object.entries(p.resourceMeta || {})) {
    if (key.length > 3000 || !m || typeof m !== 'object') throw Error('Metadata sumber daya tidak valid.');
    if (typeof (m.code||'') !== 'string' || (m.code||'').length>100 || typeof (m.remarks||'') !== 'string' || (m.remarks||'').length>4000) throw Error('Kode/keterangan HSD tidak valid.');
    resourceMeta[key]={code:m.code||'',remarks:m.remarks||''};
    if(m.shb!=null && m.shb!=='')resourceMeta[key].shb=nonnegative(m.shb);
  }
  const items = p.items.map(item => {
    for (const k of ['code', 'title', 'unit', 'group']) if (typeof item[k] !== 'string' || item[k].length > 2000) throw Error('Identitas pekerjaan tidak valid.');
    if (!Array.isArray(item.components) || item.components.length > 300 || (item.heading && item.components.length)) throw Error('Rincian analisis tidak valid.');
    const wbsLevel = item.wbsLevel ?? 2;
    if (!Number.isInteger(wbsLevel) || wbsLevel < 1 || wbsLevel > 4) throw Error('Tingkat WBS harus 1–4.');
    if (item.remarks != null && (typeof item.remarks !== 'string' || item.remarks.length > 4000)) throw Error('Keterangan tidak valid.');
    if (item.docId && !['se','i','ii','iii','iv','v','vi','vii'].includes(item.docId)) throw Error('Dokumen sumber tidak valid.');
    const page = Number(item.page || 1); if (!Number.isInteger(page) || page < 1 || page > 10000) throw Error('Halaman sumber tidak valid.');
    if(item.empirical && (item.code !== 'Empiris' || item.docId || item.heading || !item.components.length || typeof item.note !== 'string' || !item.note.trim())) throw Error('AHS Empiris harus berkode Empiris, memiliki komponen dan dasar empiris, tanpa rujukan PDF SE.');
    const quantityRows=validateQuantityRows(item.quantityRows||[]),quantityLinked=Boolean(item.quantityLinked);
    if(item.heading&&quantityRows.length)throw Error('Judul WBS tidak memiliki rincian Quantity.');
    const volume=quantityLinked?quantitySummary(quantityRows,item.unit).total:nonnegative(item.volume);
    return { id: crypto.randomUUID(), recapVolume:item.recapVolume==null?1:nonnegative(item.recapVolume), code: item.code, title: wbsLevel===1?item.title.toLocaleUpperCase('id'):item.title, unit: item.unit, group: item.group, docId: item.docId || '', page, note: String(item.note || '').slice(0,4000), remarks: item.remarks || '', heading: Boolean(item.heading), wbsLevel, empirical: Boolean(item.empirical), adjusted: Boolean(item.adjusted), manual: Boolean(item.manual || item.empirical || item.adjusted), volume, quantityRows, quantityLinked, components: item.components.map(c => {
      if (!groups.includes(c.group) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 1000 || typeof c.unit !== 'string' || !c.unit.trim() || c.unit.length > 50) throw Error('Komponen analisis tidak valid.');
      return { group: c.group, name: c.name, unit: c.unit, coefficient: nonnegative(c.coefficient), code: String(c.code||'').slice(0,100) };
    }) };
  });
  const validateSmkk=rows=>{
   if(!Array.isArray(rows)||rows.length>1000)throw Error('Maksimal 1000 komponen SMKK.');
   return rows.map(r=>{
    if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>1000||typeof r.unit!=='string'||r.unit.length>50)throw Error('Rincian SMKK tidak valid.');
    const meta={};for(const field of ['sourceKey','sourceTable','sourceCode','sourceGroup','sourceGroupTitle','quantityText','quantityBasis','acceptance','evidence'])if(r[field]!=null){if(typeof r[field]!=='string'||r[field].length>6000)throw Error('Rujukan SMKK tidak valid.');meta[field]=r[field];}
    if(r.sourcePage!=null){if(!Number.isInteger(r.sourcePage)||r.sourcePage<1||r.sourcePage>74)throw Error('Halaman SMKK tidak valid.');meta.sourcePage=r.sourcePage;}
    if(r.sourceGroup!=null&&!/^[1-9]$/.test(r.sourceGroup))throw Error('Kelompok SMKK tidak valid.');
    for(const field of ['enabled','manualVolume','manualPrice','manualEnabled'])if(r[field]!=null){if(typeof r[field]!=='boolean')throw Error('Pengaturan komponen SMKK tidak valid.');meta[field]=r[field];}
    return {id:crypto.randomUUID(),name:r.name,unit:r.unit,volume:r.volume==null?null:nonnegative(r.volume),price:r.price==null?null:nonnegative(r.price),...meta,group:r.sourceGroup||''};
   });
  };
  const smkk=validateSmkk(p.smkk),smkkRisk=p.smkkRisk||'',smkkSettings={},smkkDrafts={};
  if(!['','Kecil','Sedang','Tinggi'].includes(smkkRisk))throw Error('Kategori risiko SMKK tidak valid.');
  if(p.smkkSettings!=null&&(typeof p.smkkSettings!=='object'||Array.isArray(p.smkkSettings)))throw Error('Parameter SMKK tidak valid.');
  for(const field of ['workers','months','insuredValue']){const value=p.smkkSettings?.[field];smkkSettings[field]=value==null?null:nonnegative(value);}
  if(smkkSettings.workers!=null&&(!Number.isInteger(smkkSettings.workers)||smkkSettings.workers>1000000)||smkkSettings.months>1200)throw Error('Parameter tenaga/durasi SMKK melewati batas.');
  if(p.smkkSettings?.highway!=null&&typeof p.smkkSettings.highway!=='boolean')throw Error('Jenis pekerjaan SMKK tidak valid.');smkkSettings.highway=Boolean(p.smkkSettings?.highway);
  if(p.smkkDrafts!=null&&(typeof p.smkkDrafts!=='object'||Array.isArray(p.smkkDrafts)))throw Error('Cadangan kategori SMKK tidak valid.');
  for(const [risk,rows]of Object.entries(p.smkkDrafts||{})){if(!['manual','Kecil','Sedang','Tinggi'].includes(risk))throw Error('Kategori cadangan SMKK tidak valid.');smkkDrafts[risk]=validateSmkk(rows);}
  for(const field of ['year','coordinates','documentType'])if(p[field]!=null&&(typeof p[field]!=='string'||p[field].length>500))throw Error('Identitas form tidak valid.');
  for(const field of ['ma','subMa','workUnit'])if(p[field]!=null&&(typeof p[field]!=='string'||p[field].length>1000))throw Error('Informasi pekerjaan tidak valid.');
  const budget=p.budget==null||p.budget===''?null:nonnegative(p.budget);
  if(p.programCategory!=null&&!['','Beban','Investasi'].includes(p.programCategory))throw Error('Kategori Program tidak valid.');
  if(p.documentType && !['RAB','HPS'].includes(p.documentType))throw Error('Jenis dokumen tidak valid.');
  if(p.taxScheme!=null&&!['full','dpp11of12'].includes(p.taxScheme))throw Error('Skema DPP tidak valid.');
  return { id: crypto.randomUUID(), name: p.name, ma:p.ma||'',subMa:p.subMa||'',workUnit:p.workUnit||'',programCategory:p.programCategory||'',budget,location: p.location, owner: p.owner, date: p.date, year:p.year??p.date.slice(0,4),coordinates:p.coordinates||'',documentType:p.documentType||'RAB',taxScheme:p.taxScheme||'full',resourceMeta,smkkRecapVolume:p.smkkRecapVolume==null?1:nonnegative(p.smkkRecapVolume),recapUnassignedVolume:p.recapUnassignedVolume==null?1:nonnegative(p.recapUnassignedVolume),overhead: Number(p.overhead), tax: Number(p.tax), rates, items, smkk, smkkRisk, smkkSettings, smkkDrafts };
}

export function projectInformationErrors(p,allowedUnits=null) {
  const errors={};
  for(const [field,label] of [['name','Nama Pekerjaan'],['ma','MA'],['subMa','Sub MA'],['workUnit','Unit Kerja']])if(typeof p[field]!=='string'||!p[field].trim())errors[field]=label+' wajib diisi.';
  for(const field of ['ma','subMa'])if(typeof p[field]!=='string'||!/^\d{4}$/.test(p[field]))errors[field]=(field==='ma'?'MA':'Sub MA')+' harus tepat 4 angka.';
  if(Array.isArray(allowedUnits)&&!allowedUnits.includes(p.workUnit))errors.workUnit='Pilih Unit Kerja dari daftar.';
  if(!['Beban','Investasi'].includes(p.programCategory))errors.programCategory='Pilih Kategori Program: Beban atau Investasi.';
  if(typeof p.year!=='string'||!/^\d{4}$/.test(p.year.trim())||Number(p.year)<1900)errors.year='Tahun harus 4 digit dan minimal 1900.';
  if(typeof p.budget!=='number'||!Number.isFinite(p.budget)||p.budget<=0||p.budget>1e15)errors.budget='Pagu Anggaran harus lebih dari 0 dan maksimal 10^15.';
  return errors;
}

export function wbsNumbers(items) {
  const counters = [0,0,0,0];
  const alpha = (n, upper) => { let s=''; while(n>0){ n--;s=String.fromCharCode((upper?65:97)+n%26)+s;n=Math.floor(n/26); } return s; };
  return items.map(item => {
    const level = item.wbsLevel ?? 2;
    counters[level-1]++;
    for(let i=level;i<4;i++) counters[i]=0;
    return level===1?alpha(counters[0],true):level===2?String(counters[1]):level===3?alpha(counters[2],false):'•';
  });
}

export function wbsTitle(item) { return (item.wbsLevel??2)===1?item.title.toLocaleUpperCase('id'):item.title; }