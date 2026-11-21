import {compactPriceCatalog} from '../price-catalog.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cleanResourceName,normalizedResourceUnit,resourceIdentity} from '../resource-cleanup.js';
import {priceRegions,moneyRound,toCsv} from '../rab-core.js';
const root=new URL('../',import.meta.url),load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const sourceDir=process.argv[2]||'/workspace/price-sources';
const previous=await load('public/data/regional-price-catalog.json');
const sourceRows=JSON.parse(await readFile(sourceDir+'/extracted-prices.json','utf8'));
sourceRows.push(...(await load('public/data/reviewed-price-rows.json')).rows);
sourceRows.push(...(await load('public/data/jabar-wage-source-review.json')).rows);
sourceRows.push(...(await load('public/data/reviewed-regional-wages.json')).rows);
sourceRows.push(...(await load('public/data/official-wage-sources.json')).rows);
for(const row of (await load('public/data/provincial-material-sources.json')).rows)for(const subRegion of row.applicableSubRegions||[row.subRegion])sourceRows.push({...row,subRegion});
const checkedJournals=[];
for(const [year,suffix]of [[2025,''],[2023,'-2023']]){
 const journal=JSON.parse(await readFile(sourceDir+'/journal-image-checked'+suffix+'.json','utf8'));
 for(const row of journal.rows){if(!row.reviewed)continue;const reviewed={...row,bpsCommodity:row.group==='Bahan'?commodityFor(row.name):undefined,sourcePriority:year===2025?20:40};sourceRows.push(reviewed);checkedJournals.push(reviewed);}
}
await writeFile(new URL('public/data/journal-reviewed-prices.json',root),JSON.stringify({schemaVersion:1,rows:checkedJournals},null,2));
import {commodityFor} from './bps-commodity-match.mjs';
const inventory=await load('public/reports/inventaris-sumber-daya-harga.json'),bps=await load('public/data/bps-price-indices.json');
import {norm,unit,wagePeriodFactor} from './price-source-matching.mjs';
const index=new Map();for(const r of inventory.resources){const key=norm(r.name)+'\0'+unit(r.unit,r.group);if(!index.has(key))index.set(key,[]);index.get(key).push(r);}
function category(row){if(row.group)return row.group;if(/Jasa Tenaga Penanganan Prasarana|Upah Tenaga|Upah Pekerja/i.test(row.name))return 'Tenaga kerja';if(/Sewa/i.test(row.name))return 'Peralatan';if(/^(?:1\.1\.12|Bahan)/.test(row.sourceCode||row.commodityGroup||''))return 'Bahan';return null;}
// Only explicitly classified wages are converted; consulting billing rates and
// equipment rentals never inherit the user's monthly wage rule.
for(const source of [...sourceRows])if(category(source)==='Tenaga kerja'&&!source.matchUnit&&/^(?:ob|bulan|org\/bulan|orang\/bulan|orangbulan)$/.test(String(source.unit).toLowerCase().replace(/\s+/g,''))){
 for(const target of ['OH','OJ'])sourceRows.push({...source,id:source.id+':'+target,matchUnit:target,unitConversion:{factor:wagePeriodFactor(source.unit,target),reason:'Konversi upah sesuai instruksi pengguna: perbulan dibagi30 hari'+(target==='OJ'?', lalu dibagi8 jam kerja':'')},hoursPerDay:8,hoursBasis:'Asumsi pengguna'});
}
const wageProxies=await load('public/data/bps-wage-proxies.json');
const candidates=[],review=[];
for(const s of sourceRows){
 if(!s.subRegion||!priceRegions[s.region]?.includes(s.subRegion))continue;
 const group=category(s),names=s.matchNames?[...s.matchNames]:[s.specification,`${s.name} ${s.specification}`];
 if(!s.specification||norm(s.specification)===norm(s.name))names.push(s.name);
 const matches=new Map();
 for(const name of names)for(const r of index.get(norm(name)+'\0'+unit(s.matchUnit||s.unit,group))||[]){if(group&&r.group!==group)continue;matches.set(r.identity,r);}
 for(const r of matches.values()){
  let reason='';if(s.sourceYear<2026)reason='Harga lama: eskalasi dan perlakuan pajak perlu dilengkapi';
  if(s.tax.included==null)reason='Perlakuan pajak sumber belum dinyatakan';
  if(s.sourceYear>2026)reason='Tahun dasar di luar cakupan 2026';
  if(!Number.isInteger(s.sourceYear))reason='Tahun harga sumber belum dikonfirmasi';
  let escalation=null;
  if(s.sourceYear===2025&&s.reviewed&&s.bpsCommodity){
   const b=bps.commodities.find(x=>x.id===s.bpsCommodity);
   if(b?.annual2025&&b.oct2026){escalation={series:b.name,indexBaseYear:2023,basePeriod:'Rata-rata tahunan 2025',targetPeriod:'Oktober 2026',baseValue:b.annual2025,targetValue:b.oct2026,factor:b.oct2026/b.annual2025,percent:(b.oct2026/b.annual2025-1)*100,baseUrl:bps.tableUrl,targetUrl:bps.releaseUrl};reason='';}
  }
  if(s.sourceYear===2023&&s.reviewed&&s.bpsCommodity&&bps.indexBaseYear===2023){
   const b=bps.commodities.find(x=>x.id===s.bpsCommodity);
   if(b?.oct2026){escalation={series:b.name,indexBaseYear:2023,basePeriod:'Rata-rata tahun dasar 2023 (2023=100)',targetPeriod:'Oktober 2026',baseValue:100,targetValue:b.oct2026,factor:b.oct2026/100,percent:b.oct2026-100,baseUrl:bps.tableUrl,targetUrl:bps.releaseUrl};reason='';}
  }
  if((group==='Tenaga kerja'||(group==='Bahan'&&!escalation&&s.reviewed)||(group==='Peralatan'&&s.priceKind==='rental'))&&s.sourceYear===2025){
   const proxy=wageProxies.proxies.find(p=>p.region===s.region&&p.subRegion===s.subRegion&&p.sourceYear===s.sourceYear&&p.basisYear===2026);
   if(proxy){escalation={kind:group==='Tenaga kerja'?'regional-cpi-wage-proxy':group==='Bahan'?'regional-cpi-material-proxy':'regional-cpi-rental-proxy',series:proxy.series,indexBaseYear:2022,basePeriod:proxy.basePeriod,targetPeriod:proxy.targetPeriod,factor:1+proxy.percent/100,percent:proxy.percent,baseUrl:proxy.url,targetUrl:proxy.url,sourceTitle:proxy.sourceTitle,pages:proxy.pages,limitation:proxy.limitation};reason='';}
  }
  let price=s.sourcePrice*(s.unitConversion?.factor??1),adjustment=s.unitConversion?`${s.unitConversion.reason}. `:'';
  if(s.mappingBasis)adjustment+=s.mappingBasis+' ';
  if(s.applicability)adjustment+=s.applicability+' ';
  if(s.tax.included==null)adjustment+='Perlakuan PPN tidak dinyatakan sumber; harga kutipan dipakai tanpa koreksi PPN. Periksa agar PPN tidak dihitung ganda sebelum anggaran final. ';
  if(s.tax.included&&r.group!=='Tenaga kerja'){price/=1+s.tax.effectivePercent/100;adjustment+=`PPN efektif ${s.tax.effectivePercent}% dikeluarkan dari harga sumber agar tidak ditambahkan dua kali dalam RAB.`;}
  if(escalation){price*=escalation.factor;adjustment+=escalation.kind?.startsWith('regional-cpi-')?`Estimasi penyesuaian ${group==='Tenaga kerja'?'upah':group==='Bahan'?'bahan':'sewa alat'} menggunakan proksi IHK BPS ${escalation.percent}% (${escalation.basePeriod} → ${escalation.targetPeriod}). ${group==='Tenaga kerja'?escalation.limitation:group==='Bahan'?'Proksi IHK umum karena belum ada pasangan indeks komoditas yang terverifikasi; bukan IHPB spesifik bahan.':'Proksi IHK umum untuk estimasi sewa, bukan indeks harga sewa alat resmi. Tidak diterapkan ke harga pembelian alat.'} ${escalation.targetUrl}`:` Eskalasi BPS ${escalation.series}: ${escalation.baseValue} → ${escalation.targetValue} (${escalation.percent.toFixed(4)}%), ${escalation.basePeriod} → Oktober2026. ${bps.tableUrl} ${bps.releaseUrl}`;}
  const entry={escalation,identity:r.identity,resourceId:r.id,name:r.name,group:r.group,unit:r.unit,region:s.region,subRegion:s.subRegion,source:s,price:moneyRound(price),reason,adjustment};
  (reason?review:candidates).push(entry);
 }
}
const byScope=new Map();for(const c of candidates){const k=c.identity+'\0'+c.region+'\0'+c.subRegion;if(!byScope.has(k))byScope.set(k,[]);byScope.get(k).push(c);}
const records=[],conflicts=[];
for(const available of byScope.values()){
 const priority=c=>c.source.sourcePriority??(c.group==='Tenaga kerja'?(c.source.sourceTitle.match(/Perbup|Kepwal/)?0:50):c.source.sourceId==='13otiSlyWtwwPdRkdaxIrAKQiWRQU4Fdu'?20:30);
 const rank=c=>priority(c)*10000-(c.group==='Tenaga kerja'?c.source.sourceYear:0)+(c.source.mappingBasis?0.1:0)+(c.source.fallbackOnly?0.01:0);
 const best=Math.min(...available.map(rank)),list=available.filter(c=>rank(c)===best);
 const distinct=[...new Set(list.map(r=>r.price))];
 if(distinct.length!==1){conflicts.push(...list.map(r=>({...r,reason:'Beberapa harga berbeda untuk identitas/satuan/wilayah yang sama; tidak dipilih otomatis'})));continue;}
 const c=list[0],s=c.source,id=createHash('sha256').update(c.identity+'\0'+s.id).digest('hex').slice(0,24);
 const old=previous.records.find(r=>r.identity===c.identity&&r.region===s.region&&r.subRegion===s.subRegion),replaces=[...(old?.replaces||[])];if(old&&(old.id!==id||old.price!==c.price)&&!replaces.some(r=>r.id===old.id&&r.price===old.price))replaces.push({id:old.id,price:old.price});
 records.push({id,replaces,identity:c.identity,name:c.name,group:c.group,unit:c.unit,region:c.region,subRegion:c.subRegion,basisYear:2026,priceKind:c.escalation||s.tax.included==null?'estimate':'source-price',intendedUseYear:2027,sourceYear:s.sourceYear,price:c.price,status:'verified',sourceText:`${s.sourceTitle} · ${s.locator} · ${s.region}/${s.subRegion} · harga sumber Rp ${s.sourcePrice} per ${s.unit}; tahun sumber ${s.sourceYear}, basis 2026${c.escalation?', '+(c.escalation.kind?.startsWith('regional-cpi-')?'estimasi/proksi IHK ':'eskalasi ')+c.escalation.percent.toFixed(4)+'% ('+c.escalation.basePeriod+' → '+c.escalation.targetPeriod+')':''}. ${s.sourceUrl}`.slice(0,2000),remarks:[s.hoursPerDay?`Upah ${s.hoursBasis?'asumsi pengguna':'sumber'} ${s.hoursPerDay} jam/hari; ${s.specification}.`:'',c.adjustment,c.group==='Tenaga kerja'?'Harga upah sumber/estimasi tetap dapat diedit. TKDN produk tidak berlaku untuk upah tenaga kerja.':'Harga standar/batas tertinggi sumber; tetap dapat diedit. TKDN belum ditetapkan tanpa produk/sertifikat yang cocok.'].filter(Boolean).join(' '),evidence:s,escalation:c.escalation,matching:s.mappingBasis||'Nama/spesifikasi dan satuan sama setelah normalisasi terbatas; wilayah eksplisit',duplicates:list.length});
}
// Authorized regional references are compiled explicitly and labelled. Runtime
// lookup remains exact; wages never inherit another locality's tariff.
const referencePolicy=await load('public/data/regional-reference-policy.json');
if(referencePolicy.enabled){
 const direct=[...records],scopeKey=(identity,region,sub)=>identity+'\0'+region+'\0'+sub,known=new Set(records.map(r=>scopeKey(r.identity,r.region,r.subRegion))),blocked=new Set(conflicts.map(r=>scopeKey(r.identity,r.region,r.subRegion))),available=new Map(direct.map(r=>[scopeKey(r.identity,r.region,r.subRegion),r]));
 const identities=new Set(direct.filter(r=>referencePolicy.groups.includes(r.group)).map(r=>r.identity));
 for(const [region,targets]of Object.entries(referencePolicy.donors))for(const [subRegion,donors]of Object.entries(targets)){
  if(!priceRegions[region]?.includes(subRegion)||donors.some(d=>!priceRegions[region].includes(d)))throw Error('Wilayah acuan tidak sah.');
  for(const identity of identities){const key=scopeKey(identity,region,subRegion);if(known.has(key)||blocked.has(key))continue;
   const donor=donors.map(d=>available.get(scopeKey(identity,region,d))).find(r=>r&&referencePolicy.groups.includes(r.group));if(!donor)continue;
   const id=createHash('sha256').update(donor.id+'\0'+region+'\0'+subRegion+'\0regional-reference').digest('hex').slice(0,24),old=previous.records.find(r=>scopeKey(r.identity,r.region,r.subRegion)===key),replaces=[...(old?.replaces||[])];if(old&&(old.id!==id||old.price!==donor.price)&&!replaces.some(r=>r.id===old.id&&r.price===old.price))replaces.push({id:old.id,price:old.price});
   const note=`Estimasi harga ${region}/${subRegion} dengan acuan ${donor.region}/${donor.subRegion}; bukan survei harga setempat. Dipakai karena belum ada pasangan harga lokal yang sesuai. Disetujui pengguna 21 November 2026.`;
   records.push({...donor,id,replaces,subRegion,priceKind:'estimate',sourceText:(note+' '+donor.sourceText).slice(0,2000),remarks:note+' '+donor.remarks,regionalReference:{sourceRegion:donor.region,sourceSubRegion:donor.subRegion,targetRegion:region,targetSubRegion:subRegion,sourceRecordId:donor.id,authorizedOn:'2026-11-21',method:referencePolicy.method}});known.add(key);
  }
 }
}
const summary={resources:inventory.resources.length,structuredPriceRows:sourceRows.length,verifiedPrices:records.length,resourcesWithPrice:new Set(records.map(r=>r.identity)).size,regionalReferences:records.filter(r=>r.regionalReference).length,conflictingCandidates:conflicts.length,olderOrTaxUnresolved:review.length,byRegion:Object.fromEntries(Object.entries(priceRegions).flatMap(([region,subs])=>subs.map(sub=>[region+'/'+sub,records.filter(r=>r.region===region&&r.subRegion===sub).length])))};
const publication={schemaVersion:1,preparedOn:'2026-11-21',summary,records};
await writeFile(new URL('public/data/regional-price-catalog.json',root),JSON.stringify(publication,null,2));
await writeFile(new URL('public/data/regional-price-runtime.json',root),JSON.stringify(compactPriceCatalog(publication)));
await writeFile(sourceDir+'/price-match-review.json',JSON.stringify([...review,...conflicts],null,2));
await writeFile(new URL('public/reports/harga-terverifikasi-2026.csv',root),toCsv([['Sumber daya','Kelompok','Satuan','Region','Sub Region','Harga acuan (lihat catatan PPN)','Tahun basis','Dokumen sumber','Halaman/baris','Harga sumber','Satuan sumber','Catatan'],...records.map(r=>[r.name,r.group,r.unit,r.region,r.subRegion,r.price,r.basisYear,r.evidence.sourceTitle,r.evidence.locator,r.evidence.sourcePrice,r.evidence.unit,r.remarks])]));
console.log(JSON.stringify(summary,null,2));
