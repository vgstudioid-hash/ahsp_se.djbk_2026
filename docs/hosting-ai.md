# Mengaktifkan Asisten AI di RAB Studio

Website GitHub Pages tetap menjadi aplikasi utama. Layanan Node.js terpisah meneruskan permintaan analisis ke OpenAI dan menyimpan API key di server. Menu **Asisten AI** menampilkan jawaban langsung dalam website; pengguna tidak perlu membuka ChatGPT.

Langganan ChatGPT dan penggunaan OpenAI API memiliki penagihan terpisah. Siapkan akun OpenAI API, aktifkan billing, dan tetapkan batas pemakaian sesuai kebutuhan. Hosting dan API dapat menimbulkan biaya. Implementasi ini tidak membuat akun, langganan, atau layanan berbayar otomatis.

## Pilihan hosting: Render Web Service

1. Masuk ke Render dan pilih **New → Web Service**, kemudian hubungkan repository `vgstudioid-hash/ahsp_se.djbk_2026`, branch `main`.
2. Pilih runtime **Node**, build command `npm run build`, start command `npm start`. Gunakan versi Node minimal 20. Pilih paket hosting sesuai kebutuhan; periksa harga dan ketentuan terbaru sebelum membuat layanan.
3. Tambahkan environment variables berikut di dashboard Render. Isi nilai secret hanya di dashboard hosting, jangan di chat, GitHub, file sumber atau pengaturan frontend.

| Variabel | Nilai |
| --- | --- |
| `OPENAI_API_KEY` | API key dari dashboard OpenAI API |
| `OPENAI_MODEL` | `gpt-4.1-mini` atau model Responses API yang tersedia di akun Anda |
| `AI_ACCESS_TOKEN` | Token acak minimal 32 karakter, untuk akses layanan RAB |
| `AI_ALLOWED_ORIGINS` | `https://vgstudioid-hash.github.io` |

Buat token layanan di komputer lokal dengan `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Token ini **berbeda dari API key OpenAI**. Jika menggunakan domain website lain, tambahkan origin lengkap (scheme dan domain, tanpa path atau slash akhir), dipisahkan koma. Untuk pengujian lokal tambahkan `http://localhost:3000` atau origin lokal yang digunakan.

4. Deploy layanan. Render menyediakan alamat HTTPS, misalnya `https://rab-ai-anda.onrender.com`. Endpoint analisisnya: `https://rab-ai-anda.onrender.com/api/analysis`.
5. Buka website RAB Studio → **Asisten AI → Pengaturan koneksi AI**. Isi alamat endpoint dan **token layanan** (`AI_ACCESS_TOKEN`), lalu tekan **Analisis RAB otomatis**. API key OpenAI tidak pernah dimasukkan di website. Pengaturan koneksi dan percakapan hanya tersimpan di memori tab, terpisah untuk setiap proyek; muat ulang halaman akan menghapusnya.
6. Periksa jawaban dengan proyek kecil terlebih dahulu. Pastikan nama proyek, harga yang belum terisi, total dan pagu sesuai. Uji juga pertanyaan lanjutan. Tombol **Bersihkan percakapan** memulai sesi baru setelah maksimal 20 pesan.

Server yang sama juga dapat melayani aplikasi pada root URL hosting dengan `npm start`. Rute API tetap `/api/analysis`; izinkan origin hosting tersebut di `AI_ALLOWED_ORIGINS` jika digunakan. GitHub Pages tidak dapat mengeksekusi server ini, dan GitHub Actions secret saja tidak mengaktifkan endpoint.

## Data dan batas layanan

- Setelah pengguna menekan Analisis atau Kirim, salinan proyek aktif, termasuk identitas, AHS/koefisien, HSD, SMKK dan Quantity, dikirim ke server lalu OpenAI. UI memberi tahu pengguna sebelum pengiriman. Jangan gunakan data yang tidak boleh dikirim ke penyedia AI.
- Server memvalidasi proyek dan menghitung ulang subtotal/pajak/total melalui mesin perhitungan aplikasi. Jawaban hanya saran, tanpa mengubah data RAB.
- Permintaan OpenAI menggunakan Responses API dengan `store: false`. Ini bukan janji tanpa retensi; kebijakan pemrosesan data penyedia tetap berlaku.
- API key hanya di server; server tidak mengembalikan detail error penyedia atau kredensial. Respons AI ditampilkan sebagai teks, bukan HTML aktif.
- Wajib token, origin harus diizinkan untuk browser, maksimum 10 permintaan per menit per token per proses, body 750 KB, 20 pesan, 2.500 output token dan timeout 55 detik. Batas ini membantu mengendalikan pemakaian, bukan pengganti batas anggaran akun OpenAI.
- Token layanan adalah akses bersama untuk tahap awal pengguna terbatas. Jangan menaruhnya di bundle, repository, URL, atau membagikannya secara publik. Ganti di hosting jika bocor. Untuk akses publik banyak pengguna, tambahkan login individual, kuota per pengguna dan penyimpanan pembatasan terpusat sebelum membuka akses; CORS bukan pengganti autentikasi.
- AI tidak membaca seluruh PDF secara otomatis. Ia menerima data proyek dan metadata referensi. Integrasi pencarian kutipan PDF dapat dikembangkan terpisah; jawaban tidak boleh mengarang koefisien atau ketentuan.

## Mengatasi masalah

| Pesan | Tindakan |
| --- | --- |
| Koneksi AI belum diaktifkan | Isi endpoint dan token layanan di panel koneksi |
| Layanan belum dikonfigurasi | Pastikan API key dan token minimal 32 karakter tersedia di environment hosting; restart/deploy ulang |
| Token tidak valid | Samakan token yang diinput dengan `AI_ACCESS_TOKEN` |
| Origin belum diizinkan / Failed to fetch | Periksa `AI_ALLOWED_ORIGINS`, alamat HTTPS, dan status layanan hosting |
| Layanan belum tersedia pada alamat ini | Gunakan endpoint server Node, bukan URL GitHub Pages |
| Kuota/batas OpenAI tercapai | Periksa billing, kuota dan model di akun OpenAI |
| Waktu habis | Periksa hosting yang sedang tidur, tunggu server siap, atau gunakan proyek lebih kecil |

## Menjalankan lokal

Jalankan Node dengan environment variables yang sama melalui pengaturan secret shell/hosting Anda, lalu `npm start`. Jangan menulis secret ke file tracked. Server tidak memuat `.env` otomatis; gunakan secret manager atau `node --env-file=.env scripts/server.mjs` pada Node yang mendukungnya. File `.env` diabaikan Git.

Pengujian otomatis menggunakan respons OpenAI tiruan agar tidak mengirim data nyata atau menghabiskan biaya API. Koneksi produksi baru dapat diverifikasi setelah hosting, billing dan secret disiapkan.
