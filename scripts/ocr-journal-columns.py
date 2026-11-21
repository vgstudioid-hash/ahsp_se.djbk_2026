"""Read scanned journal columns separately so grid lines do not merge cells."""
import pathlib,concurrent.futures,subprocess,os,json,io,csv
import fitz,numpy as np
from scipy.ndimage import binary_opening
from PIL import Image
root=pathlib.Path('/workspace/price-sources');folder=root/'journal-2023-ocr';pages=list(range(345,369))+list(range(373,431))+list(range(437,452))+list(range(490,494))+list(range(495,519))
def work(n):
 target=folder/(str(n)+'.columns-v2.json')
 if target.exists():return n
 original=np.asarray(Image.open(folder/(str(n)+'-2.png')).convert('L'));ink=original<160;vertical=binary_opening(ink,structure=np.ones((100,1),bool)).sum(axis=0);active=np.where((vertical>max(vertical)*.22)&(np.arange(len(vertical))>600)&(np.arange(len(vertical))<1110))[0];runs=[]
 for x in active:
  if not runs or x>runs[-1][-1]+3:runs.append([x])
  else:runs[-1].append(x)
 bounds=[float(np.mean(r))/2 for r in runs]
 if len(bounds)<3:target.write_text(json.dumps({'words':[],'reason':'Column boundaries could not be determined','bounds':bounds}));return n
 ux,px,right=bounds[-3:]
 if not (260<ux<460 and 25<px-ux<120 and 35<right-px<130):target.write_text(json.dumps({'words':[],'reason':'Ambiguous column geometry','bounds':bounds}));return n
 clean=Image.open(folder/(str(n)+'-clean.png'));words=[];env=dict(os.environ,OMP_THREAD_LIMIT='1')
 for role,x0,x1 in [('name',90,ux),('unit',ux,px),('price',px,right)]:
  stream=io.BytesIO();clean.crop((int(x0*2+3),100,int(x1*2-3),1540)).save(stream,format='PNG')
  r=subprocess.run(['tesseract','stdin','stdout','--psm','6','tsv'],input=stream.getvalue(),capture_output=True,env=env,check=True)
  for w in csv.DictReader(io.StringIO(r.stdout.decode()),delimiter='\t',quoting=csv.QUOTE_NONE):
   if not (w.get('text') or '').strip():continue
   x=int(w['left'])/2+x0+1.5;y=int(w['top'])/2+50;width=int(w['width'])/2;height=int(w['height'])/2;words.append([x,y,x+width,y+height,w['text'],w['block_num'],w['line_num'],w['word_num']])
 target.write_text(json.dumps({'words':words,'bounds':[ux,px,right]}));return n
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for i,n in enumerate(pool.map(work,pages),1):
  if i%25==0:print(f'Column OCR {i}/{len(pages)}',flush=True)
