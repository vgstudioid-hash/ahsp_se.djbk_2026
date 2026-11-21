import {resources, resourceMetadata, setResourcePrice, setResourceMetadata, priceProfileKey, moneyRound} from './rab-core.f982dfc93bad.js';
import {resourceIdentity} from './resource-cleanup.f982dfc93bad.js';

// Published records contain reviewed identities; runtime never guesses by name or code.
export function createPriceCatalog(data){
 if(![1,2].includes(data?.schemaVersion)||!Array.isArray(data.records))throw Error('Katalog harga tidak valid.');
 const index=new Map(),direct=new Map(data.records.filter(r=>!r.sourceRecordId).map(r=>[r.id,r]));
 for(const stored of data.records){
  let record=stored;
  if(stored.sourceRecordId){
   const source=direct.get(stored.sourceRecordId);
   if(data.schemaVersion!==2||!source||source.sourceRecordId||!['Bahan','Peralatan'].includes(source.group)||source.region!==stored.region||source.subRegion===stored.subRegion||typeof stored.referenceNotice!=='string'||!stored.referenceNotice)throw Error('Acuan regional tidak valid.');
   record={...source,id:stored.id,region:stored.region,subRegion:stored.subRegion,replaces:stored.replaces||[],priceKind:'estimate',sourceText:(stored.referenceNotice+' '+source.sourceText).slice(0,2000),remarks:stored.referenceNotice+' '+(source.remarks||''),regionalReference:{sourceRegion:source.region,sourceSubRegion:source.subRegion,sourceRecordId:source.id,targetRegion:stored.region,targetSubRegion:stored.subRegion}};
  }
  if(record.status!=='verified')continue;
  if(typeof record.identity!=='string'||!record.id||!Number.isFinite(record.price)||record.price<0||record.price>1e15||record.basisYear!==2026||typeof record.sourceText!=='string'||!record.sourceText||record.sourceText.length>2000)throw Error('Rekaman harga terverifikasi tidak valid.');
  if(record.tkdn!=null){
   const c=record.tkdnCertificate;
   if(JSON.parse(record.identity)[0]==='Tenaga kerja')throw Error('TKDN sertifikat produk tidak berlaku pada tenaga kerja.');
   if(!Number.isFinite(record.tkdn)||record.tkdn<0||record.tkdn>100||!c||!c.number||!c.manufacturer||!c.product||!/^https:\/\/(?:[a-z0-9-]+\.)*kemenperin\.go\.id\//i.test(c.url||'')||!/^\d{4}-\d{2}-\d{2}$/.test(c.validThrough||'')||!c.verifiedOn)throw Error('TKDN memerlukan produk dan sertifikat P3DN terverifikasi.');
  }
  const key=priceProfileKey(record.region,record.subRegion)+'\0'+record.identity;
  if(!index.has(key))index.set(key,[]);index.get(key).push(record);
 }
 return index;
}
export {markResourceFieldManual as markPriceFieldManual} from './rab-core.f982dfc93bad.js';
export function applyPriceCatalog(project,index){
 // Local prices require an explicit complete region; no silent provincial/city fallback.
 if(!project.priceRegion||!project.priceSubRegion||!index?.size)return 0;
 const scope=priceProfileKey(project.priceRegion,project.priceSubRegion);let filled=0;
 for(const c of resources(project)){
  const candidates=index.get(scope+'\0'+resourceIdentity(c))||[];
  if(candidates.length!==1)continue;
  const r=candidates[0],m=resourceMetadata(project,c),manual=m.catalogManual||[];
  const certificate=r.tkdnCertificate,year=String(project.year||'2027');
  if(r.tkdn!=null&&certificate&&certificate.validThrough>=year+'-12-31'&&!m.kdn&&!manual.includes('kdn')){
   setResourceMetadata(project,c.key,'kdn',String(r.tkdn)+'%');
   setResourceMetadata(project,c.key,'catalogTkdnId',certificate.number);
   if(!manual.includes('remarks'))setResourceMetadata(project,c.key,'remarks',((m.remarks?m.remarks+'\n':'')+`TKDN ${r.tkdn}%: ${certificate.product}; ${certificate.manufacturer}; sertifikat ${certificate.number}; berlaku sampai ${certificate.validThrough}; ${certificate.url}`).slice(0,4000));
   filled++;
  }
  // Preserve explicit zero, conflicting legacy prices and manual clearing.
  const replacesAuto=c.price!=null&&c.price!==0&&m.catalogPriceId&&!manual.includes('price')&&r.replaces?.some(old=>old.id===m.catalogPriceId&&old.price===c.price);
  if((c.price!=null&&!replacesAuto)||c.priceConflict||manual.includes('price'))continue;
  setResourcePrice(project,c.key,moneyRound(r.price));
  setResourceMetadata(project,c.key,'catalogPriceId',r.id);
  setResourceMetadata(project,c.key,'catalogPriceYear',r.basisYear);
  for(const [field,value]of [['priceSource',r.sourceText],['remarks',r.remarks],['kdn','']]){
   if(value&&(!resourceMetadata(project,c)[field]||replacesAuto)&&!manual.includes(field))setResourceMetadata(project,c.key,field,value);
  }
  filled++;
 }
 return filled;
}
// A catalogue preview prices a prospective AHS without adding it to the project or
// modifying any stored price bank. Existing manual prices/clears still take priority.
export function priceCatalogPreview(project,item,index){
 const draft={...project,rates:{...project.rates},resourceMeta:structuredClone(project.resourceMeta||{}),items:[{...item,volume:item.volume??1,heading:false,wbsLevel:2}]};
 applyPriceCatalog(draft,index);
 return draft;
}
// The indices must belong to the same official series and base year.
export function escalateByIndex(price,base,target){
 if(!Number.isFinite(price)||price<0||price>1e15||!base?.series||base.series!==target?.series||base.baseYear!==target.baseYear||!Number.isFinite(base.value)||base.value<=0||!Number.isFinite(target.value)||target.value<=0||!base.period||!target.period||!base.url||!target.url)throw Error('Indeks eskalasi harus sebanding dan memiliki rujukan.');
 const factor=target.value/base.value,result=price*factor;
 if(!Number.isFinite(result)||result>1e15)throw Error('Hasil eskalasi melebihi batas.');
 return {price:moneyRound(result),factor,percent:(factor-1)*100,base,target};
}

// Compact only the wire format; the downloadable database retains full evidence.
export function compactPriceCatalog(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.records))throw Error('Katalog sumber tidak valid.');
 const sources=new Map(data.records.map(r=>[r.id,r])),fields=['id','identity','name','group','unit','region','subRegion','basisYear','price','status','sourceText','remarks','replaces','priceKind','sourceYear','intendedUseYear','tkdn','tkdnCertificate'];
 return {schemaVersion:2,preparedOn:data.preparedOn,summary:data.summary,records:data.records.map(r=>{
  if(!r.regionalReference)return Object.fromEntries(fields.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
  const source=sources.get(r.regionalReference.sourceRecordId);if(!source||source.regionalReference||!source.remarks||!r.remarks.endsWith(source.remarks))throw Error('Sumber harga acuan harus langsung dan terlacak.');
  return {id:r.id,sourceRecordId:source.id,region:r.region,subRegion:r.subRegion,replaces:r.replaces||[],referenceNotice:r.remarks.slice(0,-source.remarks.length).trim()};
 })};
}
