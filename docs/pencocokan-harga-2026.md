# Harga wilayah AHSP: status implementasi

21 November 2026. UI/UX tetap mengikuti acuan terkunci; CSS, teks kontrol, tata letak, ukuran dan navigasi dipertahankan. Ikon AHS saja diganti sesuai referensi diagram lingkaran pengguna pada koreksi ini.

## Hasil dan batas cakupan

- Semua 53 berkas dari folder HARGA PEMERINTAH dan JURNAL HARGA telah diunduh ke `/workspace/price-sources`, di luar aset website. Register nama, URL, SHA256, ukuran dan status ekstraksi tersedia di `public/data/price-source-register.json`. Tujuh PDF tidak mempunyai lapisan teks. Dokumen lain pun belum semuanya dikonversi menjadi tabel harga terverifikasi.
- Inventaris katalog: 4.996 identitas sumber daya dari 5.637 entri AHS; 455 entri tanpa rincian komponen belum dapat menyumbangkan inventaris lengkap. Kategori bahan 3.983, tenaga kerja 178, alat 794, sewa 35, lainnya 6.
- Katalog otomatis: **1.074 pasangan sumber daya–wilayah / 795 identitas unik**, bukan semua sumber daya. Purwakarta 28, Karawang 785, Kab. Bekasi 28, Kota Bekasi 55, Kota Bandung 30, Kab. Bogor 28, Indramayu 28, Subang 28, Jakarta 12, Banten 24, Lampung 28. Sebanyak 4.201 identitas belum mempunyai harga pada wilayah mana pun. Semua 11 pasangan wilayah diperiksa dalam `public/reports/audit-pengisian-harga-wilayah.pdf` dan CSV/JSON pendamping.
- Koreksi contoh UPVC VI PDF478: seluruh empat upah kini tersedia di delapan Sub Region Jawa Barat, Banten dan Lampung; Jakarta hanya Pekerja dan Mandor. Sumber Jakarta tidak merinci Tukang Aluminium dan Kepala Tukang generik, sehingga tidak diganti tarif spesialis lain secara sembarang. Harga material jendela spesifik belum tersedia pada seluruh wilayah.
- Proksi IHK BPS Oktober 2026 tahun kalender: Jawa Barat 2,31% (kabupaten tanpa seri kota), Kota Bekasi 2,21%, Kota Bandung 2,18%, Jakarta 1,91%, Banten 1,81%, Lampung 2,86%. Dasar upah tetap lokal; bukan menyalin tarif Karawang/Bekasi ke daerah lain. Tarif kelompok Tukang untuk spesialis yang tidak dirinci diberi keterangan estimasi klasifikasi. Sumber primer tepat tetap lebih diutamakan daripada fallback.
- Lampung memakai sumber Kota Bandar Lampung 2025, Jurnal Edisi44 PDF240, sebagai estimasi acuan yang disetujui pengguna pada 21 November 2026. Pengguna menetapkan **8 jam/OH** (bukan 7), dan sumber bulanan dibagi **30 hari**. Sumber Lampung per jam dikalikan8 lalu disesuaikan IHK2,86%; Pekerja Rp152.232,80/OH, Tukang Aluminium estimasi Rp213.948,80/OH, Kepala Tukang Rp246.864/OH, Mandor Rp271.550,40/OH. Keterangan menyebut asal kota, asumsi jam, dan harga bruto termasuk inflasi/pajak/keuntungan yang tidak dirinci sumber. Tidak diklaim sebagai tarif survei seluruh provinsi atau upah bersih. Belum ada tarif bulanan baru yang dimasukkan dalam pembaruan ini.
- Sebagian terbesar berasal dari SHS Karawang 2026 dan SSH Kota Bekasi 2026. Nama/spesifikasi, satuan dan wilayah dibandingkan secara ketat. Harga yang bertentangan tidak dipilih otomatis. Normalisasi mempertahankan pecahan, desimal, diameter dan dimensi agar tidak salah disamakan.
- 13 pasangan harga dari baris jurnal 2025 yang diperiksa visual dieskalasi menggunakan indeks komoditas BPS rata-rata tahunan 2025 → Oktober 2026, tahun dasar 2023=100. BPS konstruksi y-on-y 9,59% bukan faktor yang digunakan secara seragam. Angka lengkap, periode, sumber dan perhitungan tersimpan pada setiap rekaman dan laporan.
- Koreksi 21 November: sumber Excel SBU Jawa Barat yang sebelumnya tidak masuk ekstraksi kini dibaca. Pengguna mengonfirmasi tahun 2025. Sebanyak 14 pasangan upah Kota Bekasi diisi sebagai estimasi dengan proksi IHK BPS tahun kalender 2,21% (Desember 2025 → Oktober 2026), bukan indeks upah konstruksi atau tarif resmi Mandor 2026. Mandor Rp292.200/OH menjadi Rp298.657,62/OH, atau Rp37.332,20/OJ berdasarkan 8 jam/hari yang tercetak pada sumber. Tarif tahunan 2025 diperlakukan berlaku sampai akhir 2025 sebagai konvensi periode dasar. Upah lokal yang sudah memiliki harga primer, serta semua harga manual, dipertahankan. Data/URL/halaman BPS ada di `public/data/bps-wage-proxies.json`.
- Pemakaian rata-rata tahunan sebagai periode dasar merupakan konvensi untuk sumber yang hanya menyebut tahun. Tidak ada proyeksi 2027 atau penyambungan seri BPS beda tahun dasar. Upah dan sewa alat lama belum dieskalasi dengan indeks bahan.
- SSH sumber menyatakan harga termasuk pajak. Harga barang nonmewah dibagi 1,11 sebelum masuk RAB agar tidak dikenai PPN dua kali; asumsi ini mengikuti model aplikasi 12% × DPP 11/12, dicatat pada setiap rekaman. Ini bukan angka pajak yang dicetak per barang. Upah langsung tidak dikurangi PPN. SSH merupakan standar/batas tertinggi, bukan bukti harga pasar terkini. Perlakuan pajak dan kondisi pengadaan harus tetap ditinjau.

