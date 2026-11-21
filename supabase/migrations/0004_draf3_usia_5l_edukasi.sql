-- =====================================================================
-- PRD Draf 3: usia siswi, skrining gejala 5L & pola makan, log edukasi per siswi.
-- Jalankan SEBELUM men-deploy kode yang memakainya. Aman dijalankan berulang.
-- =====================================================================

-- ---------- Usia (registrasi) ----------
alter table public.siswi add column if not exists usia smallint
  check (usia between 10 and 25);

-- ---------- Skrining tambahan: gejala 5L (0 = tidak pernah, 1 = kadang, 2 = sering) ----------
-- Hanya indikator tambahan untuk peneliti, TIDAK dipakai menentukan status/dosis.
alter table public.skrining
  add column if not exists g_lemah   smallint check (g_lemah   between 0 and 2),
  add column if not exists g_letih   smallint check (g_letih   between 0 and 2),
  add column if not exists g_lesu    smallint check (g_lesu    between 0 and 2),
  add column if not exists g_lalai   smallint check (g_lalai   between 0 and 2),
  add column if not exists g_lunglai smallint check (g_lunglai between 0 and 2);

alter table public.skrining
  add column if not exists skor_5l smallint generated always as (
    case when g_lemah is null or g_letih is null or g_lesu is null or g_lalai is null or g_lunglai is null
         then null
         else g_lemah + g_letih + g_lesu + g_lalai + g_lunglai end
  ) stored;

-- ---------- Skrining tambahan: kebiasaan pola makan ----------
alter table public.skrining
  add column if not exists makan_zat_besi text
    check (makan_zat_besi in ('tidak_pernah', '1_2x', '3_4x', '5x_lebih')),
  add column if not exists teh_kopi_saat_makan boolean,
  add column if not exists lewat_sarapan text
    check (lewat_sarapan in ('tidak_pernah', 'kadang', 'sering')),
  add column if not exists diet_pembatasan boolean,
  add column if not exists vitamin_c_saat_makan text
    check (vitamin_c_saat_makan in ('ya', 'tidak', 'tidak_tahu'));

-- ---------- Log akses edukasi lengkap (per kunjungan) ----------
create or replace view public.kunjungan_edukasi_lengkap with (security_invoker = true) as
select
  k.id,
  k.siswi_id,
  s.nama,
  s.kelas,
  s.sekolah,
  k.topik,
  (k.created_at at time zone coalesce(
     (select nilai #>> '{}' from public.pengaturan where kunci = 'zona_waktu'), 'Asia/Jakarta')) as waktu_akses
from public.kunjungan_edukasi k
join public.siswi s on s.id = k.siswi_id;

-- ---------- Rekap akses edukasi per siswi (termasuk yang belum membuka sama sekali) ----------
create or replace view public.rekap_edukasi_siswi with (security_invoker = true) as
select
  s.id as siswi_id,
  s.nama,
  s.kelas,
  s.sekolah,
  s.status as kategori_jadwal,
  count(distinct k.topik) as jumlah_topik_dibuka,
  count(k.id) as jumlah_kunjungan,
  (max(k.created_at) at time zone coalesce(
     (select nilai #>> '{}' from public.pengaturan where kunci = 'zona_waktu'), 'Asia/Jakarta')) as akses_terakhir
from public.siswi s
left join public.kunjungan_edukasi k on k.siswi_id = s.id
group by s.id, s.nama, s.kelas, s.sekolah, s.status;

revoke all on public.kunjungan_edukasi_lengkap from anon, authenticated;
revoke all on public.rekap_edukasi_siswi from anon, authenticated;
