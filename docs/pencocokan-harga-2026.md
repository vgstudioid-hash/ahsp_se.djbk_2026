# Pencocokan harga wilayah dan TKDN

Status 21 November 2026: **belum selesai; akses sumber eksternal diblokir jaringan lingkungan Cloud**. Tidak ada perubahan UI/UX, harga proyek, koefisien, bank wilayah, atau nilai TKDN pengguna.

## Hasil yang tersedia

Jalankan `node scripts/inventory-price-resources.mjs` untuk menghasilkan inventaris di `public/reports/inventaris-sumber-daya-harga.{json,csv,html}`. PDF dibuat dengan renderer laporan yang sudah ada. Sumbernya katalog mentah + lapisan koreksi + normalisasi sumber daya yang digunakan aplikasi. JSON menyimpan seluruh rujukan AHS dan nama asal; CSV menyediakan kolom kerja untuk harga wilayah dan sertifikat. Kolom yang belum terverifikasi sengaja kosong.

5.637 entri AHS, 35.031 kemunculan komponen setelah koreksi dan pemisahan alternatif, 4.996 identitas unik. Kategori: bahan 3.983, tenaga kerja 178, alat 794, sewa 35, lainnya 6. Ada 455 entri tanpa komponen; daftar ini bukan sertifikasi kelengkapan seluruh PDF sumber.

## Sumber yang diizinkan pengguna

Folder harga: https://drive.google.com/drive/folders/1yXPx38FtRKkNQJ72HCBZOsfdILmWT-8B

Pengguna mengizinkan pembacaan dan bila diperlukan penyimpanan ke folder. Respons CONNECT 403 berasal dari pembatasan jaringan Cloud; ini tidak membuktikan folder privat atau izin berbagi salah. Domain yang diperlukan: drive.google.com, drive.usercontent.google.com, docs.google.com, *.bps.go.id, *.kemenperin.go.id. Tidak ada berkas Drive yang telah dibaca atau diunggah pada tahap ini.

## Tahap setelah akses tersedia

1. Inventaris setiap dokumen harga: judul, penerbit, URL/file, tahun/periode, wilayah, halaman/sheet, status pajak dan pengiriman, jenis harga (upah/bahan/sewa/pembelian). Pertahankan dokumen asli.
2. Cocokkan kelompok, nama/spesifikasi, satuan dan wilayah. Jangan memakai kecocokan nama mendekati atau kode saja sebagai bukti. Ukuran/mutu/kapasitas berbeda tetap terpisah. Konversi satuan harus memiliki dasar; OH tidak otomatis disamakan dengan OJ. Tarif sewa tidak disamakan harga pembelian alat.
3. Harga 2026 boleh menjadi basis sementara penggunaan 2027; tidak membuat prediksi 2027 tanpa data. Catat tanggal/periode ketersediaan jika data 2026 belum setahun penuh. Harga lebih lama: pilih seri BPS sesuai komoditas/jenis biaya dan cakupan yang tersedia. Jangan memakai inflasi bahan konstruksi untuk upah secara otomatis.
4. Eskalasi hanya ketika seri dan basis indeks sebanding: harga target = harga dasar × indeks target / indeks dasar. Jika memakai perubahan tahunan yang terverifikasi, kalikan faktor (1 + r/100) tiap periode, bukan menjumlahkan persen. Jangan menyambung seri berbeda tahun dasar tanpa penghubung resmi. Simpan nama seri, periode awal/akhir, nilai indeks atau setiap persen, tautan publikasi, halaman dan hasil perhitungan. Contoh pengguna menuju 2024 bukan faktor menuju 2026.
5. TKDN: cari P3DN berdasarkan produsen, produk/model dan spesifikasi yang sama. Simpan nomor sertifikat, nilai persen, masa berlaku dan URL. Satu nama generik dapat mencakup banyak produk dengan TKDN berbeda; jangan memaksakan satu nilai. Tidak ditemukan ≠ 0%. Upah tidak diperlakukan sebagai produk dengan sertifikat TKDN.
6. Masukkan data terverifikasi ke bank Region/Sub Region yang tepat melalui pola impor harga yang tersedia. Pemilihan wilayah dan propagasi harga bersama AHS/HSD sudah tersedia di core, tetapi pemasukan data sumber dan pemilihan otomatis katalog harga baru **belum dikerjakan**. Jangan menyalin harga lokal ke semua wilayah atau menimpa harga manual pengguna. Pertahankan sumber harga dan nilai KDN di metadata yang tersedia.
7. Uji satu sumber daya yang dipakai beberapa AHS, pergantian wilayah, harga manual, impor/ekspor dan backup. Laporkan cocok/tidak cocok/ambigu/tidak tersedia per item beserta alasan. UI/UX tetap memakai acuan terkunci.
