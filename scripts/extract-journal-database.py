"""Read complete relevant 2025 journal tables by column positions.
Never infer a blank price, erase a product specification, or turn equipment purchase
prices into rental prices. Retain the original row and bounding box for review.
"""
import json,re,pathlib,sys,statistics
import fitz
root=pathlib.Path(next((a for a in sys.argv[1:] if not a.startswith('--')),'/workspace/price-sources'))
year=2023 if '--year=2023' in sys.argv else 2025
fid='1rvmzzOu7jzS_Gs-8pSvKFHBCIEURi-bR' if year==2023 else '13otiSlyWtwwPdRkdaxIrAKQiWRQU4Fdu';doc=fitz.open(root/(fid+'.pdf'));rows=[];rejected=[]
# Scope is taken from the actual journal heading, not a neighboring city.
sections=[('Lampung','Lampung','Kota Bandar Lampung',241,247,'Bahan',325,405),('Lampung','Lampung','Kota Bandar Lampung',248,248,'Peralatan',325,405),('Banten','Banten','Provinsi Banten',285,298,'Bahan',410,480),('Banten','Banten','Provinsi Banten',299,301,'Peralatan',410,480),('Jakarta','Jakarta','DKI Jakarta',303,350,'Bahan',410,480),('Jakarta','Jakarta','DKI Jakarta',351,355,'Peralatan',410,480),('Jawa Barat','Kota Bandung','Kota Bandung',357,378,'Bahan',410,480),('Jawa Barat','Kota Bandung','Kota Bandung',379,379,'Peralatan',390,460),('Jawa Barat','Karawang','Kabupaten Karawang',396,419,'Bahan',410,480)]
if year==2023:
 sections=[('Banten','Banten','Provinsi Banten',345,368,'Bahan',352,407),('Jakarta','Jakarta','DKI Jakarta',373,430,'Bahan',352,407),('Jawa Barat','Kota Bandung','Kota Bandung',437,451,'Bahan',352,407),('Jawa Barat','Karawang','Kabupaten Karawang',490,493,'Bahan',352,407),('Jawa Barat','Indramayu','Kabupaten Indramayu',495,518,'Bahan',352,407)]
def number(raw):
 s=re.sub(r'\s+','',raw).strip('|[]{}')
 if not re.fullmatch(r'\d+(?:\.\d{3})*(?:,\d{1,2})?',s):return None
 v=float(s.replace('.','').replace(',','.'));return v if 0<v<1e13 else None
def join(words):return ' '.join(w[4] for w in sorted(words,key=lambda w:(round(w[1]/2),w[0])))
for region,sub,locality,start,end,group,ux,px in sections:
 for page in range(start,end+1):
  p=doc[page-1];words=p.get_text('words')
  if year==2023:
   block=json.load(open(root/'journal-2023-ocr'/(str(page)+'.columns-v2.json')))
   if not block['words']:
    rejected.append({'page':page,'reason':block.get('reason','No OCR words')});continue
   words=block['words'];ux,px,right=block['bounds']
  pw=[w for w in words if px<=(w[0]+w[2])/2<(right if year==2023 else 548) and 75<w[1]<760]
  # Adjacent digit fragments in the same printed price are combined, not a row number.
  clusters=[]
  for w in sorted(pw,key=lambda w:(w[1],w[0])):
   hit=next((c for c in clusters if abs(c[0][1]-w[1])<1.7),None)
   if hit is None:clusters.append([w])
   else:hit.append(w)
  anchors=[]
  for c in clusters:
   raw=' '.join(w[4] for w in sorted(c,key=lambda w:w[0]));v=number(raw)
   if v is not None:anchors.append((statistics.median((w[1]+w[3])/2 for w in c),v,raw,c))
  anchors.sort()
  for i,(cy,v,raw,pwords) in enumerate(anchors):
   prev=anchors[i-1][0] if i else cy-20;nxt=anchors[i+1][0] if i+1<len(anchors) else cy+20
   lo=max(cy-13,(prev+cy)/2);hi=min(cy+13,(nxt+cy)/2)
   same=lambda w:lo<=(w[1]+w[3])/2<hi
   nw=[w for w in words if 90<=(w[0]+w[2])/2<ux and same(w)];uw=[w for w in words if ux<=(w[0]+w[2])/2<px and same(w)]
   name=join(nw).strip('|[]{} _- ');unit=join(uw).strip('|[]{} _- ');label=join([w for w in words if 60<=(w[0]+w[2])/2<90 and same(w)])
   if not name or not unit or re.search(r'HARGA|SATUAN|termasuk|Catatan|Provinsi|Journal',name+' '+unit,re.I):
    rejected.append({'page':page,'price':v,'name':name,'unit':unit,'reason':'Incomplete row/header'});continue
   if not re.fullmatch(r"[\w²³^ /.,'’-]{1,24}",unit):continue
   # Row recognition only; no claim of manual visual review of every OCR row.
   r=dict(id=f'{fid}:p{page}:y{cy:.2f}',sourceId=fid,sourceTitle='Jurnal Harga Bangunan Edisi-42-2023.pdf' if year==2023 else 'Jurnal Harga Bangunan Edisi-44-2025.pdf',sourceUrl=f'https://drive.google.com/file/d/{fid}/view',locator=f'PDF {page} / cetak {page-(11 if year==2023 else 1)} / baris {label or i+1} / y={cy:.2f}',page=page,name=name,specification=name,unit=unit,sourcePrice=v,sourceYear=year,region=region,subRegion=sub,sourceLocality=locality,group=group,tax={'included':False,'basis':'Catatan wilayah jurnal menyatakan belum termasuk PPN.'} if region!='Lampung' and sub not in ('Karawang','Indramayu') else {'included':True,'effectivePercent':10 if year==2023 else 11,'basis':('Catatan wilayah 2023: termasuk pajak 10%, keuntungan/overhead15% dan inflasi2%; pajak10% dikeluarkan, margin lainnya dipertahankan karena merupakan harga kutipan.' if year==2023 else 'Catatan wilayah: termasuk inflasi, pajak dan keuntungan; komponen pajak tidak dirinci. Asumsi barang nonmewah PPN efektif11% untuk estimasi sebelum PPN.')},extraction='PDF OCR word columns, original row retained; exact identity/units and independent price OCR required before automatic use',bbox=[90,round(min(w[1] for w in nw+pwords),2),548,round(max(w[3] for w in nw+pwords),2)],rawPrice=raw,sourceRowLabel=label,reviewed=False,priceKind='rental' if group=='Peralatan' else 'material')
   if region=='Lampung':r['mappingBasis']='Estimasi acuan Lampung dari Kota Bandar Lampung sesuai instruksi pengguna; bukan survei seluruh provinsi. Harga sumber memuat inflasi, pajak dan keuntungan yang tidak dirinci.'
   rows.append(r)
json.dump({'schemaVersion':1,'rows':rows,'rejected':rejected},open(root/('journal-database-'+str(year)+'.json'),'w'),ensure_ascii=False,indent=2)
from collections import Counter
print(json.dumps({'rows':len(rows),'byScope':dict(Counter(r['region']+'/'+r['subRegion']+'/'+r['group'] for r in rows)),'rejected':len(rejected)},indent=2))
