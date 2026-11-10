"""Extract every cost-analysis table and TOC item, keeping source evidence and review flags.
No execution of PDF formula text. Rebuild: python3 scripts/extract-ahs.py
"""
import json,re,hashlib,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'public/data'
A=re.compile(r'^\s*A[.\s]+(?:TENAGA|PEKERJA|UNIT\s+PEKERJAAN)',re.I)
GROUP=re.compile(r'^\s*([ABCD])[.\s]+(TENAGA(?:\s+KERJA)?|PEKERJA|UNIT\s+PEKERJAAN[^\n]*|BAHAN|PERALATAN|ALAT|LAIN[^\n]*)\s*$',re.I)
END=re.compile(r'^\s*[EFG][.\s]+HARGA\s+SATUAN\s+PEKERJAAN',re.I)
NUM=re.compile(r'(?<![\w.,])(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?(?![\w.,])')
HEAD={'iv':re.compile(r'^\s{0,12}(A\.\d+(?:\.[\w-]+)+)\s+(.+)'), 'v':re.compile(r'^\s{0,12}([A-Z]\.\d+[a-z]?(?:\.[\w-]+)*)\s+(.+)'), 'vi':re.compile(r'^\s{0,12}(\d+(?:\.\d+){2,}[a-z]?)\s+(.+)')}
def clean(s):return re.sub(r'\s+',' ',s).strip()
def number(s):return float(s.replace('.','').replace(',','.'))
def unit(title):
 m=re.search(r'(?i)(?:\b1(?:[,.]0+)?\s*)(m[²³23’\x27]?|kg|ton|buah|unit|titik|set|ha|liter|ls|paket)\b',title)
 if not m:m=re.search(r'(?i)/\s*(m[²³23\x27]?|kg|ton|buah|unit|titik|set)\b',title)
 if not m:return ''
 return {'m2':'m²','m3':'m³',"m'":'m','m’':'m'}.get(m[1].lower(),m[1].lower())
def columns(context):
 for _,line in reversed(context):
  c=re.search(r'Koefisien|KUANTITAS|KOEF\.',line,re.I)
  if not c:continue
  cx=(c.start()+c.end())/2
  us=[m for m in re.finditer(r'Satuan',line,re.I) if m.start()<c.start()]
  if not us:continue
  u=us[-1];ux=(u.start()+u.end())/2
  k=re.search(r'Kode',line,re.I);kx=(k.start()+k.end())/2 if k else ux-11
  return (int((kx+ux)/2),int((ux+cx)/2),int(cx+max(6,(cx-ux)*.48)),max(5,int(kx-5)))
 return None
