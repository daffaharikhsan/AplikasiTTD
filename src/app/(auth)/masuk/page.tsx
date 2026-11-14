"use client";

import Link from "next/link";
import { useActionState } from "react";
import { masuk } from "../actions";
import { HalamanLangkah, Logo, PesanGalat } from "@/components/ui";

export default function HalamanMasuk() {
  const [state, aksi, memproses] = useActionState(masuk, undefined);

  return (
    <form action={aksi} className="contents">
      <HalamanLangkah
        aksi={
          <button type="submit" disabled={memproses} className="btn-utama">
            {memproses ? "Masuk…" : "Masuk"}
          </button>
        }
      >
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-bold">Pengingat TTD</span>
        </div>
        <div className="flex flex-col gap-1.5 pt-6">
          <h1 className="judul-halaman">Selamat datang lagi</h1>
          <p className="text-[15px] leading-normal text-muted">Masuk dengan nomor WhatsApp dan PIN-mu.</p>
        </div>

        <PesanGalat pesan={state?.galat} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="no_wa" className="label">Nomor WhatsApp</label>
          <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border-[1.5px] border-garis bg-white focus-within:outline-2 focus-within:outline-berry">
            <span className="flex h-full items-center bg-blush px-3 text-[15px] font-bold">+62</span>
            <input id="no_wa" name="no_wa" type="tel" inputMode="tel" required autoComplete="tel" defaultValue={state?.nilai?.no_wa} placeholder="812 3456 7890" className="h-full min-w-0 flex-1 border-none bg-transparent px-3 text-base outline-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pin" className="label">PIN</label>
          <input id="pin" name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="current-password" placeholder="••••••" className="isian tracking-[0.4em]" />
        </div>
        <p className="text-center text-sm text-muted">
          Belum punya akun? <Link href="/daftar">Daftar</Link>
        </p>
      </HalamanLangkah>
    </form>
  );
}
