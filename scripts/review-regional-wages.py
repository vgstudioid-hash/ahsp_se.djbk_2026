import json,pathlib,re,copy
root=pathlib.Path(__file__).resolve().parents[1];data=root/'public/data'
p=json.load(open(data/'bps-wage-proxies.json'));bek=p['proxies'][0]
urls={
'jabar':'https://jabar.bps.go.id/id/pressrelease/2026/11/02/170359/oktober-2026-jawa-barat-mengalami-inflasi-tahunan-year-on-year-sebesar-2-90-persen-dengan-indeks-harga-konsumen-ihk-sebesar-112-69.html',
'bandung':'https://bandungkota.bps.go.id/id/pressrelease/2026/11/02/173660/oktober-2026-inflasi-year-on-year-y-on-y-kota-bandung-sebesar-2-95-persen.html',
'jakarta':'https://jakarta.bps.go.id/id/pressrelease/2026/11/02/170358/perkembangan-indeks-harga-konsumen-provinsi-dki-jakarta-oktober-2026.html',
'banten':'https://banten.bps.go.id/id/pressrelease/2026/11/02/170363/inflasi-year-on-year-y-on-y-provinsi-banten-pada-oktober-2026-tercatat-sebesar-2-76-persen.html',
'lampung':'https://lampung.bps.go.id/id/pressrelease/2026/11/02/170377/oktober-2026-inflasi-year-on-year-y-on-y-provinsi-lampung-mengalami-inflasi-sebesar-3-83-persen.html'}
p['proxies']=[bek]
scopes=[('Jawa Barat',s,'jabar',2.31,'Jawa Barat') for s in ['Purwakarta','Karawang','Kab. Bekasi','Kab. Bogor','Indramayu','Subang']]+[('Jawa Barat','Kota Bandung','bandung',2.18,'Kota Bandung'),('Jakarta','Jakarta','jakarta',1.91,'DKI Jakarta'),('Banten','Banten','banten',1.81,'Banten'),('Lampung','Lampung','lampung',2.86,'Lampung')]
for region,sub,key,percent,label in scopes:
 p['proxies'].append(dict(region=region,subRegion=sub,sourceYear=2025,basisYear=2026,method='regional-cpi-wage-proxy',series='IHK umum '+label+' (2022=100), inflasi tahun kalender',percent=percent,basePeriod='Desember 2025 (konvensi tarif tahunan 2025 berlaku sampai akhir tahun)',targetPeriod='Oktober 2026',url=urls[key],sourceTitle='BRS Perkembangan Indeks Harga Konsumen '+label+', Oktober 2026; 2 November 2026',pages=[2],quote='Tingkat inflasi year to date sebesar '+str(percent).replace('.',',')+' persen.',limitation='Proksi biaya hidup untuk estimasi anggaran upah, bukan indeks upah konstruksi atau tarif resmi 2026. Tarif tahunan sumber 2025 diperlakukan berlaku sampai akhir 2025. '+('IHK provinsi dipakai sebagai proksi untuk kabupaten; harga dasar tetap tarif kabupaten masing-masing.' if key=='jabar' else 'Tidak digunakan untuk bahan atau wilayah lain.')))
json.dump(p,open(data/'bps-wage-proxies.json','w'),ensure_ascii=False,indent=2)
rows=[];fid='13otiSlyWtwwPdRkdaxIrAKQiWRQU4Fdu'
def add(region,page,n,name,price,unit='OH',aliases=None):
 r=dict(id=f'jurnal44-2025-wage-{page}-{n}',sourceId=fid,sourceTitle='Jurnal Harga Bangunan Edisi-44-2025.pdf',sourceUrl='https://drive.google.com/file/d/'+fid+'/view',locator=f'PDF {page} / cetak {page-1} / baris {n}',page=page,name=name,matchNames=aliases or [name],specification=name,unit=unit,sourcePrice=price,sourceYear=2025,region=region,subRegion=region,group='Tenaga kerja',tax={'included':False,'basis':'Catatan sumber: belum termasuk PPN.'},reviewed=True,extraction='Nama, satuan, harga dan catatan diperiksa visual pada PDF sumber.')
 rows.append(r)
