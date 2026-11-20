"""Extract retained, user-authorized price documents without inventing missing rows.
Usage: python3 scripts/extract-price-sources.py /workspace/price-sources
"""
import json,sys,re,hashlib,pathlib,unicodedata
import fitz,openpyxl
root=pathlib.Path(sys.argv[1]);out=pathlib.Path(__file__).resolve().parents[1]/'public/data';manifest=json.load(open(root/'manifest.json'))
byid={r['id']:r for r in manifest};prices=[];register=[]
def text(words,x0,x1,y0,y1):
 selected=[w for w in words if x0<=(w[0]+w[2])/2<x1 and y0<=(w[1]+w[3])/2<y1]
 lines={}
 for w in selected:lines.setdefault((w[5],w[6]),[]).append(w)
 return ' '.join(' '.join(w[4] for w in sorted(ws,key=lambda w:w[0])) for ws in sorted(lines.values(),key=lambda ws:min(w[1] for w in ws)))
def number(s):
 s=re.sub(r'\s+','',str(s)).replace('Rp','').strip()
 if not re.fullmatch(r'\d+(?:\.\d{3})*(?:,\d+)?',s):return None
 return float(s.replace('.','').replace(',','.'))
def add(fid,location,name,spec,unit,price,year,region,sub,tax,code='',extra=None):
 if not name or not unit or price is None or price<=0:return
 r={'id':fid+':'+str(location),'sourceId':fid,'locator':str(location),'name':name.strip(),'specification':spec.strip(),'unit':unit.strip(),'sourcePrice':price,'sourceYear':year,'region':region,'subRegion':sub,'tax':tax,'sourceCode':code,'sourceUrl':'https://drive.google.com/file/d/'+fid+'/view','sourceTitle':byid[fid]['name']}
 if extra:r.update(extra)
 prices.append(r)
# Column coordinates are verified against retained PDF word positions, not inferred prices.
configs=[('1Aoyp4xmG2LTwSArkigUKrTf0WnO69Eti','Jawa Barat','Karawang',2026,{'code':(55,140),'name':(140,237),'spec':(237,418),'unit':(418,479),'price':(479,558)},5,{'included':True,'effectivePercent':11,'basis':'Pasal 3 ayat (1), PDF hal. 3; barang/jasa nonmewah: PPN 12% × DPP 11/12. Upah tenaga kerja langsung tidak dikenai PPN.'}),('1Mj6VV8UVmAVNH_FQPHZwLLu2BqhAQZyQ','Jawa Barat','Kota Bekasi',2026,{'code':(73,129),'name':(129,262),'spec':(262,460),'unit':(460,496),'price':(496,549),'tkdn':(549,591)},6,{'included':True,'effectivePercent':11,'basis':'Diktum KELIMA dan KETUJUH, PDF hal. 4; barang nonmewah PPN 12% × DPP 11/12. TKDN tercetak SSH belum dianggap sertifikat P3DN.'})]
for fid,region,sub,year,cols,start,tax in configs:
 d=fitz.open(root/(fid+'.pdf'));count=0
 for pi in range(start-1,len(d)):
  p=d[pi];words=p.get_text('words');anchors=[]
  for w in words:
   if cols['price'][0]<=(w[0]+w[2])/2<cols['price'][1] and w[1]>85 and number(w[4]) is not None:
    # All source prices are whole rupiah and are printed in a dedicated column.
    if '.' in w[4] or len(w[4])>=3:anchors.append(w)
  anchors.sort(key=lambda w:w[1])
  for i,a in enumerate(anchors):
   cy=(a[1]+a[3])/2;prev=(anchors[i-1][1]+anchors[i-1][3])/2 if i else cy-26;nxt=(anchors[i+1][1]+anchors[i+1][3])/2 if i+1<len(anchors) else cy+26
   y0=(prev+cy)/2;y1=(nxt+cy)/2
   fields={key:text(words,*bounds,y0,y1) for key,bounds in cols.items()}
   if not fields['unit'] or fields['unit'].lower() in ('satuan','tkdn','ssh'):continue
   if not fields['name'] or not fields['spec']:continue
   # Retain only complete structured rows; continuation text without its key is reviewed separately.
   if not re.fullmatch(r'\d(?:\.\d+){4,5}',fields['code']):continue
   extra={'printedTkdn':fields.get('tkdn',''),'extraction':'PDF word columns; price row anchor','page':pi+1}
   add(fid,'PDF '+str(pi+1)+' baris '+str(i+1),fields['name'],fields['spec'],fields['unit'],number(a[4]),year,region,sub,tax,fields['code'],extra);count+=1
 print(byid[fid]['name'],count,flush=True)
# Structured provincial Excel: region qualifiers are explicitly in each specification.
fid='1wR0gGXAz1GfFkpeFD8a-e-34wlnM2Nsh';w=openpyxl.load_workbook(root/(fid+'.xlsx'),data_only=True,read_only=True)
subs={'Kota Bandung':'Kota Bandung','Kabupaten Karawang':'Karawang','Kab. Karawang':'Karawang','Karawang':'Karawang','Kabupaten Purwakarta':'Purwakarta','Purwakarta':'Purwakarta','Kabupaten Bekasi':'Kab. Bekasi','Kab. Bekasi':'Kab. Bekasi','Kota Bekasi':'Kota Bekasi','Kabupaten Bogor':'Kab. Bogor','Kab. Bogor':'Kab. Bogor','Kabupaten Indramayu':'Indramayu','Indramayu':'Indramayu','Kabupaten Subang':'Subang','Subang':'Subang'}
for sh in w:
 for i,r in enumerate(sh.values,1):
  if i==1 or not isinstance(r[7],(float,int)) or r[7]<=0:continue
  spec=str(r[5] or '');found=[]
  for qualifier,sub in subs.items():
   if re.search(r'(?<!\w)'+re.escape(qualifier)+r'(?!\w)',spec,re.I):found.append((len(qualifier),sub,qualifier))
  if found:
   _,sub,qualifier=max(found);spec=re.sub(r'\s*[-,]?\s*'+re.escape(qualifier)+r'\s*$','',spec,flags=re.I).strip()
  else:sub=''
  add(fid,sh.title+' baris '+str(i),str(r[4] or ''),spec,str(r[6] or ''),float(r[7]),2025,'Jawa Barat',sub,{'included':None,'basis':'Berkas Excel tidak menyatakan perlakuan pajak; perlu konfirmasi sebelum pengisian otomatis.'},str(r[3] or ''),{'row':i,'sheet':sh.title,'commodityGroup':r[1]})
# Source register covers every uploaded document, including textless/scanned sources.
for r in manifest:
 f=root/(r['id']+'.'+r['type']);entry={**r,'url':'https://drive.google.com/file/d/'+r['id']+'/view','sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size,'extractedPriceRows':sum(x['sourceId']==r['id'] for x in prices)}
 if r['type']=='pdf':
  pages=json.load(open(root/(r['id']+'.pages.json')));entry.update(pages=len(pages),textCharacters=sum(map(len,pages)),status='Teks diekstrak; pencocokan belum lengkap' if any(pages) else 'Pindai gambar; memerlukan OCR dan pemeriksaan visual')
 else:entry['status']='Workbook dibaca'
 register.append(entry)
json.dump({'schemaVersion':1,'sources':register},open(out/'price-source-register.json','w'),ensure_ascii=False,indent=2)
json.dump(prices,open(root/'extracted-prices.json','w'),ensure_ascii=False,indent=2)
print('Total structured price rows:',len(prices),flush=True)
