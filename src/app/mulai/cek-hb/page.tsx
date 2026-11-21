import type { Metadata } from "next";
import Link from "next/link";
import { siswiLogin } from "@/lib/siswi";
import { supabaseAdmin } from "@/lib/supabase/server";
import { pesanSkor5L } from "@/lib/skrining";
import { ambilPengaturan } from "@/lib/pengaturan";
import { MotifLingkaran } from "@/components/ui";
import { IkonKalender } from "@/components/ikon";

export const metadata: Metadata = { title: "Jangan lupa periksa Hb" };

export default async function CekHb() {
  const s = await siswiLogin();
  const { data: skrining } = await supabaseAdmin()
    .from("skrining")
    .select("skor_5l")
    .eq("siswi_id", s.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const skor = typeof skrining?.skor_5l === "number" ? skrining.skor_5l : null;
  const cfg = await ambilPengaturan();

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-6 pt-[52px] pb-7">
      <div className="flex flex-1 flex-col items-center justify-center gap-[22px] text-center">
        <MotifLingkaran />
        <span className="chip bg-lavender px-3.5 py-2 text-sm">Kategori: Belum diketahui</span>
        <h1 className="font-judul text-[32px] leading-[1.15] font-normal tracking-[-0.01em]">Jangan lupa periksa Hb dulu ya</h1>
        <p className="max-w-[320px] text-base leading-relaxed text-ink-2">
          Dengan tahu kadar Hb, jadwal TTD-mu bisa lebih pas. Kamu bisa periksa di puskesmas atau UKS sekolah.
        </p>
        {skor !== null && (
          <div className="flex w-full flex-col gap-0.5 rounded-[20px] bg-lavender px-4 py-3 text-left">
            <span className="text-sm">
              Skor gejalamu: <b>{skor}/10</b>
            </span>
            <span className="text-[13px] leading-snug text-ink-2">{pesanSkor5L(skor)}</span>
          </div>
        )}
        <div className="flex w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-mint text-ink">
            <IkonKalender />
          </span>
          <span className="text-[15px] leading-snug">
            Sementara itu, kamu ikut <b>jadwal pencegahan: {cfg.dosisPencegahan} seminggu</b>.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Link href="/mulai" className="btn-utama">Oke, aku akan periksa</Link>
        <Link href="/mulai/skrining?ulang=1" className="btn-garis">Sudah periksa? Isi kadar Hb</Link>
      </div>
    </main>
  );
}
