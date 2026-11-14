import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { StatusJadwal } from "@/lib/jadwal";

export type Pengaturan = {
  zonaWaktu: string;
  batasHbAnemia: number;
  dosisPencegahan: string;
  dosisAnemia: string;
  jedaTahap2Menit: Record<StatusJadwal, number>;
  jamTahap3: string;
  hariSekolah: number[];
  jamSekolah: { mulai: string; selesai: string };
  maksPesanPerHari: number;
  lamaHaidOtomatis: number;
  periodePenelitian: { mulai: string | null; selesai: string | null };
};

export const PENGATURAN_BAWAAN: Pengaturan = {
  zonaWaktu: "Asia/Jakarta",
  batasHbAnemia: 12,
  dosisPencegahan: "1 tablet TTD",
  dosisAnemia: "1 tablet TTD setiap hari",
  jedaTahap2Menit: { anemia: 30, tidak_anemia: 60, belum_diketahui: 60 },
  jamTahap3: "19:00",
  hariSekolah: [1, 2, 3, 4, 5],
  jamSekolah: { mulai: "07:00", selesai: "14:00" },
  maksPesanPerHari: 2,
  lamaHaidOtomatis: 7,
  periodePenelitian: { mulai: null, selesai: null },
};

const PETA: Record<string, keyof Pengaturan> = {
  zona_waktu: "zonaWaktu",
  batas_hb_anemia: "batasHbAnemia",
  dosis_pencegahan: "dosisPencegahan",
  dosis_anemia: "dosisAnemia",
  jeda_tahap2_menit: "jedaTahap2Menit",
  jam_tahap3: "jamTahap3",
  hari_sekolah: "hariSekolah",
  jam_sekolah: "jamSekolah",
  maks_pesan_per_hari: "maksPesanPerHari",
  lama_haid_otomatis: "lamaHaidOtomatis",
  periode_penelitian: "periodePenelitian",
};

export async function ambilPengaturan(): Promise<Pengaturan> {
  const { data, error } = await supabaseAdmin().from("pengaturan").select("kunci, nilai");
  if (error) throw new Error("Gagal membaca pengaturan: " + error.message);
  const hasil: Pengaturan = structuredClone(PENGATURAN_BAWAAN);
  for (const baris of data ?? []) {
    const kunci = PETA[baris.kunci as string];
    if (kunci && baris.nilai !== null) {
      (hasil as Record<string, unknown>)[kunci] = baris.nilai;
    }
  }
  return hasil;
}
