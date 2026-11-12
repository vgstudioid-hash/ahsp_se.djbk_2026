// Source quantities are defaults, not prices. Conditional/project-specific quantities remain editable.
export const smkkRisks=['Kecil','Sedang','Tinggi'];
const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function riskQuantityText(text,risk){
 if(/Risiko\s+Sedang\/Besar/i.test(text))return text.replace(/Risiko\s+Sedang\/Besar\s*:/i,'').trim();
 const medium=text.match(/Risiko\s+Sedang\s*:\s*([\s\S]*?)(?=Risiko\s+Besar\s*:|$)/i),high=text.match(/Risiko\s+Besar\s*:\s*([\s\S]*)/i);
 return (risk==='Sedang'?medium?.[1]:risk==='Tinggi'?high?.[1]:null)?.trim()||text;
}
export function smkkDefaults(row,risk,settings={}){
 const key=row.sourceKey?.endsWith(':5.a.utama')||row.key==='5.a.utama'?'5.a.utama':row.sourceCode||row.key,small=risk==='Kecil',high=risk==='Tinggi',text=riskQuantityText(row.quantityText||'',risk),workers=settings.workers,months=settings.months,highway=Boolean(settings.highway);
 let volume=null,price=null,basis='Isi sesuai kebutuhan/IBPRP dan ketentuan sumber.',enabled=true;
 const set=(value,note)=>{volume=value;basis=note;};
 if(row.group==='8'||/tergantung|disesuaikan|jika|apabila|khusus/i.test(text+' '+row.name))enabled=false;
 if(/Jalan Bebas Hambatan/i.test(row.name)&&!highway)enabled=false;
 if(/^3\.a\./.test(key)&&/bekerja|peledakan|lubang|tepi/i.test(row.name))enabled=false;
 if(/ketinggian|dalam air|bahan kimia/i.test(row.name)&&row.group==='2')enabled=false;
 if(/^9\.(?:a|c)\.[234]$/.test(key)||/^9\.(?:e|k)\./.test(key))enabled=false;
 if(!row.unit)enabled=false;
 if(key==='1.a')set(6,'3 paket dokumen awal + minimal 3 paket pemutakhiran (kolom kuantitas sumber).');
 else if(key==='1.b')set(1,'Minimal 1 paket prosedur/IK; isi paket mengikuti kategori risiko sumber.');
 else if(key==='1.c')set(3,'Minimal 3 paket pelaporan sesuai definisi 1 buah pada sumber.');
 else if(key==='2.a'){const cap=small?25:high?100:50;set(positive(workers)?Math.ceil(workers/cap):1,`Minimal 1 kegiatan; peserta maksimal ${cap} orang per kegiatan.`);}
 else if(key==='2.b'){const cap=high?50:25,frequency=high?2:1;set(positive(months)&&positive(workers)?Math.ceil(workers/cap)*frequency*months:null,`${frequency} kegiatan/bulan × kelompok maksimal ${cap} pekerja × durasi bulan.`);}
 else if(key==='2.c'&&small)set(positive(months)?3*months:null,'Alokasi awal mengikuti batas maksimal 3 kegiatan/bulan × durasi; dapat dikurangi sesuai pelaksanaan.');
 else if(!small&&['2.c','2.d','2.e'].includes(key))set(positive(months)?(high?4:2)*months:null,`Minimal ${high?4:2} kegiatan/bulan × durasi bulan.`);
 else if(key==='2.g'&&!small)set(4,'Alokasi awal batas maksimal 4 kegiatan selama masa pelaksanaan; dapat disesuaikan.');
 else if(key==='2.l'&&!small)set(2,'2 papan informasi di lokasi pekerjaan.');
 else if(key==='5.a'&&small)set(positive(workers)&&positive(months)?Math.ceil(workers/60)*months:null,'1 petugas per 60 pekerja (dibulatkan ke atas) × durasi bulan.');
 else if(key==='5.a'&&!small)set(positive(months)?months:null,'1 Ahli muda KK/K3 Konstruksi × durasi bulan. Ahli utama/madya pada risiko besar dihitung terpisah.');
 else if(key==='5.a.utama'){enabled=positive(workers)?workers>100:true;set(positive(workers)&&positive(months)?(workers>100?months:0):null,'Tambahan 1 Ahli utama/madya untuk risiko Besar dengan jumlah pekerja >100 orang × durasi bulan.');}
 else if(key==='5.b'&&!small){const ratio=high?40:50;set(positive(workers)&&positive(months)?Math.ceil(workers/ratio)*months:null,`1 petugas per ${ratio} pekerja (berlaku kelipatan) × durasi bulan.`);}
 else if(key==='4.a'&&!small){set(1,'1 paket premi; nilai awal minimal 0,1% × nilai pekerjaan yang diasuransikan. Harga tetap dapat diubah.');price=positive(settings.insuredValue)?round(settings.insuredValue*.001):null;}
 else if(/^3\.b\./.test(key)&&small){set(positive(workers)?Math.min(25,workers):null,'Alokasi sesuai jumlah pekerja, dengan batas maksimal 25 buah/pasang pada sumber.');}
 else if(!small&&['3.b.1','3.b.5','3.b.11'].includes(key)){const max=key==='3.b.1'?100:50;set(high?(positive(workers)?Math.max(100,workers):100):(positive(workers)?Math.min(max,Math.max(25,workers)):25),high?'Minimal 100 buah/pasang; disesuaikan dengan jumlah pekerja.':`Minimal 25 dan maksimal ${max} buah/pasang sesuai sumber.`);}
 else if(key==='6.a'){set(small?(positive(workers)&&workers<26?1:null):high?4:2,small?'1 kotak P3K Tipe A untuk tenaga kerja kurang dari 26 orang.':'Pilihan awal kotak P3K Tipe A; sumber juga mengizinkan alternatif Tipe B/C. Dapat diubah.');}
 else if(small&&['7.b','7.c','7.e'].includes(key))set({'7.b':4,'7.c':3,'7.e':4}[key],'Jumlah seluruh jenis rambu yang disebutkan pada kolom kuantitas sumber.');
 else if(!small&&['7.b','7.c','7.e','7.f','9.e'].includes(key)){const values={'7.b':[6,10],'7.c':[8,12],'7.e':[8,15],'7.f':[12,24],'9.e':[2,4]};set(values[key][high?1:0],'Jumlah seluruh jenis barang/rambu pada ketentuan “masing-masing” sumber.');}
 else if(/^9\.(?:a|c)\.[1-4]$/.test(key))set(small?1:high?5:3,'Kuantitas awal dari kolom bersama APAR; pilih kelas yang diperlukan dan sesuaikan jumlahnya.');
 else if(/^9\.(?:e|k)\./.test(key))set(3,'Ketentuan kelompok: pengujian sebelum, sedang, dan setelah pelaksanaan; pilih pengujian yang dibutuhkan.');
 else if(key==='9.i'&&!small)set(positive(months)?Math.ceil(months/12):null,'Minimal 1 audit internal setiap tahun pelaksanaan.');
 else if(key==='9.c'&&small)set(positive(workers)?Math.min(25,workers):null,'Kartu identitas sesuai jumlah pekerja, maksimal 25 buah.');
 else if(key==='9.h'&&!small)set(high?(positive(workers)?Math.max(100,workers):100):(positive(workers)?Math.min(50,workers):null),high?'Minimal 100 kartu; disesuaikan pekerja.':'Alokasi sesuai pekerja, maksimal 50 kartu.');
 else if(row.unit==='Org-Bln'){
  const m=text.match(/minimal\s*(\d+)\s*(?:\([^)]*\)\s*)?orang/i);set(m&&positive(months)?Number(m[1])*months:null,'Jumlah personel pada ketentuan risiko × durasi bulan.');
 }else if(!/tergantung|disesuaikan|maksimal|masing-masing|atau/i.test(text)){
  const m=text.match(/(?:minimal|sekurangnya|minimal terpasang)\s*(\d+(?:[.,]\d+)?)|^(\d+)\s*(?:\([^)]*\)|Ls|buah)|dilakukan\s*(\d+)\s*kali/i);
  if(m)set(Number((m[1]||m[2]||m[3]).replace(',','.')),'Mengikuti kuantitas minimum/frekuensi tertulis pada sumber.');
 }
 if(highway){const highwayVolumes={'2.j':8,'6.j':12,'7.o':1000,'7.p':20,'9.g':36};if(key in highwayVolumes){enabled=true;set(highwayVolumes[key],'Kuantitas khusus Jalan Bebas Hambatan sesuai sumber.');}
  if(high){const map={'2.k':10000,'7.f':96,'7.i':500,'7.j':20,'7.m':200};if(key in map)set(map[key],'Kuantitas khusus Jalan Bebas Hambatan sesuai sumber.');}
  if(key==='5.f')set(positive(months)?12*months:null,'12 flagman × durasi bulan untuk Jalan Bebas Hambatan.');
  if(key==='5.j'){enabled=true;set(positive(months)?2*months:null,'2 personel KMKL × durasi bulan untuk Jalan Bebas Hambatan.');}
  if(key==='5.k'){enabled=true;set(null,'Isi kebutuhan Staf KMKL sesuai organisasi lapangan × durasi bulan.');}
 }
 if(row.unit.toLowerCase()==='buah'&&volume!=null)volume=Math.ceil(volume);
 return {volume,price,quantityBasis:basis,enabled};
}
export function createSmkkRows(templates,risk,settings={}){
 if(!smkkRisks.includes(risk))throw Error('Pilih risiko Kecil, Sedang atau Tinggi.');
 const table=templates.tables[risk==='Kecil'?'small':'mediumHigh'];
 const rows=table.rows.map(row=>({...row,sourceKey:`${table.sourceTable}:${row.key}`,sourceTable:table.sourceTable,sourcePage:row.page,sourceGroup:row.group,sourceGroupTitle:row.groupTitle,id:crypto.randomUUID(),...smkkDefaults(row,risk,settings)}));
 if(risk==='Tinggi'){
  const junior=rows.find(r=>r.sourceCode==='5.a');if(junior){const senior={...junior,key:'5.a.utama',sourceCode:'5.a',sourceKey:table.sourceTable+':5.a.utama',name:'Ahli utama/madya KK/K3 Konstruksi (tambahan untuk >100 pekerja)',id:crypto.randomUUID()};rows.splice(rows.indexOf(junior)+1,0,{...senior,...smkkDefaults(senior,risk,settings)});}
 }
 return rows;
}
export function updateSmkkDefaults(rows,risk,settings){
 return rows.map(row=>{if(!row.sourceKey)return row;const next=smkkDefaults(row,risk,settings);return {...row,...(!row.manualVolume?{volume:next.volume}:{}),...(!row.manualPrice?{price:next.price}:{}),...(!row.manualEnabled?{enabled:next.enabled}:{}),quantityBasis:next.quantityBasis};});
}