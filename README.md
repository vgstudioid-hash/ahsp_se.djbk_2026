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

1. Buat atau pilih proyek, isi lokasi dan tanggal harga.
2. Tambah lingkup pekerjaan atau klik **+ Tambah uraian pekerjaan**. Ketik uraian langsung, pilih AHS pada barisnya, lalu isi volume hasil pengukuran. Tingkat WBS A → 1 → a → • dapat dipilih pada kolom NO; nomor diperbarui mengikuti urutan baris.
3. Isi harga dasar upah, bahan, dan peralatan di menu Harga Dasar atau impor CSV. Daftar harga daerah/proyek pengguna masih menunggu unggahan; tidak ada harga contoh PDF yang dipakai otomatis.
4. Periksa rincian analisis dan sumber PDF. Masukkan biaya penerapan SMKK sesuai kebutuhan secara terpisah.
5. Tinjau biaya umum/keuntungan dan persentase pajak efektif sesuai proyek, lalu ekspor CSV, cadangan JSON, atau cetak/simpan PDF.

Lembar RAB mengikuti tujuh kolom: **NO / WBS, URAIAN PEKERJAAN, VOLUME, SATUAN, HARGA SATUAN, JUMLAH HARGA, KETERANGAN**. Uraian dan keterangan dapat diketik langsung. Satuan dan harga satuan berasal dari AHS pilihan, sehingga mengganti AHS perlu diikuti pemeriksaan volume. Pemilihan AHS mempertahankan uraian, volume, WBS, dan keterangan pengguna. Tombol panah memindahkan urutan baris. Judul WBS tidak dihitung sebagai pekerjaan. Baris yang belum terhubung ke AHS membuat hasil berstatus DRAF. Format tujuh kolom dan keterangan yang sama digunakan pada CSV, cetak/PDF, serta cadangan JSON.

Perhitungan: biaya langsung AHS = jumlah (koefisien × harga dasar). Biaya umum/keuntungan = persentase × biaya langsung. Harga satuan = biaya langsung + biaya umum/keuntungan. Jumlah pekerjaan = volume × harga satuan. Dasar pajak = total pekerjaan + biaya SMKK. Total RAB = dasar pajak + pajak efektif yang diisi pengguna. Komponen biaya, biaya umum/keuntungan, harga satuan, jumlah baris, SMKK, dan pajak dibulatkan ke dua desimal rupiah pada masing-masing tahap.

Biaya umum/keuntungan awal 10% dan pajak awal 0% adalah pengaturan yang dapat diubah; nilai tersebut bukan penentuan perlakuan pajak proyek. SMKK tidak dikenai biaya umum/keuntungan kedua kali. Rekap kebutuhan sumber daya mengalikan koefisien dengan volume sebelum menggabungkan komponen dan belum memuat SMKK. Harga per OH, per jam, dan per hari dibedakan. Kode tenaga kerja yang sama tidak menyatukan jenis tukang berbeda.

## Form mengikuti workbook rujukan

Struktur form mengacu pada `RAB JEMBATAN MJM.xlsm` unggahan pengguna; rincian pemetaan ada di [docs/workbook-format.md](docs/workbook-format.md). Berkas dibaca tanpa menjalankan VBA/makro atau formula workbook.

- Identitas bersama: pemberi tugas, nama proyek, lokasi, koordinat, tahun proyek; jenis dokumen RAB/HPS dapat dipilih. Tanggal harga tetap terpisah dari tahun proyek.
- RAB tetap memakai tujuh kolom WBS yang dapat diedit, ditambah kepala form dan rekap biaya.
- AHS: NO, URAIAN, KODE, SATUAN, KOEFISIEN, HARGA SATUAN, JUMLAH HARGA. Kelompok A tenaga kerja, B bahan, C peralatan, D lain-lain mempunyai subtotal; E jumlah biaya langsung, F biaya umum/keuntungan, G harga satuan pekerjaan. Kode/harga komponen terhubung ke HSD.
- HSD: NO, URAIAN, KODE, SATUAN, HARGA SHB, HARGA SATUAN, KETERANGAN. Harga SHB adalah pembanding yang tidak otomatis mengubah harga satuan aktual. Kode dan keterangan dapat diedit. Metadata ikut disimpan di cadangan JSON serta CSV HSD (kolom kode, harga shb, harga, keterangan).
- Form AHS dan HSD dapat dicetak terpisah; cetak RAB juga menyertakan keduanya. Input diganti teks pada cetakan.

Angka harga/koefisien proyek 2025, diskon, formula pajak, pembulatan, dan konversi satuan pada workbook tidak diimpor otomatis. Kelompok Lain-lain tersedia untuk analisis manual; tidak menambahkan biaya baru pada template SE yang tidak memiliki komponen tersebut. Dasar volume kini tersedia pada menu Quantity; sheet VOLUME Excel tidak diimpor otomatis. JADWAL belum menjadi fitur aplikasi.

## Cakupan analisis siap hitung

Tersedia **18 template AHS**: 10 pekerjaan SDA (pembersihan, galian batu manual/semi-mekanis, dan pemadatan timbris), 7 pekerjaan CK (pagar dan papan nama), serta 1 contoh BM (galian drainase B.1). Koefisien telah diperiksa terhadap halaman PDF yang dicantumkan; asumsi khusus ditampilkan pada rincian. Koefisien template dikunci. Harga dasar tidak diisi otomatis.

**Belum seluruh AHS pada 6.700 halaman PDF menjadi data perhitungan terstruktur.** Gunakan pencarian dokumen untuk analisis lain, lalu masukkan seluruh komponen, koefisien, satuan, dan halaman sumber melalui form AHS manual. Analisis manual ditandai pada lembar RAB dan hasil cetak. Contoh BM bersifat informatif dan memakai asumsi angkut 2 km, tanah liat, serta 7 jam kerja efektif; harga alat sudah mencakup operator, BBM, dan bahan habis pakai sesuai catatan sumber. Jangan menambahkan biaya tersebut dua kali.

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

Lembar RAB langsung menampilkan daftar pekerjaan. Blok pengantar, form identitas yang besar, dan kartu ringkasan atas dipindahkan ke menu **Pengaturan Proyek**. Nama proyek aktif tetap terlihat pada panel kecil yang dapat dilipat; buka **Kelola proyek** untuk memilih proyek, membuat proyek baru, mengimpor cadangan, atau menuju pengaturan. Tombol ekspor/cadangan/cetak tetap terlihat pada Lembar RAB.

Identitas, koordinat, tanggal harga, jenis dokumen, biaya umum/keuntungan, pajak, dan ringkasan statistik dikelola pada Pengaturan Proyek. Kepala form RAB menampilkan identitas tersebut sebagai informasi dokumen (bukan form edit). Rekapitulasi biaya di bagian bawah Lembar RAB tetap tersedia. Pemindahan tampilan tidak menghapus data proyek, pekerjaan, AHS, HSD, atau Quantity.
