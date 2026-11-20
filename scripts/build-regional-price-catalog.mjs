import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cleanResourceName,normalizedResourceUnit,resourceIdentity} from '../resource-cleanup.js';
import {priceRegions,moneyRound,toCsv} from '../rab-core.js';
const root=new URL('../',import.meta.url),load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const sourceDir=process.argv[2]||'/workspace/price-sources';
const sourceRows=JSON.parse(await readFile(sourceDir+'/extracted-prices.json','utf8'));
sourceRows.push(...(await load('public/data/reviewed-price-rows.json')).rows);
const inventory=await load('public/reports/inventaris-sumber-daya-harga.json'),bps=await load('public/data/bps-price-indices.json');
const norm=s=>cleanResourceName(s).replace(/^Semen\s*\(PC\)$/i,'Semen Portland').replace(/^PC$/i,'Semen Portland').normalize('NFKC').toLowerCase().replace(/alumunium/g,'aluminium').replace(/\b(?:semen\s*\(pc\)|portland cement|pc)\b/g,'semen portland').replace(/\b(?:m3|m2)\b/g,m=>m).replace(/[Øø∅⌀]/g,'d').replace(/\b(?:ukuran|uk\.|tebal|t\.)\s*/g,' ').replace(/(\d)\s*(mm|cm|m|kg)\b/g,'$1$2').replace(/(?<=\d),(?=\d)/g,'.').replace(/[^\p{L}\p{N}./"']+/gu,' ').replace(/(?<!\d)\.|\.(?!\d)/g,' ').replace(/\s+/g,' ').trim();
const unit=(s,group)=>{const v=normalizedResourceUnit(s);if(group==='Tenaga kerja')return /^(orang\/hari|oranghari|orang\/hr|org\/hr|oh)$/.test(v)?'oh':/^(orang\/jam|orangjam|oj|jam)$/.test(v)?'oj':v;return ({meter:'m',pcs:'buah',piece:'buah',biji:'buah',liter:'liter',l:'liter',kilogram:'kg',lembar:'lembar'})[v]||v;};
const index=new Map();for(const r of inventory.resources){const key=norm(r.name)+'\0'+unit(r.unit,r.group);if(!index.has(key))index.set(key,[]);index.get(key).push(r);}
function category(row){if(row.group)return row.group;if(/Jasa Tenaga Penanganan Prasarana|Upah Tenaga|Upah Pekerja/i.test(row.name))return 'Tenaga kerja';if(/Sewa/i.test(row.name))return 'Peralatan';if(/^(?:1\.1\.12|Bahan)/.test(row.sourceCode||row.commodityGroup||''))return 'Bahan';return null;}
const candidates=[],review=[];
for(const s of sourceRows){
 if(!s.subRegion||!priceRegions[s.region]?.includes(s.subRegion))continue;
 const group=category(s),names=[s.specification,`${s.name} ${s.specification}`];
 if(!s.specification||norm(s.specification)===norm(s.name))names.push(s.name);
 const matches=new Map();
 for(const name of names)for(const r of index.get(norm(name)+'\0'+unit(s.unit,group))||[]){if(group&&r.group!==group)continue;matches.set(r.identity,r);}
 for(const r of matches.values()){
  let reason='';if(s.sourceYear<2026)reason='Harga lama: eskalasi dan perlakuan pajak perlu dilengkapi';
  if(s.tax.included==null)reason='Perlakuan pajak sumber belum dinyatakan';
  if(s.sourceYear>2026)reason='Tahun dasar di luar cakupan 2026';
  let escalation=null;
  if(s.sourceYear===2025&&s.reviewed&&s.bpsCommodity){
   const b=bps.commodities.find(x=>x.id===s.bpsCommodity);
   if(b?.annual2025&&b.oct2026){escalation={series:b.name,indexBaseYear:2023,basePeriod:'Rata-rata tahunan 2025',targetPeriod:'Oktober 2026',baseValue:b.annual2025,targetValue:b.oct2026,factor:b.oct2026/b.annual2025,percent:(b.oct2026/b.annual2025-1)*100,baseUrl:bps.tableUrl,targetUrl:bps.releaseUrl};reason='';}
  }
  let price=s.sourcePrice,adjustment='';
  if(s.tax.included&&r.group!=='Tenaga kerja'){price/=1+s.tax.effectivePercent/100;adjustment=`PPN efektif ${s.tax.effectivePercent}% dikeluarkan dari harga sumber agar tidak ditambahkan dua kali dalam RAB.`;}
  if(escalation){price*=escalation.factor;adjustment+=` Eskalasi BPS ${escalation.series}: ${escalation.baseValue} → ${escalation.targetValue} (${escalation.percent.toFixed(4)}%), rata-rata 2025 → Oktober 2026. ${bps.tableUrl} ${bps.releaseUrl}`;}
  const entry={escalation,identity:r.identity,resourceId:r.id,name:r.name,group:r.group,unit:r.unit,region:s.region,subRegion:s.subRegion,source:s,price:moneyRound(price),reason,adjustment};
  (reason?review:candidates).push(entry);
 }
}
const byScope=new Map();for(const c of candidates){const k=c.identity+'\0'+c.region+'\0'+c.subRegion;if(!byScope.has(k))byScope.set(k,[]);byScope.get(k).push(c);}
const records=[],conflicts=[];
for(const list of byScope.values()){
 const distinct=[...new Set(list.map(r=>r.price))];
 if(distinct.length!==1){conflicts.push(...list.map(r=>({...r,reason:'Beberapa harga berbeda untuk identitas/satuan/wilayah yang sama; tidak dipilih otomatis'})));continue;}
 const c=list[0],s=c.source,id=createHash('sha256').update(c.identity+'\0'+s.id).digest('hex').slice(0,24);
 records.push({id,identity:c.identity,name:c.name,group:c.group,unit:c.unit,region:c.region,subRegion:c.subRegion,basisYear:2026,intendedUseYear:2027,sourceYear:s.sourceYear,price:c.price,status:'verified',sourceText:`${s.sourceTitle} · ${s.locator} · ${s.region}/${s.subRegion} · harga sumber Rp ${s.sourcePrice} per ${s.unit}; tahun sumber ${s.sourceYear}, basis 2026${c.escalation?', eskalasi '+c.escalation.percent.toFixed(4)+'% (rata-rata 2025 → Oktober 2026)':''}. ${s.sourceUrl}`.slice(0,2000),remarks:[c.adjustment,'Harga standar/batas tertinggi sumber; tetap dapat diedit. TKDN belum ditetapkan tanpa produk/sertifikat yang cocok.'].filter(Boolean).join(' '),evidence:s,escalation:c.escalation,matching:'Nama/spesifikasi dan satuan sama setelah normalisasi terbatas; wilayah eksplisit',duplicates:list.length});
}
const summary={resources:inventory.resources.length,structuredPriceRows:sourceRows.length,verifiedPrices:records.length,resourcesWithPrice:new Set(records.map(r=>r.identity)).size,conflictingCandidates:conflicts.length,olderOrTaxUnresolved:review.length,byRegion:Object.fromEntries(Object.entries(priceRegions).flatMap(([region,subs])=>subs.map(sub=>[region+'/'+sub,records.filter(r=>r.region===region&&r.subRegion===sub).length])))};
await writeFile(new URL('public/data/regional-price-catalog.json',root),JSON.stringify({schemaVersion:1,preparedOn:'2026-11-21',summary,records},null,2));
await writeFile(sourceDir+'/price-match-review.json',JSON.stringify([...review,...conflicts],null,2));
await writeFile(new URL('public/reports/harga-terverifikasi-2026.csv',root),toCsv([['Sumber daya','Kelompok','Satuan','Region','Sub Region','Harga dasar sebelum PPN','Tahun basis','Dokumen sumber','Halaman/baris','Harga sumber','Satuan sumber','Catatan'],...records.map(r=>[r.name,r.group,r.unit,r.region,r.subRegion,r.price,r.basisYear,r.evidence.sourceTitle,r.evidence.locator,r.evidence.sourcePrice,r.evidence.unit,r.remarks])]));
console.log(JSON.stringify(summary,null,2));
