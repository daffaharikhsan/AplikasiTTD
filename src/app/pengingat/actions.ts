"use server";

import { siswiSiap } from "@/lib/siswi";
import { kirimPush } from "@/lib/notifikasi";

export type HasilUji = { pesan: string; ok: boolean } | undefined;

/** Kirim notifikasi uji ke semua perangkat siswi, untuk memastikan pengingat benar-benar muncul. */
export async function kirimUji(): Promise<HasilUji> {
  const s = await siswiSiap();
  const hasil = await kirimPush(
    { siswiId: s.id },
    { judul: "Tes pengingat TTD", isi: "Notifikasi sudah berfungsi. Sayangi tubuhmu!", url: "/kalender", tag: "uji" },
  );
  if (hasil.total === 0) return { ok: false, pesan: "Belum ada HP yang mengaktifkan pengingat." };
  if (hasil.terkirim === 0) return { ok: false, pesan: "Gagal mengirim. " + (hasil.galat || "") };
  return { ok: true, pesan: `Terkirim ke ${hasil.terkirim} perangkat. Cek notifikasi di HP-mu.` };
}
