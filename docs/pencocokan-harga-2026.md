# Database harga AHSP — status implementasi

21 November 2026. UI/UX terkunci dipertahankan. Perubahan saat ini berupa data, pemilihan sumber, pembaruan harga otomatis yang terlacak, dan laporan.

## Hasil dan batas cakupan

- Register53 dokumen Drive tersimpan bersama URL dan SHA256. Basis data mempunyai **43,154 baris kutipan/calon harga**, **4,996 identitas AHSP**, dan **7,585 pasangan harga–wilayah untuk 968 identitas**. Baris sumber mencakup calon/duplikat pembacaan; bukan seluruhnya harga siap pakai. Angka ini tidak berarti semua harga telah lengkap.
- Seluruh5637 entri AHS diperiksa pada11 pasangan wilayah: 62,007 pemeriksaan AHS–wilayah. Sebanyak455 entri tidak mempunyai rincian komponen. Nama terpotong/gabung dan bahan yang salah terbaca sebagai upah memerlukan pemeriksaan sumber; tidak diberi harga upah secara sembarang.
- Pasangan harga perkelompok: {"Bahan": 6661, "Tenaga kerja": 320, "Peralatan": 604}. Perwilayah: {"Jawa Barat/Purwakarta": 930, "Jawa Barat/Karawang": 938, "Jawa Barat/Kab. Bekasi": 930, "Jawa Barat/Kota Bekasi": 930, "Jawa Barat/Kota Bandung": 925, "Jawa Barat/Kab. Bogor": 930, "Jawa Barat/Indramayu": 930, "Jawa Barat/Subang": 930, "Jakarta/Jakarta": 24, "Banten/Banten": 40, "Lampung/Lampung": 78}.
- Bahan dan sewa mengutamakan Jurnal2025 yang kompatibel; Jurnal2023 menjadi pelengkap dengan basis indeks sebanding. Tabel jurnal relevan dibaca perkolom, angka calon yang cocok diperiksa kembali pada raster kolom harga. OCR yang tidak sepakat ditahan. Ini pemeriksaan otomatis silang, bukan klaim pemeriksaan visual manual setiap baris.
- Upah Jawa Barat mengutamakan Kepgub No.900/Kep.239-BPKAD/2024, SHS2025, Tabel1.10 PDF24–26. Dokumen mengatur honorarium NonASN fisik/konstruksi swakelola, sehingga batas penerapannya dicatat. Tarif pemerintah2026 lokal yang tersedia didahulukan dari2025. Workbook tidak dinyatakan sebagai peraturan. Keahlian yang menggunakan kelompok Tukang tetap diberi label estimasi klasifikasi.
- Lampung memakai Kota Bandar Lampung sesuai instruksi pengguna, bukan survei seluruhprovinsi. Upah perjam×8→OH, bulanan÷30→OH; OJ dari bulanan÷240. Koefisien AHS tidak berubah. Aturan bulanan upah tidak diterapkan ke sewa alat/lahan.
- Sumber upah resmi yang lengkap belum dapat dipastikan untuk seluruhprovinsi/subregion. Banten dan Lampung yang memakai jurnal tetap merupakan acuan jurnal/estimasi, bukan tarif peraturan2026. Dua peraturan Banten dibaca OCR93 dan322halaman tetapi kualitas tabel belum mendukung kutipan yang dapat dipastikan. Jakarta2024 mempunyai tarif konstruksi, namun sambungan indeks yang sebanding belum tersedia pada pembaruan ini; tidak dipaksakan menjadi2026.

## Acuan wilayah terdekat yang disetujui

Pengguna menyetujui pada21 November2026: "Boleh, beri keterangan estimasi" untuk bahan/alat tanpa harga lokal. Sebanyak6.206 pasangan memakai acuan dalam provinsi sama. `public/data/regional-reference-policy.json` menyimpan urutan wilayah sumber yang tersedia; ini urutan kedekatan administratif, bukan klaim jarak GIS. Harga langsung setempat diutamakan, konflik lokal tidak dilewati dengan harga kota lain, dan donor harus rekaman langsung (tidak berantai). Upah tidak memperoleh fallback. ID dan angka donor, lokasi target/sumber serta label bukan survei setempat tetap tersimpan.

## Eskalasi dan pajak

Bahan2025 memakai indeks komoditas Oktober2026 / rata-rata2025 pada seri2023=100. Bahan2023 memakai indeks Oktober2026 /100 (rata-rata tahun dasar2023). Sumber tahunan tanpa bulan menggunakan konvensi periode dasar yang dicatat. IHPB konstruksi y-on-y9,59% tidak diterapkan seragam pada semua harga2025. Upah dan sewa menggunakan proksi IHK umum setempat jika sesuai periode sumber; bukan indeks upah/sewa resmi. Bahan2025 tanpa pasangan komoditas terverifikasi dapat memakai proksi IHK umum yang diberi label, bukan diklaim IHPB spesifik bahan. Tidak ada proyeksi fiktif ke2027.

PPN sumber yang dinyatakan dipisahkan sesuai catatan dan asumsi pada rekaman. Barang nonmewah yang dinyatakan termasuk pajak menggunakan asumsi efektif11%; jurnal2023 tertentu menyebut10%. Sumber dengan PPN tidak dinyatakan dipertahankan sebagai kutipan estimasi dengan peringatan agar tidak dikenai PPN ganda, bukan diklaim harga bersih. Keuntungan/overhead yang tidak dirinci tidak dikurangi secara fiktif. Harga beli alat tidak digunakan sebagai tarif sewanya. Lokasi, mutu, diameter, kapasitas dan satuan berbeda tidak disamakan.

