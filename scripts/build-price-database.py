"""Publish a searchable source database, including unpriced resources and reasons.
The source-price table is NOT the set of approved automatic prices.
"""
import pathlib,json,sqlite3,hashlib,collections,sys,zipfile
repo=pathlib.Path(__file__).resolve().parents[1];root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/price-sources');out=repo/'public/data'
def load(p):return json.load(open(p))
manifest=load(root/'manifest.json');inventory=load(repo/'public/reports/inventaris-sumber-daya-harga.json')['resources'];published=load(out/'regional-price-catalog.json')
raw=load(root/'extracted-prices.json')+load(root/'journal-database-2025.json')['rows']
for n in ['reviewed-price-rows','jabar-wage-source-review','reviewed-regional-wages','official-wage-sources','provincial-material-sources','journal-reviewed-prices']:raw+=load(out/(n+'.json'))['rows']
if (root/'journal-database-2023.json').exists():raw+=load(root/'journal-database-2023.json')['rows']
raw+=[r['evidence'] for r in published['records']]
rows={}
for r in raw:
 key=hashlib.sha256(json.dumps([r['sourceId'],r['locator'],r['name'],r.get('specification'),r['unit'],r['sourcePrice'],r.get('sourceYear'),r['region'],r.get('subRegion'),r.get('matchUnit'),r.get('unitConversion'),r.get('matchNames')],ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:24]
 if key not in rows or r.get('reviewed'):rows[key]=r
file=root/'price-database.sqlite';file.unlink(missing_ok=True);db=sqlite3.connect(file)
db.executescript('''PRAGMA foreign_keys=ON;
CREATE TABLE sources(id TEXT PRIMARY KEY,title TEXT NOT NULL,url TEXT NOT NULL,source_type TEXT NOT NULL);
CREATE TABLE source_prices(row_key TEXT PRIMARY KEY,source_id TEXT NOT NULL REFERENCES sources(id),external_id TEXT,locator TEXT NOT NULL,page INTEGER,source_name TEXT NOT NULL,specification TEXT,unit TEXT NOT NULL,source_price REAL NOT NULL CHECK(source_price>0),source_year INTEGER,region TEXT,sub_region TEXT,source_locality TEXT,resource_group TEXT,reviewed INTEGER NOT NULL,tax_json TEXT,conversion_json TEXT,evidence_json TEXT);
CREATE INDEX source_price_name ON source_prices(source_name,unit);CREATE INDEX source_price_scope ON source_prices(region,sub_region,resource_group);
CREATE TABLE resources(identity TEXT PRIMARY KEY,name TEXT NOT NULL,unit TEXT NOT NULL,resource_group TEXT NOT NULL,occurrences INTEGER NOT NULL,codes_json TEXT,references_json TEXT);
CREATE TABLE prices(id TEXT PRIMARY KEY,identity TEXT NOT NULL REFERENCES resources(identity),region TEXT NOT NULL,sub_region TEXT NOT NULL,price REAL NOT NULL,basis_year INTEGER NOT NULL,source_year INTEGER,price_kind TEXT,source_id TEXT REFERENCES sources(id),source_locator TEXT,evidence_json TEXT,escalation_json TEXT,remarks TEXT,regional_reference_json TEXT,UNIQUE(identity,region,sub_region));
CREATE INDEX price_lookup ON prices(region,sub_region,identity);
CREATE VIEW unpriced_resources AS SELECT resources.* FROM resources WHERE NOT EXISTS(SELECT 1 FROM prices WHERE prices.identity=resources.identity);
CREATE VIEW ahs_price_lookup AS SELECT r.name,r.unit,r.resource_group,r.identity,p.region,p.sub_region,p.price,p.basis_year,p.source_year,s.title AS source_title,p.source_locator,p.price_kind,p.regional_reference_json,p.remarks FROM resources r LEFT JOIN prices p ON p.identity=r.identity LEFT JOIN sources s ON s.id=p.source_id;
CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
''')
for s in manifest:db.execute('INSERT INTO sources VALUES(?,?,?,?)',(s['id'],s['name'],'https://drive.google.com/file/d/'+s['id']+'/view',s['type']))
for key,r in rows.items():db.execute('INSERT INTO source_prices VALUES('+','.join('?'*18)+')',(key,r['sourceId'],r['id'],r['locator'],r.get('page'),r['name'],r.get('specification'),r['unit'],r['sourcePrice'],r.get('sourceYear'),r.get('region'),r.get('subRegion'),r.get('sourceLocality'),r.get('group'),int(bool(r.get('reviewed'))),json.dumps(r.get('tax'),ensure_ascii=False),json.dumps(r.get('unitConversion'),ensure_ascii=False),json.dumps({k:v for k,v in r.items() if k not in ['sourceTitle','sourceUrl','id','sourceId','locator','page','name','specification','unit','sourcePrice','sourceYear','region','subRegion','sourceLocality','group','reviewed','tax','unitConversion']},ensure_ascii=False,separators=(',',':'))))
for r in inventory:db.execute('INSERT INTO resources VALUES(?,?,?,?,?,?,?)',(r['identity'],r['name'],r['unit'],r['group'],r['occurrences'],json.dumps(r['codes']),json.dumps(r['references'])))
for r in published['records']:
 db.execute('INSERT INTO prices VALUES('+','.join('?'*14)+')',(r['id'],r['identity'],r['region'],r['subRegion'],r['price'],r['basisYear'],r['sourceYear'],r['priceKind'],r['evidence']['sourceId'],r['evidence']['locator'],json.dumps(r['evidence'],ensure_ascii=False),json.dumps(r['escalation'],ensure_ascii=False),r['remarks'],json.dumps(r.get('regionalReference'),ensure_ascii=False)))
summary=dict(preparedOn='2026-11-21',sourceDocuments=len(manifest),sourcePriceRows=len(rows),journal2025Rows=len(load(root/'journal-database-2025.json')['rows']),resourceIdentities=len(inventory),automaticPrices=len(published['records']),regionalReferences=sum(bool(r.get('regionalReference')) for r in published['records']),pricedIdentities=len({r['identity'] for r in published['records']}),byRegion=published['summary']['byRegion'],byGroup=dict(collections.Counter(r['group'] for r in published['records'])),limitations=['Source rows are retained observations/candidates, not all approved automatic prices.','All AHSP identities are registered, including identities with no compatible price.','Unknown specifications, scope, tax, OCR disagreements, incompatible units and missing indices remain pending.','Journal material/rental prices are preferred when compatible; local regulations are preferred for wages.','Lampung city reference and 8-hour conversion follow the user instruction; not represented as a province-wide survey.','Legacy material-in-labor or incomplete AHSP extraction identities require source review, not a fabricated wage.'])
for k,v in summary.items():db.execute('INSERT INTO metadata VALUES(?,?)',(k,json.dumps(v,ensure_ascii=False)))
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok';assert not db.execute('PRAGMA foreign_key_check').fetchall();db.commit();db.execute('VACUUM');db.close()
json.dump(summary,open(out/'price-database-summary.json','w'),ensure_ascii=False,indent=2)
register=load(out/'price-source-register.json')
for source in register['sources']:
 source['databaseRows']=sum(r['sourceId']==source['id'] for r in rows.values())
 source['automaticPrices']=sum(r['evidence']['sourceId']==source['id'] for r in published['records'])
 if source['id']=='1rvmzzOu7jzS_Gs-8pSvKFHBCIEURi-bR':source['ocrPagesRead']=125;source['status']='Pindai gambar: 125 halaman bahan wilayah relevan dibaca OCR perkolom; angka calon terpilih diperiksa OCR harga terpisah. Belum seluruh907 halaman.'
 if source['id'] in ['1qbSORmaGFiiX2wa6AQotEj4SbU1UFs4g','1Jbmu2apv6mlQct09PNR40dgUjmrqn6Kj']:
  source['ocrPagesRead']=93 if source['id'].startswith('1qb') else 322;source['status']='Pindai dibaca OCR; kualitas tabel belum mendukung kutipan harga yang dapat dipastikan. Tidak diklaim sebagai tarif upah siap pakai.'
json.dump(register,open(out/'price-source-register.json','w'),ensure_ascii=False,indent=2)
readme="Basis data harga AHSP · 21 November 2026\n\nSumber harga tidak sama dengan harga siap pakai. Tabel source_prices menyimpan kutipan/calon harga; tabel prices hanya pasangan sumber daya/wilayah yang dipilih untuk pengisian otomatis. Semua identitas AHSP tercatat dalam resources, termasuk yang belum memiliki harga.\n\nBuka price-database.sqlite menggunakan SQLite atau DB Browser for SQLite.\nContoh query:\nSELECT * FROM ahs_price_lookup WHERE region='Lampung' AND sub_region='Lampung';\nSELECT * FROM unpriced_resources;\nSELECT * FROM source_prices WHERE source_name LIKE '%Semen%';\n\nPrioritas: bahan/sewa dari jurnal yang kompatibel; upah dari peraturan daerah yang tersedia. Satuan/spec/wilayah berbeda tidak disamakan. Eskalasi, konversi, asumsi dan pajak tersimpan dalam evidence_json/escalation_json/remarks. Harga sebelum 2026 yang belum memiliki indeks sebanding tetap belum siap pakai. Tarif 2026 belum berarti survei resmi2026; lihat price_kind dan rujukannya.\n\nHarga dengan PPN tidak dinyatakan tetap diberi keterangan, bukan diklaim sebagai harga bersih. Acuan provinsi dibedakan dari harga lokal. Persetujuan pengguna21 November2026 membolehkan acuan bahan/alat wilayah terdekat dalam provinsi sama dengan label estimasi; bukan upah. Kolom prices.regional_reference_json menyimpan lokasi sumber dan target. Ongkos angkut serta kondisi pasar target perlu ditinjau sebelum anggaran final. Acuan Lampung menggunakan Bandar Lampung sesuai instruksi pengguna, 8jam/OH; upah bulanan/30hari. Tidak ada TKDN numerik yang dikarang.\n"
with zipfile.ZipFile(out/'price-database.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,content in [('price-database.sqlite',file.read_bytes()),('README.txt',readme.encode('utf-8')),('summary.json',json.dumps(summary,ensure_ascii=False,indent=2).encode('utf-8'))]:
  info=zipfile.ZipInfo(name,(2026,11,21,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,content)
print(json.dumps(summary,ensure_ascii=False,indent=2));print('SQLite bytes',file.stat().st_size,'ZIP bytes',(out/'price-database.zip').stat().st_size)
