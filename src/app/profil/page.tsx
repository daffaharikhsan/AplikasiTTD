import type { Metadata } from "next";
import Link from "next/link";
import { siswiSiap } from "@/lib/siswi";
import { kontakSiswi } from "@/lib/kontak";
import { supabaseAdmin } from "@/lib/supabase/server";
import { tampilNomor } from "@/lib/telepon";
import { HalamanApp } from "@/components/nav-bawah";
import { BagikanOrtu } from "@/components/bagikan-ortu";
import { ChipStatus } from "@/components/ui";
import { IkonGuru, IkonKeluar, IkonPensil, IkonTetesGaris } from "@/components/ikon";
import { keluar } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Profil" };

export default async function Profil() {
  const s = await siswiSiap();
  const kontak = await kontakSiswi(s.id);
  const { data: skrining } = await supabaseAdmin()
    .from("skrining")
    .select("kadar_hb, pernah_periksa_hb, created_at")
    .eq("siswi_id", s.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ortu = kontak.filter((k) => k.peran === "ortu");
  const guru = kontak.filter((k) => k.peran === "guru");

  return (
    <HalamanApp aktif="profil" status={s.status} zona={s.zona_waktu}>
      <h1 className="font-judul text-[28px] font-normal">Profil</h1>

      <section className="kartu flex flex-col gap-1 rounded-[24px]">
        <b className="font-judul text-xl font-medium">{s.nama}</b>
        <span className="text-sm text-muted">
          Kelas {s.kelas} · {s.sekolah}
        </span>
        <span className="text-sm text-muted">{tampilNomor(s.no_wa)}</span>
      </section>

      <section className="kartu flex flex-col gap-3 rounded-[24px]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-petal text-ink"><IkonTetesGaris size={18} /></span>
            <b className="text-base">Skrining Hb</b>
          </span>
          <ChipStatus status={s.status} />
        </div>
        <p className="text-sm text-ink-2">
          {skrining?.kadar_hb ? `Hb terakhir: ${String(skrining.kadar_hb).replace(".", ",")} g/dL.` : skrining?.pernah_periksa_hb ? "Kadar Hb belum diisi." : "Belum pernah periksa Hb."}{" "}
          Kategori ini hanya untuk jadwal pengingat, bukan diagnosis.
        </p>
        <Link href="/mulai/skrining?ulang=1" className="btn-garis">Sudah periksa lagi? Perbarui Hb</Link>
      </section>

      <div className="flex items-center justify-between pt-1">
        <h2 className="font-judul text-lg font-medium">Yang ikut mengingatkan</h2>
        <Link href="/mulai/kontak?dari=profil" className="flex min-h-11 items-center gap-1.5 px-1 text-sm font-bold no-underline">
          <IkonPensil size={16} /> Ubah
        </Link>
      </div>

      {ortu.map((o) => (
        <BagikanOrtu key={o.id} ortu={o} namaSiswi={s.nama} />
      ))}
      {guru.map((g) => (
        <div key={g.id} className="kartu flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-ink"><IkonGuru size={18} /></span>
          <span className="flex min-w-0 flex-col">
            <b className="text-[15px]">{g.nama || "Guru"}</b>
            <span className="text-[13px] text-muted">{tampilNomor(g.no_wa)}</span>
          </span>
          <span className={`chip ml-auto shrink-0 ${g.aktif ? "bg-mint" : "bg-garis-2 text-muted"}`}>
            {g.aktif ? "Pengingat aktif" : "Menunggu"}
          </span>
        </div>
      ))}
      {guru.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-muted">
          Belum ada guru. <Link href="/mulai/kontak?dari=profil">Tambahkan</Link>
        </p>
      )}

      <form action={keluar} className="pt-2">
        <button type="submit" className="btn-garis">
          <IkonKeluar /> Keluar
        </button>
      </form>
    </HalamanApp>
  );
}
