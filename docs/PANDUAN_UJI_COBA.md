# Panduan Uji Coba — Pengingat TTD

Panduan ini untuk siapa pun yang membantu menguji aplikasi sebelum penelitian dimulai (teman, beberapa siswi, atau pembimbing).

**Alamat aplikasi:** https://darahsehat-gamma.vercel.app

---

## 1. Akun uji coba

Data login tidak ditulis di file ini karena repo bersifat publik. Semua kredensial ada di file **`.env.local`** (di folder proyek, tidak ikut ter-upload ke GitHub). Minta ke peneliti jika Anda tidak memegang file tersebut.

### Siswi (sudah selesai semua langkah pendaftaran)
| | |
|---|---|
| Nomor WhatsApp | ada di `.env.local` → `UJI_SISWI_NO_WA` |
| PIN | ada di `.env.local` → `UJI_SISWI_PIN` |
| Nama | Siswi UJI COBA · XI IPA 1 · SMA Uji Coba |
| Kategori jadwal | Tidak anemia (Hb 12,8) → jadwal **mingguan** |
| Jadwal awal | Setiap **Sabtu** jam **07.00** |

Akun ini dipakai bersama. Kalau Anda ingin menguji alur pendaftaran dari awal, **daftar akun baru** memakai nomor WhatsApp Anda sendiri (lihat Skenario A).

### Orang tua & guru (tanpa login, cukup buka link)
| Peran | Link |
|---|---|
| Orang tua (Ibu) dari Siswi UJI COBA | ada di `.env.local` → `UJI_LINK_ORTU` |
| Guru dari Siswi UJI COBA | ada di `.env.local` → `UJI_LINK_GURU` |

### Peneliti
| | |
|---|---|
| Halaman | https://darahsehat-gamma.vercel.app/peneliti |
| Kata sandi | ada di `.env.local` → `PENELITI_PASSWORD` |

> Nomor ortu dan guru di akun uji coba adalah nomor fiktif. Tidak ada pesan WhatsApp yang dikirim ke siapa pun.

---

## 2. Gambaran alur aplikasi

```
SISWI
  Daftar (nama, kelas, sekolah, nomor WA, PIN, persetujuan)
    → Kontak orang tua & guru
    → Skrining Hb ──(belum pernah periksa)──→ "Jangan lupa periksa Hb dulu ya"
    → Pilih jam (dan hari, untuk jadwal mingguan)
    → Aktifkan pengingat + kirim link ke orang tua via WhatsApp
    → KALENDER: centang "Sudah minum TTD" di hari jadwal

KATEGORI JADWAL (dari skrining)
  Hb < 12 g/dL, atau pernah didiagnosis anemia → Anemia → kalender HARIAN
  Hb ≥ 12 g/dL                                  → Tidak anemia → kalender MINGGUAN
  Belum pernah periksa / Hb tidak diisi         → Belum diketahui → MINGGUAN + anjuran periksa Hb

PENGINGAT (otomatis, dicek tiap 5 menit, berhenti setelah dicentang)
  Jam minum          → notifikasi ke siswi + orang tua + guru
  +1 jam (anemia +30 menit) belum dicentang → notifikasi lebih tegas ke ketiganya
  19.00 belum dicentang → notifikasi terakhir, hanya ke siswi
  Orang tua/guru maksimal 2 pesan per hari; guru hanya di hari & jam sekolah (07.00–14.00)

ORANG TUA  buka link dari siswi → "Aktifkan pengingat" → melihat status minum anak
GURU       buka link dari peneliti → "Aktifkan pengingat" → ringkasan siswi yang belum minum
PENELITI   /peneliti → statistik, link undangan guru, tanda consent, ekspor CSV
```

---

## 3. Persiapan HP

| HP | Langkah |
|---|---|
| **Android** | Buka alamat aplikasi di **Google Chrome**. Bila muncul tawaran "Tambahkan ke layar utama / Instal aplikasi", setujui. |
| **iPhone** | Buka di **Safari** → tombol **Bagikan** (kotak dengan panah ke atas) → **Tambahkan ke Layar Utama** → buka aplikasi **dari ikon di layar utama**. Tanpa langkah ini notifikasi tidak bisa aktif di iPhone. |

Untuk HP **Xiaomi, Oppo, Vivo, Realme**, notifikasi bisa tertahan oleh penghemat baterai. Jika notifikasi tidak muncul, buka **Pengaturan → Aplikasi → Chrome → Baterai** lalu pilih **Tanpa batasan**, dan pastikan notifikasi Chrome diizinkan.

---

## 4. Skenario uji

