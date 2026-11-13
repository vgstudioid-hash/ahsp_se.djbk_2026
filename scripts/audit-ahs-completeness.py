"""Independent, conservative row reconciliation against retained PDF layout text.
Writes a correction overlay, never overwrites source catalogue/PDF evidence.
"""
import json,re,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'public/data';R=ROOT/'public/reports';R.mkdir(exist_ok=True)
CAT=json.loads((D/'ahs-catalog.json').read_text());SRC=json.loads((D/'ahs-source.json').read_text())
UNITS=r"OH|OJ|m[23²³’']?|M[123’']?|kg|Kg|KG|ton|Ton|buah|Buah|bh|BH|unit|Unit|jam|Jam|hari|Hari|liter|Liter|Ltr|ltr|Ls|ls|LS|Lot|lot|set|Set|lembar|Lembar|Lbr|lbr|batang|Btg|pohon|nos|tube|Gulung|gulung|pasang|paket|Paket|rol|Roll|titik|ha|cm"
TOKEN=r"(?:\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)"
ROW=re.compile(r'^(?P<prefix>.*?)\s{2,}(?P<unit>'+UNITS+r')\s{2,}(?P<coef>'+TOKEN+r')(?=\s|$)')
GROUP=re.compile(r'^\s*([ABCD])\.?\s+(TENAGA(?:\s+KERJA)?|PEKERJA|BAHAN(?:\s*/\s*MATERIAL)?|PERALATAN|ALAT|LAIN(?:-LAIN)?)(?:\s*[*\d)]*)\s*$',re.I)
END=re.compile(r'^\s*[DEFG]\.?\s+(?:JUMLAH|BIAYA|OVERHEAD|HARGA)',re.I)
CODE=re.compile(r'(?:^|\s)\(?([LMEPTB](?:[.\d])[\w.+/\-]*)\)?\s*$',re.I)
clean=lambda s:re.sub(r'\s+',' ',s).strip()
def value(s,comma=False):return float(s.replace('.','').replace(',','.')) if ',' in s or (comma and re.fullmatch(r'[1-9]\d{0,2}(?:\.\d{3})+',s)) else float(s)
def comp_sig(c):return (c['group'],clean(c['name']).lower(),c['unit'].lower(),c['coefficient'],c.get('code',''))
def parse(text,page):
 groups={};current=None;seen=False
 body=text.splitlines();start=next((i for i,l in enumerate(body) if GROUP.match(l) and GROUP.match(l)[1]=='A'),len(body));stop=next((i for i in range(start+1,len(body)) if END.match(body[i])),len(body));tokens=[m['coef'] for l in body[start:stop] if (m:=ROW.match(l))];comma=any(',' in t for t in tokens);dot_decimal=any(t.startswith('0.') or ('.' in t and ',' not in t and len(t.split('.')[-1])!=3) for t in tokens)
 for line in text.splitlines():
  m=GROUP.match(line)
  if m:
   if m[1]=='A':
    if seen:break
    seen=True
   if not seen:continue
   current={'A':'Tenaga kerja','B':'Bahan','C':'Peralatan','D':'Lain-lain'}[m[1]];groups.setdefault(current,{'rows':[],'uncertain':[]});continue
  if not seen:continue
  if END.match(line):break
  if not current:continue
  g=groups[current]
  if not line.strip() or re.search(r'JUMLAH\s+HARGA|^\s*-\s*$|^\s*\d+\s*$|^\s*\(\d\)\s*$',line,re.I):continue
  m=ROW.match(line)
  if m:
   if re.fullmatch(r'[1-9]\d{0,2}(?:\.\d{3})+',m['coef']) and not comma and not dot_decimal:g['uncertain'].append('Pemisah angka ambigu: '+line.strip());continue
   prefix=clean(m['prefix']);prefix=re.sub(r'^\d+[.)]?\s+','',prefix);code='';cm=CODE.search(prefix)
   if cm:code=cm[1].strip('()');prefix=prefix[:cm.start()].strip()
   if not prefix or len(prefix)>180 or not re.search(r'[A-Za-z]',prefix):g['uncertain'].append(line.strip());continue
   g['rows'].append(dict(group=current,name=prefix,unit=m['unit'],coefficient=value(m['coef'],comma),code=code,sourceCoefficient=m['coef'],sourcePage=page));continue
  # Any unassigned descriptive line can be a continuation or a missed resource.
  if re.search(r'[A-Za-z]',line) and not re.search(r'^\s*(?:No\.?|Uraian|Kode|Satuan|Koefisien|Catatan|\(Rp)',line,re.I):g['uncertain'].append(line.strip())
 return groups
corrections={};audit=[]
for a in CAT:
 text=SRC.get(a['id'],'');parsed=parse(text,a['page']);changes=[];unknown=[]
 if a['extractionStatus']=='reference' and not parsed:
  status='Rujukan: rincian belum terhubung';unknown=['Entri belum memiliki rincian tabel yang dapat direkonsiliasi.']
 else:
  updated=list(a['components']);reliable=0
  for group,g in parsed.items():
   if g['uncertain']:unknown.extend(g['uncertain']);continue
   if not g['rows']:continue
   reliable+=1;old=[c for c in a['components'] if c['group']==group];new=g['rows']
   if [comp_sig(c) for c in old]!=[comp_sig(c) for c in new]:
    # Curated verified rows remain manual ground truth; report any discrepancy.
    if a['extractionStatus']=='verified':unknown.append('Perbedaan dengan entri terverifikasi: '+group);continue
    changes.append({'group':group,'before':old,'after':new,'sourceLines':[line for line in text.splitlines() if ROW.match(line)]})
    at=next((i for i,c in enumerate(updated) if c['group']==group),len(updated));updated=[c for c in updated if c['group']!=group];updated[at:at]=new
  # Multi-page attribution is ambiguous; retain findings but do not auto-apply.
  if changes and len(a.get('sourcePages',[a['page']]))!=1:unknown.append('Tabel lebih dari satu halaman; perbedaan dilaporkan untuk pemeriksaan.');changes=[]
  if changes:
   corrections[a['id']]={'components':updated,'reason':'Rekonsiliasi baris bernama, bersatuan dan berkoefisien numerik pada teks tata letak PDF sumber.','groups':[c['group'] for c in changes]}
  status='Dikoreksi terhadap baris sumber' if changes else 'Perlu pemeriksaan sumber' if unknown or not a['components'] else 'Baris terdeteksi cocok / tidak ada koreksi pasti'
 audit.append({'id':a['id'],'docId':a['docId'],'page':a['page'],'code':a['code'],'title':a['title'],'beforeCount':len(a['components']),'afterCount':len(corrections.get(a['id'],{}).get('components',a['components'])),'status':status,'changes':changes,'unresolved':unknown,'originalIssues':a.get('issues',[])})
summary={'catalog':len(CAT),'componentsBefore':sum(len(a['components']) for a in CAT),'componentsAfter':sum(r['afterCount'] for r in audit),'correctedAhs':len(corrections),'changedGroups':sum(len(r['changes']) for r in audit),'statuses':dict(collections.Counter(r['status'] for r in audit))}
(D/'ahs-corrections.json').write_text(json.dumps({'schemaVersion':1,'summary':summary,'entries':corrections},ensure_ascii=False,separators=(',',':')))
(R/'audit-kelengkapan-ahs.json').write_text(json.dumps({'summary':summary,'entries':audit},ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False,indent=2))
