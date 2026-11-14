import { penelitiMasuk } from "@/lib/peneliti";
import { ambilPengaturan } from "@/lib/pengaturan";
import { EKSPOR, TIPE_XLSX, ambilData, bukuKerja, buatCsv, daftarKolom, tambahSheet } from "@/lib/ekspor";

export const maxDuration = 60;

/**
 * /api/ekspor/<jenis>?format=xlsx|csv[&pemisah=koma]
 * /api/ekspor/semua            → satu file Excel berisi semua data (satu sheet per jenis)
 */
export async function GET(req: Request, ctx: RouteContext<"/api/ekspor/[jenis]">) {
  if (!(await penelitiMasuk())) return new Response("Tidak diizinkan", { status: 401 });
  const { jenis } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const tanggal = new Date().toISOString().slice(0, 10);
  const header = (tipe: string, nama: string) => ({
    "Content-Type": tipe,
    "Content-Disposition": `attachment; filename="${nama}"`,
    "Cache-Control": "no-store",
  });

  if (jenis === "semua") {
    const { zonaWaktu } = await ambilPengaturan();
    const wb = bukuKerja();
    const hasil = await Promise.all(Object.values(EKSPOR).map(async (d) => ({ d, baris: await ambilData(d) })));
    for (const { d, baris } of hasil) tambahSheet(wb, d.judul, daftarKolom(d), baris, zonaWaktu);
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf as ArrayBuffer, { headers: header(TIPE_XLSX, `ttd-semua-data-${tanggal}.xlsx`) });
  }

  const def = EKSPOR[jenis];
  if (!def) return new Response("Jenis ekspor tidak dikenal", { status: 404 });
  const baris = await ambilData(def);
  const kolom = daftarKolom(def);

  if (q.get("format") === "xlsx") {
    const { zonaWaktu } = await ambilPengaturan();
    const wb = bukuKerja();
    tambahSheet(wb, def.judul, kolom, baris, zonaWaktu);
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf as ArrayBuffer, { headers: header(TIPE_XLSX, `ttd-${jenis}-${tanggal}.xlsx`) });
  }

  // CSV: default ";" agar langsung rapi di Excel berbahasa Indonesia; ?pemisah=koma untuk SPSS/R
  const pemisah = q.get("pemisah") === "koma" ? "," : ";";
  return new Response(buatCsv(kolom, baris, pemisah), {
    headers: header("text/csv; charset=utf-8", `ttd-${jenis}-${tanggal}.csv`),
  });
}
