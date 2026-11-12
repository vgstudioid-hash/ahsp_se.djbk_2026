# RAB Studio — AHSP SE DJBK 2026

Aplikasi penyusunan Rencana Anggaran Biaya (RAB) berbahasa Indonesia berdasarkan analisis dalam PDF SE DJBK No. 47 Tahun 2026 yang diunggah pengguna. Halaman utama adalah lembar perhitungan proyek. Pustaka PDF dipertahankan sebagai fitur pendukung pada `references.html`.

## Menjalankan

Memerlukan Node.js 20 atau lebih baru. Tidak ada dependensi eksternal, API berbayar, atau variabel rahasia.

```sh
cd /workspace/ahsp_se.djbk_2026
npm run dev -- --host 0.0.0.0 --port 3000
npm test
npm run build
```

Gunakan checkout yang ada; tugas cloud sudah terisolasi sehingga tidak perlu Git worktree. Proses server perlu dijalankan ulang pada sesi baru. Hasil build statis tersedia di `dist/`; seluruh path relatif mendukung GitHub Pages pada subdirektori repositori. `PORT` dapat digunakan untuk mengganti port server.

## Alur penyusunan RAB

1. Buka Informasi Umum, pilih Project Baru atau Impor Project, lalu lengkapi Nama Pekerjaan, MA, Sub MA, Unit Kerja, Tahun, dan Pagu Anggaran. Tombol Lanjut terkunci sampai seluruh isian valid.
2. Tambah lingkup pekerjaan atau klik **+ Tambah uraian pekerjaan**. Ketik uraian langsung, pilih AHS pada barisnya, lalu isi volume hasil pengukuran. Tingkat WBS A → 1 → a → • dapat dipilih pada kolom NO; nomor diperbarui mengikuti urutan baris.
3. Isi harga dasar upah, bahan, dan peralatan di menu Harga Dasar atau impor CSV. Daftar harga daerah/proyek pengguna masih menunggu unggahan; tidak ada harga contoh PDF yang dipakai otomatis.
4. Periksa rincian analisis dan sumber PDF. Kelola biaya penerapan SMKK pada bagian terakhir halaman AHS; nilainya tersambung ke lingkup level 1 di RAB.
5. Tinjau biaya umum/keuntungan dan persentase pajak efektif sesuai proyek, lalu ekspor CSV, cadangan JSON, atau cetak/simpan PDF.

Lembar RAB mengikuti tujuh kolom: **NO / WBS, URAIAN PEKERJAAN, VOLUME, SATUAN, HARGA SATUAN, JUMLAH HARGA, KETERANGAN**. Uraian dan keterangan dapat diketik langsung. Satuan dan harga satuan berasal dari AHS pilihan, sehingga mengganti AHS perlu diikuti pemeriksaan volume. Pemilihan AHS mempertahankan uraian, volume, WBS, dan keterangan pengguna. Tombol panah memindahkan urutan baris. Judul WBS tidak dihitung sebagai pekerjaan. Baris yang belum terhubung ke AHS membuat hasil berstatus DRAF. Format tujuh kolom dan keterangan yang sama digunakan pada CSV, cetak/PDF, serta cadangan JSON.

Perhitungan: biaya langsung AHS = jumlah (koefisien × harga dasar). Biaya umum/keuntungan = persentase × biaya langsung. Harga satuan = biaya langsung + biaya umum/keuntungan. Jumlah pekerjaan = volume × harga satuan. Nilai sebelum pajak = total pekerjaan + biaya SMKK. DPP = faktor DPP × nilai sebelum pajak. PPN/pajak = tarif × DPP. Total RAB = nilai sebelum pajak + PPN/pajak (DPP tidak menggantikan nilai pekerjaan). Komponen biaya, biaya umum/keuntungan, harga satuan, jumlah baris, SMKK, dan pajak dibulatkan ke dua desimal rupiah pada masing-masing tahap.

Biaya umum/keuntungan awal 10%. Proyek baru memakai DPP 11/12 dan PPN 12% (efektif 11% dari nilai sebelum pajak); tarif dan skema dapat diubah sesuai proyek. Proyek lama mempertahankan tarif langsung yang tersimpan sampai pengguna memilih preset DPP. SMKK tidak dikenai biaya umum/keuntungan kedua kali. Rekap kebutuhan sumber daya mengalikan koefisien dengan volume sebelum menggabungkan komponen dan belum memuat SMKK. Harga per OH, per jam, dan per hari dibedakan. Kode tenaga kerja yang sama tidak menyatukan jenis tukang berbeda.

## Form mengikuti workbook rujukan

Struktur form mengacu pada `RAB JEMBATAN MJM.xlsm` unggahan pengguna; rincian pemetaan ada di [docs/workbook-format.md](docs/workbook-format.md). Berkas dibaca tanpa menjalankan VBA/makro atau formula workbook.

