import { NextResponse } from "next/server";
import { jalankanPengingat } from "@/lib/pengingat";

export const maxDuration = 60;

function diizinkan(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia) return false;
  return req.headers.get("authorization") === `Bearer ${rahasia}`;
}

/** Dipanggil pg_cron (Supabase) setiap 5 menit. */
async function jalankan(req: Request) {
  if (!diizinkan(req)) return NextResponse.json({ galat: "Tidak diizinkan" }, { status: 401 });
  try {
    const hasil = await jalankanPengingat();
    return NextResponse.json(hasil);
  } catch (e) {
    console.error("[cron pengingat]", e);
    return NextResponse.json({ galat: (e as Error).message }, { status: 500 });
  }
}

export const POST = jalankan;
export const GET = jalankan;
