-- =====================================================================
-- Zona waktu per siswi: jam minum mengikuti zona waktu HP siswi
-- (WIB/WITA/WIT atau luar negeri). Jalankan SEBELUM men-deploy kode
-- yang memakai kolom ini. Aman dijalankan berulang.
-- =====================================================================

alter table public.siswi add column if not exists zona_waktu text;

comment on column public.siswi.zona_waktu is
  'Zona waktu IANA dari HP siswi (mis. Asia/Makassar). null = memakai pengaturan zona_waktu (zona sekolah).';

-- View rekap memakai zona waktu masing-masing siswi untuk "hari ini" dan jam centang
create or replace view public.rekap_kepatuhan_harian with (security_invoker = true) as
with batas as (
  select
    nullif((select nilai ->> 'selesai' from public.pengaturan where kunci = 'periode_penelitian'), '')::date as selesai_periode,
    coalesce((select (nilai #>> '{}')::int from public.pengaturan where kunci = 'lama_haid_otomatis'), 7) as lama_haid,
    coalesce((select nilai #>> '{}' from public.pengaturan where kunci = 'zona_waktu'), 'Asia/Jakarta') as tz_sekolah
),
siswi_tz as (
  select s.*, coalesce(s.zona_waktu, b.tz_sekolah) as tz
  from public.siswi s cross join batas b
),
tanggal as (
  select s.id as siswi_id, s.nama, s.kelas, s.sekolah, s.status, s.hari_minum, s.jam_minum, s.tz,
         d::date as tanggal
  from siswi_tz s
  cross join batas b
  cross join lateral generate_series(
    s.mulai_tanggal::timestamp,
    least((now() at time zone s.tz)::date, coalesce(b.selesai_periode, (now() at time zone s.tz)::date))::timestamp,
    interval '1 day'
  ) d
  where s.mulai_tanggal is not null and s.status is not null
)
select
  t.siswi_id, t.nama, t.kelas, t.sekolah,
  t.status as kategori_jadwal,
  t.tanggal,
  t.jam_minum,
  (k.id is not null) as diminum,
  (k.diminum_at at time zone t.tz) as diminum_pada,
  exists (
    select 1 from public.periode_haid h
    where h.siswi_id = t.siswi_id
      and t.tanggal between h.mulai and coalesce(h.selesai, h.mulai + (b.lama_haid - 1))
  ) as sedang_haid,
  t.tz as zona_waktu
from tanggal t
cross join batas b
left join public.konsumsi k on k.siswi_id = t.siswi_id and k.tanggal = t.tanggal
where t.status = 'anemia' or extract(dow from t.tanggal) = t.hari_minum;

revoke all on public.rekap_kepatuhan_harian from anon, authenticated;
