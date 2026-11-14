import type { Metadata } from "next";
import { HalamanKalender } from "../tampilan";

export const metadata: Metadata = { title: "Kalender TTD harian" };

/** Kalender untuk kategori ANEMIA: jadwal harian. */
export default async function KalenderHarian({ searchParams }: PageProps<"/kalender/harian">) {
  const { bulan } = await searchParams;
  return <HalamanKalender jenis="harian" bulan={typeof bulan === "string" ? bulan : undefined} />;
}
