import {cleanResourceName,normalizedResourceUnit} from '../resource-cleanup.js';
export const norm=s=>cleanResourceName(s).replace(/^Semen\s*\(PC\)$/i,'Semen Portland').replace(/^(?:PC|Semen)$/i,'Semen Portland').normalize('NFKC').toLowerCase().replace(/alumunium/g,'aluminium').replace(/\b(?:semen\s*\(pc\)|portland cement|pc)\b/g,'semen portland').replace(/\b(?:m3|m2)\b/g,m=>m).replace(/[Øø∅⌀]/g,'d').replace(/\b(?:ukuran|uk\.|tebal|t\.)\s*/g,' ').replace(/(\d)\s*(mm|cm|m|kg)\b/g,'$1$2').replace(/(?<=\d),(?=\d)/g,'.').replace(/[^\p{L}\p{N}./"']+/gu,' ').replace(/(?<!\d)\.|\.(?!\d)/g,' ').replace(/\s+/g,' ').trim().replace(/\s+/g,(spaces,at,text)=>/\d/.test(text[at-1]||'')&&/\d/.test(text[at+spaces.length]||'')?' ':'');
export const unit=(s,group)=>{const v=normalizedResourceUnit(s);if(group==='Tenaga kerja')return /^(orang\/hari|oranghari|orang\/hr|org\/hr|oh)$/.test(v)?'oh':/^(orang\/jam|orangjam|oj|jam)$/.test(v)?'oj':v;return ({'perjam':'jam','perhari':'hari','org/jam':'oj',meter:'m',pcs:'buah',piece:'buah',biji:'buah',liter:'liter',l:'liter',kilogram:'kg',lembar:'lembar'})[v]||v;};
// Conversion instruction supplied by the user; never alter AHSP coefficients.
export function wagePeriodFactor(sourceUnit,targetUnit='OH'){
 const source=String(sourceUnit).toLowerCase().replace(/\s+/g,''),target=String(targetUnit).toLowerCase();
 const daily=/^(?:oh|orang\/hari|org\/hari|org\/hr|oranghari)$/.test(source),hourly=/^(?:oj|jam|org\/jam|orang\/jam|orangjam)$/.test(source),monthly=/^(?:ob|bulan|org\/bulan|orang\/bulan|orangbulan)$/.test(source);
 if(!daily&&!hourly&&!monthly||!['oh','oj','jam'].includes(target))throw Error('Satuan periode upah tidak dikenali.');
 const perDay=daily?1:hourly?8:1/30;return target==='oh'?perDay:perDay/8;
}