def parse_components(lines,cols):
 if not cols:return [],['Kolom koefisien belum dikenali']
 u0,c0,c1,k0=cols;groups=[];current=None;issues=[]
 for page,line in lines:
  m=GROUP.match(line)
  if m:
   if m[1]=='D' and 'LAIN' not in m[2].upper():break
   current={'group':('Lain-lain' if 'UNIT PEKERJAAN' in m[2].upper() or 'LAIN' in m[2].upper() else {'A':'Tenaga kerja','B':'Bahan','C':'Peralatan','D':'Lain-lain'}[m[1]]),'lines':[]};groups.append(current);continue
  if re.match(r'^\s*[DEF][.\s]+(?:Jumlah|Biaya|Overhead|Harga)',line,re.I):break
  if current and not re.search(r'JUMLAH\s+HARGA',line,re.I) and not re.match(r'^\s*-?\s*\d+\s*-?\s*$',line):current['lines'].append((page,line))
 components=[]
 for g in groups:
  ls=g['lines'];anchors=[]
  for i,(page,line) in enumerate(ls):
   candidates=[m for m in NUM.finditer(line) if m.start()>=c0-4 and m.start()<c1];text=candidates[0][0] if candidates else line[c0:c1].strip()
   if not text:continue
   if re.fullmatch(r'(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?',text):anchors.append((i,text,page))
   elif line[:u0].strip() and not re.search(r'\(Rp|Satuan|Koefisien|^\s*No|^\s*1\s+2\s+3',line,re.I):issues.append('Koefisien nonnumerik/bergeser: '+clean(line))
  for ai,(idx,coef,page) in enumerate(anchors):
   prev=anchors[ai-1][0] if ai else -1;nexti=anchors[ai+1][0] if ai+1<len(anchors) else len(ls)
   low=0;high=len(ls)
   nameparts=[];codes=[];units=[]
   def has_name(k):
    prefix=ls[k][1][:u0];return bool(re.sub(r'^\s*\d+[.)]?\s+','',prefix[:k0]).strip())
   for j in range(low,high):
    nearest=min(anchors,key=lambda a:(abs(j-a[0]), 1 if has_name(a[0]) else 0, a[0]));
    if nearest[0]!=idx:continue
    _,line=ls[j];prefix=line[:u0];code=prefix[k0:].strip();name=prefix[:k0].strip()
    # A few source rows have no gap before resource code.
    if code and re.fullmatch(r'\(?[LMEPTB][.\w-]+\)?',code):codes.append(code.strip('()'))
    elif code:name=clean(prefix)
    name=re.sub(r'^\d+[.)]?\s+','',name) if len(line)-len(line.lstrip())<6 else name
    if name and not re.search(r'JUMLAH|TENAGA KERJA|PERALATAN|^BAHAN$|^No\.?$|^\(\d\)',name,re.I):nameparts.append(name)
    u=line[u0:c0].strip()
    if u and not re.fullmatch(r'\(?[345]\)?',u):units.append(u)
   name=clean(' '.join(nameparts));u=clean(' '.join(dict.fromkeys(units)))
   if not name or not u:issues.append('Nama/satuan komponen belum lengkap: '+coef);continue
   if len(name)>350 or len(u)>25:issues.append('Batas kolom komponen perlu ditinjau: '+name[:80]);continue
   components.append(dict(group=g['group'],name=name,code=' '.join(dict.fromkeys(codes)),unit=u,coefficient=number(coef),sourceCoefficient=coef,sourcePage=page))
  # Components whose entire coefficient cell is empty must not disappear silently.
  for i,(page,line) in enumerate(ls):
   if re.match(r'^\s*\d+[.)]?\s+\S',line) and not line[c0:c1].strip():
    if not any(abs(i-a[0])<=2 for a in anchors):issues.append('Baris komponen tanpa koefisien: '+clean(line))
 return components,list(dict.fromkeys(issues))
INVENTORY_RECORDS={}
def toc_inventory(doc,pages,first_table_page):
 pattern={
  'iv':re.compile(r'^\s*\d+\s+(A\.[\w.-]+)\s+(.*)'),
  'v':re.compile(r'^\s*([A-Z]\.\d+[a-z]?(?:\.[\w-]+)*)\s+(.*)'),
  'vi':re.compile(r'^\s*(\d+(?:\.[\w-]+){2,}[a-z]?)\s*(.*)')
 }[doc]
 start=next((i for i,p in enumerate(pages) if 'DAFTAR ISI' in p and 'AHSP' in p),0)
 records=[];current=None
 for page,text in enumerate(pages[start:first_table_page-1],start+1):
  if not re.search(r'(?:No\s+Kode|Kode\s+Uraian)',text,re.I):continue
  for line in text.splitlines():
   m=pattern.match(line)
   if m:
    if current:records.append(current)
    current={'code':m[1].rstrip('.'),'page':page,'lines':[]}
   if current:current['lines'].append(line)
 if current:records.append(current)
 out={};source_records=[]
 for r in records:
  raw='\n'.join(r['lines']);status=re.search(r'Normatif|Informatif',raw,re.I)
  if not status:continue
  u='';title=[]
  for line in r['lines']:
   parts=re.split(r'\s{2,}',line.strip());si=next((i for i,t in enumerate(parts) if t.lower() in ['normatif','informatif']),None)
   if si is not None and si>0 and not u:u=parts[si-1]
   left=line[:max(0,len(line)-len(line.lstrip()))+60]
   left=re.sub(r'^\s*(?:\d+\s+)?'+re.escape(r['code'])+r'\s*','',left)
   if not re.search(r'Normatif|Informatif|Kode|Satuan|Status|Tipe|DIVISI|^\s*-?\d+-?\s*$',left,re.I):title.append(left)
  norms={'Meter Kubik':'m³','Meter Persegi':'m²','Meter Panjang':'m','M2':'m²','M3':'m³','m2':'m²','m3':'m³',"m'":'m','m’':'m','Buah':'buah','Unit':'unit','Lumsum':'ls'}
  u=norms.get(u,u)
  if len(u)>25:u=''
  record=dict(code=r['code'],page=r['page'],title=clean(' '.join(title)) or 'AHSP '+r['code'],unit=u,sourceText=raw);out[r['code']]=record;source_records.append(record)
 INVENTORY_RECORDS[doc]=source_records
 return out
