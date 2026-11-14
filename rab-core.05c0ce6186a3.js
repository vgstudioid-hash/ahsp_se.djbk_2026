import {cleanResourceName,normalizedResourceUnit,resourceIdentity,buildResourceCodeIndex,buildResourceNameIndex,normalizeItemResources} from './resource-cleanup.05c0ce6186a3.js';
import { validateQuantityRows, quantitySummary } from './quantity-core.05c0ce6186a3.js';
export const groups = ['Tenaga kerja', 'Bahan', 'Peralatan', 'Lain-lain'];
export const moneyRound = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function nonnegative(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (value === '' || value == null || !Number.isFinite(n) || n < 0 || n > 1e15) throw new Error('Angka harus bernilai 0 atau lebih dan tidak melebihi 10^15.');
  return n;
}
let resourceCodeIndex=new Map(),resourceNameIndex=new Map();
export function configureResourceCatalog(catalog,corrections={}){const corrected=catalog.map(item=>corrections[item.id]?{...item,components:corrections[item.id].components,correctionNote:corrections[item.id].reason}:item);resourceCodeIndex=buildResourceCodeIndex(corrected);resourceNameIndex=buildResourceNameIndex(corrected);return corrected.map(item=>normalizeItemResources(item,resourceCodeIndex,resourceNameIndex));}
export function prepareItemResources(item){return normalizeItemResources(item,resourceCodeIndex,resourceNameIndex);}
export function applyCatalogCorrections(project,rawCatalog,correctedCatalog){
 const signature=item=>JSON.stringify(prepareItemResources(item).components.map(c=>[resourceIdentity(c),c.coefficient]));let count=0;
 for(const item of project.items){if(item.adjusted||item.empirical)continue;const before=signature(item),candidates=rawCatalog.filter(a=>a.docId===item.docId&&a.code===item.code&&a.page===item.page&&signature(a)===before),replacements=candidates.map(a=>correctedCatalog.find(b=>b.id===a.id&&b.correctionNote)).filter(Boolean);if(replacements.length!==1)continue;if(signature(item)===signature(replacements[0])&&item.components.every((c,i)=>(c.code||'')===(replacements[0].components[i]?.code||'')))continue;item.components=structuredClone(replacements[0].components);count++;}return count;
}
function identityFromKey(key){try{const a=JSON.parse(key);if(!Array.isArray(a)||a.length!==4||a.some(x=>typeof x!=='string'))return null;return resourceIdentity({group:a[1],name:a[2],unit:a[3]});}catch{return null;}}
function indexedRates(rates){const map=new Map();for(const [key,value]of Object.entries(rates)){const id=identityFromKey(key);if(!id)continue;if(!map.has(id))map.set(id,[]);map.get(id).push({key,value,doc:JSON.parse(key)[0]});}return map;}
export function rateKey(item,component){return JSON.stringify([item.empirical?'empiris':item.docId||'manual',component.group,cleanResourceName(component.name).toLocaleLowerCase('id').replace(/\s+/g,' ').trim(),normalizedResourceUnit(component.unit)]);}
function resourcePrice(item,c,rates,index){
 const key=rateKey(item,c);if(Object.hasOwn(rates,key))return rates[key];
 const sourceName=c.sourceName||c.name;if(resourceIdentity({...c,name:sourceName})===resourceIdentity(c)){const legacyKey=JSON.stringify([item.empirical?'empiris':item.docId||'manual',c.group,sourceName.toLocaleLowerCase('id').replace(/\s+/g,' ').trim(),c.unit.toLocaleLowerCase('id').trim()]);if(Object.hasOwn(rates,legacyKey))return rates[legacyKey];}
 const entries=index.get(resourceIdentity(c))||[],doc=item.empirical?'empiris':item.docId||'manual',local=entries.filter(r=>r.doc===doc),values=[...new Set((local.length?local:entries).map(r=>r.value))];return values.length===1?values[0]:null;
}
function resourceAliasKeys(project,key){const id=identityFromKey(key),keys=new Set([key]);for(const item of project.items)for(const c of item.components)if(resourceIdentity(c)===id)keys.add(rateKey(item,c));for(const alias of [...Object.keys(project.rates),...Object.keys(project.resourceMeta||{})])if(identityFromKey(alias)===id)keys.add(alias);return [...keys];}
export function setResourcePrice(project,key,value){for(const alias of resourceAliasKeys(project,key)){if(value==null)delete project.rates[alias];else project.rates[alias]=nonnegative(value);}}
export function setResourceMetadata(project,key,field,value){project.resourceMeta??={};for(const alias of resourceAliasKeys(project,key)){project.resourceMeta[alias]??={};if(value==null)delete project.resourceMeta[alias][field];else project.resourceMeta[alias][field]=value;}}
export function resourceMetadata(project,c){
 const id=resourceIdentity(c),aliases=Object.entries(project.resourceMeta||{}).filter(([key])=>identityFromKey(key)===id);let meta={};for(const [,m]of aliases)meta={...meta,...m};meta={...meta,...(project.resourceMeta?.[c.key]||{})};if(!meta.code&&c.code)meta.code=c.code;return meta;
}
export function calculateItem(item, rates, overhead) {
  const index=indexedRates(rates);
  const breakdown = item.components.map(c => {
    const key=rateKey(item,c),price=resourcePrice(item,c,rates,index);
    return { ...c,name:resourceNameIndex.get(resourceIdentity(c))||cleanResourceName(c.name),code:c.code||resourceCodeIndex.get(resourceIdentity(c))||'',key,price, cost: price == null ? null : moneyRound(c.coefficient * price) };
  });
  const missing = breakdown.filter(c => c.price == null).length;
  const alternatives=new Map();for(const c of item.components)if(c.alternativeSet)alternatives.set(c.alternativeSet,(alternatives.get(c.alternativeSet)||0)+1);const unresolvedAlternatives=[...alternatives.values()].filter(n=>n>1).length;
  const direct = moneyRound(breakdown.reduce((sum, c) => sum + (c.cost ?? 0), 0));
  const margin = moneyRound(direct * overhead / 100);
  const unitPrice = moneyRound(direct + margin);
  return { breakdown, missing, unresolvedAlternatives, unlinked: !item.heading && !item.components.length, direct, margin, unitPrice, amount: item.heading ? 0 : moneyRound(unitPrice * item.volume) };
}
export function smkkRowResult(row){
 const enabled=row.enabled!==false,missing=enabled&&(row.volume==null||row.price==null||!row.unit.trim());
 return {enabled,missing,amount:enabled&&!missing?moneyRound(row.volume*row.price):0};
}
export function wbsStructure(items){
 const rows=items.map(()=>({parentIndex:null,children:[],rollup:false})),stack=[];
 items.forEach((item,index)=>{const level=item.wbsLevel??2;while(stack.length&&(items[stack.at(-1)].wbsLevel??2)>=level)stack.pop();if(stack.length){rows[index].parentIndex=stack.at(-1);rows[stack.at(-1)].children.push(index);}stack.push(index);});
 rows.forEach(row=>row.rollup=row.children.length>0);return rows;
}
export function calculateProject(project) {
  const structure=wbsStructure(project.items);
  const items=project.items.map((item,index)=>({item,...calculateItem(structure[index].rollup?{...item,heading:true,components:[]}:item,project.rates,project.overhead),rollup:structure[index].rollup,billable:!item.heading&&!structure[index].rollup}));
  for(let i=items.length-1;i>=0;i--)if(items[i].rollup)items[i].amount=moneyRound(structure[i].children.reduce((sum,j)=>sum+items[j].amount,0));
  const subtotal=moneyRound(items.filter(r=>r.billable).reduce((n,r)=>n+r.amount,0));
  const smkkResults=project.smkk.map(smkkRowResult);
  const smkk=moneyRound(smkkResults.reduce((n,r)=>n+r.amount,0));
  const smkkMissing=smkkResults.filter(r=>r.missing).length;
  const beforeTax = moneyRound(subtotal + smkk);
  const taxFactor = project.taxScheme === 'dpp11of12' ? 11/12 : 1;
  const taxBase = moneyRound(beforeTax * taxFactor);
  const tax = moneyRound(taxBase * project.tax / 100);
  const missingKeys = new Set(items.filter(i=>i.billable).flatMap(i => i.breakdown.filter(c => c.price == null).map(c => c.key)));
  const work = items.filter(i => i.billable);
  const incomplete = smkkMissing>0 || !work.length || missingKeys.size > 0 || work.some(i => i.unlinked || i.unresolvedAlternatives>0 || i.item.volume <= 0 || !i.item.title.trim());
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
    if(!row.billable)return;
    if(!current){current={id:null,number:'—',title:'BELUM DIKELOMPOKKAN KE LINGKUP',count:0,amount:0,incomplete:false,missingKeys:new Set()};scopes.push(current);}
    current.count++;
    current.amount=moneyRound(current.amount+row.amount);
    current.incomplete ||= row.missing>0||row.unlinked||row.unresolvedAlternatives>0||item.volume<=0||!item.title.trim();
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
export const resourceCategories=['BAHAN/ MATERIAL','TENAGA KERJA','ALAT','SEWA','LAINNYA'];
export function resourceCategory(resource){
 if(resource.group==='Bahan')return 'BAHAN/ MATERIAL';
 if(resource.group==='Tenaga kerja')return 'TENAGA KERJA';
 if(/\b(?:sewa|rental)\b/i.test(resource.name))return 'SEWA';
 if(resource.group==='Peralatan')return 'ALAT';
 return 'LAINNYA';
}
export function resources(project){
 const map=new Map(),index=indexedRates(project.rates),structure=wbsStructure(project.items);
 for(const [i,item]of project.items.entries())if(!item.heading&&!structure[i].rollup)for(const c of item.components){
  const id=resourceIdentity(c),key=rateKey(item,c);if(!map.has(id))map.set(id,{...c,name:resourceNameIndex.get(resourceIdentity(c))||cleanResourceName(c.name),code:c.code||resourceCodeIndex.get(id)||'',key,docId:item.empirical?'empiris':item.docId,quantity:0,aliases:new Set(),prices:new Set()});
  const row=map.get(id);row.aliases.add(key);for(const entry of index.get(id)||[]){row.aliases.add(entry.key);row.prices.add(entry.value);}if(!row.code&&c.code)row.code=c.code;row.quantity+=c.coefficient*item.volume;
 }
 return [...map.values()].map(({prices,aliases,...row})=>({...row,aliases:[...aliases],price:prices.size===1?[...prices][0]:null,priceConflict:prices.size>1,priceVariants:[...prices]})).sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group)||a.name.localeCompare(b.name,'id'));
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
function importSingleRates(text, project) {
  const rows = readCsv(text);
  if (!rows.length) throw Error('CSV kosong.');
  const header = rows.shift().map(c => c.trim().toLowerCase());
  const keyIndex = header.indexOf('kunci'), priceIndex = header.indexOf('harga');
  if (keyIndex < 0 || priceIndex < 0) throw Error('Gunakan template CSV dengan kolom kunci dan harga.');
  const resourceRows=resources(project),allowed=new Map(resourceRows.flatMap(c=>c.aliases.map(key=>[key,c.key]))),rates={...project.rates},resourceMeta=structuredClone(project.resourceMeta||{}),draft={...project,rates,resourceMeta};
  let count = 0;
  for (const row of rows) {
    const sourceKey=row[keyIndex],key=allowed.get(sourceKey)||resourceRows.find(c=>resourceIdentity(c)===identityFromKey(sourceKey))?.key,raw=row[priceIndex]?.trim();
    if (!key) throw Error('CSV memuat sumber daya yang tidak ada pada proyek ini.');
    for (const [column,field,max] of [['kode','code',100],['keterangan','remarks',4000],['sumber harga','priceSource',2000],['nilai kdn','kdn',100]]) {
      const index=header.indexOf(column);
      if(index>=0){const value=row[index]||'';if(value.length>max)throw Error('Kode/keterangan HSD terlalu panjang.');setResourceMetadata(draft,key,field,value);}
    }
    const shbIndex=header.indexOf('harga shb');
    if(shbIndex>=0 && row[shbIndex]?.trim()){
      const value=row[shbIndex].trim();if(!/^\d+(?:[.,]\d+)?$/.test(value))throw Error('Harga SHB harus angka tanpa pemisah ribuan.');
      setResourceMetadata(draft,key,'shb',nonnegative(value.replace(',','.')));
    }
    if (raw === '' || raw == null) continue;
    // CSV template uses decimal dot; Indonesian decimal comma is accepted without thousands separators.
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) throw Error('Harga harus angka tanpa pemisah ribuan. Contoh: 150000 atau 150000,50.');
    setResourcePrice(draft,key,nonnegative(raw.replace(',','.')));count++;
  }
  return { rates, resourceMeta, count };
}
export function importRates(text,project){
 const rows=readCsv(text),header=rows[0]?.map(c=>c.trim().toLowerCase())||[],ri=header.indexOf('region'),si=header.indexOf('sub region');
 if(ri<0&&si<0){if(project.priceRegion&&!project.priceSubRegion)throw Error('Pilih Sub Region sebelum mengimpor harga.');return importSingleRates(text,project);}
 if(ri<0||si<0)throw Error('CSV wilayah harus memiliki kolom Region dan Sub Region.');
 const draft=structuredClone(project);snapshotPriceProfile(draft);let count=0;const buckets=new Map();
 for(const row of rows.slice(1)){const key=priceProfileKey((row[ri]||'').trim(),(row[si]||'').trim());if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row);}
 for(const [key,list]of buckets){const profile=draft.priceProfiles[key]||{rates:{},resourceMeta:{}};const result=importSingleRates(toCsv([rows[0],...list]),{...project,...profile});draft.priceProfiles[key]={rates:result.rates,resourceMeta:result.resourceMeta};count+=result.count;}
 const key=project.priceRegion&&!project.priceSubRegion?null:priceProfileKey(project.priceRegion||'',project.priceSubRegion||''),active=key?draft.priceProfiles[key]:null;
 return {rates:active?.rates||{},resourceMeta:active?.resourceMeta||{},priceProfiles:draft.priceProfiles,count};
}
export function nextEmpiricalCode(project){
 const used=project.items.filter(i=>i.empirical).map(i=>Number(/^Empiris-(\d+)$/.exec(i.code)?.[1]||0));
 const next=Math.max(project.empiricalSequence||0,0,...used)+1;
 if(next>999999999)throw Error('Nomor AHS empiris mencapai batas.');
 return 'Empiris-'+String(next).padStart(3,'0');
}
export const priceRegions=Object.freeze({
 'Jawa Barat':Object.freeze(['Purwakarta','Karawang','Kab. Bekasi','Kota Bekasi','Kota Bandung','Kab. Bogor','Indramayu','Subang']),
 Jakarta:Object.freeze(['Jakarta']),Banten:Object.freeze(['Banten']),Lampung:Object.freeze(['Lampung'])
});
export function priceProfileKey(region='',subRegion=''){
 if(!region&&!subRegion)return 'general';
 if(!Object.hasOwn(priceRegions,region)||!priceRegions[region].includes(subRegion))throw Error('Pilih Region dan Sub Region yang sesuai.');
 return region+'|'+subRegion;
}
function validatePriceProfile(p){
  if (!p.rates || typeof p.rates !== 'object' || Array.isArray(p.rates)) throw Error('Harga dasar tidak valid.');
  const rates = {};
  for (const [key, value] of Object.entries(p.rates)) { if (key.length > 3000) throw Error('Kunci harga terlalu panjang.'); rates[key] = nonnegative(value); }
  const resourceMeta = {};
  if (p.resourceMeta != null && (typeof p.resourceMeta !== 'object' || Array.isArray(p.resourceMeta))) throw Error('Metadata harga dasar tidak valid.');
  for (const [key,m] of Object.entries(p.resourceMeta || {})) {
    if (key.length > 3000 || !m || typeof m !== 'object') throw Error('Metadata sumber daya tidak valid.');
    if (typeof (m.code||'') !== 'string' || (m.code||'').length>100 || typeof (m.remarks||'') !== 'string' || (m.remarks||'').length>4000) throw Error('Kode/keterangan HSD tidak valid.');
    resourceMeta[key]={code:m.code||'',remarks:m.remarks||''};
    for(const [field,max] of [['priceSource',2000],['kdn',100]])if(m[field]!=null){if(typeof m[field]!=='string'||m[field].length>max)throw Error('Sumber harga/Nilai KDN tidak valid.');resourceMeta[key][field]=m[field];}
    if(m.shb!=null && m.shb!=='')resourceMeta[key].shb=nonnegative(m.shb);
  }
 return {rates,resourceMeta};
}
export function snapshotPriceProfile(p){
 const region=p.priceRegion||'',sub=p.priceSubRegion||'';
 if(region&&!sub)return;
 p.priceProfiles??={};p.priceProfiles[priceProfileKey(region,sub)]=structuredClone({rates:p.rates,resourceMeta:p.resourceMeta||{}});
}
export function selectPriceRegion(p,region,subRegion=''){
 if(region&&!Object.hasOwn(priceRegions,region))throw Error('Region tidak valid.');
 if(subRegion)priceProfileKey(region,subRegion);
 if(!region&&subRegion)throw Error('Pilih Region dahulu.');
 snapshotPriceProfile(p);p.priceRegion=region;p.priceSubRegion=subRegion;
 const profile=region&&!subRegion?null:p.priceProfiles[priceProfileKey(region,subRegion)];
 p.rates=structuredClone(profile?.rates||{});p.resourceMeta=structuredClone(profile?.resourceMeta||{});
}
function validatePriceRegions(p,rates,resourceMeta){
 const priceRegion=p.priceRegion||'',priceSubRegion=p.priceSubRegion||'',priceProfiles={};
 if(typeof priceRegion!=='string'||typeof priceSubRegion!=='string'||priceRegion&&!Object.hasOwn(priceRegions,priceRegion)||!priceRegion&&priceSubRegion)throw Error('Region harga tidak valid.');
 if(priceSubRegion)priceProfileKey(priceRegion,priceSubRegion);
 if(p.priceProfiles!=null&&(!p.priceProfiles||typeof p.priceProfiles!=='object'||Array.isArray(p.priceProfiles)))throw Error('Kelompok harga wilayah tidak valid.');
 const allowed=new Set(['general',...Object.entries(priceRegions).flatMap(([r,subs])=>subs.map(sub=>priceProfileKey(r,sub)))]);
 for(const [key,profile]of Object.entries(p.priceProfiles||{})){if(!allowed.has(key)||!profile||typeof profile!=='object')throw Error('Kelompok harga wilayah tidak valid.');priceProfiles[key]=validatePriceProfile(profile);}
 if(!priceRegion||priceSubRegion)priceProfiles[priceProfileKey(priceRegion,priceSubRegion)]={rates:structuredClone(rates),resourceMeta:structuredClone(resourceMeta)};
 else if(Object.keys(rates).length||Object.keys(resourceMeta).length)throw Error('Harga wilayah memerlukan Sub Region.');
 return {priceRegion,priceSubRegion,priceProfiles};
}

