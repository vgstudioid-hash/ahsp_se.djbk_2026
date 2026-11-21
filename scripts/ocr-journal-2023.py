"""OCR every relevant 2023 material table, retaining word coordinates and images."""
import fitz,pathlib,concurrent.futures,subprocess,os,json
root=pathlib.Path('/workspace/price-sources');fid='1rvmzzOu7jzS_Gs-8pSvKFHBCIEURi-bR';out=root/'journal-2023-ocr';out.mkdir(exist_ok=True)
pages=list(range(345,369))+list(range(373,431))+list(range(437,452))+list(range(490,494))+list(range(495,519))
def work(n):
 f=out/(str(n)+'.clean.tsv')
 if not f.exists():
  d=fitz.open(root/(fid+'.pdf'));d[n-1].get_pixmap(matrix=fitz.Matrix(2,2)).save(str(out/(str(n)+'-2.png')))
  from PIL import Image
  import numpy as np
  from scipy.ndimage import binary_opening
  image=Image.open(out/(str(n)+'-2.png')).convert('L');a=np.asarray(image).copy();ink=a<160;grid=binary_opening(ink,structure=np.ones((1,75),bool))|binary_opening(ink,structure=np.ones((75,1),bool));a[grid]=255;Image.fromarray(a).save(out/(str(n)+'-clean.png'))
  env=dict(os.environ,OMP_THREAD_LIMIT='1');r=subprocess.run(['tesseract',str(out/(str(n)+'-clean.png')),'stdout','--psm','6','tsv'],capture_output=True,text=True,env=env,check=True);f.write_text(r.stdout)
 return n
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for i,n in enumerate(pool.map(work,pages),1):
  if i%20==0:print(f'OCR2023 {i}/{len(pages)} pages',flush=True)
print(json.dumps({'pages':len(pages),'complete':True}))
