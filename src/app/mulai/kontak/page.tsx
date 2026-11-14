import type { Metadata } from "next";
import { siswiLogin } from "@/lib/siswi";
import { supabaseAdmin } from "@/lib/supabase/server";
import { tampilNomor } from "@/lib/telepon";
import { FormKontak, type KontakAwal } from "./form";

export const metadata: Metadata = { title: "Kontak orang tua dan guru" };

export default async function HalamanKontak({ searchParams }: PageProps<"/mulai/kontak">) {
  const s = await siswiLogin();
  const dariProfil = (await searchParams).dari === "profil";
  const { data } = await supabaseAdmin()
    .from("siswi_penerima")
    .select("penerima:penerima_id (peran, nama, hubungan, no_wa)")
    .eq("siswi_id", s.id);

  const awal: KontakAwal = {};
  for (const r of data ?? []) {
    const p = r.penerima as unknown as { peran: string; nama: string | null; hubungan: string | null; no_wa: string } | null;
    if (!p) continue;
    if (p.peran === "ortu") awal.ortu = { nama: p.nama ?? "", hubungan: p.hubungan ?? "Ibu", no_wa: tampilNomor(p.no_wa) };
    else awal.guru = { nama: p.nama ?? "", no_wa: tampilNomor(p.no_wa) };
  }
  return <FormKontak awal={awal} dariProfil={dariProfil} />;
}
