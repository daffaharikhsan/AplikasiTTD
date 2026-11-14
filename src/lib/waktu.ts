/** Utilitas tanggal & jam dalam zona waktu sekolah. Tanggal selalu string "YYYY-MM-DD". */

export type SaatLokal = {
  tanggal: string; // YYYY-MM-DD
  menit: number; // menit sejak tengah malam
  hari: number; // 0 = Minggu … 6 = Sabtu
};

export function saatLokal(zona: string, waktu: Date = new Date()): SaatLokal {
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(waktu);
  const ambil = (t: string) => bagian.find((p) => p.type === t)?.value ?? "";
  const tanggal = `${ambil("year")}-${ambil("month")}-${ambil("day")}`;
  const menit = Number(ambil("hour")) * 60 + Number(ambil("minute"));
  return { tanggal, menit, hari: hariDari(tanggal) };
}

/** Hari dalam minggu (0 = Minggu) dari tanggal kalender, tanpa terpengaruh zona waktu. */
export function hariDari(tanggal: string): number {
  const [y, m, d] = tanggal.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function tambahHari(tanggal: string, n: number): string {
  const [y, m, d] = tanggal.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function selisihHari(dari: string, sampai: string): number {
  const a = Date.parse(dari + "T00:00:00Z");
  const b = Date.parse(sampai + "T00:00:00Z");
  return Math.round((b - a) / 86_400_000);
}

/** "07:30" atau "07:30:00" → 450 */
export function jamKeMenit(jam: string): number {
  const [h, m] = jam.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** 450 → "07.30" (format Indonesia) */
export function menitKeJam(menit: number): string {
  const h = Math.floor(menit / 60) % 24;
  const m = menit % 60;
  return `${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")}`;
}

export const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "2026-11-14" → "Sabtu, 14 November" */
export function formatTanggalPanjang(tanggal: string): string {
  const [, m, d] = tanggal.split("-").map(Number);
  return `${NAMA_HARI[hariDari(tanggal)]}, ${d} ${NAMA_BULAN[m - 1]}`;
}
