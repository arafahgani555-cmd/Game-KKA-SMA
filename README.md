# KKA EduGame: Konten Digital dalam Multimedia (Kelas X SMA)

Aplikasi web game edukasi interaktif berbahasa Indonesia untuk mata pelajaran **Koding dan Kecerdasan Artifisial (KKA)** kelas X SMA materi *"Konten Digital dalam Multimedia"*.

Aplikasi ini bersifat **statis murni (Client-Side Only)** tanpa backend, tanpa API key, dan tanpa berkas `.env`. Seluruh pemrosesan video kamera diproses secara lokal 100% di browser pengguna.

---

## 🎮 Dua Pilihan Game Interaktif

### 1. Game 1: Kiri atau Kanan (Berdiri di Sisi Jawaban)
* **Mekanisme**: Layar dibagi menjadi dua sisi warna kontras tinggi: **Sisi Kiri (Teal - Pilihan A)** dan **Sisi Kanan (Oranye - Pilihan B)**. Siswa berdiri atau bergerak ke sisi jawaban yang benar.
* **Deteksi Wajah AI**: Kamera mendeteksi jumlah wajah di masing-masing sisi menggunakan `@vladmandic/face-api` (Tiny Face Detector) dengan penstabil median 5 frame.
* **Kontrol Koreksi Manual**: Tersedia tombol `A+`, `A−`, `B+`, dan `B−` untuk mengoreksi hitungan jika ada siswa yang terhalang atau kamera tidak aktif.
* **4 Variasi Tipe Ronde**:
  1. *Pilih A atau B*: Jawaban benar vs satu pengecoh.
  2. *Benar atau Salah*: Menentukan kebenaran pernyataan konsep.
  3. *Cari yang BUKAN*: Memilih opsi yang keliru dari pertanyaan terbalik.
  4. *Ronde Kilat*: Durasi setengah dan skor bernilai ganda (×2).
* **Mode Eliminasi**: Siswa yang salah duduk, permainan berhenti jika tersisa 1 pemenang.

### 2. Game 2: Tangkap Kata (Lambaian Tangan di Depan Kamera)
* **Mekanisme**: Kapsul kata jawaban melayang turun dari atas layar pada 4 jalur berbeda. Siswa melambaikan tangan di depan kamera atau menyentuh layar proyektor untuk menangkap kapsul.
* **Deteksi Gerakan Murni (Tanpa Library Luar)**: Menggunakan pemrosesan selisih frame (*frame differencing*) pada kanvas beresolusi 80×45 dengan ambang selisih kecerahan 28 dan partikel feedback tembus pandang.
* **Sistem Penilaian**:
  * Menangkap jawaban benar: **+10 poin** (dengan pengganda kombo ×1.5, ×2).
  * Menangkap pengecoh biasa atau kata jebakan: **−5 poin** dan tampil alasan spesifik kekeliruannya.
* **Variasi Mode**: *Tangkap Satu*, *Tangkap Semua yang Benar*, *Urutkan Tahapan Multimedia*, *Kapsul Bintang Bonus (+5)*, dan *Kombo Streak*.

---

## 📚 Bank 100 Soal Lengkap (10 Soal per Topik)

1. Pengertian dan elemen multimedia (teks, gambar, audio, video, animasi)
2. Interaktivitas, perkembangan multimedia, AR dan VR
3. Perangkat lunak pembuat konten (Photoshop, Illustrator, Blender, Audacity, Canva, Premiere, Figma)
4. Tahapan produksi (praproduksi, produksi, pascaproduksi) dan storyboard
5. Gambar digital (bitmap vs vektor, piksel, resolusi, DPI, RGB vs CMYK, anti-aliasing)
6. Audio dan video digital (sample rate, frame rate, bitrate, codec, mono/stereo)
7. Format file dan kompresi (lossy vs lossless, JPEG, PNG, GIF, SVG, MP3, WAV, MP4, WebP)
8. Hak cipta, lisensi Creative Commons (BY, NC, SA, ND), etika, dan plagiarisme
9. Publikasi dan distribusi (SEO, hashtag, thumbnail, retensi, CDN, monetisasi, bandwidth)
10. AI dan koding dalam konten digital (Generative AI, prompt, deepfake, tag HTML `<img>`, `<video>`, atribut `alt`, `<canvas>`)

---

## 🚀 Cara Menjalankan di Komputer Lokal

1. **Prasyarat**: Pastikan Node.js (versi 18+) telah terpasang.
2. **Kloning Repositori**:
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd kka-edugame-multimedia
   ```
3. **Instal Dependensi**:
   ```bash
   npm install
   ```
4. **Jalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Buka peramban pada alamat `http://localhost:3000`.

---

## 🤖 Cara Menaruh Berkas Model Wajah AI

Model Tiny Face Detector dimuat dari rute `/models`. Untuk mengaktifkan deteksi wajah otomatis:
1. Unduh atau siapkan berkas bobot model Tiny Face Detector:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model.bin`
2. Letakkan kedua berkas tersebut ke dalam folder:
   ```text
   public/models/
   ├── tiny_face_detector_model-weights_manifest.json
   └── tiny_face_detector_model.bin
   ```
3. Jika berkas belum diletakkan, aplikasi **tetap 100% dapat dimainkan** menggunakan tombol hitungan manual di layar (`A+/A−` dan `B+/B−`).

---

## ⚙️ Cara Mengatur Sensitivitas & Kecepatan (Game 2)

Pada bilah atas Game 2 (Tangkap Kata):
- **Kecepatan**: Klik tombol `Kecepatan: Sedang` untuk beralih antara *Lambat*, *Sedang*, dan *Cepat*.
- **Sensitivitas**: Gunakan tombol `−` dan `+` untuk mengatur sensitivitas deteksi gerakan lambaian tangan (nilai rasio piksel 0.06 – 0.24).
- **Layar Sentuh / Mouse**: Anda dapat mengklik langsung kapsul jawaban kapan saja.

---

## ✍️ Cara Menambah & Mengelola Soal

Klik tombol **"Kelola & Edit Bank Soal"** di Menu Utama:
1. **Formulir Manual**: Masukkan pertanyaan, jawaban benar, penjelasan, dan 3 pilihan pengecoh beserta alasannya.
2. **Format Satu Baris per Soal (Pemisah Bar `|`)**:
   Format baris:
   ```text
   Topik|Level(1-3)|Pertanyaan...|JawabanBenar|Penjelasan|Pengecoh1|Alasan1|Pengecoh2|Alasan2|PengecohJebakan|AlasanJebakan
   ```
3. **Impor / Ekspor JSON**: Unduh seluruh soal aktif atau unggah berkas JSON cadangan.
4. **Kembalikan Soal Bawaan**: Tombol reset untuk menghapus soal kustom dan kembali ke 100 soal bawaan.

---

## 🌐 Langkah Deploy ke Vercel

Aplikasi ini sudah dikonfigurasi siap pakai untuk Vercel:
1. Dorong (*push*) proyek Anda ke repositori GitHub.
2. Buka dashboard [Vercel](https://vercel.com) dan pilih **Add New Project** -> **Import Git Repository**.
3. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Berkas `vercel.json` telah menyertakan konfigurasi izin kamera:
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Permissions-Policy",
             "value": "camera=(self)"
           }
         ]
       }
     ]
   }
   ```
5. Klik tombol **Deploy**. Proyek Anda akan langsung tayang di domain HTTPS Vercel!

---

## 🛡️ Kebijakan Privasi
Seluruh data kamera hanya diproses di memori RAM peramban secara lokal. Tidak ada streaming video atau data biometrik yang disimpan maupun dikirim ke server mana pun.
