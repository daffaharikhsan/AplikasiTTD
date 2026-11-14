"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { daftar } from "../actions";
import { HalamanLangkah, KepalaLangkah, PesanGalat } from "@/components/ui";

export function FormDaftar() {
  const [state, aksi, memproses] = useActionState(daftar, undefined);
  const [setuju, setSetuju] = useState(false);
  const v = state?.nilai ?? {};

  return (
    <form action={aksi} className="contents">
      <HalamanLangkah
        aksi={
          <button type="submit" disabled={!setuju || memproses} className={setuju ? "btn-utama" : "btn btn-nonaktif"}>
            {memproses ? "Mendaftarkan…" : "Daftar & lanjut"}
          </button>
        }
      >
        <KepalaLangkah langkah={1} />

        <div className="flex flex-col gap-1.5">
          <h1 className="judul-halaman">Halo! Yuk kenalan dulu</h1>
          <p className="text-[15px] leading-normal text-muted">Data ini dipakai untuk mengatur jadwal minum TTD-mu.</p>
        </div>

        <PesanGalat pesan={state?.galat} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nama" className="label">Nama lengkap</label>
          <input id="nama" name="nama" required autoComplete="name" defaultValue={v.nama} placeholder="Nama kamu" className="isian" />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="kelas" className="label">Kelas</label>
            <select id="kelas" name="kelas" defaultValue={v.kelas ?? "X"} className="isian px-3">
              <option>X</option>
              <option>XI</option>
              <option>XII</option>
            </select>
          </div>
          <div className="flex flex-[1.3] flex-col gap-1.5">
            <label htmlFor="rombel" className="label">Rombel <span className="font-normal text-muted">(opsional)</span></label>
            <input id="rombel" name="rombel" defaultValue={v.rombel} placeholder="mis. IPA 2" className="isian" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sekolah" className="label">Sekolah</label>
          <input id="sekolah" name="sekolah" required defaultValue={v.sekolah} placeholder="Nama SMA" className="isian" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="no_wa" className="label">Nomor WhatsApp kamu</label>
          <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border-[1.5px] border-garis bg-white focus-within:outline-2 focus-within:outline-berry">
            <span className="flex h-full items-center bg-blush px-3 text-[15px] font-bold">+62</span>
            <input id="no_wa" name="no_wa" type="tel" inputMode="tel" required autoComplete="tel" defaultValue={v.no_wa} placeholder="812 3456 7890" className="h-full min-w-0 flex-1 border-none bg-transparent px-3 text-base outline-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pin" className="label">Buat PIN 6 angka</label>
          <input id="pin" name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="new-password" placeholder="••••••" className="isian tracking-[0.4em]" />
          <span className="text-[13px] text-muted">Dipakai untuk masuk lagi. Jangan beri tahu orang lain.</span>
        </div>

        <div className="kartu flex flex-col gap-2.5 rounded-[20px]">
          <b className="text-[15px]">Persetujuan ikut penelitian</b>
          <p className="text-sm leading-normal text-muted">
            Data kesehatanmu disimpan aman dan hanya dilihat peneliti.{" "}
            <Link href="/persetujuan" target="_blank">Baca lembar persetujuan</Link>
          </p>
          <label className="flex min-h-11 items-start gap-3 text-[15px] leading-snug">
            <input type="checkbox" name="setuju" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="size-[22px] shrink-0 accent-berry" />
            Aku sudah membaca, menandatangani lembar persetujuan bersama orang tua, dan setuju ikut penelitian ini
          </label>
        </div>

        <p className="text-center text-sm text-muted">
          Sudah punya akun? <Link href="/masuk">Masuk</Link>
        </p>
      </HalamanLangkah>
    </form>
  );
}
