"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_PENELITI, cocokSandi, nilaiCookie, penelitiMasuk } from "@/lib/peneliti";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function masukPeneliti(_: { galat?: string } | undefined, fd: FormData) {
  const sandi = String(fd.get("sandi") ?? "");
  if (!cocokSandi(sandi)) return { galat: "Kata sandi salah (atau PENELITI_PASSWORD belum diatur, minimal 8 karakter)." };
  (await cookies()).set(COOKIE_PENELITI, nilaiCookie()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  revalidatePath("/peneliti");
  return undefined;
}

export async function keluarPeneliti() {
  (await cookies()).delete(COOKIE_PENELITI);
  revalidatePath("/peneliti");
}

export async function tandaiConsent(fd: FormData) {
  if (!(await penelitiMasuk())) return;
  const id = String(fd.get("id") ?? "");
  const nilai = fd.get("nilai") === "1";
  await supabaseAdmin().from("siswi").update({ consent_kertas_diterima: nilai }).eq("id", id);
  revalidatePath("/peneliti");
}
