import "server-only";
import ExcelJS from "exceljs";
import { ambilSemua } from "@/lib/peneliti";

export type DefEkspor = {
  judul: string; // label tombol & nama sheet (maks. 31 karakter)
  sumber: string; // tabel / view
  kolom: string;
  urut: { kolom: string; naik?: boolean }[];
};

/** Daftar data yang bisa diekspor peneliti. Kunci = bagian URL /api/ekspor/<kunci>. */
export const EKSPOR: Record<string, DefEkspor> = {
  "kepatuhan-harian": {
    judul: "Kepatuhan harian",
    sumber: "rekap_kepatuhan_harian",
    kolom: "siswi_id, nama, kelas, sekolah, kategori_jadwal, tanggal, jam_minum, zona_waktu, diminum, diminum_pada, sedang_haid",
    urut: [{ kolom: "nama" }, { kolom: "tanggal" }],
  },
  "kepatuhan-siswi": {
    judul: "Rekap per siswi",
    sumber: "rekap_kepatuhan_siswi",
    kolom: "siswi_id, nama, kelas, sekolah, kategori_jadwal, jumlah_jadwal, jumlah_diminum, persen_kepatuhan",
    urut: [{ kolom: "nama" }],
  },
  siswi: {
    judul: "Data siswi",
    sumber: "siswi",
    kolom: "id, nama, usia, kelas, sekolah, no_wa, setuju_penelitian, setuju_at, consent_kertas_diterima, status, jam_minum, hari_minum, zona_waktu, mulai_tanggal, created_at",
    urut: [{ kolom: "created_at" }],
  },
  skrining: {
    judul: "Skrining Hb",
    sumber: "skrining",
    kolom: "id, siswi_id, pernah_periksa_hb, kadar_hb, diagnosis_anemia, status_hasil, g_lesu, g_letih, g_lemah, g_lelah, g_lalai, skor_5l, makan_zat_besi, teh_kopi_saat_makan, lewat_sarapan, diet_pembatasan, vitamin_c_saat_makan, created_at",
    urut: [{ kolom: "created_at" }],
  },
  haid: {
    judul: "Periode haid",
    sumber: "periode_haid",
    kolom: "id, siswi_id, mulai, selesai, created_at",
    urut: [{ kolom: "mulai" }],
  },
  notifikasi: {
    judul: "Log notifikasi",
    sumber: "log_notifikasi",
    kolom: "id, tanggal, tahap, target, siswi_id, siswi_ids, penerima_id, kanal, status, detail, created_at",
    urut: [{ kolom: "created_at" }],
  },
  "edukasi-siswi": {
    judul: "Akses edukasi per siswi",
    sumber: "rekap_edukasi_siswi",
    kolom: "siswi_id, nama, kelas, sekolah, kategori_jadwal, jumlah_topik_dibuka, jumlah_kunjungan, akses_terakhir",
    urut: [{ kolom: "nama" }],
  },
  edukasi: {
    judul: "Log akses edukasi",
    sumber: "kunjungan_edukasi_lengkap",
    kolom: "id, siswi_id, nama, kelas, sekolah, topik, waktu_akses",
    urut: [{ kolom: "waktu_akses" }],
  },
  penerima: {
    judul: "Orang tua & guru",
    sumber: "penerima",
    kolom: "id, peran, nama, hubungan, no_wa, berhenti, created_at",
    urut: [{ kolom: "created_at" }],
  },
  "siswi-penerima": {
    judul: "Relasi siswi-ortu-guru",
    sumber: "siswi_penerima",
    kolom: "siswi_id, penerima_id, created_at",
    urut: [{ kolom: "created_at" }],
  },
};

export const daftarKolom = (d: DefEkspor) => d.kolom.split(",").map((k) => k.trim());

export async function ambilData(d: DefEkspor) {
  return ambilSemua<Record<string, unknown>>(d.sumber, d.kolom, d.urut);
}

// ---------------- CSV ----------------

function selCsv(v: unknown, pemisah: string): string {
  if (v === null || v === undefined) return "";
  let s = Array.isArray(v) ? v.join(" ") : typeof v === "boolean" ? (v ? "1" : "0") : String(v);
  if (pemisah === ";" && typeof v === "number") s = s.replace(".", ","); // desimal ala Excel Indonesia
  // Cegah injeksi formula: teks isian pengguna yang diawali = + - @ tab/CR dijalankan Excel sebagai rumus
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buatCsv(kolom: string[], baris: Record<string, unknown>[], pemisah: "," | ";") {
  const isi = [kolom.join(pemisah), ...baris.map((r) => kolom.map((k) => selCsv(r[k], pemisah)).join(pemisah))];
  return "﻿" + isi.join("\r\n");
}

// ---------------- Excel ----------------

const RE_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const RE_WAKTU = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

/** Jam dinding di zona tertentu sebagai Date "UTC" (ExcelJS menulis tanggal apa adanya dalam UTC). */
function jamDinding(waktu: Date, zona: string): Date {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zona,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
      .formatToParts(waktu)
      .map((x) => [x.type, x.value]),
  );
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second));
}

type Sel = { nilai: ExcelJS.CellValue; format?: string };

function selExcel(v: unknown, zona: string): Sel {
  if (v === null || v === undefined) return { nilai: null };
  if (typeof v === "boolean") return { nilai: v ? 1 : 0 }; // 1/0 agar mudah dianalisis (SPSS/Excel)
  if (typeof v === "number") return { nilai: v };
  if (Array.isArray(v)) return { nilai: v.join(" ") };
  const s = String(v);
  if (RE_TANGGAL.test(s)) return { nilai: new Date(s + "T00:00:00Z"), format: "yyyy-mm-dd" };
  if (RE_WAKTU.test(s)) {
    const punyaZona = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
    // timestamptz → jam dinding zona sekolah; timestamp tanpa zona (sudah lokal) → apa adanya
    const d = punyaZona ? jamDinding(new Date(s), zona) : new Date(s.replace(" ", "T").replace(/(\.\d+)?$/, "") + "Z");
    if (!Number.isNaN(d.getTime())) return { nilai: d, format: "yyyy-mm-dd hh:mm" };
  }
  if (/^-?\d+(\.\d+)?$/.test(s) && s.length < 15) return { nilai: Number(s) }; // numeric dari Postgres
  return { nilai: s };
}

export function tambahSheet(
  wb: ExcelJS.Workbook,
  judul: string,
  kolom: string[],
  baris: Record<string, unknown>[],
  zona: string,
) {
  const ws = wb.addWorksheet(judul.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRow(kolom);
  const lebar = kolom.map((k) => Math.max(10, k.length + 2));
  for (const r of baris) {
    const sel = kolom.map((k) => selExcel(r[k], zona));
    const row = ws.addRow(sel.map((x) => x.nilai));
    sel.forEach((x, i) => {
      if (x.format) row.getCell(i + 1).numFmt = x.format;
      const panjang = x.format ? x.format.length + 2 : String(x.nilai ?? "").length + 2;
      lebar[i] = Math.min(48, Math.max(lebar[i], panjang));
    });
  }
  const judulRow = ws.getRow(1);
  judulRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  judulRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA3456A" } };
  ws.columns.forEach((c, i) => (c.width = lebar[i]));
  if (kolom.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: kolom.length } };
}

export function bukuKerja() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pengingat TTD";
  wb.created = new Date();
  return wb;
}

export const TIPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
