-- =====================================================================
-- Penjadwal pengingat: memanggil aplikasi setiap 5 menit.
-- Jalankan SETELAH aplikasi sudah di-deploy ke Vercel.
-- Ganti 2 nilai di bawah:
--   https://NAMA-APLIKASI.vercel.app  -> domain Vercel Anda
--   ISI_CRON_SECRET                   -> sama dengan env CRON_SECRET di Vercel
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('pengingat-ttd')
where exists (select 1 from cron.job where jobname = 'pengingat-ttd');

select cron.schedule(
  'pengingat-ttd',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://NAMA-APLIKASI.vercel.app/api/cron/pengingat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ISI_CRON_SECRET'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $cron$
);

-- Cek riwayat pemanggilan:
--   select * from cron.job_run_details order by start_time desc limit 20;
--   select id, status_code, content from net._http_response order by id desc limit 20;
