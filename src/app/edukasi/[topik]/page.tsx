import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { siswiSiap } from "@/lib/siswi";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cariTopik } from "@/lib/edukasi";
import { HalamanApp } from "@/components/nav-bawah";
import { IkonKembali } from "@/components/ikon";

export async function generateMetadata({ params }: PageProps<"/edukasi/[topik]">): Promise<Metadata> {
  const t = cariTopik((await params).topik);
  return { title: t?.judul ?? "Edukasi" };
}

export default async function TopikEdukasi({ params }: PageProps<"/edukasi/[topik]">) {
  const s = await siswiSiap();
  const t = cariTopik((await params).topik);
  if (!t) notFound();

  // Catat kunjungan (KPI) tanpa menunda tampilan halaman
  after(async () => {
    await supabaseAdmin().from("kunjungan_edukasi").insert({ siswi_id: s.id, topik: t.slug });
  });

  return (
    <HalamanApp aktif="edukasi">
      <Link href="/edukasi" aria-label="Kembali ke Edukasi" className="flex size-11 items-center justify-center rounded-full bg-white text-ink">
        <IkonKembali />
      </Link>
      <div className={`flex items-center gap-3 rounded-[26px] p-5 ${t.warna}`}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/60">
          <t.Ikon size={24} />
        </span>
        <h1 className="font-judul text-[24px] leading-tight font-medium">{t.judul}</h1>
      </div>
      <article className="prosa rounded-[22px] bg-white p-5">{t.isi}</article>
    </HalamanApp>
  );
}
