# Acuan UX/UI yang dikunci pengguna

Instruksi eksplisit pengguna, ditegaskan 14 November 2026: **jangan pernah mengubah UX/UI kecuali pengguna meminta penyesuaian atau koreksi tersebut.**

Acuan terkunci adalah build **d26ee01e41a9**, implementasi pada commit **1f7098e**. Berlaku untuk seluruh halaman, sidebar, dialog, tabel, hasil responsif, dan interaksi aplikasi.

- Pertahankan tata letak, hierarki, font, ukuran, warna, ikon, jarak, posisi, bentuk tombol, teks kontrol, efek interaksi, navigasi, dan perilaku freeze yang sudah disetujui.
- Ketika pengguna meminta perubahan UX/UI, ubah hanya elemen dan perilaku yang termasuk permintaan itu. Permintaan koreksi satu bagian tidak membuka izin untuk merancang ulang atau menyeragamkan bagian lain.
- Jangan mengubah tampilan atas inisiatif sendiri ketika merapikan kode, menambah fitur nonvisual, memperbarui dependensi, mengoreksi data AHS/HSD, atau memperbaiki logika. Gunakan pola/komponen yang sudah ada dan pertahankan bagian di luar lingkup permintaan.
- Perubahan isi data yang memang diminta boleh tampil melalui komponen yang ada; hal itu bukan izin mengganti desain komponen tersebut.
- Bila pekerjaan yang diminta benar-benar memerlukan perubahan UX/UI tambahan di luar lingkupnya, jelaskan keterkaitannya dan minta instruksi pengguna sebelum mengubah bagian tambahan itu. Jangan meminta konfirmasi ulang untuk bagian yang sudah diminta secara eksplisit.
- Untuk perubahan tampilan yang diminta, periksa tampilan terkait pada desktop/ponsel dan pastikan area lain tetap mengikuti acuan ini. Jangan mengganti acuan terkunci dengan acuan baru tanpa instruksi pengguna.

Dokumen ini mencatat preferensi pengguna yang berlaku lintas tugas; instruksi eksplisit pengguna berikutnya menentukan perubahan yang diizinkan.
