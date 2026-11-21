/**
 * Pertanyaan skrining tambahan (PRD Draf 3, bagian 3.1a–3.1b).
 * Hanya indikator tambahan untuk peneliti & kesadaran diri — TIDAK menentukan status atau dosis.
 */

export const SKALA_5L = [
  { nilai: 0, label: "Tidak pernah" },
  { nilai: 1, label: "Kadang" },
  { nilai: 2, label: "Sering" },
] as const;

/** Urutan & istilah 5L mengikuti Buku Saku Pencegahan Anemia (Kemenkes RI, 2023, hlm. 5). */
export const GEJALA_5L = [
  { kolom: "g_lesu", nama: "Lesu", tanya: "Apakah kamu sering mengantuk atau tidak bersemangat di siang hari?" },
  { kolom: "g_letih", nama: "Letih", tanya: "Apakah kamu cepat letih walau aktivitasnya ringan?" },
  { kolom: "g_lemah", nama: "Lemah", tanya: "Apakah kamu sering merasa tidak bertenaga untuk beraktivitas?" },
  { kolom: "g_lelah", nama: "Lelah", tanya: "Apakah kamu mudah merasa lelah setelah beraktivitas atau berolahraga?" },
  { kolom: "g_lalai", nama: "Lalai", tanya: "Apakah kamu sulit berkonsentrasi atau mudah lupa?" },
] as const;

export type Kolom5L = (typeof GEJALA_5L)[number]["kolom"];

export const POLA_MAKAN = [
  {
    kolom: "makan_zat_besi",
    tanya: "Seberapa sering kamu makan sumber zat besi (daging merah, hati, bayam, kacang-kacangan) dalam seminggu?",
    opsi: [
      { nilai: "tidak_pernah", label: "Tidak pernah" },
      { nilai: "1_2x", label: "1–2x" },
      { nilai: "3_4x", label: "3–4x" },
      { nilai: "5x_lebih", label: "≥5x" },
    ],
  },
  {
    kolom: "teh_kopi_saat_makan",
    tanya: "Apakah kamu sering minum teh atau kopi bersamaan dengan makan utama?",
    opsi: [
      { nilai: "ya", label: "Ya" },
      { nilai: "tidak", label: "Tidak" },
    ],
  },
  {
    kolom: "lewat_sarapan",
    tanya: "Apakah kamu sering melewatkan sarapan?",
    opsi: [
      { nilai: "tidak_pernah", label: "Tidak pernah" },
      { nilai: "kadang", label: "Kadang" },
      { nilai: "sering", label: "Sering" },
    ],
  },
  {
    kolom: "diet_pembatasan",
    tanya: "Apakah kamu sedang menjalani diet pembatasan makan (termasuk untuk menurunkan berat badan)?",
    opsi: [
      { nilai: "ya", label: "Ya" },
      { nilai: "tidak", label: "Tidak" },
    ],
  },
  {
    kolom: "vitamin_c_saat_makan",
    tanya: "Apakah kamu makan buah atau sumber vitamin C bersamaan dengan makan utama?",
    opsi: [
      { nilai: "ya", label: "Ya" },
      { nilai: "tidak", label: "Tidak" },
      { nilai: "tidak_tahu", label: "Tidak tahu" },
    ],
  },
] as const;

/** Kolom ya/tidak yang disimpan sebagai boolean di database. */
export const KOLOM_BOOLEAN = new Set(["teh_kopi_saat_makan", "diet_pembatasan"]);

/** Pesan reflektif untuk skor gejala 0–10 (bukan diagnosis). */
export function pesanSkor5L(skor: number): string {
  if (skor >= 5) return "Gejala ini cukup sering kamu rasakan. Bisa jadi tanda anemia — yuk cek Hb di UKS atau puskesmas.";
  if (skor >= 3) return "Kadang kamu merasakan gejala ini. Kalau makin sering, bisa jadi tanda anemia — yuk cek Hb.";
  return "Gejalamu jarang muncul. Tetap minum TTD sesuai jadwal ya.";
}