- Identitas bersama: pemberi tugas, nama proyek, lokasi, koordinat, tahun proyek; jenis dokumen RAB/HPS dapat dipilih. Tanggal harga tetap terpisah dari tahun proyek.
- RAB tetap memakai tujuh kolom WBS yang dapat diedit, ditambah kepala form dan rekap biaya.
- AHS: NO, URAIAN, KODE, SATUAN, KOEFISIEN, HARGA SATUAN, JUMLAH HARGA. Kelompok A tenaga kerja, B bahan, C peralatan, D lain-lain mempunyai subtotal; E jumlah biaya langsung, F biaya umum/keuntungan, G harga satuan pekerjaan. Kode/harga komponen terhubung ke HSD.
- HSD: NO, URAIAN, KODE, SATUAN, HARGA SHB, HARGA SATUAN, KETERANGAN. Harga SHB adalah pembanding yang tidak otomatis mengubah harga satuan aktual. Kode dan keterangan dapat diedit. Metadata ikut disimpan di cadangan JSON serta CSV HSD (kolom kode, harga shb, harga, keterangan).
- Form AHS dan HSD dapat dicetak terpisah; cetak RAB juga menyertakan keduanya. Input diganti teks pada cetakan.

Angka harga/koefisien proyek 2025, diskon, formula pajak, pembulatan, dan konversi satuan pada workbook tidak diimpor otomatis. Kelompok Lain-lain tersedia untuk analisis manual; tidak menambahkan biaya baru pada template SE yang tidak memiliki komponen tersebut. Dasar volume kini tersedia pada menu Quantity; sheet VOLUME Excel tidak diimpor otomatis. JADWAL belum menjadi fitur aplikasi.

## Cakupan katalog AHSP SE DJBK 2026

Katalog mencakup **5.637 entri** yang diperoleh dari tabel analisis serta daftar isi Lampiran IV, V, dan VI. Semua kode yang terbaca pada daftar isi masing-masing lampiran terwakili; kode/varian sumber yang berulang tetap dicatat dalam inventaris. Jumlah entri bukan jumlah AHSP unik yang sudah tervalidasi.

| Lampiran | Kode unik daftar isi tercakup | Tabel analisis terdeteksi/tercakup |
| --- | ---: | ---: |
| IV — SDA | 1.544/1.544 | 1.273/1.273 |
| V — Bina Marga | 1.132/1.132 | 1.100/1.100 |
| VI — Cipta Karya | 2.816/2.816 | 2.817/2.817 |

**Status data:** 18 template diperiksa, 4.840 ekstraksi tabel numerik. 333 tabel memerlukan pemeriksaan/parameter. dan 446 rujukan sumber tanpa rincian koefisien lengkap yang terhubung. Cakupan kode bukan jaminan seluruh AHSP siap hitung tanpa pemeriksaan: sumber memuat rumus produktivitas, tabel gabungan, rujukan Peraturan Menteri PUPR 8/2023, dan ketidakseragaman kode. Nilai yang tidak tersedia tidak diganti nol atau koefisien rekaan.

Menu AHS dan pemilih AHS pada RAB mencari seluruh katalog, dengan filter bidang/status dan pemuatan bertahap 48 entri. Entri hasil ekstraksi/rujukan menampilkan koefisien serta teks sumber, lalu membuka form pemeriksaan untuk melengkapi atau mengoreksi data. Pengguna wajib menyatakan pemeriksaan seluruh komponen, satuan, asumsi dan koefisien sebelum menyimpan sebagai analisis manual pada proyek. Halaman rujukan, identitas baris RAB, uraian, volume dan Quantity dipertahankan saat menghubungkan hasil pemeriksaan. Harga contoh PDF tidak diimpor ke HSD.

Sumber data dan cara membangun ulang:

- `public/data/ahs-catalog.json`: katalog, komponen numerik dan status pemeriksaan.
- `public/data/ahs-verified.json`: 18 template yang sebelumnya diperiksa, dipertahankan sebagai acuan regresi.
- `public/data/ahs-inventory.json`: semua baris kode daftar isi, termasuk kode berulang dan teks sumber.
- `public/data/ahs-source.json`: bukti teks tabel/rujukan, dimuat hanya saat analisis dibuka.
- `public/data/ahs-coverage.json`: jumlah, status, serta hash teks sumber per lampiran; dapat diunduh dari aplikasi.
- `python3 scripts/extract-ahs.py`: ekstraksi deterministik dari indeks teks PDF unggahan; tidak mengeksekusi rumus dari dokumen.
- `npm test`: memeriksa keberadaan setiap tabel per halaman, seluruh kode inventaris, token koefisien lengkap, satuan/skema, serta kasus nama komponen multibaris.

Template contoh BM memakai asumsi pelaksanaan yang dijelaskan pada sumber; harga alat dapat sudah mencakup operator, BBM dan bahan habis pakai. Analisis gabungan yang memakai harga pekerjaan lain memerlukan pemeriksaan agar biaya umum tidak dikenakan dua kali.

## AHS Empiris

Tombol **+ AHS Empiris** tersedia pada menu Pilih AHS dan dialog pemilihan AHS per baris RAB. Gunakan untuk pekerjaan yang belum tersedia pada daftar. Kode selalu **Empiris** (dikunci), tanpa mengaitkan analisis dengan nomor halaman PDF SE. Isi uraian, satuan hasil, kelompok RAB, komponen/koefisien, dan dasar pengamatan atau asumsi produktivitas. Harga dasar dikelola melalui HSD. Pengguna dapat membuka rincian dan memilih **Ubah AHS Empiris** untuk mengubah koefisien; perubahan menghitung ulang RAB.

