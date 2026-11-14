-- =====================================================================
-- Pengingat TTD — skema database
-- Jalankan sekali di Supabase: Dashboard › SQL Editor › New query › Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Pengaturan (angka dosis, jeda pengingat, dll.) ----------
-- Semua angka klinis disimpan di sini agar bisa diubah tanpa deploy ulang.
create table if not exists public.pengaturan (
  kunci text primary key,
  nilai jsonb not null,
  keterangan text
);

insert into public.pengaturan (kunci, nilai, keterangan) values
  ('zona_waktu',          '"Asia/Jakarta"', 'Zona waktu sekolah (Asia/Jakarta = WIB, Asia/Makassar = WITA, Asia/Jayapura = WIT)'),
  ('batas_hb_anemia',     '12',             'Hb (g/dL) di bawah angka ini -> kategori jadwal anemia. VALIDASI dengan bidan/pembimbing.'),
  ('dosis_pencegahan',    '"1 tablet TTD"', 'Teks dosis untuk jadwal mingguan (tidak anemia / belum diketahui)'),
  ('dosis_anemia',        '"1 tablet TTD setiap hari"', 'Teks dosis harian untuk anemia. WAJIB divalidasi tenaga kesehatan.'),
  ('jeda_tahap2_menit',   '{"anemia":30,"tidak_anemia":60,"belum_diketahui":60}', 'Jeda pengingat kedua setelah jam minum'),
  ('jam_tahap3',          '"19:00"',        'Jam pengingat ketiga (malam, hanya ke siswi)'),
  ('hari_sekolah',        '[1,2,3,4,5]',    'Hari sekolah (0=Minggu ... 6=Sabtu). Guru hanya dikirimi pada hari ini.'),
  ('jam_sekolah',         '{"mulai":"07:00","selesai":"14:00"}', 'Guru hanya dikirimi di rentang jam ini'),
  ('maks_pesan_per_hari', '2',              'Batas pesan per hari per penerima (ortu/guru)'),
  ('lama_haid_otomatis',  '7',              'Haid dianggap selesai otomatis setelah N hari jika tombol "Haid selesai" tidak ditekan'),
  ('periode_penelitian',  '{"mulai":null,"selesai":null}', 'Tanggal YYYY-MM-DD. Di luar periode ini pengingat tidak dikirim. null = tidak dibatasi.')
on conflict (kunci) do nothing;

-- ---------- Siswi ----------
do $$ begin
  create type public.status_jadwal as enum ('anemia', 'tidak_anemia', 'belum_diketahui');
exception when duplicate_object then null; end $$;