## Pengisian dan kelestarian edit

`price-catalog.js` berlaku untuk seluruh komponen AHS terpilih, bukan kasus contoh. Harga disimpan memakai identitas sumber daya yang sama untuk AHS/HSD dan profil wilayah. Pratinjau memakai salinan proyek; pemilihan AHS langsung menyimpan harga yang tersedia. Pencarian browser menggunakan indeks identitas eksak yang dikompilasi, tanpa tebakan nama mendekati.

Harga otomatis lama dapat diperbarui hanya jika ID asal dan angka lama cocok dengan riwayat `replaces`, tanpa penanda edit manual. Harga manual, nol, konflik dan pengosongan manual dipertahankan. Metadata sumber otomatis ikut diperbarui kecuali diedit manual. Harga/metadata/bank wilayah ikut cadangan.

## Artefak

- `public/data/price-database.zip`: SQLite, README dan ringkasan. Semua identitas, sumber, kutipan dan harga terpilih terpisah dalam tabel berindeks; integrity/FK diperiksa.
- `public/reports/database-harga-ahsp.pdf`: ringkasan metode, kategori, cakupan seluruhAHS/wilayah, batas sumber, register dan cara memeriksa.
- `public/reports/audit-harga-semua-ahs.csv`: seluruhAHS × seluruhwilayah, termasuk nama komponen yang belum berharga.
- `public/reports/cakupan-harga-ahsp-2026.csv`: matriks identitas × wilayah.
- `public/reports/harga-terverifikasi-2026.csv`: harga terpilih dan asal/konversi/catatan. Penanda terverifikasi adalah kecocokan sumber, bukan semua merupakan survei resmi2026.

## TKDN — belum selesai

Workbook snapshot P3DN per 6 Januari 2025 berisi 39.424 baris produk; 20.661 belum melewati tanggal kedaluwarsa yang tertulis saat diperiksa pada 21 November 2026. 1.086 sumber daya memiliki kandidat pencarian, **0 penetapan TKDN numerik terkonfirmasi**. Kandidat tidak menjamin spesifikasi sama dan tidak membuktikan status sertifikat terkini.

Workbook tidak mencantumkan nomor sertifikat. Nama AHSP umumnya generik; produsen, merek/model dan sertifikat belum dipilih. Halaman utama https://tkdn.kemenperin.go.id/ dapat dibaca, tetapi `/cari` dan `/sertifikat` mengembalikan HTTP 403 dari layanan. Pembacaan kandidat ini bukan verifikasi ulang sertifikat P3DN terkini. BMP tidak dianggap TKDN produk. Tenaga kerja bukan produk dengan persentase sertifikat.

Logika pengisian mendukung TKDN hanya jika rekaman memuat produk/produsen, nomor sertifikat, URL Kemenperin, tanggal verifikasi dan masa berlaku yang mencakup tahun proyek. Nilai kosong atau manual tidak dipaksa menjadi 0. Tidak ada kandidat generik yang dimasukkan sebagai TKDN terpilih ke website.


## Reproduksi

1. Inventaris: `node scripts/inventory-price-resources.mjs`.
2. Baca sumber dasar dengan `scripts/extract-price-sources.py`, sumber jurnal/calon lama jika diperlukan, `scripts/extract-jabar-wages.py --year 2025`.
3. `python scripts/review-regional-wages.py`, `python scripts/extract-official-wages.py`, `node scripts/prepare-provincial-materials.mjs`.
4. `python scripts/extract-journal-database.py`; `node scripts/journal-price-candidates.mjs`; `python scripts/verify-journal-prices.py`.
5. Pelengkap2023: `python scripts/ocr-journal-2023.py`; `python scripts/ocr-journal-columns.py`; ulangi ekstraksi, calon dan verifikasi dengan `--year=2023` (CLI Node menerima folder sumber sebagai argumen pertama).
6. `node scripts/build-regional-price-catalog.mjs`; `node scripts/audit-all-ahs-prices.mjs`; `node scripts/audit-regional-autofill.mjs`.
7. `python scripts/build-price-database.py`; `node scripts/report-regional-prices.mjs`; `node scripts/report-price-database.mjs`.
8. Render PDF melalui `scripts/render-resource-audits.mjs`, jalankan `npm test`, `npm run build`.

Build mengirim format runtime ringkas schema2 berukuran sekitar3,7MB dari data bukti penuh sekitar23,5MB. `compactPriceCatalog` mempertahankan semua harga, scope, metadata dan riwayat penggantian; `createPriceCatalog` menolak referensi berantai, lintasprovinsi dan acuan upah. Bukti penuh disimpan dalam database unduhan.

Endpoint lama `public/data/regional-price-catalog.json` (schema1) tetap dipertahankan untuk kompatibilitas; aplikasi terbaru menggunakan `public/data/regional-price-runtime.json` (schema2).

Berkas asli Drive tetap di workspace sumber, bukan disalin sebagai PDF lampiran website. Database harga adalah hasil ekstraksi/pencocokan dan catatan sumber. Seluruh harga belum lengkap; daftar kekosongan harus tetap terlihat.
