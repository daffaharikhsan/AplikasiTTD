# Pengingat TTD

PWA pengingat minum Tablet Tambah Darah (TTD) berbasis kalender untuk siswi SMA, dengan dukungan orang tua dan guru. Dibuat untuk penelitian S1 Kebidanan.

**Teknologi:** Next.js 16 (PWA) · Supabase (database, login, penjadwal pg_cron) · Web Push · Vercel. Tanpa WhatsApp gateway: pengingat lewat push notification.

Panduan uji coba untuk penguji: [docs/PANDUAN_UJI_COBA.md](docs/PANDUAN_UJI_COBA.md)  
Membuat akun uji & menghapus data uji: [docs/AKUN_DAN_DATA_UJI.md](docs/AKUN_DAN_DATA_UJI.md)

## Alur

| Siapa | Yang dilakukan |
|---|---|
| Siswi | Daftar (nomor WA + PIN) → kontak ortu & guru → skrining Hb → pilih jam/hari minum → aktifkan notifikasi → centang "Sudah minum TTD" di kalender |
| Orang tua/wali | Menerima link dari siswi lewat WhatsApp → buka → "Aktifkan pengingat". Tanpa akun |
| Guru | Menerima link dari peneliti (halaman `/peneliti`) → buka → "Aktifkan pengingat". Menerima **ringkasan** satu pesan per jam minum, hanya di jam sekolah |
| Peneliti | Halaman `/peneliti`: statistik KPI, daftar guru + link undangan, tanda consent kertas, ekspor CSV |

**Pengingat bertingkat** (dicek tiap 5 menit):
1. Jam minum: siswi + ortu + guru
2. +1 jam (anemia +30 menit) jika belum dicentang: siswi + ortu + guru, dengan nada lebih tegas
3. Malam (19.00): hanya siswi

Pengingat berhenti setelah siswi mencentang. Maksimal 2 pesan/hari per ortu/guru. Semua pengingat dikirim lewat push notification. WhatsApp hanya dipakai siswi/peneliti untuk membagikan link secara manual (tombol "Kirim link via WhatsApp").

**Jadwal** (pedoman baru): tidak anemia dan belum diketahui = 1 tablet/minggu pada hari pilihan siswi. Anemia = harian. Tombol haid **tidak** menambah jadwal; tombol ini mencatat haid dan mengganti isi pesan.

---

## Cara memasang (sekali saja)

### 1. Supabase
1. Buka project Supabase → **SQL Editor** → New query → tempel isi [`supabase/migrations/0001_skema.sql`](supabase/migrations/0001_skema.sql) → **Run**.
2. Buka **Project Settings → API**, lalu catat `Project URL`, `anon public key`, dan `service_role key`.

Tidak perlu mengubah pengaturan Auth: akun siswi dibuat server dalam keadaan sudah terkonfirmasi.

### 2. Kunci push notification (VAPID)
```bash
npx web-push generate-vapid-keys
```
Simpan `Public Key` dan `Private Key`.

### 3. Deploy ke Vercel
1. Push repo ini ke GitHub, lalu di Vercel pilih **Add New → Project** → import repo.
2. Di **Environment Variables**, isi semua variabel dari [`.env.example`](.env.example):

| Variabel | Isi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | dari langkah 1 |
| `NEXT_PUBLIC_APP_URL` | domain Vercel, mis. `https://pengingat-ttd.vercel.app` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | dari langkah 2 |
| `VAPID_SUBJECT` | `mailto:` + email peneliti |
| `CRON_SECRET` | string acak panjang (mis. hasil `openssl rand -hex 24`) |
| `PENELITI_PASSWORD` | kata sandi halaman `/peneliti` (min. 8 karakter) |

3. Deploy. Jika `NEXT_PUBLIC_APP_URL` baru diketahui setelah deploy pertama, isi lalu **Redeploy**.

### 4. Nyalakan penjadwal
Buka [`supabase/migrations/0002_cron.sql`](supabase/migrations/0002_cron.sql), ganti `NAMA-APLIKASI.vercel.app` dan `ISI_CRON_SECRET`, lalu jalankan di SQL Editor.

Uji manual:
```bash
curl -X POST https://NAMA-APLIKASI.vercel.app/api/cron/pengingat -H "Authorization: Bearer ISI_CRON_SECRET"
```