Analisis empiris tersimpan bersama proyek dan ikut pada cadangan, CSV, dan cetak/PDF dengan kode Empiris. Saat dibuat dari baris RAB, WBS, volume, keterangan, dan uraian yang telah diisi dipertahankan. Harga komponen empiris dipisahkan dari harga template SE, sehingga perubahan tidak mengubah harga pada analisis sumber. Analisis tidak dinyatakan sebagai AHS resmi dari SE.

## Insert / hapus komponen per sub-AHS

Pada rincian AHS proyek, setiap kelompok Tenaga Kerja, Bahan, Peralatan, dan Lain-lain memiliki tombol **+ Tambah** serta **−** untuk komponen terakhir kelompok. Tombol **−** pada masing-masing baris menghapus komponen tersebut. Form insert meminta uraian, kode opsional, satuan, koefisien, dan harga dasar opsional; harga kosong mengikuti HSD jika komponen sudah ada atau ditandai belum diisi. Minimal satu komponen harus dipertahankan pada AHS tersimpan. Form pembuatan/edit AHS manual dan Empiris juga memiliki tombol +/− per kelompok.

Penyesuaian berlaku pada salinan AHS dalam proyek, menghitung ulang subtotal A–D dan total RAB, serta menyimpan tanda **DISESUAIKAN** pada rincian/cetakan. Template katalog sumber tidak diubah. Harga HSD komponen yang dihapus tetap tersimpan agar tidak mengubah pekerjaan lain. Penambahan harga untuk komponen yang sama mengikuti mekanisme harga bersama proyek. Pratinjau katalog tidak menampilkan tombol perubahan; tambahkan AHS ke RAB terlebih dahulu. Penyesuaian tidak otomatis dinyatakan memenuhi ketentuan AHS normatif.

## Quantity — dasar volume pekerjaan

Menu **Quantity** menyimpan rincian pengukuran untuk setiap baris pekerjaan non-judul WBS. Tautan Quantity juga tersedia di kolom volume RAB. Pilih pekerjaan, tambah perhitungan, lalu isi dimensi dan faktor jumlah bagian.

- **Jumlah:** nilai jumlah × faktor, dalam satuan pekerjaan yang dipilih (misalnya buah, unit, titik, set).
- **Panjang:** panjang × faktor.
- **Luas:** persegi, persegi panjang, segitiga, trapesium, jajar genjang, belah ketupat, layang-layang, lingkaran, dan elips. Rumus dan label dimensi ditampilkan; tinggi adalah tinggi tegak lurus, radius adalah jari-jari, dan sumbu elips adalah setengah sumbu.
- **Volume:** balok, kubus, tabung, prisma segitiga, prisma trapesium, kerucut, dan bola.

Dimensi geometri dapat diisi dalam m, cm, atau mm. Sistem menghitung dalam m/m²/m³ lalu mengonversi hasil ke satuan RAB yang dikenali; cm²/cm³ dan mm²/mm³ juga didukung. Bentuk-bentuk dalam satu pekerjaan boleh berbeda, tetapi kategorinya harus sesuai satuan pekerjaan. Campuran panjang dengan luas/volume ditolak. Untuk satuan pekerjaan di luar dimensi panjang/luas/volume, gunakan Jumlah sesuai satuan tersebut; tidak ada konversi massa otomatis.

Setiap rincian mempunyai uraian/lokasi, bentuk, dimensi, faktor pengulangan, dan operasi Tambah/Kurangi. Pengurang dapat dipakai untuk bukaan. Hasil negatif tidak dapat diterapkan. Tombol **Terapkan ke volume RAB** mengaktifkan hubungan otomatis: perubahan rincian memperbarui volume dan biaya pekerjaan. Mengubah volume langsung pada RAB memutus hubungan otomatis, sambil mempertahankan rincian sebagai catatan. Penggantian AHS mempertahankan rincian; jika satuan tidak sesuai, hubungan dihentikan agar hasil tidak diterapkan ke satuan yang salah. Menghapus seluruh rincian yang terhubung mengubah volume menjadi 0.

Rincian ikut tersimpan di browser, cadangan JSON, ekspor Quantity CSV, dan cetak/PDF Quantity. Cetak RAB juga menyertakan backup Quantity. Impor cadangan dengan hubungan aktif menghitung ulang volume dari dimensinya; tidak mempercayai total yang ditulis dalam file. Hasil akhir dibulatkan ke 6 desimal sebelum masuk RAB; π memakai Math.PI. Maksimal 500 rincian per pekerjaan.

## Harga, penyimpanan, dan ekspor

