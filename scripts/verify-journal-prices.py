"""Independently re-read price-column images; disagreement stays pending."""
import pathlib,json,re,concurrent.futures,subprocess,os
import fitz,sys
root=pathlib.Path('/workspace/price-sources');year=2023 if '--year=2023' in sys.argv else 2025;rows=json.load(open(root/('journal-exact-matches'+('-2023' if year==2023 else '')+'.json')));cache=root/('journal-ocr-checks-'+str(year)+('-columns-clean' if year==2023 else '-clean'));cache.mkdir(exist_ok=True);fid='1rvmzzOu7jzS_Gs-8pSvKFHBCIEURi-bR' if year==2023 else '13otiSlyWtwwPdRkdaxIrAKQiWRQU4Fdu';pages=sorted({r['page'] for r in rows})
def work(n):
 path=cache/(str(n)+'.tsv')
 if not path.exists():
  d=fitz.open(root/(fid+'.pdf'));p=d[n-1];bounds=json.load(open(root/'journal-2023-ocr'/(str(n)+'.columns-v2.json')))['bounds'] if year==2023 else None;p.get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(bounds[1] if bounds else 475 if n>281 else 405,65,bounds[2] if bounds else 548,760)).save(str(cache/(str(n)+'.png')))
  from PIL import Image
  import numpy as np
  from scipy.ndimage import binary_opening
  a=np.asarray(Image.open(cache/(str(n)+'.png')).convert('L')).copy();ink=a<160;grid=binary_opening(ink,structure=np.ones((1,60),bool))|binary_opening(ink,structure=np.ones((100,1),bool));a[grid]=255;Image.fromarray(a).save(cache/(str(n)+'-clean.png'))
  env=dict(os.environ,OMP_THREAD_LIMIT='1');result=subprocess.run(['tesseract',str(cache/(str(n)+'-clean.png')),'stdout','--psm','6','-c','tessedit_char_whitelist=0123456789.,','tsv'],capture_output=True,text=True,env=env,check=True);path.write_text(result.stdout)
 text=path.read_text();vals=[]
 import csv,io
 for word in csv.DictReader(io.StringIO(text),delimiter='\t',quoting=csv.QUOTE_NONE):
  raw=(word.get('text') or '').strip()
  if re.fullmatch(r'\d+(?:\.\d{3})*(?:,\d{1,2})?',raw):
   vals.append((float(raw.replace('.','').replace(',','.')),65+(int(word['top'])+int(word['height'])/2)/3))
 return n,vals
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=dict(pool.map(work,pages))
for r in rows:
 r['priceImageCheck']={'engine':'Tesseract eng, independent 216 dpi price-column raster','page':r['page'],'agrees':any(value==r['sourcePrice'] and abs(y-float(r['locator'].rsplit('y=',1)[1]))<=6 for value,y in checks[r['page']])};r['reviewed']=r['priceImageCheck']['agrees']
json.dump({'schemaVersion':1,'rows':rows},open(root/('journal-image-checked'+('-2023' if year==2023 else '')+'.json'),'w'),ensure_ascii=False,indent=2)
print(json.dumps({'candidateRows':len(rows),'independentlyConfirmed':sum(r['reviewed'] for r in rows),'pages':len(pages)}))