export function validateProject(p) {
  if (!p || typeof p !== 'object' || !Array.isArray(p.items) || !Array.isArray(p.smkk) || p.items.length > 1000 || p.smkk.length > 1000) throw Error('Data proyek tidak valid.');
  if(p.items.reduce((n,i)=>n+(Array.isArray(i.quantityRows)?i.quantityRows.reduce((sum,r)=>sum+(typeof r.image==='string'?r.image.length:0),0):0),0)>2000000)throw Error('Total gambar proyek maksimal 2 MB.');
  for (const field of ['name', 'location', 'owner', 'date']) if (typeof p[field] !== 'string' || p[field].length > 1000) throw Error('Identitas proyek tidak valid.');
  for (const field of ['overhead', 'tax']) if (nonnegative(p[field]) > 100) throw Error('Persentase harus 0–100.');
  const {rates,resourceMeta}=validatePriceProfile(p);
  const regional=validatePriceRegions(p,rates,resourceMeta);
  const items = p.items.map(item => {
    for (const k of ['code', 'title', 'unit', 'group']) if (typeof item[k] !== 'string' || item[k].length > 2000) throw Error('Identitas pekerjaan tidak valid.');
    if (!Array.isArray(item.components) || item.components.length > 300 || (item.heading && item.components.length)) throw Error('Rincian analisis tidak valid.');
    const wbsLevel = item.wbsLevel ?? 2;
    if (!Number.isInteger(wbsLevel) || wbsLevel < 1 || wbsLevel > 4) throw Error('Tingkat WBS harus 1–4.');
    if (item.remarks != null && (typeof item.remarks !== 'string' || item.remarks.length > 4000)) throw Error('Keterangan tidak valid.');
    if (item.docId && !['se','i','ii','iii','iv','v','vi','vii'].includes(item.docId)) throw Error('Dokumen sumber tidak valid.');
    const page = Number(item.page || 1); if (!Number.isInteger(page) || page < 1 || page > 10000) throw Error('Halaman sumber tidak valid.');
    if(item.empirical && (!(item.code==='Empiris'||(/^Empiris-\d{3,9}$/.test(item.code)&&Number(item.code.slice(8))>0)) || item.docId || item.heading || !item.components.length || typeof item.note !== 'string' || !item.note.trim())) throw Error('AHS Empiris harus berkode Empiris-NNN, memiliki komponen dan dasar empiris, tanpa rujukan PDF SE.');
    const quantityRows=validateQuantityRows(item.quantityRows||[]),quantityLinked=Boolean(item.quantityLinked);
    if(item.heading&&quantityRows.length)throw Error('Judul WBS tidak memiliki rincian Quantity.');
    const volume=quantityLinked?quantitySummary(quantityRows,item.unit).total:nonnegative(item.volume);
    return prepareItemResources({ id: crypto.randomUUID(), recapVolume:item.recapVolume==null?1:nonnegative(item.recapVolume), code: item.code, title: wbsLevel===1?item.title.toLocaleUpperCase('id'):item.title, unit: item.unit, group: item.group, docId: item.docId || '', page, note: String(item.note || '').slice(0,4000), remarks: item.remarks || '', heading: Boolean(item.heading), wbsLevel, empirical: Boolean(item.empirical), adjusted: Boolean(item.adjusted), manual: Boolean(item.manual || item.empirical || item.adjusted), volume, quantityRows, quantityLinked, components: item.components.map(c => {
      if (!groups.includes(c.group) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 1000 || typeof c.unit !== 'string' || !c.unit.trim() || c.unit.length > 50) throw Error('Komponen analisis tidak valid.');
      for(const field of ['sourceName','alternativeSet'])if(c[field]!=null&&(typeof c[field]!=='string'||c[field].length>3000))throw Error('Rujukan sumber daya tidak valid.');
      return {group:c.group,name:c.name,unit:c.unit,coefficient:nonnegative(c.coefficient),code:String(c.code||'').slice(0,100),...(c.sourceName?{sourceName:c.sourceName}:{}),...(c.alternativeSet?{alternativeSet:c.alternativeSet}:{})};
    }) });
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
  if(p.empiricalSequence!=null&&(!Number.isInteger(p.empiricalSequence)||p.empiricalSequence<0||p.empiricalSequence>999999999))throw Error('Nomor urut empiris tidak valid.');
  const empiricalSequence=Math.max(p.empiricalSequence||0,0,...items.filter(i=>i.empirical).map(i=>Number(/^Empiris-(\d+)$/.exec(i.code)?.[1]||0)));
  return { id: crypto.randomUUID(), empiricalSequence, name: p.name, ma:p.ma||'',subMa:p.subMa||'',workUnit:p.workUnit||'',programCategory:p.programCategory||'',budget,location: p.location, owner: p.owner, date: p.date, year:p.year??p.date.slice(0,4),coordinates:p.coordinates||'',documentType:p.documentType||'RAB',taxScheme:p.taxScheme||'full',resourceMeta,...regional,smkkRecapVolume:p.smkkRecapVolume==null?1:nonnegative(p.smkkRecapVolume),recapUnassignedVolume:p.recapUnassignedVolume==null?1:nonnegative(p.recapUnassignedVolume),overhead: Number(p.overhead), tax: Number(p.tax), rates, items, smkk, smkkRisk, smkkSettings, smkkDrafts };
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