- Proyek tersimpan di localStorage browser. Beberapa proyek dapat dibuat; tidak ada akun, server database, atau sinkronisasi antarperangkat. Cadangkan JSON secara berkala.
- Harga kosong berarti belum diisi; nol yang dimasukkan pengguna merupakan harga nol eksplisit. Item dengan harga kosong atau volume nol membuat hasil berstatus DRAF. Total parsial diberi label dan tidak disajikan sebagai harga satuan lengkap.
- Harga komponen digunakan bersama jika bidang, kelompok, nama, dan satuannya sama. Perubahan harga menghitung ulang seluruh pekerjaan terkait.
- Unduh template Harga Dasar CSV proyek. Pertahankan kolom `kunci`; isi `harga` tanpa pemisah ribuan, misalnya `150000` atau `150000,50`. Pemisah kolom `;` dan `,`, kutipan CSV, serta desimal koma/titik didukung. Impor divalidasi secara utuh sebelum diterapkan.
- File CSV/JSON dapat diunduh, diimpor, dan dicetak tanpa layanan eksternal. JSON impor dibuat menjadi proyek baru dan analisisnya ditandai manual untuk ditinjau, sehingga tidak menimpa proyek yang ada.
- Cetak mencakup tabel RAB, rincian SMKK, dan analisis tiap pekerjaan. Gunakan pilihan Save as PDF browser untuk menyimpan PDF. CSV dapat dibuka di aplikasi spreadsheet; formula pada teks ekspor dinonaktifkan dengan awalan apostrof.

Pustaka pendukung mempertahankan pencarian teks halaman, pembaca PDF, unduhan, dan penanda halaman lokal. Mode teks tidak menggantikan pemeriksaan tabel dan gambar pada PDF asli.

## Cakupan sumber

| Sumber | Status | Halaman PDF |
| --- | --- | ---: |
| Batang tubuh surat edaran | Tersedia | 13 |
| Lampiran I — Pengumpulan data HSP | Tersedia | 109 |
| Lampiran II — Acuan penyusunan AHSP | Tersedia | 85 |
| Lampiran III — Biaya penerapan SMKK | Tersedia | 74 |
| Lampiran IV — Sumber Daya Air | Tersedia (2 bagian digabung) | 1.689 |
| Lampiran V — Bina Marga | Tersedia | 3.125 |
| Lampiran VI — Cipta Karya | Tersedia (2 bagian digabung) | 1.563 |
| Lampiran VII — Pengajuan usulan AHSP | Tersedia | 42 |

Total: 8 PDF tersedia, 6.700 halaman sumber. Lampiran IV dan VI masing-masing diunggah sebagai dua bagian bernomor dan digabung menggunakan `pdfunite`. Bagian pertama keduanya berisi 800 halaman; bagian kedua dimulai pada halaman PDF 801. Penomoran cetak pada sambungan adalah 1080 → 1081 untuk Lampiran IV dan 5893 → 5894 untuk Lampiran VI. Semua halaman, termasuk halaman kosong, dipertahankan. Isi teks setiap halaman hasil gabungan diverifikasi sama dengan bagian sumbernya.

Nomor halaman pembaca mengikuti urutan fisik PDF, bukan nomor cetak. Halaman hasil pindai tanpa lapisan teks tidak terindeks; gunakan PDF asli. Hasil ekstraksi mempertahankan isi teks, tetapi bukan jaminan ketepatan tata letak tabel. Koefisien dan tabel harus diperiksa pada PDF asli sebelum digunakan. File Bina Marga memakai nama asli unggahan `5.-Lampiran-V-Bidang-Bina-Marga-ok.pdf`; header halaman pertamanya tidak mencantumkan nomor surat edaran. Pengelompokokan edisi mengikuti kumpulan unggahan pengguna, bukan verifikasi independen terhadap penerbit.

Enam PDF tunggal disalin tanpa modifikasi ke `public/documents/`. Dua lampiran terpisah digabung tanpa mengubah urutan halaman; file bagian asli tetap tersimpan di folder unggahan. Metadata ada di `public/data/documents.json`, termasuk nama bagian sumber, jumlah halaman, halaman awal, dan SHA-256 setiap bagian. Indeks teks JSON mengikuti urutan halaman PDF hasil gabungan. Tidak ada instruksi dalam PDF yang dieksekusi.

Untuk membangun ulang data dari folder PDF sumber (memerlukan Poppler `pdftotext`, `pdfinfo`, dan `pdfunite`):

```sh
python3 scripts/prepare-documents.py /path/to/source-pdfs
npm test
npm run build
```

Script memetakan nama asli PDF dan mengurutkan bagian berdasarkan akhiran `_(1).pdf`, `_(2).pdf`, dan seterusnya. Nomor yang hilang/duplikat, campuran PDF utuh dan bagian terpisah, serta satu bagian bernomor saja ditolak. Pastikan semua bagian sumber tersedia sebelum menjalankannya. Script tidak menjalankan OCR dan tidak menciptakan isi untuk dokumen yang tidak tersedia. Nama sumber di metadata dipertahankan untuk unduhan. Website berjalan tanpa CDN, API, atau layanan eksternal. `npm run build` menghasilkan artefak lokal; publikasi menggunakan perintah deploy di bawah.


## Deployment GitHub Pages

```sh
npm run deploy
```

Perintah ini membangun ulang website dan memublikasikan isi `dist/` ke cabang `gh-pages` melalui Git. Riwayat cabang deployment dipertahankan; tidak ada force push. Checkout sumber tidak dipindah dan tidak dibuat Git worktree. Tidak memerlukan token tambahan jika autentikasi Git platform sudah memiliki izin push.