create table if not exists public.siswi (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  kelas text not null,
  sekolah text not null,
  no_wa text not null unique,
  setuju_penelitian boolean not null default false,
  setuju_at timestamptz,
  consent_kertas_diterima boolean not null default false, -- diisi peneliti setelah lembar bertanda tangan diterima
  status public.status_jadwal,                            -- kategori jadwal hasil skrining terakhir
  jam_minum time,
  hari_minum smallint check (hari_minum between 0 and 6), -- untuk jadwal mingguan; 0 = Minggu
  mulai_tanggal date,                                     -- hari pertama jadwal dihitung
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Orang tua / wali / guru (tanpa akun) ----------
do $$ begin
  create type public.peran_penerima as enum ('ortu', 'guru');
exception when duplicate_object then null; end $$;

create table if not exists public.penerima (
  id uuid primary key default gen_random_uuid(),
  peran public.peran_penerima not null,
  nama text,
  hubungan text,                                  -- Ibu / Ayah / Wali / Orang serumah (untuk ortu)
  no_wa text not null,
  token text not null unique default encode(gen_random_bytes(18), 'hex'), -- link pribadi /o/<token>
  berhenti boolean not null default false,        -- memilih berhenti menerima pengingat
  created_at timestamptz not null default now(),
  unique (peran, no_wa)
);

create table if not exists public.siswi_penerima (
  siswi_id uuid not null references public.siswi (id) on delete cascade,
  penerima_id uuid not null references public.penerima (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (siswi_id, penerima_id)
);

-- ---------- Skrining (riwayat; baris terbaru = yang berlaku) ----------
create table if not exists public.skrining (
  id bigint generated always as identity primary key,
  siswi_id uuid not null references public.siswi (id) on delete cascade,
  pernah_periksa_hb boolean not null,
  kadar_hb numeric(4, 1),
  diagnosis_anemia text not null check (diagnosis_anemia in ('ya', 'tidak', 'tidak_tahu')),
  status_hasil public.status_jadwal not null,
  created_at timestamptz not null default now()
);
create index if not exists skrining_siswi_idx on public.skrining (siswi_id, created_at desc);

-- ---------- Centang "Sudah minum TTD" ----------
create table if not exists public.konsumsi (
  id bigint generated always as identity primary key,
  siswi_id uuid not null references public.siswi (id) on delete cascade,
  tanggal date not null,                 -- tanggal jadwal (zona waktu sekolah)
  diminum_at timestamptz not null default now(),
  unique (siswi_id, tanggal)
);

-- ---------- Haid ----------
create table if not exists public.periode_haid (
  id bigint generated always as identity primary key,
  siswi_id uuid not null references public.siswi (id) on delete cascade,
  mulai date not null,
  selesai date,                          -- null = masih berlangsung (berakhir otomatis setelah lama_haid_otomatis)
  created_at timestamptz not null default now()
);
create index if not exists haid_siswi_idx on public.periode_haid (siswi_id, mulai desc);

-- ---------- Langganan push notification ----------
create table if not exists public.push_langganan (
  id bigint generated always as identity primary key,
  siswi_id uuid references public.siswi (id) on delete cascade,
  penerima_id uuid references public.penerima (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  check ((siswi_id is null) <> (penerima_id is null))
);

-- ---------- Klaim pengingat (mencegah kirim ganda) ----------
create table if not exists public.klaim_pengingat (
  siswi_id uuid not null references public.siswi (id) on delete cascade,
  tanggal date not null,
  tahap smallint not null check (tahap between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (siswi_id, tanggal, tahap)
);

-- ---------- Log semua notifikasi (KPI "pesan terkirim") ----------
create table if not exists public.log_notifikasi (
  id bigint generated always as identity primary key,
  tanggal date not null,
  tahap smallint not null,
  target text not null check (target in ('siswi', 'ortu', 'guru')),
  siswi_id uuid references public.siswi (id) on delete cascade,
  siswi_ids uuid[],                      -- untuk ringkasan guru (beberapa siswi dalam satu pesan)
  penerima_id uuid references public.penerima (id) on delete cascade,
  kanal text not null check (kanal in ('push', 'wa', 'tidak_ada')),
  status text not null check (status in ('terkirim', 'gagal', 'dilewati')),
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists log_penerima_idx on public.log_notifikasi (penerima_id, tanggal);

-- ---------- Kunjungan halaman edukasi (KPI) ----------
create table if not exists public.kunjungan_edukasi (
  id bigint generated always as identity primary key,
  siswi_id uuid references public.siswi (id) on delete cascade,
  topik text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Keamanan: Row Level Security
-- Siswi hanya bisa membaca/mengubah datanya sendiri.
-- Tabel penerima, push, log, klaim: tanpa policy = hanya server (service role).
-- Peneliti membaca semua data lewat dashboard Supabase / halaman /peneliti.
-- =====================================================================
alter table public.pengaturan        enable row level security;
alter table public.siswi             enable row level security;
alter table public.penerima          enable row level security;
alter table public.siswi_penerima    enable row level security;
alter table public.skrining          enable row level security;
alter table public.konsumsi          enable row level security;
alter table public.periode_haid      enable row level security;
alter table public.push_langganan    enable row level security;
alter table public.klaim_pengingat   enable row level security;
alter table public.log_notifikasi    enable row level security;
alter table public.kunjungan_edukasi enable row level security;

drop policy if exists "pengaturan dibaca pengguna login" on public.pengaturan;
create policy "pengaturan dibaca pengguna login" on public.pengaturan
  for select to authenticated using (true);

drop policy if exists "siswi baca diri" on public.siswi;
create policy "siswi baca diri" on public.siswi
  for select to authenticated using (id = auth.uid());

drop policy if exists "skrining baca sendiri" on public.skrining;
create policy "skrining baca sendiri" on public.skrining
  for select to authenticated using (siswi_id = auth.uid());

drop policy if exists "konsumsi baca sendiri" on public.konsumsi;
create policy "konsumsi baca sendiri" on public.konsumsi
  for select to authenticated using (siswi_id = auth.uid());

drop policy if exists "haid baca sendiri" on public.periode_haid;
create policy "haid baca sendiri" on public.periode_haid
  for select to authenticated using (siswi_id = auth.uid());

-- Catatan: semua penulisan data dilakukan lewat server aplikasi (service role)
-- setelah identitas siswi diverifikasi, sehingga aturan (mis. tanggal centang
-- yang boleh) tidak bisa dilewati dari browser.

-- =====================================================================
-- Fungsi bantu & view untuk ekspor peneliti
-- =====================================================================
create or replace function public.hari_ini() returns date
language sql stable as $$
  select (now() at time zone coalesce(
    (select nilai #>> '{}' from public.pengaturan where kunci = 'zona_waktu'), 'Asia/Jakarta'))::date
$$;

-- Satu baris per siswi per tanggal jadwal (dari mulai_tanggal s.d. hari ini / akhir periode)
create or replace view public.rekap_kepatuhan_harian with (security_invoker = true) as
with batas as (
  select
    public.hari_ini() as hari_ini,
    nullif((select nilai ->> 'selesai' from public.pengaturan where kunci = 'periode_penelitian'), '')::date as selesai_periode,
    coalesce((select (nilai #>> '{}')::int from public.pengaturan where kunci = 'lama_haid_otomatis'), 7) as lama_haid,
    coalesce((select nilai #>> '{}' from public.pengaturan where kunci = 'zona_waktu'), 'Asia/Jakarta') as tz
),
tanggal as (
  select s.id as siswi_id, s.nama, s.kelas, s.sekolah, s.status, s.hari_minum, s.jam_minum,
         d::date as tanggal
  from public.siswi s
  cross join batas b
  cross join lateral generate_series(
    s.mulai_tanggal::timestamp,
    least(b.hari_ini, coalesce(b.selesai_periode, b.hari_ini))::timestamp,
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
  (k.diminum_at at time zone b.tz) as diminum_pada,
  exists (
    select 1 from public.periode_haid h
    where h.siswi_id = t.siswi_id
      and t.tanggal between h.mulai and coalesce(h.selesai, h.mulai + (b.lama_haid - 1))
  ) as sedang_haid
from tanggal t
cross join batas b
left join public.konsumsi k on k.siswi_id = t.siswi_id and k.tanggal = t.tanggal
where t.status = 'anemia' or extract(dow from t.tanggal) = t.hari_minum;

create or replace view public.rekap_kepatuhan_siswi with (security_invoker = true) as
select
  siswi_id, nama, kelas, sekolah, kategori_jadwal,
  count(*) as jumlah_jadwal,
  count(*) filter (where diminum) as jumlah_diminum,
  round(100.0 * count(*) filter (where diminum) / nullif(count(*), 0), 1) as persen_kepatuhan
from public.rekap_kepatuhan_harian
group by siswi_id, nama, kelas, sekolah, kategori_jadwal;

revoke all on public.rekap_kepatuhan_harian from anon, authenticated;
revoke all on public.rekap_kepatuhan_siswi from anon, authenticated;
