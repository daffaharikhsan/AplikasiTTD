"use client";

import { useActionState } from "react";
import { simpanKontak } from "../actions";
import { Catatan, HalamanLangkah, KepalaLangkah, PesanGalat } from "@/components/ui";
import { IkonGuru, IkonInfo, IkonRumah } from "@/components/ikon";

export type KontakAwal = {
  ortu?: { nama: string; hubungan: string; no_wa: string };
  guru?: { nama: string; no_wa: string };
};

export function FormKontak({ awal, dariProfil }: { awal: KontakAwal; dariProfil: boolean }) {
  const [state, aksi, memproses] = useActionState(simpanKontak, undefined);

  return (
    <form action={aksi} className="contents">
      {dariProfil && <input type="hidden" name="dari" value="profil" />}
      <HalamanLangkah
        aksi={
          <button type="submit" disabled={memproses} className="btn-utama">
            {memproses ? "Menyimpan…" : dariProfil ? "Simpan kontak" : "Simpan & lanjut"}
          </button>
        }
      >
        {dariProfil ? (
          <KepalaLangkah langkah={2} total={0} kembali="/profil" />
        ) : (
          <KepalaLangkah langkah={2} kembali="/" />
        )}

        <div className="flex flex-col gap-1.5">
          <h1 className="judul-halaman">Siapa yang ikut mengingatkanmu?</h1>
          <p className="text-[15px] leading-normal text-muted">
            Mereka ikut dapat pengingat di jam minum TTD-mu. Tanpa perlu buat akun.
          </p>
        </div>

        <PesanGalat pesan={state?.galat} />

        <fieldset className="kartu flex flex-col gap-3">
          <legend className="sr-only">Orang tua / wali / orang serumah</legend>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-petal text-ink"><IkonRumah size={18} /></span>
            <b className="text-base">Orang tua / wali / orang serumah</b>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="hubungan" className="label">Hubungan</label>
              <select id="hubungan" name="hubungan" defaultValue={awal.ortu?.hubungan ?? "Ibu"} className="isian-lembut px-3">
                <option>Ibu</option>
                <option>Ayah</option>
                <option>Wali</option>
                <option>Orang serumah</option>
              </select>
            </div>
            <div className="flex flex-[1.4] flex-col gap-1.5">
              <label htmlFor="nama_ortu" className="label">Nama <span className="font-normal text-muted">(opsional)</span></label>
              <input id="nama_ortu" name="nama_ortu" defaultValue={awal.ortu?.nama} placeholder="mis. Ibu Sari" className="isian-lembut" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="no_ortu" className="label">Nomor WhatsApp</label>
            <input id="no_ortu" name="no_ortu" type="tel" inputMode="tel" required defaultValue={awal.ortu?.no_wa} placeholder="0812 3456 7890" className="isian-lembut" />
          </div>
        </fieldset>

        <fieldset className="kartu flex flex-col gap-3">
          <legend className="sr-only">Guru</legend>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lavender text-ink"><IkonGuru size={18} /></span>
            <b className="text-base">Guru (BK / UKS / wali kelas)</b>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nama_guru" className="label">Nama guru</label>
            <input id="nama_guru" name="nama_guru" defaultValue={awal.guru?.nama} placeholder="Bu / Pak …" className="isian-lembut" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="no_guru" className="label">Nomor WhatsApp <span className="font-normal text-muted">(boleh dikosongkan jika belum tahu)</span></label>
            <input id="no_guru" name="no_guru" type="tel" inputMode="tel" defaultValue={awal.guru?.no_wa} placeholder="0813 0000 0000" className="isian-lembut" />
          </div>
        </fieldset>

        <Catatan ikon={<IkonInfo />}>
          Maksimal 2 pesan per hari. Guru hanya dikirimi di jam sekolah. Nomor hanya dipakai untuk penelitian.
        </Catatan>
      </HalamanLangkah>
    </form>
  );
}