Pada GitHub, buka **Settings → Pages**, pilih **Deploy from a branch**, cabang **gh-pages**, folder **/ (root)**, lalu **Save**. Aktivasi ini diperlukan sekali jika Pages belum aktif. Untuk repositori privat, ketersediaan Pages bergantung pada paket GitHub. Alamat standar setelah aktivasi adalah `https://vgstudioid-hash.github.io/ahsp_se.djbk_2026/`; push cabang deployment saja belum membuktikan situs sudah aktif.


## Koreksi tampilan WBS

Tombol **+ Lingkup Pekerjaan** membuat baris lingkup tanpa biaya, otomatis WBS tingkat 1. Uraian tingkat 1 disimpan dan ditampilkan dengan huruf kapital serta cetak tebal, termasuk saat cetak/PDF. WBS memakai A, B, C… (tingkat 1); 1, 2, 3… (tingkat 2); a, b, c… (tingkat 3); dan bullet • (tingkat 4). Nomor alfabet berlanjut ke AA/AB setelah Z.

Tombol **+** pada kolom nomor setiap baris menyediakan penyisipan lingkup di atas baris, uraian di bawah, atau sub-uraian satu tingkat lebih dalam. Penyisipan mempertahankan AHS, volume, Quantity, dan keterangan baris yang sudah ada.


## Lembar RAB ringkas dan Pengaturan Proyek

Lembar RAB langsung menampilkan daftar pekerjaan. Blok pengantar, form identitas yang besar, dan kartu ringkasan atas dipindahkan ke menu **Informasi Umum**. Nama proyek aktif tetap terlihat pada panel kecil yang dapat dilipat; buka **Kelola proyek** untuk memilih proyek, membuat proyek baru, mengimpor cadangan, atau menuju pengaturan. Tombol ekspor/cadangan/cetak tetap terlihat pada Lembar RAB.

Identitas, koordinat, tanggal harga, jenis dokumen, biaya umum/keuntungan, pajak, dan ringkasan statistik dikelola pada Informasi Umum. Kepala form RAB menampilkan identitas tersebut sebagai informasi dokumen (bukan form edit). Rekapitulasi biaya di bagian bawah Lembar RAB tetap tersedia. Pemindahan tampilan tidak menghapus data proyek, pekerjaan, AHS, HSD, atau Quantity.


## Urutan navigasi dan Rekapitulasi RAB

Sidebar aplikasi dan Pustaka mengikuti urutan:

1. Informasi Umum
2. Quantity Pekerjaan
3. Rekapitulasi RAB
4. Rencana Anggaran Biaya (RAB)
5. Analisa Harga Satuan (AHS)
6. Harga Satuan Dasar (HSD)
7. Dasar-dasar Perhitungan (Pustaka)

Rekapitulasi RAB menjumlahkan nilai pekerjaan di bawah setiap baris WBS tingkat 1 hingga lingkup berikutnya. Lingkup dengan nama sama tetap terpisah menurut posisinya. Pekerjaan sebelum lingkup pertama ditampilkan sebagai **Belum dikelompokkan ke lingkup** agar nilainya tetap masuk total. Subjudul WBS tingkat 2–4 tidak dihitung sebagai biaya atau lingkup baru. Lingkup kosong ditandai belum memiliki pekerjaan.

Jumlah lingkup sudah mencakup biaya umum/keuntungan AHS. SMKK tampil sebagai lingkup level 1 tersendiri dan termasuk jumlah seluruh lingkup; pajak ditambahkan satu kali pada tingkat proyek. Total akhir konsisten dengan Lembar RAB. Harga atau volume yang belum lengkap ditandai parsial/DRAF, tanpa menyembunyikan jumlah terhitung. Perubahan AHS, harga dasar, volume, dan Quantity langsung tercermin saat halaman rekap dibuka. Rekap dapat diekspor CSV atau dicetak/PDF. Rekap sumber daya tetap tersedia melalui tombol pada halaman HSD, tanpa menambah item sidebar. Navigasi bidang dan penanda Pustaka tersedia di tab dalam halaman Pustaka.


## Lanjut dan default DPP 11/12

Pada Informasi Umum tersedia tombol **Lanjut → Rencana Anggaran Biaya (RAB)** untuk menyimpan pengaturan dan membuka Lembar RAB. Keterangan awal pajak 0% dan kalimat tentang harga contoh yang dicoret pada koreksi pengguna telah dihapus dari form.

Proyek baru otomatis memakai skema DPP nilai lain **11/12** dengan tarif **PPN 12%**. Faktor DPP ditampilkan hanya-baca. Perhitungan: `nilai sebelum pajak = pekerjaan + SMKK`; `DPP = 11/12 × nilai sebelum pajak`; `PPN = 12% × DPP`; `total RAB = nilai sebelum pajak + PPN`. Masing-masing tahap dibulatkan dua desimal rupiah. Contoh nilai Rp1.200.000 menghasilkan DPP Rp1.100.000, PPN Rp132.000, dan total Rp1.332.000.

