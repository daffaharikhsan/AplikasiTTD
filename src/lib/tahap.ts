/** Pemilihan tahap pengingat (murni, tanpa database) — dipakai mesin pengingat & diuji fuzz. */
import type { Tahap } from "@/lib/pesan";

export const TOLERANSI_MENIT = 120; // tahap 1/2 masih dikirim sampai 2 jam setelah waktunya
export const AKHIR_HARI = 24 * 60;

/**
 * Tahap yang jatuh tempo pada `menit` (menit sejak tengah malam, waktu lokal siswi), atau null.
 * Jika beberapa tahap sedang dalam jendela waktunya, yang paling akhir yang dipilih.
 */
export function tahapJatuhTempo(jamMinumMenit: number, jedaTahap2Menit: number, jamTahap3Menit: number, menit: number): Tahap | null {
  const t1 = jamMinumMenit;
  const t2 = t1 + jedaTahap2Menit;
  const kandidat: { tahap: Tahap; dari: number; sampai: number }[] = [
    { tahap: 1, dari: t1, sampai: t1 + TOLERANSI_MENIT },
    { tahap: 2, dari: t2, sampai: t2 + TOLERANSI_MENIT },
  ];
  if (jamTahap3Menit > t2) kandidat.push({ tahap: 3, dari: jamTahap3Menit, sampai: AKHIR_HARI });
  return kandidat.filter((k) => menit >= k.dari && menit < k.sampai).pop()?.tahap ?? null;
}
