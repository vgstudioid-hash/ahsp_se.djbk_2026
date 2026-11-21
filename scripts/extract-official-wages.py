"""Extract the statutory Jabar 2025 wage matrix, without treating Excel as law."""
import pathlib,json,re,copy
import fitz
root=pathlib.Path('/workspace/price-sources');out=pathlib.Path(__file__).resolve().parents[1]/'public/data';fid='1KXEj1gp7afNY_GGnOMWWmk6MRW7UgaQP';doc=fitz.open(root/(fid+'.pdf'))
regions={'Kota Bekasi':(24,0,0),'Kota Bandung':(24,0,1),'Kab. Bekasi':(25,0,1),'Karawang':(25,0,2),'Purwakarta':(25,0,3),'Kab. Bogor':(25,0,4),'Indramayu':(25,1,1),'Subang':(25,1,5)}
roles=['Pekerja','Tukang','Kepala Tukang','Mandor','Mekanik','Operator','Pembantu Operator','Supir Truk','Kenek Truk','Penjaga Malam'];rows=[]
for sub,(page,table,col) in regions.items():
 text=doc[page-1].get_text();numbers=[int(x.replace('.','')) for x in re.findall(r'(?m)^\s*(\d{3}\.\d{3})\s*$',text)]
 assert len(numbers)>=(table+1)*60,(page,len(numbers))
 for i,role in enumerate(roles):
  price=numbers[table*60+i*6+col]
  r=dict(id=f'{fid}:p{page}:table{table+1}:{i+1}:{col+1}',sourceId=fid,sourceTitle='Kepgub Jawa Barat No.900/Kep.239-BPKAD/2024 — SHS Tahun 2025',sourceUrl=f'https://drive.google.com/file/d/{fid}/view',locator=f'PDF {page}, Tabel 1.10 blok {table+1}, {sub}, {role}',page=page,name=role,matchNames=[role],specification=f'{sub}; 1 hari / 8 jam',unit='OH',sourcePrice=price,sourceYear=2025,region='Jawa Barat',subRegion=sub,group='Tenaga kerja',hoursPerDay=8,tax={'included':False,'basis':'Honorarium Non ASN langsung untuk pekerjaan fisik/konstruksi; tidak dikurangi PPN barang.'},reviewed=True,authority='regional-regulation',legalBasis='Kepgub Jawa Barat No.900/Kep.239-BPKAD/2024, Tabel1.10, PDF24–26',applicability='Honorarium Non ASN untuk pekerjaan fisik/konstruksi swakelola; acuan perencanaan, bukan otomatis tarif pasar kontraktor.',sourcePriority=0)
  rows.append(r);h=copy.deepcopy(r);h['id']+=':OJ';h['matchUnit']='OJ';h['unitConversion']={'factor':1/8,'reason':'Sumber Tabel1.10 menyatakan 1 OH / 8 jam; OH dibagi8 untuk OJ'};rows.append(h)
  if role=='Tukang':
   for base in [r,h]:
    a=copy.deepcopy(base);a['id']+=':trade-estimate';a['matchNames']=['Tukang Aluminium','Tukang Batu','Tukang Kayu','Tukang Besi','Tukang besi beton','Tukang Cat','Tukang Kaca','Tukang tembok','Tukang Pelitur','Tukang Listrik','Tukang Elektronik','Tukang Tanam'];a['mappingBasis']='Estimasi klasifikasi ke kelompok Tukang pada tarif daerah; sumber tidak merinci tarif keahlian ini.';rows.append(a)
json.dump({'schemaVersion':1,'rows':rows},open(out/'official-wage-sources.json','w'),ensure_ascii=False,indent=2)
print('Official Jabar wage source rows',len(rows))
