/**
 * Logika jadwal minum TTD (murni, tanpa database) — dipakai di halaman kalender,
 * mesin pengingat, dan halaman ortu/guru.
 */
import { hariDari, selisihHari, tambahHari } from "@/lib/waktu";

export type StatusJadwal = "anemia" | "tidak_anemia" | "belum_diketahui";
export type Diagnosis = "ya" | "tidak" | "tidak_tahu";

export const LABEL_STATUS: Record<StatusJadwal, string> = {
  anemia: "Anemia",
  tidak_anemia: "Tidak anemia",
  belum_diketahui: "Belum diketahui",
};

export const WARNA_STATUS: Record<StatusJadwal, string> = {
  anemia: "bg-peach",
  tidak_anemia: "bg-mint",
  belum_diketahui: "bg-lavender",
};

/**
 * Menentukan KATEGORI JADWAL (bukan diagnosis).
 * - Kadar Hb diisi  → di bawah batas = anemia, selain itu tidak anemia
 * - Hb tidak diisi tapi pernah didiagnosis anemia → anemia
 * - Lainnya → belum diketahui (ikut jadwal pencegahan sambil dianjurkan periksa Hb)
 */
export function tentukanStatus(input: {
  pernahPeriksa: boolean;
  kadarHb: number | null;
  diagnosis: Diagnosis;
  batasHb: number;
}): StatusJadwal {
  if (input.pernahPeriksa && input.kadarHb !== null && !Number.isNaN(input.kadarHb)) {
    return input.kadarHb < input.batasHb ? "anemia" : "tidak_anemia";
  }
  if (input.diagnosis === "ya") return "anemia";
  return "belum_diketahui";
}

export const jadwalHarian = (status: StatusJadwal) => status === "anemia";

/** Apakah tanggal ini termasuk jadwal minum? (pedoman baru: haid tidak menambah jadwal) */
export function terjadwal(
  s: { status: StatusJadwal; hari_minum: number | null; mulai_tanggal: string | null },
  tanggal: string,
): boolean {
  if (!s.mulai_tanggal || tanggal < s.mulai_tanggal) return false;
  if (jadwalHarian(s.status)) return true;
  return s.hari_minum !== null && hariDari(tanggal) === s.hari_minum;
}

export type Haid = { mulai: string; selesai: string | null };

export function akhirHaid(h: Haid, lamaOtomatis: number): string {
  return h.selesai ?? tambahHari(h.mulai, lamaOtomatis - 1);
}

export function sedangHaidPada(daftar: Haid[], tanggal: string, lamaOtomatis: number): boolean {
  return daftar.some((h) => tanggal >= h.mulai && tanggal <= akhirHaid(h, lamaOtomatis));
}

/** Haid yang sedang aktif hari ini (jika ada). */
export function haidAktif(daftar: Haid[], hariIni: string, lamaOtomatis: number) {
  const h = daftar.find((x) => hariIni >= x.mulai && hariIni <= akhirHaid(x, lamaOtomatis));
  return h ? { ...h, hariKe: selisihHari(h.mulai, hariIni) + 1 } : null;
}

/**
 * Kepatuhan: jadwal yang sudah lewat (sebelum hari ini) + hari ini jika sudah dicentang.
 * Hari ini yang belum dicentang tidak dihitung terlewat (masih ada waktu).
 */
export function hitungKepatuhan(
  s: { status: StatusJadwal; hari_minum: number | null; mulai_tanggal: string | null },
  diminum: Set<string>,
  hariIni: string,
  sampai?: string | null,
) {
  if (!s.mulai_tanggal) return { jadwal: 0, diminum: 0, persen: null as number | null };
  const akhir = sampai && sampai < hariIni ? sampai : hariIni;
  let jadwal = 0;
  let sudah = 0;
  for (let t = s.mulai_tanggal; t <= akhir; t = tambahHari(t, 1)) {
    if (!terjadwal(s, t)) continue;
    const ok = diminum.has(t);
    if (t === hariIni && !ok) continue;
    jadwal++;
    if (ok) sudah++;
  }
  return { jadwal, diminum: sudah, persen: jadwal ? Math.round((sudah / jadwal) * 100) : null };
}

/** Jadwal berikutnya mulai dari tanggal tertentu (termasuk tanggal itu). */
export function jadwalBerikutnya(
  s: { status: StatusJadwal; hari_minum: number | null; mulai_tanggal: string | null },
  dari: string,
): string | null {
  for (let i = 0; i < 8; i++) {
    const t = tambahHari(dari, i);
    if (terjadwal(s, t)) return t;
  }
  return null;
}

/** Centang boleh untuk tanggal jadwal dalam 7 hari terakhir (termasuk hari ini), bukan masa depan. */
export const BATAS_CENTANG_MUNDUR_HARI = 6;
