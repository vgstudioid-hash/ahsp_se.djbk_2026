# Pustaka AHSP 2026

Website referensi berbahasa Indonesia berdasarkan PDF SE DJBK No. 47 Tahun 2026 yang diunggah pengguna. Aplikasi ini merupakan pustaka dokumen, bukan layanan resmi Kementerian PU atau kalkulator RAB.

## Menjalankan

Memerlukan Node.js 20 atau lebih baru. Tidak ada dependensi eksternal atau variabel rahasia.

```sh
cd /workspace/ahsp_se.djbk_2026
npm run dev -- --host 0.0.0.0 --port 3000
```

Gunakan checkout yang ada; setiap tugas cloud sudah terisolasi, sehingga tidak perlu membuat Git worktree. Proses server perlu dijalankan kembali pada sesi cloud baru. Untuk memeriksa layanan, ambil `/` dan `/data/documents.json`, kemudian cari “SMKK” di antarmuka dan buka salah satu halaman hasilnya.

```sh
npm test
npm run build
```

Hasil build di `dist/` dapat disajikan melalui hosting statis. Aset menggunakan path relatif sehingga dapat ditempatkan di subdirektori. Server pengembangan mendukung permintaan rentang byte untuk membaca PDF besar. `PORT` dapat digunakan untuk mengganti port.

## Fitur

- Ikhtisar, filter kategori/judul, tampilan kisi/daftar, dan navigasi bidang pekerjaan.
- Pencarian isi PDF di Web Worker, dengan cuplikan dan nomor halaman sumber. Semua kata kunci harus ada pada halaman yang sama; maksimal 12 hasil per dokumen ditampilkan. Persempit kata kunci untuk menemukan hasil lain.
- Pembaca PDF asli, teks hasil ekstraksi per halaman, unduhan, dan buka di tab baru.
- Penanda dokumen/halaman tersimpan di localStorage browser; tidak dikirim ke server.
- Tampilan responsif, navigasi keyboard, dan pintasan `/` untuk mencari.

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
