"""Find review candidates, never turn a generic material into a selected certified product."""
import json,re,sys,pathlib,datetime,unicodedata,collections
import openpyxl
root=pathlib.Path(sys.argv[1]);repo=pathlib.Path(__file__).resolve().parents[1];out=repo/'public/reports'
resources=json.load(open(out/'inventaris-sumber-daya-harga.json'))['resources']
fid='1_qjDaA6-J2_djYMIECnYMJfPgNMSmPrv';sheet=openpyxl.load_workbook(root/(fid+'.xlsx'),read_only=True,data_only=True).active
asof=datetime.datetime(2026,11,21);products=[];index=collections.defaultdict(set)
def norm(v):return re.sub(r'[^\w]+',' ',unicodedata.normalize('NFKC',str(v or '')).lower()).strip()
for i,r in enumerate(sheet.values,1):
 if i<=5 or not isinstance(r[10],(int,float)):continue
 expiry=r[11];valid=isinstance(expiry,datetime.datetime) and expiry>=asof
 product={'sourceRow':i,'manufacturer':str(r[3] or ''),'province':str(r[5] or ''),'product':str(r[6] or ''),'specification':str(r[7] or ''),'type':str(r[8] or ''),'brand':str(r[9] or ''),'tkdn':float(r[10]),'expires':expiry.date().isoformat() if isinstance(expiry,datetime.datetime) else str(expiry or ''),'validBySnapshotExpiry':valid,'certificateNumber':None}
 if not 0<=product['tkdn']<=100:continue
 n=norm(product['product']);product['_norm']=n;pos=len(products);products.append(product)
 for t in set(n.split()):index[t].add(pos)
results=[]
for c in resources:
 n=norm(c['name']);tokens=n.split();valid=[]
 if c['group']=='Tenaga kerja':status='Tidak berlaku sebagai persentase sertifikat produk: tenaga kerja/jasa'
 else:
  significant=[x for x in tokens if len(x)>=2 and not x.isdigit() and x not in ('dan','atau','dari','untuk','dengan','termasuk','buah','meter','of','the')]
  ids=set.intersection(*(index.get(x,set()) for x in significant[:2])) if significant else set()
  # Product descriptions must overlap a phrase, not just a code or percentage.
  for i in sorted(ids):
   p=products[i];pn=p['_norm'];phrase=' '.join(significant[:2])
   if not p['validBySnapshotExpiry'] or not phrase or phrase not in pn:continue
   valid.append({k:v for k,v in p.items() if k!='_norm'})
  status='Kandidat ditemukan; produk/produsen/sertifikat belum ditentukan' if valid else 'Belum ada kecocokan produk pasti; TKDN tidak diisi'
 results.append({'resourceId':c['id'],'identity':c['identity'],'name':c['name'],'group':c['group'],'unit':c['unit'],'status':status,'matchBasis':'Jenis produk dari kata awal; ukuran, merek, tipe dan sertifikat belum dikonfirmasi','tkdn':None,'candidateCount':len(valid),'candidates':valid[:10]})
summary={'spreadsheetProductRows':len(products),'validBySnapshotExpiry':sum(p['validBySnapshotExpiry'] for p in products),'resources':len(resources),'resourcesWithCandidates':sum(x['candidateCount']>0 for x in results),'confirmedTkdnAssignments':0,'labourNotProduct':sum(c['group']=='Tenaga kerja' for c in resources)}
data={'schemaVersion':1,'reviewDate':'2026-11-21','snapshotDate':'2025-01-06','sourceUrl':'https://drive.google.com/file/d/'+fid+'/view','officialSite':'https://tkdn.kemenperin.go.id/','officialSearchStatus':'Halaman /cari dan /sertifikat merespons HTTP 403; halaman utama dapat dibaca. Belum memverifikasi sertifikat terkini.','limitations':'Tanggal kadaluarsa berasal dari snapshot 2025, bukan pemeriksaan pencabutan atau pembaruan sertifikat terkini. Workbook tidak menyertakan nomor sertifikat. Kandidat bukan penetapan TKDN sumber daya generik. Tidak ada harga atau TKDN dipilih hanya karena kandidat tunggal.','summary':summary,'resources':results}
json.dump(data,open(out/'kandidat-tkdn-sumber-daya.json','w'),ensure_ascii=False,indent=2)
print(json.dumps(summary,indent=2))
