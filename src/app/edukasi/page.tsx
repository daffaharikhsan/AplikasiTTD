import type { Metadata } from "next";
import Link from "next/link";
import { siswiSiap } from "@/lib/siswi";
import { TOPIK } from "@/lib/edukasi";
import { HalamanApp } from "@/components/nav-bawah";
import { IkonLanjut } from "@/components/ikon";

export const metadata: Metadata = { title: "Edukasi" };

export default async function Edukasi() {
  await siswiSiap();
  const [utama, ...lain] = TOPIK;

  return (
    <HalamanApp aktif="edukasi">
      <div className="flex flex-col gap-1">
        <h1 className="font-judul text-[28px] font-normal">Edukasi</h1>
        <span className="text-[15px] text-muted">Bacaan singkat tentang anemia &amp; TTD</span>
      </div>

      <Link href={`/edukasi/${utama.slug}`} className="relative flex flex-col gap-2 overflow-hidden rounded-[26px] bg-petal p-5 text-ink no-underline">
        <div className="absolute -top-[30px] -right-[30px] size-[130px] rounded-full bg-white/45" aria-hidden="true" />
        <span className="text-[13px] font-bold tracking-[0.08em] uppercase">Bacaan hari ini</span>
        <span className="max-w-[250px] font-judul text-[22px] leading-tight font-medium">{utama.judul}</span>
        <span className="text-sm">{utama.ringkas}</span>
      </Link>

      <ul className="flex flex-col gap-2.5">
        {lain.map((t) => (
          <li key={t.slug}>
            <Link href={`/edukasi/${t.slug}`} className="flex min-h-[52px] items-center gap-3.5 rounded-[20px] bg-white p-3 text-ink no-underline">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${t.warna}`}>
                <t.Ikon size={22} />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <b className="text-base">{t.judul}</b>
                <span className="text-[13px] text-muted">{t.ringkas}</span>
              </span>
              <IkonLanjut className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </HalamanApp>
  );
}
