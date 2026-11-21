import {resources, resourceMetadata, setResourcePrice, setResourceMetadata, priceProfileKey, moneyRound} from './rab-core.9057dd027f80.js';
import {resourceIdentity} from './resource-cleanup.9057dd027f80.js';

// Published records contain reviewed identities; runtime never guesses by name or code.
export function createPriceCatalog(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.records))throw Error('Katalog harga tidak valid.');
 const index=new Map();
 for(const record of data.records){
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
export {markResourceFieldManual as markPriceFieldManual} from './rab-core.9057dd027f80.js';
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
  if(c.price!=null||c.priceConflict||manual.includes('price'))continue;
  setResourcePrice(project,c.key,moneyRound(r.price));
  setResourceMetadata(project,c.key,'catalogPriceId',r.id);
  setResourceMetadata(project,c.key,'catalogPriceYear',r.basisYear);
  for(const [field,value]of [['priceSource',r.sourceText],['remarks',r.remarks],['kdn','']]){
   if(value&&!resourceMetadata(project,c)[field]&&!manual.includes(field))setResourceMetadata(project,c.key,field,value);
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
