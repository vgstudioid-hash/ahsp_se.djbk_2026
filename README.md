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
2. Pilih AHS siap hitung; tambah pekerjaan dan masukkan volume hasil pengukuran.
3. Isi harga dasar upah, bahan, dan peralatan di menu Harga Dasar atau impor CSV. Daftar harga daerah/proyek pengguna masih menunggu unggahan; tidak ada harga contoh PDF yang dipakai otomatis.
4. Periksa rincian analisis dan sumber PDF. Masukkan biaya penerapan SMKK sesuai kebutuhan secara terpisah.
5. Tinjau biaya umum/keuntungan dan persentase pajak efektif sesuai proyek, lalu ekspor CSV, cadangan JSON, atau cetak/simpan PDF.

Perhitungan: biaya langsung AHS = jumlah (koefisien × harga dasar). Biaya umum/keuntungan = persentase × biaya langsung. Harga satuan = biaya langsung + biaya umum/keuntungan. Jumlah pekerjaan = volume × harga satuan. Dasar pajak = total pekerjaan + biaya SMKK. Total RAB = dasar pajak + pajak efektif yang diisi pengguna. Komponen biaya, biaya umum/keuntungan, harga satuan, jumlah baris, SMKK, dan pajak dibulatkan ke dua desimal rupiah pada masing-masing tahap.

Biaya umum/keuntungan awal 10% dan pajak awal 0% adalah pengaturan yang dapat diubah; nilai tersebut bukan penentuan perlakuan pajak proyek. SMKK tidak dikenai biaya umum/keuntungan kedua kali. Rekap kebutuhan sumber daya mengalikan koefisien dengan volume sebelum menggabungkan komponen dan belum memuat SMKK. Harga per OH, per jam, dan per hari dibedakan. Kode tenaga kerja yang sama tidak menyatukan jenis tukang berbeda.

## Cakupan analisis siap hitung

Tersedia **18 template AHS**: 10 pekerjaan SDA (pembersihan, galian batu manual/semi-mekanis, dan pemadatan timbris), 7 pekerjaan CK (pagar dan papan nama), serta 1 contoh BM (galian drainase B.1). Koefisien telah diperiksa terhadap halaman PDF yang dicantumkan; asumsi khusus ditampilkan pada rincian. Koefisien template dikunci. Harga dasar tidak diisi otomatis.

**Belum seluruh AHS pada 6.700 halaman PDF menjadi data perhitungan terstruktur.** Gunakan pencarian dokumen untuk analisis lain, lalu masukkan seluruh komponen, koefisien, satuan, dan halaman sumber melalui form AHS manual. Analisis manual ditandai pada lembar RAB dan hasil cetak. Contoh BM bersifat informatif dan memakai asumsi angkut 2 km, tanah liat, serta 7 jam kerja efektif; harga alat sudah mencakup operator, BBM, dan bahan habis pakai sesuai catatan sumber. Jangan menambahkan biaya tersebut dua kali.

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