## Pengisian otomatis dan pelestarian edit

`price-catalog.js` mengindeks identitas yang telah dicocokkan dalam data. Tidak ada pencarian nama mendekati atau harga terendah/tertinggi di browser. Harga hanya diisi setelah Region dan Sub Region lengkap. Semua sumber daya yang sama memakai alias harga AHS/HSD yang sudah ada, tanpa mengubah koefisien.

Harga pengguna, termasuk 0, konflik harga lama, dan pengosongan manual tidak ditimpa. Harga otomatis dapat diedit melalui kolom yang sudah ada. Penanda asal katalog, tahun dan kolom manual ikut validasi, bank harga, impor CSV serta cadangan. Sumber harga dan catatan mengikuti kolom metadata yang sudah ada. Katalog dimuat bersama data awal, diterapkan saat menyimpan/merender dan setelah pergantian wilayah. Region/Sub Region kini dipilih lebih awal pada kotak Lokasi Pekerjaan di Informasi Umum, bukan toolbar HSD. Pratinjau AHS menggunakan salinan proyek untuk menampilkan harga wilayah sebelum komponen ditambahkan. Pemilihan dari katalog maupun baris RAB langsung menyimpan harga yang tersedia dan memperbarui daftar AHS terpakai. Build menyertakan versi modul dan JSON harga dalam hash.

## TKDN — belum selesai

Workbook snapshot P3DN per 6 Januari 2025 berisi 39.424 baris produk; 20.661 belum melewati tanggal kedaluwarsa yang tertulis saat diperiksa pada 21 November 2026. 1.086 sumber daya memiliki kandidat pencarian, **0 penetapan TKDN numerik terkonfirmasi**. Kandidat tidak menjamin spesifikasi sama dan tidak membuktikan status sertifikat terkini.

Workbook tidak mencantumkan nomor sertifikat. Nama AHSP umumnya generik; produsen, merek/model dan sertifikat belum dipilih. Halaman utama https://tkdn.kemenperin.go.id/ dapat dibaca, tetapi `/cari` dan `/sertifikat` mengembalikan HTTP 403 dari layanan. Pembacaan kandidat ini bukan verifikasi ulang sertifikat P3DN terkini. BMP tidak dianggap TKDN produk. Tenaga kerja bukan produk dengan persentase sertifikat.

Logika pengisian mendukung TKDN hanya jika rekaman memuat produk/produsen, nomor sertifikat, URL Kemenperin, tanggal verifikasi dan masa berlaku yang mencakup tahun proyek. Nilai kosong atau manual tidak dipaksa menjadi 0. Tidak ada kandidat generik yang dimasukkan sebagai TKDN terpilih ke website.

## Reproduksi

1. `node scripts/inventory-price-resources.mjs`
2. `python3 scripts/extract-price-sources.py /workspace/price-sources`
3. `python3 scripts/extract-journal-price-candidates.py /workspace/price-sources`, lalu `python3 scripts/extract-jabar-wages.py /workspace/price-sources --year 2025` (tahun dikonfirmasi pengguna)
4. `python3 scripts/review-regional-wages.py`, lalu `node scripts/build-regional-price-catalog.mjs /workspace/price-sources` dan `node scripts/audit-regional-autofill.mjs`
5. `python3 scripts/match-tkdn-candidates.py /workspace/price-sources`
6. `node scripts/report-regional-prices.mjs /workspace/price-sources`
7. Gunakan `scripts/render-resource-audits.mjs` untuk PDF `klasifikasi-harga-ahsp-2026`, `kandidat-tkdn-ahsp` dan inventaris dasar.

`public/data/reviewed-price-rows.json` menyimpan baris jurnal yang diperiksa visual. Kandidat OCR lain tidak disetujui otomatis. `public/data/bps-price-indices.json` menyimpan 65 komoditas dari Tabel 3 BRS No.103/11/Th.XXIX (2 November 2026), hal.5–6, dan indeks tahunan 2025 dari tabel statistik BPS resmi. Dokumen BPS asli disimpan di workspace sumber; fakta indeks dirujuk dengan URL, bukan mendistribusikan PDF aslinya.

Laporan PDF/CSV menunjukkan seluruh identitas, wilayah tanpa harga, kandidat TKDN, periode BPS dan batas penggunaan. Pekerjaan berikutnya adalah melengkapi OCR, rincian sumber yang belum terstruktur, perlakuan pajak Excel, harga lokal identitas yang masih kosong dan konfirmasi produk/sertifikat TKDN. Tidak boleh mengklaim seluruh harga/TKDN telah selesai.
