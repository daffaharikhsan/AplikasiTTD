"use client";

import { useActionState, useState } from "react";
import { simpanJadwal } from "@/app/mulai/actions";
import { Catatan, HalamanLangkah, PesanGalat } from "@/components/ui";
import { IkonInfo } from "@/components/ikon";
import { InputZona } from "@/components/input-zona";
import type { StatusJadwal } from "@/lib/jadwal";

const HARI = [
  { n: 1, l: "Sen" }, { n: 2, l: "Sel" }, { n: 3, l: "Rab" }, { n: 4, l: "Kam" },
  { n: 5, l: "Jum" }, { n: 6, l: "Sab" }, { n: 0, l: "Min" },
];

const keMenit = (j: string) => {
  const [h, m] = j.split(":").map(Number);
  return h * 60 + m;
};

/** Form pilih jam (dan hari untuk jadwal mingguan). Dipakai di onboarding & halaman Pengingat. */
export function FormJadwal({
  status,
  jamAwal,
  hariAwal,
  jamSekolah,
  hariSekolah,
  dari,
  kepala,
}: {
  status: StatusJadwal;
  jamAwal: string;
  hariAwal: number;
  jamSekolah: { mulai: string; selesai: string };
  hariSekolah: number[];
  dari?: "pengingat";
  /** Kepala halaman onboarding (tidak dipakai di halaman Pengingat). */
  kepala?: React.ReactNode;
}) {
  const [state, aksi, memproses] = useActionState(simpanJadwal, undefined);
  const [jam, setJam] = useState(jamAwal);
  const [hari, setHari] = useState(hariAwal);
  const mingguan = status !== "anemia";

  const diLuarJamSekolah =
    jam && (keMenit(jam) < keMenit(jamSekolah.mulai) || keMenit(jam) > keMenit(jamSekolah.selesai));
  const bukanHariSekolah = mingguan && !hariSekolah.includes(hari);

  const isi = (
    <>
      <PesanGalat pesan={state?.galat} />
      {mingguan && (
        <fieldset className="kartu flex flex-col gap-3">
          <legend className="contents text-base font-bold">Hari minum tiap minggu</legend>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup">
            {HARI.map((h) => (
              <label
                key={h.n}
                className={`flex h-12 cursor-pointer items-center justify-center rounded-[14px] text-sm font-bold has-focus-visible:outline-2 has-focus-visible:outline-berry ${
                  hari === h.n ? "bg-berry text-white" : "border-[1.5px] border-garis bg-blush"
                }`}
              >
                <input type="radio" name="hari" value={h.n} checked={hari === h.n} onChange={() => setHari(h.n)} className="sr-only" />
                {h.l}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="kartu flex items-center justify-between gap-3 rounded-[24px]">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="jam" className="text-base font-bold">Jam minum TTD</label>
          <span className="text-[13px] text-muted">Pilih pagi/siang agar guru ikut mengingatkan</span>
        </div>
        <input
          id="jam"
          name="jam"
          type="time"
          step={300}
          required
          value={jam}
          onChange={(e) => setJam(e.target.value)}
          className="h-12 rounded-[14px] border-[1.5px] border-garis bg-blush px-2.5 text-lg font-bold accent-berry"
        />
      </div>

      {(diLuarJamSekolah || bukanHariSekolah) && (
        <Catatan ikon={<IkonInfo />} warna="bg-peach">
          Jadwal ini di luar jam sekolah ({jamSekolah.mulai.replace(":", ".")}–{jamSekolah.selesai.replace(":", ".")}, hari
          sekolah), jadi guru tidak ikut diingatkan. Orang tua tetap diingatkan.
        </Catatan>
      )}
      <InputZona />
      {dari && <input type="hidden" name="dari" value={dari} />}
    </>
  );

  const tombol = (
    <button type="submit" disabled={memproses} className="btn-utama">
      {memproses ? "Menyimpan…" : dari ? "Simpan jadwal" : "Simpan & lanjut"}
    </button>
  );

  return (
    <form action={aksi} className={dari ? "flex flex-col gap-3.5" : "contents"}>
      {dari ? (
        <>
          {isi}
          {tombol}
        </>
      ) : (
        <HalamanLangkah aksi={tombol}>
          {kepala}
          {isi}
        </HalamanLangkah>
      )}
    </form>
  );
}