Kerjakan berurutan dan centang yang berhasil. Kolom "Hasil yang diharapkan" adalah patokannya.

### A. Pendaftaran akun baru (pakai nomor sendiri)
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| A1 | Buka aplikasi → **Daftar sekarang** | Muncul form "Halo! Yuk kenalan dulu", Langkah 1 dari 4 | ☐ |
| A2 | Isi semua kolom, PIN 6 angka, **jangan** centang persetujuan | Tombol "Daftar & lanjut" tidak bisa ditekan | ☐ |
| A3 | Centang persetujuan → **Daftar & lanjut** | Pindah ke halaman kontak (Langkah 2) | ☐ |
| A4 | Isi nomor orang tua **sama** dengan nomor sendiri | Muncul peringatan, tidak bisa lanjut | ☐ |
| A5 | Isi nomor orang tua yang benar (guru boleh dikosongkan) → **Simpan & lanjut** | Pindah ke skrining (Langkah 3) | ☐ |
| A6 | Pilih **Belum** periksa Hb, diagnosis **Tidak tahu** | Kotak kategori berubah menjadi "Belum diketahui" (ungu) | ☐ |
| A7 | **Lihat jadwalku** | Muncul halaman "Jangan lupa periksa Hb dulu ya" | ☐ |
| A8 | **Oke, aku akan periksa** | Halaman pilih hari & jam (Langkah 4) | ☐ |
| A9 | Pilih hari ini dan jam beberapa menit dari sekarang → **Simpan & lanjut** | Halaman "Satu langkah lagi" | ☐ |
| A10 | **Lihat kalenderku** | Kalender mingguan dengan tombol "Sudah minum TTD" | ☐ |
| A11 | Menu **Profil** → **Keluar**, lalu **Masuk** lagi dengan nomor + PIN | Kembali ke kalender | ☐ |
| A12 | Coba masuk dengan PIN salah | Muncul "Nomor atau PIN salah" | ☐ |

### B. Skrining dengan hasil berbeda
Dari **Profil** → **Sudah periksa lagi? Perbarui Hb**:
| # | Isian | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| B1 | Pernah periksa, Hb `11,5` | Kategori **Anemia** → masuk kalender **harian** ("Hari ke-…") | ☐ |
| B2 | Pernah periksa, Hb `13` | Kategori **Tidak anemia** → kalender **mingguan** | ☐ |
| B3 | Pernah periksa, Hb dikosongkan, diagnosis **Ya** | Kategori **Anemia** | ☐ |
| B4 | Hb `30` (tidak masuk akal) | Muncul peringatan kadar Hb belum benar | ☐ |

### C. Kalender & centang minum
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| C1 | Di hari jadwal, tekan **Sudah minum TTD** | Tombol berubah menjadi "Sudah diminum", tanggal hari ini jadi kotak berry | ☐ |
| C2 | Tekan lagi tombol "Sudah diminum" | Centang dibatalkan (hanya bisa untuk hari ini) | ☐ |
| C3 | Lihat angka **Kepatuhan** | Persentase sesuai jumlah jadwal yang dicentang | ☐ |
| C4 | Geser bulan dengan panah ‹ › | Kalender bulan sebelum/berikutnya tampil | ☐ |
| C5 | Di hari **tanpa** jadwal (mingguan) | Tertulis "Jadwal berikutnya: …" dan tidak ada tombol centang | ☐ |
| C6 | Jika ada jadwal kemarin yang terlewat | Muncul kotak "TTD … belum dicentang. Sudah diminum tapi lupa centang?" | ☐ |

### D. Haid
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| D1 | Tekan **Saya sedang haid** | Berubah menjadi "Haid hari ke-1", pesan di kartu berubah | ☐ |
| D2 | Lihat kalender | Hari ini ditandai warna haid (pink) | ☐ |
| D3 | Tekan **Haid sudah selesai** | Kembali ke tombol "Saya sedang haid" | ☐ |
| D4 | Jadwal **tidak** bertambah saat haid | Hanya pesan yang berubah (sesuai pedoman 1 tablet/minggu) | ☐ |

### E. Notifikasi
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| E1 | Menu **Pengingat** → **Aktifkan pengingat** → izinkan | Kotak hijau "Pengingat aktif di HP ini" | ☐ |
| E2 | **Kirim notifikasi uji** | Notifikasi "Tes pengingat TTD" muncul di HP | ☐ |
| E3 | Ketuk notifikasi | Aplikasi terbuka di kalender | ☐ |
| E4 | Atur jam minum ±10 menit dari sekarang (hari ini) → **Simpan jadwal**, **jangan centang** | Dalam ≤ 5 menit setelah jam itu muncul "Waktunya minum TTD" | ☐ |
| E5 | Tetap jangan centang | +1 jam (anemia +30 menit) muncul "Kamu belum minum TTD hari ini" | ☐ |
| E6 | Centang setelah notifikasi pertama | Notifikasi kedua **tidak** datang | ☐ |

