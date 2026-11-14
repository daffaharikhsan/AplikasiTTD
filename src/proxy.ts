import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl } from "@/lib/supabase/url";

/** Memperbarui sesi Supabase (cookie) di setiap permintaan halaman. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Memperbarui token bila hampir kedaluwarsa; verifikasi lokal (tanpa panggilan jaringan)
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    // Lewati file statis, ikon, service worker, manifest, endpoint cron/push/ekspor, dan halaman ortu/guru
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|ikon/|api/|o/).*)",
  ],
};
