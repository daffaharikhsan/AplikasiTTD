# Membuat Akun Uji Coba & Menghapus Data Uji

Panduan untuk peneliti: cara membuat akun uji coba (siswi, orang tua, guru) dan cara membersihkannya sebelum penelitian dimulai.

**Alamat aplikasi:** https://darahsehat-gamma.vercel.app

> **Aturan utama:** setiap data uji coba **diberi penanda "UJI"**, yaitu nama diawali `UJI` dan sekolah diisi `SMA Uji Coba`. Dengan begitu semua data uji bisa dihapus sekaligus tanpa menyentuh data siswi sungguhan.

---

## A. Membuat akun uji coba

### A1. Siswi uji
Daftar biasa lewat aplikasi. Tidak ada kode OTP, jadi nomor fiktif pun bisa dipakai.

1. Buka alamat aplikasi → **Daftar sekarang**.
2. Isi dengan penanda uji:

   | Kolom | Contoh | Keterangan |
   |---|---|---|
   | Nama lengkap | `UJI Ani` | **Wajib** diawali `UJI` |
   | Kelas / Rombel | `XI` / `IPA 1` | Bebas |
   | Sekolah | `SMA Uji Coba` | Dipakai untuk penanda penghapusan |
   | Nomor WhatsApp | `0812 0000 0011` | Nomor fiktif berformat benar; **setiap akun harus berbeda** (`…0011`, `…0012`, dst.) |
   | PIN | `123456` | Bebas 6 angka; catat untuk login lagi |

3. Centang persetujuan → **Daftar & lanjut**.
4. **Kontak orang tua:** isi nomor fiktif lain, misalnya `0812 0000 0111`. Nomor ini tidak boleh sama dengan nomor siswi.
5. **Kontak guru:** boleh dikosongkan, atau isi `0812 0000 0999` supaya semua akun uji memakai **satu guru uji yang sama**.
6. **Skrining:** pilih sesuai kategori yang ingin diuji:

   | Isian | Hasil |
   |---|---|
   | Pernah periksa, Hb `11,5` | Anemia → kalender **harian** |
   | Pernah periksa, Hb `13` | Tidak anemia → kalender **mingguan** |
   | Belum pernah periksa | Belum diketahui → kalender **mingguan** + anjuran periksa Hb |

7. **Jadwal:** pilih **hari ini** dan jam **beberapa menit ke depan**. Kotak hijau "Pengingat berikutnya" harus bertuliskan "hari ini".
8. Di halaman berikutnya, tekan **Aktifkan pengingat**.

Kalau penguji memakai **nomor WhatsApp aslinya sendiri**, itu juga boleh. Yang penting nama tetap diawali `UJI`.

### A2. Orang tua uji
1. Login sebagai siswi uji → menu **Profil** → **Kirim link via WhatsApp**.
2. Karena nomor ortunya fiktif, WhatsApp tidak bisa mengirim. **Salin link** (`…/o/…`) dari isi pesan itu, lalu buka di HP lain atau kirim ke HP sendiri.
3. Di HP tersebut:
   - **Android:** buka di Chrome → **Aktifkan pengingat**. Opsional: ⋮ → **Tambahkan ke layar utama**.
   - **iPhone:** buka di Safari → **Bagikan** → **Tambahkan ke Layar Utama** → buka dari ikon itu → **Aktifkan pengingat**.

### A3. Guru uji
1. Buka `/peneliti` (kata sandi: `PENELITI_PASSWORD` di `.env.local`).
2. Bagian **Guru** → baris guru uji → **Buka link**.
3. Buka link itu di HP penguji → **Aktifkan pengingat**.
4. Guru hanya menerima pengingat pada **hari dan jam sekolah** (bawaan Senin–Jumat, 07.00–14.00). Untuk menguji guru, atur jadwal siswi uji di rentang itu.

