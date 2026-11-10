"""Extract Lampiran III tables by physical PDF cell coordinates; retain source requirements."""
from pathlib import Path
import fitz,json,re,hashlib
ROOT=Path(__file__).resolve().parents[1]
def clean(x):return re.sub(r'\s+',' ',x or '').strip()
def extract(start,end):
 doc=fitz.open(ROOT/'public/documents/iii.pdf');rows=[];group='';group_title='';section='';current=None;groups={};seen=set()
 for page in range(start,end+1):
  p=doc[page-1]
  for table in p.find_tables().tables:
   for row,values in zip(table.rows,table.extract()):
    fields=['']*8
    for rect,text in zip(row.cells,values):
     if not rect or not text:continue
     key=(page,tuple(round(v,1) for v in rect));
     if key in seen:continue
     seen.add(key);x0,y0,x1,y1=rect
     slot=0 if x0<85 else 1 if x0<(102 if start==30 else 109) else 2 if x0<293 else 3 if x0<357 else 4 if x0<485 else 5 if x0<591 else 6 if x0<726 else 7
     fields[slot]+=' '+clean(text)
    fields=list(map(clean,fields));major,mark,name,unit,quantity,price,acceptance,evidence=fields
    if re.fullmatch(r'[1-9][.]?',major):
     group=major.rstrip('.');group_title=clean(mark+' '+name);groups[group]=group_title;section='';current=None;continue
    if not group or major in ['NO','NO.','I'] or 'SATUAN' in unit or 'RINCIAN BIAYA' in name:continue
    if re.match(r'[A-I]$',mark) and re.search(r'Sub\s*total',name,re.I):current=None;continue
    nested=re.match(r'^(\d+)\)\s*(.*)',name)
    if nested:mark=nested[1]+')';name=nested[2]
    if mark and re.fullmatch(r'[a-z][.]?',mark):section=mark.rstrip('.')
    if mark and re.fullmatch(r'\d+\)',mark):code=f'{group}.{section}.{mark[:-1]}'
    else:code=f'{group}.{section}'
    if name and (unit or quantity) and not re.search(r'^(III|UKURAN|SATUAN)',unit) and not (not unit and re.search(r'antara lain|yaitu|:$',name,re.I)):
     current={'key':code,'group':group,'groupTitle':group_title,'name':name,'unit':unit,'quantityText':quantity,'acceptance':acceptance,'evidence':evidence,'page':page,'pages':[page]};rows.append(current)
    elif name and mark and not unit:
     # A subdivision label is not a payable row.
     current=None
    elif current:
     for key,text in [('name',name),('unit',unit),('quantityText',quantity),('acceptance',acceptance),('evidence',evidence)]:
      if text:current[key]=clean(current[key]+' '+text)
     if any([name,unit,quantity,acceptance,evidence]) and page not in current['pages']:current['pages'].append(page)
 counts={}
 for r in rows:
  r['sourceCode']=r['key'];counts[r['key']]=counts.get(r['key'],0)+1
  if counts[r['key']]>1:r['key']+='~'+str(counts[r['key']])
 return {'sourceTable':'III.1' if start==30 else 'III.2','startPage':start,'endPage':end,'groups':groups,'rows':rows}
small=extract(30,38);large=extract(39,73)
result={'schemaVersion':1,'sourceDocument':'iii','pdfSha256':hashlib.sha256((ROOT/'public/documents/iii.pdf').read_bytes()).hexdigest(),'tables':{'small':small,'mediumHigh':large}}
(ROOT/'public/data/smkk-templates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
for key,t in result['tables'].items():
 print(key,len(t['rows']),len(set(x['key'] for x in t['rows'])),t['groups'])
 for r in t['rows']:print(r['key'],r['name'],'|',r['unit'],'|',r['quantityText'][:160])
