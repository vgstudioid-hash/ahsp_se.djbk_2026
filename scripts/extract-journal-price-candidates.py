"""Extract OCR candidates only. Reviewed rows are maintained separately; these are never auto-approved."""
import json,re,sys,pathlib
import fitz
root=pathlib.Path(sys.argv[1]);fid='13otiSlyWtwwPdRkdaxIrAKQiWRQU4Fdu'
rows=[r for r in json.load(open(root/'extracted-prices.json')) if r['sourceId']!=fid]
meta=next(r for r in json.load(open(root/'manifest.json')) if r['id']==fid)
doc=fitz.open(root/(fid+'.pdf'))
units=r'(?:m[23²³]?|M[23²³]?|kg|Kg|KG|bh|Bh|Buah|buah|liter|Liter|ltr|lembar|Lembar|Batang|batang|Unit|unit|set|Set|roll|Roll|zak|Zak|OH|Orang / Hari|org/hr|jam|Jam)'
pattern=re.compile(r'(?m)^([0-9][0-9 ]{0,3})\s*\n([^\n]+(?:\n[^\n]+){0,2}?)\s*\n('+units+r')\s*\n([\d][\d .,]*)(?=\n)')
for region,sub,start,end in [('Banten','Banten',285,298),('Jakarta','Jakarta',303,350),('Jawa Barat','Kota Bandung',357,378)]:
 for page in range(start,end+1):
  text=doc[page-1].get_text()
  for m in pattern.finditer(text):
   name=m[2].replace('\n',' ').strip();raw=re.sub(r'\s+','',m[4])
   if not re.fullmatch(r'\d+(?:\.\d{3})*(?:,\d+)?',raw):continue
   # Missing price must not consume the next row number, e.g. Air / ltr / 802 / Lem Kayu.
   after=text[m.end():].lstrip().splitlines()
   if len(raw)<=3 and after and not re.match(r'^\d',after[0]):continue
   price=float(raw.replace('.','').replace(',','.'))
   if price<=0:continue
   rows.append({'id':fid+':PDF '+str(page)+' baris '+m[1].strip(),'sourceId':fid,'locator':'PDF '+str(page)+' baris '+m[1].strip(),'page':page,'name':name,'specification':name,'unit':m[3],'sourcePrice':price,'sourceYear':2025,'region':region,'subRegion':sub,'sourceCode':'','group':'Bahan','sourceUrl':'https://drive.google.com/file/d/'+fid+'/view','sourceTitle':meta['name'],'tax':{'included':None,'basis':'Angka OCR dan catatan pajak harus diperiksa pada halaman sumber sebelum disetujui.'},'extraction':'OCR retained PDF text; requires visual verification'})
json.dump(rows,open(root/'extracted-prices.json','w'),ensure_ascii=False,indent=2)
print('Total rows including OCR candidates:',len(rows))