### A4. Tips menguji pengingat
- Pengingat dicek **setiap 5 menit**, jadi jeda sampai 5 menit setelah jam minum itu normal.
- Setelah jadwal diganti, pengingat hari itu langsung mengikuti jam yang baru.
- Orang tua dan guru menerima **maksimal 2 pesan per hari**. Kalau sudah 2 kali, pengingat berikutnya baru datang besok.
- Pengingat berhenti setelah siswi mencentang **Sudah minum TTD**. Jangan centang dulu kalau ingin menguji pengingat kedua.

---

## B. Menghapus data uji coba

Saat akun siswi dihapus, data berikut **ikut terhapus otomatis**: skrining, centang minum, haid, perangkat notifikasi, catatan pengingat, log notifikasi, dan kunjungan edukasi. Yang **tidak** ikut terhapus adalah data orang tua/guru (tabel `penerima`), karena satu guru bisa terhubung ke banyak siswi.

### Cara 1: lewat dashboard (untuk 1–3 akun)
1. Supabase → **Authentication → Users**.
2. Cari email akun uji, dengan format: `62` + nomor tanpa angka 0 di depan + `@siswi.pengingat-ttd.app`.
   Contoh: nomor `0812 0000 0011` → `6281200000011@siswi.pengingat-ttd.app`
3. Klik **⋯** → **Delete user** → konfirmasi.
4. Supabase → **Table Editor → penerima** → hapus baris orang tua/guru uji (nama berawalan "UJI" atau nomor fiktif).

### Cara 2: lewat SQL (untuk banyak akun sekaligus)
Supabase → **SQL Editor** → **+** (query baru). Jalankan **satu langkah per satu kali Run**.

**Langkah 1: lihat dulu akun yang akan terhapus**
```sql
select nama, kelas, sekolah, no_wa, created_at
from public.siswi
where nama ilike 'uji%' or sekolah ilike '%uji coba%'
order by created_at;
```
Periksa daftarnya. **Kalau ada siswi sungguhan yang ikut tercantum, berhenti di sini** dan hapus akun uji satu per satu dengan Cara 1.

**Langkah 2: hapus akun uji beserta datanya**
```sql
delete from auth.users
where id in (
  select id from public.siswi
  where nama ilike 'uji%' or sekolah ilike '%uji coba%'
);
```

**Langkah 3: hapus orang tua/guru yang tidak lagi terhubung ke siswi mana pun**
```sql
delete from public.penerima p
where not exists (
  select 1 from public.siswi_penerima sp where sp.penerima_id = p.id
);
```

**Langkah 4: cek hasil**
```sql
select (select count(*) from public.siswi)    as siswi,
       (select count(*) from public.penerima) as ortu_guru;
```

### Cara 3: reset total (sekali saja, tepat sebelum penelitian dimulai)
> ⚠️ **Menghapus SEMUA siswi, orang tua, guru, dan log notifikasi**, termasuk yang tidak berpenanda UJI. Jalankan **hanya sebelum** siswi sungguhan mulai mendaftar, dan **jangan pernah** setelah penelitian berjalan.

```sql
delete from auth.users where id in (select id from public.siswi);
delete from public.penerima;
truncate public.log_notifikasi, public.klaim_pengingat, public.kunjungan_edukasi;
```

Tabel `pengaturan` (batas Hb, dosis, jam sekolah, periode penelitian, dll.) **tidak** ikut terhapus.

---

## C. Daftar periksa setelah data uji dihapus

- [ ] Akun yang dibuat sebelum aturan penanda "UJI" (nama tanpa awalan UJI) sudah diperiksa dan dihapus manual lewat Cara 1 bila memang akun uji.
- [ ] Jumlah siswi dan ortu/guru di Langkah 4 sesuai harapan (biasanya `0` sebelum penelitian).
- [ ] Baris `UJI_...` di `.env.local` sudah dihapus.
- [ ] `periode_penelitian` di tabel `pengaturan` sudah diisi tanggal mulai & selesai.
- [ ] `/peneliti` menampilkan angka nol / kosong, dan siap dipakai untuk peserta sungguhan.
