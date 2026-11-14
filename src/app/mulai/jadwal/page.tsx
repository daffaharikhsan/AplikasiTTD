import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siswiLogin } from "@/lib/siswi";
import { ambilPengaturan } from "@/lib/pengaturan";
import { FormJadwal } from "@/components/form-jadwal";
import { KepalaLangkah, ChipStatus } from "@/components/ui";

export const metadata: Metadata = { title: "Jadwal minum TTD" };

export default async function HalamanJadwal() {
  const s = await siswiLogin();
  if (!s.status) redirect("/mulai/skrining");
  const cfg = await ambilPengaturan();
  const harian = s.status === "anemia";

  return (
    <FormJadwal
      status={s.status}
      jamAwal={s.jam_minum?.slice(0, 5) ?? "07:00"}
      hariAwal={s.hari_minum ?? 1}
      jamSekolah={cfg.jamSekolah}
      hariSekolah={cfg.hariSekolah}
      kepala={
        <>
          <KepalaLangkah langkah={4} kembali="/mulai/skrining?ulang=1" />
          <div className="flex flex-col gap-1.5">
            <h1 className="judul-halaman">Kapan kamu minum TTD?</h1>
            <p className="text-[15px] leading-normal text-muted">
              {harian
                ? `Kamu ikut jadwal harian: ${cfg.dosisAnemia}. Pilih jam yang paling mudah kamu ingat.`
                : `Kamu ikut jadwal pencegahan: ${cfg.dosisPencegahan} seminggu. Pilih hari dan jamnya.`}
            </p>
            <div>
              <ChipStatus status={s.status} />
            </div>
          </div>
        </>
      }
    />
  );
}
