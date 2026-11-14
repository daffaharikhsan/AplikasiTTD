import type { Metadata } from "next";
import { HalamanKalender } from "../tampilan";

export const metadata: Metadata = { title: "Kalender TTD mingguan" };

/** Kalender untuk kategori TIDAK ANEMIA / BELUM DIKETAHUI: jadwal mingguan (pencegahan). */
export default async function KalenderMingguan({ searchParams }: PageProps<"/kalender/mingguan">) {
  const { bulan } = await searchParams;
  return <HalamanKalender jenis="mingguan" bulan={typeof bulan === "string" ? bulan : undefined} />;
}