banten=[('Pekerja',150000),('Tukang',160000),('Tukang Aluminium',160000),('Tukang Batu',160000),('Tukang Kayu',160000),('Tukang Besi',160000),('Tukang Besi Profil',160000),('Tukang Cat',160000),('Tukang Las Konstruksi',160000),('Tukang Listrik',160000),('Tukang Pipa',160000),('Tukang Instalasi Unit AC',125000),('Kepala Tukang',168000),('Mandor',179200),('Operator Alat Berat',191800),('Pembantu Operator',173600)]
for i,(n,v) in enumerate(banten,1):add('Banten',284,i,n,v)
for i,(n,v) in enumerate([('Pekerja',21420),('Tukang Batu',22850),('Mandor',25600),('Operator Alat Berat',27400),('Pembantu Operator',24800)],17):add('Banten',284,i,n,v,'jam')
jakarta=[('Pekerja/ Kenek',195000),('Tukang Gali',205150),('Kepala Tukang Batu',223300),('Tukang Batu',205147),('Kepala Tukang Kayu',222950),('Tukang Kayu',205150),('Kepala Tukang Besi',223300),('Tukang Besi',205150),('Kepala Tukang Cat',223300),('Tukang Cat',205150),('Tukang Aspal',205150),('Mandor',235885),('Instalator',223300),('Pembantu Instalator',205150),('Tukang Babat Rumput',195000),('Kepala Tukang Pasang Pipa/Ledeng',205150),('Tukang Pasang Pipa',195000),('Operator Alat Berat',235885),('Pembantu Operator Alat Berat',205150),('Tukang Las',205250)]
for i,(n,v) in enumerate(jakarta,1):add('Jakarta',302,i,n,v,aliases=['Pekerja','Kenek'] if i==1 else None)
# Explicit provisional classification; never match by shared code L.02 alone.
trades=['Tukang Aluminium','Tukang Batu','Tukang Kayu','Tukang Besi','Tukang besi beton','Tukang Cat','Tukang Kaca','Tukang tembok','Tukang Pelitur']
for r in json.load(open(data/'jabar-wage-source-review.json'))['rows']:
 if r['matchNames']!=['Tukang']:continue
 a=copy.deepcopy(r);a['id']+=':trade-estimate';a['matchNames']=trades;a['mappingBasis']='Estimasi klasifikasi ke tarif kelompok Tukang setempat. Sumber tidak merinci keahlian; bukan survei tarif khusus aluminium/batu/kayu/besi/cat/kaca/tembok/pelitur.';rows.append(a)
# User instruction, 21 November 2026: 8 working hours/OH; monthly wages /30 days.
# Bandar Lampung is explicitly disclosed as a representative planning reference,
# not misrepresented as a province-wide surveyed tariff.
lampung=[('Pekerja',18500),('Tukang',26000),('Mandor',33000),('Operator',37000),('Pembantu Operator',23000),('Sopir',29000),('Pembantu Sopir',22000),('Mekanik',37000),('Pembantu Mekanik',23000),('Kepala Tukang',30000)]
for i,(name,value) in enumerate(lampung,1):
 add('Lampung',240,i,name,value,'OJ')
 r=rows.pop();r['tax']={'included':True,'basis':'Catatan sumber: termasuk inflasi, pajak dan keuntungan; tidak ada rincian yang dapat dipisahkan. Upah acuan bruto dipertahankan, bukan dianggap upah bersih.'}
 r['mappingBasis']='Estimasi acuan Lampung menggunakan Kota Bandar Lampung, sesuai instruksi pengguna 21 November 2026. Bukan survei atau tarif resmi seluruh kabupaten Lampung. Harga bruto sumber termasuk inflasi, pajak dan keuntungan; komponen tersebut tidak dirinci.'
 r['sourceLocality']='Kota Bandar Lampung';r['conversionAuthorizedBy']='Pengguna, 21 November 2026: 1 OH = 8 jam; upah bulanan /30 hari.'
 rows.append(r)
 h=copy.deepcopy(r);h['id']+=':OH';h['matchUnit']='OH';h['unitConversion']={'factor':8,'from':'OJ','to':'OH','reason':'Konversi asumsi pengguna: harga per orang/jam × 8 jam kerja per OH (bukan jam kerja yang tercetak pada sumber)'};h['hoursPerDay']=8;h['hoursBasis']='Asumsi pengguna, bukan pernyataan sumber';rows.append(h)
 if name=='Tukang':
  for base in [r,h]:
   a=copy.deepcopy(base);a['id']+=':trade-estimate';a['matchNames']=trades;a['fallbackOnly']=True;a['mappingBasis']+=' Estimasi klasifikasi ke tarif kelompok Tukang; sumber tidak merinci keahlian aluminium/batu/kayu/besi/cat/kaca/tembok/pelitur.';rows.append(a)
json.dump(dict(schemaVersion=1,reviewedOn='2026-11-21',rows=rows),open(data/'reviewed-regional-wages.json','w'),ensure_ascii=False,indent=2)