Skema dan tarif tersimpan dalam cadangan JSON. Proyek lama tanpa skema DPP dibaca sebagai tarif langsung atas 100% nilai sebelum pajak, sehingga nilai pajak sebelumnya tidak berubah otomatis. Tombol **Gunakan DPP 11/12 + PPN 12%** menerapkan default baru secara eksplisit pada proyek aktif. Pilihan skema 100%/tarif langsung tetap tersedia; tarif nol yang sengaja diisi juga dipertahankan. Label DPP dan PPN konsisten pada RAB, rekap, CSV, dan cetak/PDF.


## Tombol Lanjut dan versi aset

Pada Informasi Umum, satu tombol **Lanjut → Rencana Anggaran Biaya (RAB)** berada di kanan bawah form.

Build statis memberi penanda versi deterministik pada nama CSS dan seluruh modul JavaScript, termasuk dependensi dan worker pencarian. HTML menunjuk ke aset ber-versi; `dist/build-info.json` mencatat ID build dan pemetaan nama file. Jalur aset lama tetap tersedia selama perpindahan publikasi. Jika browser masih menampilkan HTML sebelumnya, buka `/?v=<buildId>#project` pada situs untuk mengambil HTML terbaru. Jangan menghapus data situs/localStorage karena proyek disimpan di sana.


## Informasi Umum — pilihan Project dan blangko wajib

Saat membuka **Informasi Umum**, pengguna melihat dua pilihan **Project Baru** dan **Impor Project**. Project tersimpan yang sudah diberi nama tetap dapat dibuka dari pilihan project tersimpan. Ikon Project Baru dan Impor memakai gaya garis hijau seperti ikon sidebar, tanpa latar gradasi.

Project Baru membuka blangko kosong tanpa mengisi nama atau tahun otomatis. Form memiliki tujuh isian wajib:

1. Nama Pekerjaan
2. MA (tepat 4 angka, mempertahankan nol di depan)
3. Sub MA (tepat 4 angka, blangko berdampingan dengan MA)
4. Unit Kerja
5. Kategori Program (dropdown Beban / Investasi)
6. Tahun (4 digit, minimal 1900)
7. Pagu Anggaran (rupiah, lebih dari 0, maksimal 10^15)

Tombol **Lanjut → Rencana Anggaran Biaya (RAB)** berada di kanan bawah dan benar-benar `disabled` selama ada isian kosong, hanya spasi, tahun tidak valid, atau pagu tidak positif. Status tombol diperbarui saat pengguna mengetik. Handler Lanjut memeriksa kembali isian sebelum berpindah halaman. Enter pada form tidak melewati validasi atau memuat ulang aplikasi.

Impor cadangan JSON membuka form dengan data impor. Data baru ini disimpan pada kolom `ma`, `subMa`, `workUnit`, dan `budget` bersama nama/tahun, serta ikut pada backup dan keluaran RAB/rekap. Cadangan lama tetap dapat diimpor; isian tambahan yang belum ada dibiarkan kosong sehingga Lanjut terkunci sampai pengguna melengkapinya. Data lama seperti AHS, Quantity, harga, lokasi, dan pajak tetap dipertahankan. Pagu adalah informasi anggaran dan tidak otomatis mengubah nilai pekerjaan.

Unit Kerja menggunakan dropdown dari `public/data/work-units.json`: Unit Wilayah I, II, III, IV, V, VI, VII; Divisi Pengendalian Mutu Teknik; dan Divisi Operasi dan Pemerliharaan Sumber Daya Air / Listrik (mengikuti penulisan yang diberikan pengguna). Daftar dapat ditambah pada file tersebut dan dibuild ulang. Tidak ada pilihan bebas pada dropdown; Unit Kerja dari berkas lama yang belum terdaftar tetap ditampilkan sebagai data tersimpan tetapi harus dipilih ulang sebelum Lanjut aktif. Versi build dan permintaan daftar memperhitungkan perubahan file Unit Kerja untuk menghindari daftar lama dari cache.

Kategori Program disimpan pada `programCategory` dan ikut pada cadangan, CSV RAB/rekap, serta kepala dokumen cetak. Project lama yang belum memiliki kategori tetap dapat dibuka, tetapi Lanjut menunggu kategori dipilih. MA/Sub MA berbentuk input teks numerik maksimal 4 karakter, tetap mempertahankan nol depan dan berdampingan dalam setengah kolom, termasuk pada ponsel.

Navigasi kembali ke Informasi Umum menampilkan pilihan awal; membuka project tersimpan tidak menghapus atau mengosongkan isinya. Menekan Project Baru membuat blangko baru dan mempertahankan project yang telah diisi.

## Asisten AI dalam aplikasi

Menu **Asisten AI** menyediakan analisis proyek aktif dan pertanyaan lanjutan di dalam website. Backend Node memakai OpenAI Responses API, menghitung ulang hasil RAB, dan menyimpan API key hanya pada environment server. GitHub Pages tetap statis; fitur memerlukan hosting API terpisah sebelum bisa menghasilkan jawaban nyata. Lihat [panduan hosting dan aktivasi](docs/hosting-ai.md) untuk Render, akun OpenAI API, konfigurasi secret, batas penggunaan dan pemecahan masalah. Tidak ada perubahan RAB otomatis dari jawaban AI.