def main():
 verified=json.loads((DATA/'ahs-verified.json').read_text());catalog=[];audit=[]
 for doc in ['iv','v','vi']:
  pages=json.loads((DATA/f'{doc}.json').read_text());stream=[(p,line) for p,text in enumerate(pages,1) for line in text.splitlines()];starts=[i for i,(_,line) in enumerate(stream) if A.match(line)];inventory=toc_inventory(doc,pages,stream[starts[0]][0]);headings=[]
  for i,(p,line) in enumerate(stream):
   h=HEAD[doc].match(line)
   if h:headings.append((i,p,h[1],h[2]))
  for ordinal,start in enumerate(starts):
   stop=starts[ordinal+1] if ordinal+1<len(starts) else len(stream)
   ends=[j for j in range(start,min(stop,start+250)) if END.match(stream[j][1])]
   end=ends[0]+1 if ends else min(stop,start+160)
   hs=[h for h in headings if h[0]<start];h=hs[-1] if hs else None
   page=stream[start][0];code=h[2] if h else f'PDF-{page}-{ordinal+1}';title=h[3] if h else 'Analisis pada PDF halaman '+str(page)
   if h:
    for _,line in stream[h[0]+1:min(start,h[0]+10)]:
     if not line.strip():continue
     if re.search(r'No\.?|Koefisien|KUANTITAS|KOMPONEN|Harga|URAIAN|KODE',line,re.I):break
     if re.match(r'^\s{10,}\S',line) and not re.match(r'^\s*[-–]?\s*\d+\s*[-–]?\s*$',line):title+=' '+line.strip()
   context=stream[max(0,start-25):start];cols=columns(context)
   components,issues=parse_components(stream[start:end],cols)
   if 'UNIT PEKERJAAN' in stream[start][1].upper():issues.append('Analisis gabungan: komponen adalah harga pekerjaan lain; periksa biaya umum agar tidak berganda')
   if not ends:issues.append('Akhir tabel melewati batas deteksi')
   u=unit(title)
   if doc=='v' and h:
    # The assumption sheet prints the final payment unit explicitly before its cost table.
    for _,line in reversed(stream[h[0]:start]):
     m=re.search(r'(?:Rp\.|Volume pekerjaan\s*:).*?(?:/|\d[,.]\d+)\s*([A-Za-z0-9³²\x27]+)\s*$',line)
     if m:u={'M3':'m³','M2':'m²',"M'":'m','M':'m','Buah':'buah','BUAH':'buah'}.get(m[1],m[1]);break
   if not u and code in inventory and inventory[code]['unit']:u=inventory[code]['unit']
   if sum(r['code']==code for r in INVENTORY_RECORDS[doc])>1:issues.append('Kode berulang pada daftar isi; cocokkan satuan dan varian terhadap tabel sumber')
   if not u:issues.append('Satuan hasil perlu verifikasi')
   entry=dict(id=f'{doc}:table:{page}:{ordinal+1}',docId=doc,page=page,code=code,title=clean(title),unit=u,note='',components=components,extractionStatus='review' if issues or not components else 'extracted',issues=issues,tableOrdinal=ordinal+1,sourcePages=sorted(set(p for p,_ in stream[start:end])),sourceText='\n'.join(line for _,line in stream[max(0,start-12):end]))
   old=next((v for v in verified if v['docId']==doc and v['code']==code and v['page']==page),None)
   if not h:issues.append('Kode/judul sumber perlu verifikasi')
   if old:
    entry.update(old);entry['extractionStatus']='verified';entry['issues']=[]
   entry['note']=('Koefisien diperiksa pada sumber.' if entry['extractionStatus']=='verified' else 'Ekstraksi tabel sumber; periksa spesifikasi dan kondisi pelaksanaan.' if entry['extractionStatus']=='extracted' else 'Perlu verifikasi: '+'; '.join(entry['issues'][:4]))
   catalog.append(entry)
  normalize=lambda c:re.sub(r'\.([a-z])',r'\1',c,flags=re.I)
  table_codes={a['code'] for a in catalog if a['docId']==doc}
  aliases={normalize(a['code']):a for a in catalog if a['docId']==doc}
  for code,r in inventory.items():
   if code in table_codes:continue
   if normalize(code) in aliases:
    aliases[normalize(code)].setdefault('aliases',[]).append(code);continue
   body=next((h for h in headings if h[1]>r['page'] and normalize(h[2])==normalize(code)),None)
   if body:
    r['page']=body[1];r['title']=body[3];r['sourceText']='\n'.join(line for _,line in stream[body[0]:body[0]+100])
   catalog.append(dict(id=f'{doc}:toc:{code}',docId=doc,page=r['page'],code=code,title=r['title'],unit=r['unit'],note='Tercantum dalam daftar isi sumber; rincian/parameter perlu diperiksa pada PDF sebelum digunakan.',components=[],extractionStatus='reference',issues=['Rincian tabel belum terhubung ke kode daftar isi'],sourcePages=[r['page']],sourceText=r['sourceText']))
  occurrences=collections.Counter()
  for index,r in enumerate(INVENTORY_RECORDS[doc]):
   occurrences[r['code']]+=1
   if occurrences[r['code']]<=1:continue
   catalog.append(dict(id=f"{doc}:toc-variant:{index+1}",docId=doc,page=r['page'],code=r['code'],title=r['title'],unit=r['unit'],note='Varian daftar isi dengan kode berulang; cocokkan spesifikasi dan koefisien dengan tabel PDF sumber.',components=[],extractionStatus='reference',issues=['Kode berulang: varian harus dicocokkan dengan tabel sumber'],sourcePages=[r['page']],sourceText=r['sourceText']))
  audit.append(dict(docId=doc,pages=len(pages),sourceSha256=hashlib.sha256((DATA/f'{doc}.json').read_bytes()).hexdigest(),detectedTables=len(starts),catalogTables=sum(a['docId']==doc and 'tableOrdinal' in a for a in catalog),tocCodes=len(inventory),tocRows=len(INVENTORY_RECORDS[doc]),duplicateSourceCodes=[c for c,n in collections.Counter(r['code'] for r in INVENTORY_RECORDS[doc]).items() if n>1],tocRepresented=sum(any(a['docId']==doc and (a['code']==c or c in a.get('aliases',[])) for a in catalog) for c in inventory),missingTocCodes=[c for c in inventory if not any(a['docId']==doc and (a['code']==c or c in a.get('aliases',[])) for a in catalog)],statuses=dict(collections.Counter(a['extractionStatus'] for a in catalog if a['docId']==doc))))
 # Preserve curated special examples if the heading differs from the source table code.
 for old in verified:
  if not any(a['id']==old['id'] for a in catalog):catalog.append(dict(old,extractionStatus='verified',issues=[],sourcePages=[old['page']]))
 (DATA/'ahs-inventory.json').write_text(json.dumps(INVENTORY_RECORDS,ensure_ascii=False,separators=(',',':')))
 source={a['id']:a.pop('sourceText') for a in catalog if 'sourceText' in a};(DATA/'ahs-source.json').write_text(json.dumps(source,ensure_ascii=False,separators=(',',':')))
 (DATA/'ahs-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
 (DATA/'ahs-coverage.json').write_text(json.dumps(dict(schemaVersion=1,documents=audit,totalEntries=len(catalog),statuses=dict(collections.Counter(a['extractionStatus'] for a in catalog))),ensure_ascii=False,indent=2))
 print(json.dumps(audit,indent=2));print('entries',len(catalog))
if __name__=='__main__':main()
