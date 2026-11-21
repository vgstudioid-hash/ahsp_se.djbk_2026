"""Extract local wage rows without guessing an undated workbook's price year.
An explicit --year is accepted only after the year is confirmed from its source/owner.
"""
import argparse,json,pathlib,re,csv,copy
import openpyxl
parser=argparse.ArgumentParser();parser.add_argument('source_directory');parser.add_argument('--year',type=int);args=parser.parse_args()
if args.year is not None and not 2000<=args.year<=2200:raise ValueError('Tahun harga tidak valid')
root=pathlib.Path(args.source_directory);repo=pathlib.Path(__file__).resolve().parents[1];fid='146vrCHoOF_3axqj17Ea8oW8eZyfqd552';w=openpyxl.load_workbook(root/(fid+'.xlsx'),read_only=True,data_only=True)
regions={'Kota Bekasi':'Kota Bekasi','Kota Bandung':'Kota Bandung','Kabupaten Bekasi':'Kab. Bekasi','Kabupaten Karawang':'Karawang','Kabupaten Purwakarta':'Purwakarta','Kabupaten Bogor':'Kab. Bogor','Kabupaten Indramayu':'Indramayu','Kabupaten Subang':'Subang'}
rows=[]
for sheet in w:
 for i,r in enumerate(sheet.values,1):
  if i==1 or not isinstance(r[7],(float,int)) or r[7]<=0:continue
  name=str(r[4] or '');spec=str(r[5] or '');m=re.fullmatch(r'Honorarium Non ASN Lainnya\s*-\s*(.+)',name,re.I)
  if not m:continue
  local=next((sub for label,sub in regions.items() if spec.startswith(label+' (')),None)
  if not local or not re.search(r'jam kerja\s*8\s*jam/hari',spec,re.I):continue
  unit=str(r[6] or '')
  if re.sub(r'\s','',unit).lower()!='orang/hari':continue
  rows.append({'id':fid+':'+sheet.title+':'+str(i),'sourceId':fid,'sourceTitle':'export_excel_sbu_Provinsi Jawa Barat (2).xlsx','sourceUrl':'https://drive.google.com/file/d/'+fid+'/view','locator':sheet.title+' baris '+str(i),'name':name,'matchNames':[m[1].strip()],'specification':spec,'unit':unit,'sourcePrice':r[7],'sourceYear':args.year,'region':'Jawa Barat','subRegion':local,'group':'Tenaga kerja','hoursPerDay':8,'sourceCode':r[3],'tax':{'included':False,'basis':'Upah tenaga kerja langsung per orang/hari, bukan harga pembelian barang.'},'reviewed':args.year is not None,'yearConfirmedBy':'Pengguna, percakapan 21 November 2026' if args.year else None,'yearStatus':'Dikonfirmasi pengguna/sumber' if args.year else 'Belum dikonfirmasi: workbook tidak mencantumkan tahun harga','fallbackOnly':True})
# Source explicitly defines 8 working hours per day. OJ is derived, never guessed.
hourly=[]
for r in rows:
 h=copy.deepcopy(r);h['id']+=':OJ';h['matchUnit']='OJ';h['unitConversion']={'factor':1/8,'from':r['unit'],'to':'OJ','reason':'Sumber menyatakan 8 jam kerja per orang/hari'};hourly.append(h)
rows.extend(hourly)
json.dump({'schemaVersion':1,'sourceYear':args.year,'rows':rows},open(repo/'public/data/jabar-wage-source-review.json','w'),ensure_ascii=False,indent=2)
with open(repo/('public/reports/upah-jawa-barat-sumber-'+str(args.year or 'belum-dikonfirmasi')+'.csv'),'w',encoding='utf-8-sig',newline='') as f:
 out=csv.writer(f,delimiter=';');out.writerow(['Sumber daya','Region','Sub Region','Harga sumber per OH','Jam per OH','Satuan pencocokan','Faktor konversi satuan','Tahun harga','Status tahun','Dokumen sumber','Baris'])
 for r in rows:out.writerow([r['matchNames'][0],r['region'],r['subRegion'],r['sourcePrice'],r['hoursPerDay'],r.get('matchUnit','OH'),r.get('unitConversion',{}).get('factor',1),r['sourceYear'] or '',r['yearStatus'],r['sourceTitle'],r['locator']])
print(json.dumps({'rows':len(rows),'sourceYear':args.year,'mandorKotaBekasi':[r for r in rows if r['subRegion']=='Kota Bekasi' and r['matchNames']==['Mandor']]},ensure_ascii=False,indent=2))