### 5. Uji coba
1. Buka aplikasi di HP → daftar → selesaikan semua langkah.
2. Menu **Pengingat** → **Kirim notifikasi uji**. Notifikasi harus muncul.
3. Atur jam minum 5–10 menit dari sekarang, lalu tunggu pengingat datang.
4. Di iPhone, notifikasi hanya bekerja setelah aplikasi dibuka lewat Safari → Bagikan → **Tambahkan ke Layar Utama**.

---

## Mengubah angka dosis & aturan (tanpa coding)

Semua angka klinis dan aturan ada di tabel **`pengaturan`** (Supabase → Table Editor). Ubah kolom `nilai`, dan perubahan berlaku dalam 1 menit tanpa deploy ulang.

| Kunci | Bawaan | Keterangan |
|---|---|---|
| `batas_hb_anemia` | `12` | Hb < angka ini → kategori anemia. **Validasi dengan pembimbing** |
| `dosis_anemia` | `"1 tablet TTD setiap hari"` | Teks dosis harian. **Validasi dengan tenaga kesehatan** |
| `dosis_pencegahan` | `"1 tablet TTD"` | Teks dosis mingguan |
| `jeda_tahap2_menit` | anemia 30, lainnya 60 | Jeda pengingat kedua |
| `jam_tahap3` | `"19:00"` | Pengingat malam |
| `hari_sekolah`, `jam_sekolah` | Sen–Jum, 07:00–14:00 | Guru hanya dikirimi di rentang ini |
| `maks_pesan_per_hari` | `2` | Per ortu/guru |
| `lama_haid_otomatis` | `7` | Haid otomatis selesai setelah N hari |
| `periode_penelitian` | `{"mulai":null,"selesai":null}` | Isi tanggal `YYYY-MM-DD` untuk membatasi pengingat & rekap |
| `zona_waktu` | `"Asia/Jakarta"` | Zona **sekolah**: dipakai untuk jam sekolah guru dan untuk siswi yang zona HP-nya belum terbaca. Jam minum siswi mengikuti zona waktu HP masing-masing (WIB/WITA/WIT/luar negeri) |

Teks pesan pengingat ada di [`src/lib/pesan.ts`](src/lib/pesan.ts). Teks edukasi ada di [`src/lib/edukasi.tsx`](src/lib/edukasi.tsx), dan teks lembar persetujuan di [`src/app/persetujuan/page.tsx`](src/app/persetujuan/page.tsx). **Ketiganya perlu ditinjau pembimbing.**

## Data untuk analisis

Di halaman `/peneliti` tersedia tombol ekspor CSV. Yang terpenting:
- **Kepatuhan harian**: satu baris per siswi per tanggal jadwal (`diminum` 1/0, jam centang, sedang haid).
- **Rekap kepatuhan per siswi**: jumlah jadwal, jumlah diminum, persen.
- **Log notifikasi**: untuk KPI "pesan terkirim ≥ 95%".

Data yang sama juga tersedia sebagai view `rekap_kepatuhan_harian` dan `rekap_kepatuhan_siswi` di Supabase.

## Catatan & keterbatasan
- Centang adalah laporan diri sendiri (self-report).
- Siswi bisa mencentang jadwal yang terlewat sampai 6 hari ke belakang (jam centang tercatat, jadi bisa dibedakan saat analisis). Pembatalan centang hanya untuk hari ini.
- Jika kategori siswi berubah (mis. setelah periksa Hb), rekap kepatuhan memakai kategori **terbaru** untuk seluruh periode. Riwayat skrining tetap tersimpan di tabel `skrining`.
- Satu HP hanya bisa menerima push untuk satu peran. Jika siswi memakai HP orang tua, push terakhir yang diaktifkan yang berlaku.
- Push notification bergantung pada browser. Beberapa HP Android (Xiaomi, Oppo, Vivo) perlu mengizinkan Chrome berjalan di latar belakang.

## Pengembangan lokal
```bash
cp .env.example .env.local   # isi nilainya
npm install
npm run dev                  # http://localhost:3000
npm run uji                  # uji logika jadwal
npm run cek-data             # cek kualitas data penelitian di Supabase (hanya membaca)
npm run build
```
