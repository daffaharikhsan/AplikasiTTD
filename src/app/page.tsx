import Link from "next/link";
import { redirect } from "next/navigation";
import { idPenggunaLogin } from "@/lib/supabase/server";
import { Logo } from "@/components/ui";
import { IkonTetes } from "@/components/ikon";

export default async function Beranda() {
  if (await idPenggunaLogin()) redirect("/kalender");

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-6 pt-[52px] pb-8">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="text-[15px] font-bold">Pengingat TTD</span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 py-8">
        <div className="relative mx-auto h-[250px] w-[300px]" aria-hidden="true">
          <div className="absolute top-0 left-[10px] size-[180px] rounded-full bg-petal" />
          <div className="absolute top-[40px] left-[120px] size-[160px] rounded-full bg-lavender mix-blend-multiply" />
          <div className="absolute top-[115px] left-[70px] size-[125px] rounded-full bg-peach mix-blend-multiply" />
          <div className="absolute top-[50px] left-[95px] flex size-[80px] items-center justify-center text-berry">
            <IkonTetes size={64} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-bold tracking-[0.14em] text-muted uppercase">Tablet Tambah Darah · siswi SMA</p>
          <h1 className="font-judul text-[56px] leading-[0.95] font-light tracking-[-0.02em]">
            Sayangi
            <br />
            tubuhmu
          </h1>
          <p className="text-[17px] leading-relaxed text-ink-2">
            Pengingat minum TTD sesuai jadwalmu, ditemani orang tua dan guru.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Link href="/daftar" className="btn-utama">
          Daftar sekarang
        </Link>
        <Link href="/masuk" className="btn-garis">
          Sudah punya akun? Masuk
        </Link>
      </div>
    </main>
  );
}
