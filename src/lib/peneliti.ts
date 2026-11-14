import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

export const COOKIE_PENELITI = "ttd_peneliti";

function tandaTangan(): string | null {
  const pw = process.env.PENELITI_PASSWORD;
  if (!pw || pw.length < 8) return null;
  return createHmac("sha256", pw).update("peneliti-ttd-v1").digest("hex");
}

export function cocokSandi(masukan: string): boolean {
  const pw = process.env.PENELITI_PASSWORD;
  if (!pw || pw.length < 8) return false;
  const a = Buffer.from(masukan);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const nilaiCookie = () => tandaTangan();

export async function penelitiMasuk(): Promise<boolean> {
  // Baca cookie lebih dulu agar halaman selalu dirender dinamis
  const v = (await cookies()).get(COOKIE_PENELITI)?.value ?? "";
  const harap = tandaTangan();
  if (!harap) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(harap);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Ambil semua baris (melewati batas 1000 baris per permintaan Supabase). */
export async function ambilSemua<T = Record<string, unknown>>(
  tabel: string,
  kolom = "*",
  urut?: { kolom: string; naik?: boolean }[],
): Promise<T[]> {
  const db = supabaseAdmin();
  const hasil: T[] = [];
  const per = 1000;
  for (let dari = 0; ; dari += per) {
    let q = db.from(tabel).select(kolom).range(dari, dari + per - 1);
    for (const u of urut ?? []) q = q.order(u.kolom, { ascending: u.naik ?? true });
    const { data, error } = await q;
    if (error) throw new Error(`${tabel}: ${error.message}`);
    hasil.push(...((data ?? []) as T[]));
    if (!data || data.length < per) break;
  }
  return hasil;
}
