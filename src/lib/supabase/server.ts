import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/** Klien dengan sesi pengguna (dari cookie). Dipakai untuk mengetahui siapa yang login. */
export async function supabaseSesi() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Dipanggil dari Server Component: abaikan, proxy yang memperbarui sesi.
          }
        },
      },
    },
  );
}

/**
 * Klien service role: melewati RLS. HANYA dipakai di server, setelah
 * identitas pengguna diverifikasi (atau untuk token ortu/guru, cron, peneliti).
 */
export function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** ID pengguna yang login (diverifikasi ke server Supabase), atau null. */
export async function idPenggunaLogin(): Promise<string | null> {
  const supabase = await supabaseSesi();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
