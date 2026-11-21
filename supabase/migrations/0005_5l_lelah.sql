-- =====================================================================
-- Gejala 5L disesuaikan dengan Buku Saku Pencegahan Anemia (Kemenkes RI, 2023, hlm. 5):
-- Lesu, Letih, Lemah, Lelah, Lalai. Kolom g_lunglai diganti menjadi g_lelah.
-- Jalankan SEBELUM men-deploy kode terbaru. Aman dijalankan berulang.
-- =====================================================================
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'skrining' and column_name = 'g_lunglai') then
    alter table public.skrining rename column g_lunglai to g_lelah;
  end if;
end $$;