Pengingat dicek tiap 5 menit, jadi jeda sampai 5 menit itu normal.

### F. Orang tua
Pakai HP lain kalau bisa, atau link ortu akun uji coba.
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| F1 | Di akun siswi: **Profil** → **Kirim link via WhatsApp** | WhatsApp terbuka dengan pesan berisi link ke nomor orang tua | ☐ |
| F2 | Buka link di HP orang tua | Halaman "Halo, Ibu/Ayah…" dengan status minum anak | ☐ |
| F3 | **Aktifkan pengingat** | Kotak hijau "Pengingat aktif"; di Profil siswi status ortu menjadi "Pengingat aktif" | ☐ |
| F4 | Siswi mencentang minum, lalu halaman ortu dimuat ulang | Status menjadi "Sudah minum" | ☐ |
| F5 | Saat jam minum (Skenario E4) | HP orang tua menerima "Sudah waktunya … minum TTD, mohon diingatkan ya" | ☐ |
| F6 | **Berhenti menerima pengingat** | Muncul tombol "Terima pengingat lagi" | ☐ |
| F7 | Halaman ortu **tidak** menampilkan kadar Hb atau kategori anemia | Hanya jadwal & status minum | ☐ |

### G. Guru
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| G1 | Buka link guru | Daftar siswi (nama depan + kelas) dan status hari ini | ☐ |
| G2 | **Aktifkan pengingat** | Kotak hijau "Pengingat aktif" | ☐ |
| G3 | Jadwal siswi di hari & jam sekolah | Guru menerima **satu** ringkasan berisi nama siswi yang belum minum | ☐ |
| G4 | Jadwal di luar jam sekolah (mis. 19.00) atau hari Minggu | Guru **tidak** menerima notifikasi | ☐ |

### H. Edukasi
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| H1 | Menu **Edukasi** | 5 topik: cara minum, anemia, dosis, pencegahan, makanan | ☐ |
| H2 | Buka setiap topik | Teks terbaca jelas, tombol kembali berfungsi | ☐ |

### I. Peneliti (khusus peneliti)
| # | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| I1 | Buka `/peneliti`, masukkan kata sandi | Dasbor dengan angka statistik | ☐ |
| I2 | Unduh **Kepatuhan harian** | File CSV terbuka rapi di Excel (kolom terpisah) | ☐ |
| I3 | Tabel guru → **Kirim via WA** | WhatsApp terbuka dengan pesan undangan + link guru | ☐ |
| I4 | **Tandai diterima** pada kolom consent kertas | Berubah menjadi "✓ Diterima" | ☐ |

### J. Kenyamanan
| # | Yang dinilai | Catatan |
|---|---|---|
| J1 | Kecepatan pindah menu | |
| J2 | Teks mudah dipahami, tidak menggurui | |
| J3 | Tombol mudah diketuk | |
| J4 | Tampilan rapi di HP Anda (tidak terpotong) | |

---

## 5. Cara melaporkan masalah

Untuk setiap masalah, kirim ke peneliti:
1. **Nomor skenario** (mis. "E4")
2. **Merek & tipe HP** dan **browser** (Chrome / Safari / dari ikon layar utama)
3. **Apa yang terjadi** vs **apa yang diharapkan**
4. **Screenshot** atau rekaman layar
5. **Jam kejadian** (penting untuk masalah notifikasi)

---

## 6. Setelah uji coba selesai (untuk peneliti)

Sebelum penelitian dimulai, hapus semua data uji agar tidak ikut dianalisis:
1. Supabase → **Authentication → Users** → hapus akun uji (email berawalan nomor `UJI_SISWI_NO_WA` dengan format `62…@siswi.pengingat-ttd.app`, serta akun teman yang ikut mencoba). Data siswinya ikut terhapus otomatis.
2. Supabase → **Table Editor → penerima** → hapus baris "Ortu UJI COBA", "Guru UJI COBA", dan kontak uji lainnya.
3. Opsional: kosongkan tabel `log_notifikasi`, `klaim_pengingat`, dan `kunjungan_edukasi`.
4. Isi `periode_penelitian` di tabel **pengaturan** dengan tanggal mulai & selesai penelitian.
5. Hapus baris `UJI_...` dari `.env.local`.
