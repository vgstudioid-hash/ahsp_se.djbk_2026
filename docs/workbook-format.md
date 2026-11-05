# Rujukan form: RAB JEMBATAN MJM.xlsm

Workbook unggahan dibaca menggunakan openpyxl tanpa menjalankan VBA/makro atau mengevaluasi formula. Sheet yang ditemukan: VOLUME, RAB, AHS, HSD, JADWAL. Permintaan implementasi ini menggunakan format RAB, AHS, dan HSD. VOLUME dan JADWAL belum diimplementasikan sebagai form tersendiri.

- RAB: judul Rencana Anggaran Biaya; subjudul HPS sesuai jenis dokumen; pemberi tugas, nama proyek, lokasi, koordinat, tahun. Header A9:H10 memiliki tujuh kolom logis karena B:C digabung: NO, URAIAN PEKERJAAN, VOLUME, SATUAN, HARGA SATUAN, JUMLAH HARGA, KET. Kelompok WBS dan rincian pekerjaan tetap dipertahankan.
- AHS: judul dan identitas proyek (baris 1–6), judul/kode pekerjaan (misalnya A8), tujuh kolom NO, URAIAN, KODE, SATUAN, KOEFISIEN, HARGA SATUAN, JUMLAH HARGA (baris 9). Kelompok A tenaga kerja, B bahan, C peralatan, D lain-lain dengan subtotal masing-masing; E biaya langsung A+B+C+D; F biaya umum/keuntungan; G harga satuan E+F. Harga/kode komponen di aplikasi terhubung ke HSD proyek.
- HSD: identitas proyek, tujuh kolom logis NO, URAIAN, KODE, SATUAN, HARGA SHB, HARGA SATUAN, KETERANGAN. Pembagian A/B/C/D sama dengan AHS. SHB disimpan sebagai harga pembanding, terpisah dari harga satuan yang dipakai menghitung AHS.

Nilai harga, identitas, volume, koefisien proyek 2025, diskon, pembulatan ratusan/ribuan, serta formula pajak pada workbook tidak diimpor otomatis. Sebagai contoh, koefisien pekerja pembersihan pada AHS!E11 berbeda dari template SE yang dipakai aplikasi; permintaan rujukan format tidak dianggap sebagai instruksi mengganti koefisien sumber. Tidak ada macro, VLOOKUP, atau formula lain dari berkas yang dieksekusi.

CSV HSD menyertakan kolom `kunci` untuk pencocokan komponen dan `harga` untuk harga satuan aktual. Kolom kode, harga shb, dan keterangan ikut diekspor/diimpor. SHB tidak mengubah harga satuan secara otomatis; harga diskon, konversi satuan, dan penyesuaian tahun harus ditentukan pengguna sesuai proyek.