### Kalkulator Quantity

Halaman Quantity tidak lagi menampilkan bar pengelolaan proyek. Tombol ekspor/cetak memakai ikon dan tombol **+ Hitung Volume** membuka pilihan pekerjaan/bentuk di sebelah tabel dimensi yang mengikuti rumus. Pekerjaan pertama dapat dibuat langsung dari kalkulator tanpa mengisi RAB terlebih dahulu. Hasil dapat disimpan sebagai rincian dan diterapkan ke volume RAB; pekerjaan baru tetap memerlukan pemilihan AHS. Bentuk yang tidak cocok dengan satuan pekerjaan ditolak. Membatalkan dialog tidak mengubah data.

### Segmen dan ilustrasi Quantity

Pagu Anggaran memakai pemisah ribuan titik saat diketik dan tetap disimpan sebagai angka. Satuan pekerjaan baru ditentukan oleh jenis hitung dan dikunci. Kalkulator menampilkan ilustrasi bentuk otomatis; unggah PNG/JPEG/WebP maksimal 2 MB untuk menggantinya. Gambar diperkecil hingga 900 piksel dan disimpan bersama segmen (maksimal 2 MB gambar tersimpan per proyek). Cadangan JSON mempertahankan gambar dan kelompok segmen.

**Add Segmen** menambah baris dalam perhitungan yang sama, **Edit** membuka kembali nilai sebelumnya, **Delete** menghapus segmen, dan **Delete perhitungan** menghapus seluruh kelompok tanpa menghapus pekerjaan RAB. Segmen pengurang tetap tersedia untuk bukaan/lubang; contoh luas 50 m² dikurangi bukaan 6 m² menghasilkan 44 m². Setelah terhubung, perubahan segmen memperbarui volume RAB otomatis. Menghapus rincian terakhir pada pekerjaan terhubung mengosongkan volume menjadi nol dan memutus tautan.

### Palet antarmuka

Tema layar memakai Forest `#1F3B2F`, Sage `#83906E`, Sand `#C7B58B`, dan Ivory `#F4F0E6`. Token serta penyesuaian bersama terdapat di `theme.css`, dimuat setelah stylesheet halaman RAB dan Pustaka. Sidebar/tombol utama menggunakan Forest, pilihan aktif/tombol sekunder Sand, aksen Sage dan latar Ivory. Teks, outline fokus keyboard, ukuran kontrol sentuh dan tampilan ponsel disesuaikan untuk keterbacaan. Aturan tema dibatasi ke layar agar lembar cetak tetap netral.

### Navigasi RAB, kontrol WBS dan lingkup SMKK

Tombol Lanjut pada Informasi Umum membuka RAB setelah validasi semua isian. Nomor WBS level 1 rata kiri, level 2 tengah, serta level 3–4 kanan. Ikon geser kiri/kanan mengganti dropdown level, dibatasi level 1–4; AHS, volume dan nilai biaya baris tetap dipertahankan. Kotak uraian/keterangan dapat diisi, berukuran tetap, dan menggulirkan teks panjang tanpa resize. Menu sisip memakai Lingkup Pekerjaan, Uraian Pekerjaan dan Sub Uraian Pekerjaan.

**BIAYA PENERAPAN SMKK** diproyeksikan otomatis sebagai lingkup level 1 terakhir pada RAB dan rekap, termasuk saat belum ada komponen. Penyimpanan tetap menggunakan `project.smkk`, sehingga proyek lama tidak membuat biaya atau lingkup tersimpan ganda. Jumlah seluruh lingkup pada rekap adalah pekerjaan + SMKK (sebelum pajak); biaya umum tidak diterapkan lagi pada SMKK. RAB hanya menampilkan satu baris lingkup SMKK tanpa uraian/suburaian, termasuk pada CSV dan tabel cetak RAB. Komponen SMKK ditambah, diedit dan dihapus pada bagian permanen paling akhir halaman AHS. Rincian tersedia dalam ekspor CSV AHS SMKK dan lampiran cetak tersendiri. Penyimpanan proyek lama tetap digunakan tanpa migrasi.

### Ringkasan biaya dan pembulatan ratusan

Ringkasan pada RAB, rekapitulasi, CSV dan cetak memuat lima baris: **Jumlah**, **DPP 11/12**, **PPN 12%**, **Jumlah Total**, dan **Dibulatkan**. Pada skema standar, Jumlah = seluruh uraian pekerjaan + lingkup SMKK; DPP = 11/12 × Jumlah; PPN = 12% × DPP; Jumlah Total = Jumlah + PPN. Dibulatkan adalah ratusan terdekat (`Math.round(JumlahTotal / 100) * 100`), dengan pecahan tepat 50 dibulatkan ke atas. Nilai sebelum pembulatan tetap ditampilkan dan dipertahankan pada hasil perhitungan. Pengaturan tarif/skema lama atau pajak nol tetap dihormati dan label mengikuti nilai aktual proyek.

### SMKK otomatis menurut Tabel III.1 dan III.2

