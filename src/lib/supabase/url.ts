/** URL project Supabase. Mengabaikan akhiran "/rest/v1/" jika ikut tersalin dari halaman Data API. */
export const supabaseUrl = () =>
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
