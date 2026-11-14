import { penelitiMasuk, ambilSemua } from "@/lib/peneliti";

/** Daftar ekspor: nama file → (tabel/view, kolom, urutan) */
const EKSPOR: Record<string, { sumber: string; kolom: string; urut: { kolom: string; naik?: boolean }[] }> = {
  "kepatuhan-harian": {
    sumber: "rekap_kepatuhan_harian",
    kolom: "siswi_id, nama, kelas, sekolah, kategori_jadwal, tanggal, jam_minum, zona_waktu, diminum, diminum_pada, sedang_haid",
    urut: [{ kolom: "nama" }, { kolom: "tanggal" }],
  },
  "kepatuhan-siswi": {
    sumber: "rekap_kepatuhan_siswi",
    kolom: "siswi_id, nama, kelas, sekolah, kategori_jadwal, jumlah_jadwal, jumlah_diminum, persen_kepatuhan",
    urut: [{ kolom: "nama" }],
  },
  siswi: {
    sumber: "siswi",
    kolom: "id, nama, kelas, sekolah, no_wa, setuju_penelitian, setuju_at, consent_kertas_diterima, status, jam_minum, hari_minum, zona_waktu, mulai_tanggal, created_at",
    urut: [{ kolom: "created_at" }],
  },
  skrining: {
    sumber: "skrining",
    kolom: "id, siswi_id, pernah_periksa_hb, kadar_hb, diagnosis_anemia, status_hasil, created_at",
    urut: [{ kolom: "created_at" }],
  },
  haid: { sumber: "periode_haid", kolom: "id, siswi_id, mulai, selesai, created_at", urut: [{ kolom: "mulai" }] },
  notifikasi: {
    sumber: "log_notifikasi",
    kolom: "id, tanggal, tahap, target, siswi_id, siswi_ids, penerima_id, kanal, status, detail, created_at",
    urut: [{ kolom: "created_at" }],
  },
  edukasi: { sumber: "kunjungan_edukasi", kolom: "id, siswi_id, topik, created_at", urut: [{ kolom: "created_at" }] },
  penerima: {
    sumber: "penerima",
    kolom: "id, peran, nama, hubungan, no_wa, berhenti, created_at",
    urut: [{ kolom: "created_at" }],
  },
  "siswi-penerima": { sumber: "siswi_penerima", kolom: "siswi_id, penerima_id, created_at", urut: [{ kolom: "created_at" }] },
};

function sel(v: unknown, pemisah: string): string {
  if (v === null || v === undefined) return "";
  let s = Array.isArray(v) ? v.join(" ") : typeof v === "boolean" ? (v ? "1" : "0") : String(v);
  if (pemisah === ";" && typeof v === "number") s = s.replace(".", ","); // desimal ala Excel Indonesia
  return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request, ctx: RouteContext<"/api/ekspor/[jenis]">) {
  if (!(await penelitiMasuk())) return new Response("Tidak diizinkan", { status: 401 });
  const { jenis } = await ctx.params;
  const def = EKSPOR[jenis];
  if (!def) return new Response("Jenis ekspor tidak dikenal", { status: 404 });

  // Default ";" agar langsung rapi di Excel berbahasa Indonesia; ?pemisah=koma untuk SPSS/R
  const pemisah = new URL(req.url).searchParams.get("pemisah") === "koma" ? "," : ";";
  const baris = await ambilSemua<Record<string, unknown>>(def.sumber, def.kolom, def.urut);
  const kolom = def.kolom.split(",").map((k) => k.trim());
  const csv = [kolom.join(pemisah), ...baris.map((r) => kolom.map((k) => sel(r[k], pemisah)).join(pemisah))].join("\r\n");
  const tanggal = new Date().toISOString().slice(0, 10);

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ttd-${jenis}-${tanggal}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