Pada bagian terakhir halaman **Analisa Harga Satuan (AHS)**, pilih **Kecil**, **Sedang**, atau **Tinggi**. Kecil memakai Tabel III.1 (halaman fisik PDF 30–38); Sedang dan Tinggi memakai Tabel III.2 (halaman 39–73). **Tinggi dipetakan ke “Besar” pada dokumen**, bukan tabel baru.

Template memuat 45 komponen untuk III.1 dan 140 komponen untuk III.2, lengkap dengan sembilan kelompok, satuan, ketentuan kuantitas, keberterimaan, bukti dukung dan tautan halaman sumber. Kode konsultan yang berulang di sumber dipertahankan sebagai komponen berbeda. Satuan ear muff pada III.2 tidak dicantumkan pada sumber, sehingga tetap kosong untuk dilengkapi, bukan ditebak. Kelompok Asuransi dan Konsultasi pada risiko Kecil tetap tampil sebagai kelompok tidak wajib tanpa komponen/harga rekaan.

- Isi jumlah pekerja dan durasi bulan untuk menghitung kebutuhan personel serta frekuensi kegiatan. Personel KK/K3 mengikuti rasio 60 pekerja untuk Kecil, 50 untuk Sedang dan 40 untuk Besar, dengan pembulatan jumlah personel ke atas. Tambahan Ahli utama/madya untuk risiko Besar dengan >100 pekerja dipisahkan dari Ahli muda agar harga keduanya dapat diisi berbeda.
- Nilai pekerjaan yang diasuransikan digunakan untuk nilai awal premi CAR minimal 0,1%; nilai ini bukan otomatis Pagu Anggaran dan bukan hasil RAB yang dipakai berulang secara sirkular. Premi dapat diedit.
- Centang Jalan Bebas Hambatan jika ketentuan khusus tabel berlaku pada proyek. Komponen bersyarat ditampilkan dan dapat diaktifkan melalui **Gunakan** berdasarkan kebutuhan/IBPRP; komponen nonaktif tidak menambah biaya.
- Nama, satuan, kuantitas dan harga dapat diubah; perubahan kuantitas/harga manual tidak ditimpa saat parameter otomatis diperbarui. Kebutuhan yang belum dapat ditentukan tetap kosong. Harga setempat tidak tersedia di tabel, sehingga tidak diisi otomatis (kecuali perhitungan awal minimum CAR dari nilai yang dimasukkan).
- Nilai kosong dibedakan dari nol yang diisi secara eksplisit. Komponen aktif dengan harga, kuantitas atau satuan kosong membuat RAB/rekap berstatus DRAF. Jumlah SMKK tetap merupakan jumlah biaya komponen aktif tanpa biaya umum tambahan.
- Edit dan penghapusan komponen disimpan terpisah per kategori. Pilihan **Tanpa preset / rincian manual** memulihkan rincian manual sebelumnya; pergantian risiko tidak menumpuk komponen atau menimpa rincian kategori lain. Semua profil ikut cadangan JSON, sementara hanya profil aktif dikirim untuk analisis AI.

Berkas template: `public/data/smkk-templates.json`. Bangun ulang dari PDF sumber dengan `python3 scripts/prepare-smkk.py` (memerlukan PyMuPDF). Perhitungan otomatis di `smkk-core.js` memakai aturan terpilih yang dijelaskan pada tiap komponen; ketentuan sumber tetap tersedia untuk pemeriksaan dan penyesuaian kondisi proyek.

### Buka/tutup seluruh rincian SMKK

Tombol panah di pojok kanan header SMKK pada halaman AHS menyembunyikan atau membuka seluruh pengaturan, kelompok dan rincian komponennya. Halaman dimulai dengan rincian tertutup; judul dan jumlah biaya tetap terlihat. Menutup panel tidak mengubah data, total, atau status buka/tutup kelompok di dalamnya. Tombol dapat digunakan dengan keyboard. Menambah komponen membuka panel otomatis, dan hasil cetak tetap memuat seluruh komponen aktif meskipun panel layar ditutup.

### Rekapitulasi sebagai paket lingkup

Rekap memakai kolom NO., LINGKUP PEKERJAAN, VOLUME, SATUAN, HARGA SATUAN, JUMLAH HARGA, KETERANGAN. Nomor berurutan; volume awal 1 dapat diubah menjadi angka nonnegatif (termasuk pecahan/nol), satuan tetap paket. Harga satuan mengikuti total asli lingkup RAB/AHS, termasuk SMKK. Jumlah harga = volume paket × harga satuan; ringkasan, pajak, CSV dan cetak rekap memakai jumlah harga tersebut. Bila volume paket diubah, total rekap mengikuti pengalinya; rincian sumber RAB/AHS tidak diubah. Volume disimpan bersama lingkup, termasuk saat cadangan dipulihkan dengan ID baru.

### Aset versi lama saat deploy

Deploy mempertahankan berkas JS/CSS berpenanda versi, sehingga HTML atau modul yang masih tersimpan di cache browser/CDN tetap dapat memuat dependensinya setelah versi baru terbit. Skrip juga memulihkan aset dari 30 commit deploy terakhir untuk memperbaiki tautan versi yang terhapus oleh deploy lama. Berkas HTML, alias tanpa penanda versi, dan data tetap diperbarui dari build terkini.
