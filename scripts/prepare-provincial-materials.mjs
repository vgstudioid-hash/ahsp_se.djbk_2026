import {readFile,writeFile} from 'node:fs/promises';
import {priceRegions} from '../rab-core.js';
import {commodityFor} from './bps-commodity-match.mjs';
const root=new URL('../',import.meta.url),dir=process.argv[2]||'/workspace/price-sources';
const raw=JSON.parse(await readFile(dir+'/extracted-prices.json','utf8')).filter(r=>r.sourceId==='1wR0gGXAz1GfFkpeFD8a-e-34wlnM2Nsh'&&r.commodityGroup==='Bahan Bangunan dan Konstruksi');
const rows=raw.map(r=>({...r,group:'Bahan',reviewed:true,reviewMethod:'Structured numeric Excel cells; exact full specification and unit matching, not OCR',authority:'regional-government-workbook',sourcePriority:35,bpsCommodity:commodityFor(r.specification),taxStatus:r.tax.included==null?'unspecified':'stated',sourceSubRegion:r.subRegion,...(!r.subRegion?{applicableSubRegions:priceRegions['Jawa Barat'],sourceScope:'Provinsi Jawa Barat',fallbackOnly:true,mappingBasis:'Acuan standar Provinsi Jawa Barat tanpa pembeda kabupaten/kota pada baris sumber; bukan harga survei khusus Sub Region. Tarif lokal/jurnal yang sesuai didahulukan.'}:{})}));
await writeFile(new URL('public/data/provincial-material-sources.json',root),JSON.stringify({schemaVersion:1,rows},null,2));console.log('Provincial material source rows',rows.length);
