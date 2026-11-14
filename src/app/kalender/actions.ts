"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { siswiSiap } from "@/lib/siswi";
import { ambilPengaturan } from "@/lib/pengaturan";
import { zonaSiswi } from "@/lib/zona";
import { saatLokal, tambahHari } from "@/lib/waktu";
import { terjadwal, haidAktif, BATAS_CENTANG_MUNDUR_HARI } from "@/lib/jadwal";

const valid = (t: string) => /^\d{4}-\d{2}-\d{2}$/.test(t);

export async function centangMinum(fd: FormData) {
  const s = await siswiSiap();
  const cfg = await ambilPengaturan();
  const hariIni = saatLokal(zonaSiswi(s, cfg.zonaWaktu)).tanggal;
  const tanggal = String(fd.get("tanggal") ?? hariIni);
  if (!valid(tanggal) || tanggal > hariIni || tanggal < tambahHari(hariIni, -BATAS_CENTANG_MUNDUR_HARI)) return;
  if (!terjadwal(s, tanggal)) return;
  await supabaseAdmin()
    .from("konsumsi")
    .upsert({ siswi_id: s.id, tanggal }, { onConflict: "siswi_id,tanggal", ignoreDuplicates: true });
  revalidatePath("/kalender", "layout");
}

/** Membatalkan centang (salah pencet) — hanya untuk hari ini. */
export async function batalCentang(fd: FormData) {
  const s = await siswiSiap();
  const cfg = await ambilPengaturan();
  const hariIni = saatLokal(zonaSiswi(s, cfg.zonaWaktu)).tanggal;
  const tanggal = String(fd.get("tanggal") ?? "");
  if (tanggal !== hariIni) return;
  await supabaseAdmin().from("konsumsi").delete().eq("siswi_id", s.id).eq("tanggal", tanggal);
  revalidatePath("/kalender", "layout");
}

export async function aturHaid(fd: FormData) {
  const s = await siswiSiap();
  const cfg = await ambilPengaturan();
  const hariIni = saatLokal(zonaSiswi(s, cfg.zonaWaktu)).tanggal;
  const db = supabaseAdmin();
  const { data: daftar } = await db
    .from("periode_haid")
    .select("id, mulai, selesai")
    .eq("siswi_id", s.id)
    .gte("mulai", tambahHari(hariIni, -cfg.lamaHaidOtomatis))
    .order("mulai", { ascending: false });
  const aktif = haidAktif(daftar ?? [], hariIni, cfg.lamaHaidOtomatis);

  if (fd.get("aksi") === "selesai") {
    if (aktif) {
      const baris = (daftar ?? []).find((h) => h.mulai === aktif.mulai);
      if (baris) {
        // Selesai di hari yang sama dengan mulai → anggap salah pencet, hapus
        if (baris.mulai === hariIni) await db.from("periode_haid").delete().eq("id", baris.id);
        else await db.from("periode_haid").update({ selesai: hariIni }).eq("id", baris.id);
      }
    }
  } else if (!aktif) {
    await db.from("periode_haid").insert({ siswi_id: s.id, mulai: hariIni });
  }
  revalidatePath("/kalender", "layout");
}
