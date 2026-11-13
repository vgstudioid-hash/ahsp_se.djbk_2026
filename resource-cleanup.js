// Display cleanup preserves technical specifications; the source catalogue stays unchanged.
export function cleanResourceName(value){
 let name=String(value??'').replace(/(?:\b\d{1,2}\s*\*+\s*\)?|\*+\s*\d{0,2}\s*\)?)/g,' ').replace(/[†‡•]/g,' ').replace(/^\s*\d{1,2}[.)]\s+(?=[A-Za-z])/,'');
 // Remove unmatched extraction brackets, keeping balanced technical descriptions.
 const chars=[...name],stack=[],drop=new Set();for(let i=0;i<chars.length;i++){if(chars[i]==='(')stack.push(i);else if(chars[i]===')'){if(stack.length)stack.pop();else drop.add(i);}}for(const i of stack)drop.add(i);
 name=chars.filter((_,i)=>!drop.has(i)).join('').replace(/\s+/g,' ').trim();
 name=name.replace(/^\d{1,3}\s+(?=(?:Pekerja|Mandor|Tukang|Kepala Tukang|Operator|Bulldozer|Excavator)\b)/i,'');
 for(const [pattern,text]of [[/\bakhli\b/gi,'Ahli'],[/\bexavator\b/gi,'Excavator'],[/\bvibator\b/gi,'Vibrator'],[/\bkaso\b/gi,'Kaso'],[/\brapia\b/gi,'Rafia'],[/\bnylon\b/gi,'Nilon'],[/\bkrikil\b/gi,'Kerikil'],[/\baggregat\b/gi,'Agregat']])name=name.replace(pattern,text);
 if(/^(?:PC\s*[:/]\s*)?(?:Portland Cement|Semen Portland)(?:\s*\(PC\))?$/i.test(name))name='Semen Portland';
 name=name.replace(/^(?:PB\s*:\s*)(?=Pasir Beton\b)/i,'').replace(/^(?:Kr\s*:\s*)(?=Kerikil\b)/i,'');
 return name||String(value).trim();
}
export function normalizedResourceUnit(unit){const value=String(unit||'').normalize('NFKC').toLocaleLowerCase('id').replace(/\s+/g,'').replace(/[’′']/g,'');return ({bh:'buah',ltr:'liter',lbr:'lembar',btg:'batang'})[value]||value;}
export function resourceIdentity(c){return JSON.stringify([c.group,cleanResourceName(c.name).normalize('NFKC').toLocaleLowerCase('id').replace(/[Øø∅⌀]/g,'ø').replace(/\bD\s+(?=\d)/gi,'d').replace(/(\d)\s+(?=(?:mm|cm|m|kg|MPa)\b)/gi,'$1').replace(/\s*([/(),])\s*/g,'$1'),normalizedResourceUnit(c.unit)]);}
function parseResourceAlternatives(raw){
 const name=cleanResourceName(raw);
 if(!/\/|\satau\s/i.test(name))return {names:[name],reason:'Tidak memuat pemisah alternatif.'};
 if(/^(?:[a-z]\s+tali|Mandor\s+B\s+Bahan)\b|Tutup Beton|\b(?:Time Switch|Tissue)\//i.test(name))return {names:[name],reason:'Nama tampak berupa alias atau hasil ekstraksi gabungan; perlu pemeriksaan sumber.'};
 const timber=name.match(/^(.+?\bKelas)\s+([IVX]+)\s+atau\s+(?:Kelas\s+)?([IVX]+)$/i);if(timber)return {names:[timber[1]+' '+timber[2],timber[1]+' '+timber[3]],reason:'Pilihan kelas kayu dengan nama bahan sama.'};
 const asphalt=name.match(/^(Aspal Emulsi)\s+\(?([A-Z]+-\d+[A-Za-z]*)\s+atau\s+([A-Z]+-\d+[A-Za-z]*)\)?$/i);if(asphalt)return {names:[asphalt[1]+' '+asphalt[2],asphalt[1]+' '+asphalt[3]],reason:'Pilihan jenis aspal emulsi eksplisit.'};
 const suffix=name.match(/^([A-Za-z][A-Za-z -]{1,25})\s*\/\s*([A-Za-z][A-Za-z -]{1,25})(\s+\([^)]*\))$/);if(suffix)return {names:[suffix[1]+suffix[3],suffix[2]+suffix[3]],reason:'Alternatif nama dengan spesifikasi kurung yang sama.'};
 if(/^Tali\/benang pengikat$/i.test(name))return {names:['Tali pengikat','Benang pengikat'],reason:'Pilihan jenis pengikat eksplisit.'};
 // Never interpret ratios, dimensions, fractions, unit rates or standards as alternatives.
 const technical=/(?:\d\s*\/\s*\d|\b(?:gr|kg|m[23²³]?|cm[23²³]?|mm|ha|liter|ltr|l|feet)\s*\/\s*(?:m[23²³]?|jam|hari|menit|mnt|detik|h|s)\b|\b(?:s\s*\/\s*d|w\s*\/\s*c|c\s*\/\s*w)\b)/i;
 if(technical.test(name))return {names:[name],reason:'Ukuran, rasio, pecahan atau satuan teknis; dipertahankan.'};
 if(/\b(?:setara|atau dibangun|offline|online|bantu|aksesoris|fasilitas|sumber|kapasitas)\b|\b[A-Z]\.\d|\b(?:SS|SM|SMAW|SAW|GMAW)\s*\d|\+|[;=]/i.test(name))return {names:[name],reason:'Istilah/spesifikasi gabungan perlu pemeriksaan sumber; tidak dipisahkan otomatis.'};
 // Clear shared nouns in short material/trade lists, with the same technical suffix on each choice.
 const match=name.match(/^((?:Karung|Tali|Tambang|Tukang|Kabel(?: TR)?|Cat|Tanah|Batu|Bahan|Sewa|Pemotong|Pelat Rambu))\s+([A-Za-z]+(?:\s*[\/]\s*[A-Za-z]+){1,4})(.*)$/i);
 if(match){const words=match[2].split(/\s*\/\s*/),tail=match[3];if(/^\s*\d+\s+\d/.test(tail))return {names:[name],reason:'Ada angka hasil ekstraksi yang ambigu; periksa sumber sebelum dipisahkan.'};if(!tail||/^\s*(?:[øØ∅⌀]|di\b|\(|\d|[-,])/i.test(tail)){return {names:words.map(word=>`${match[1]} ${word}${tail}`),reason:'Alternatif eksplisit dengan nama induk dan spesifikasi yang sama.'};}}
 const plain=name.split(/\s*\/\s*|\s+atau\s+/i);
 if(plain.length>=2&&plain.length<=4&&plain.every(part=>/^[A-Za-z][A-Za-z -]{1,35}$/.test(part))){
  if(/^(?:Barang|Material|PC|PB|Kr|T\d|Cover|Tekanan)\b/i.test(plain[0]))return {names:[name],reason:'Alias/keterangan umum; perlu pemeriksaan.'};
  if(plain.length===2&&plain[1].replace(/ /g,'').toUpperCase()===plain[0].split(/\s+/).map(w=>w[0]).join('').toUpperCase())return {names:[name],reason:'Singkatan nama yang sama, bukan pilihan sumber daya.'};
  const first=plain[0].trim().split(/\s+/),prefix=first.length>1&&/^(?:Karung|Tali|Tambang|Tukang|Bahan|Pasir|Kawat|Cat|Tanah|Batu|Sewa|Pemotong)$/i.test(first[0])?first[0]+' ':'';
  return {names:[plain[0],...plain.slice(1).map(part=>prefix&&!part.toLowerCase().startsWith(prefix.toLowerCase())?prefix+part:part)],reason:'Alternatif tekstual eksplisit.'};
 }
 return {names:[name],reason:'Kandidat pilihan/alias dengan spesifikasi kompleks; perlu pemeriksaan sumber.'};
}
export function resourceAlternatives(raw){const parsed=parseResourceAlternatives(raw),seen=new Set();return {...parsed,names:parsed.names.filter(name=>{const key=name.toLocaleLowerCase('id').trim();if(seen.has(key))return false;seen.add(key);return true;})};}
export function buildResourceCodeIndex(catalog){const map=new Map();for(const item of catalog)for(const c of item.components||[]){if(!c.code||resourceAlternatives(c.name).names.length>1)continue;const key=resourceIdentity(c);if(!map.has(key))map.set(key,new Set());map.get(key).add(c.code.trim());}return new Map([...map].filter(([,codes])=>codes.size===1).map(([key,codes])=>[key,[...codes][0]]));}
export function buildResourceNameIndex(catalog){const map=new Map();for(const item of catalog)for(const c of item.components||[])for(const name of resourceAlternatives(c.name).names){const id=resourceIdentity({...c,name});if(!map.has(id))map.set(id,new Map());const counts=map.get(id);counts.set(name,(counts.get(name)||0)+1);}return new Map([...map].map(([id,counts])=>[id,[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'id'))[0][0]]));}
export function normalizeItemResources(item,codes=new Map(),names=new Map()){
 const components=(item.components||[]).flatMap(c=>{const raw=c.sourceName||c.name,choice=resourceAlternatives(c.name),split=choice.names.length>1;return choice.names.map(name=>{const next={...c,name:names.get(resourceIdentity({...c,name}))||name,sourceName:raw};if(split){next.alternativeSet=c.alternativeSet||`${c.group}|${raw}|${c.unit}|${c.coefficient}`;next.code=codes.get(resourceIdentity(next))||'';}else if(!next.code)next.code=codes.get(resourceIdentity(next))||'';return next;});});
 return {...item,components};
}
