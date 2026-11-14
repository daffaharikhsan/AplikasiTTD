"use client";

import { useActionState, useState } from "react";
import { simpanSkrining } from "../actions";
import { HalamanLangkah, KepalaLangkah, PesanGalat } from "@/components/ui";
import { LABEL_STATUS, WARNA_STATUS, tentukanStatus, type Diagnosis } from "@/lib/jadwal";

function Pilihan<T extends string>({
  nama,
  opsi,
  nilai,
  ubah,
}: {
  nama: string;
  opsi: { nilai: T; label: string }[];
  nilai: T | null;
  ubah: (v: T) => void;
}) {
  return (
    <div className="flex gap-2" role="radiogroup">
      {opsi.map((o) => {
        const aktif = nilai === o.nilai;
        return (
          <label
            key={o.nilai}
            className={`flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-full px-2.5 text-center text-[15px] font-bold has-focus-visible:outline-2 has-focus-visible:outline-berry ${
              aktif ? "bg-berry text-white" : "border-[1.5px] border-garis bg-blush text-ink"
            }`}
          >
            <input type="radio" name={nama} value={o.nilai} checked={aktif} onChange={() => ubah(o.nilai)} className="sr-only" />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

export function FormSkrining({ batasHb, ulang }: { batasHb: number; ulang: boolean }) {
  const [state, aksi, memproses] = useActionState(simpanSkrining, undefined);
  const [periksa, setPeriksa] = useState<"pernah" | "belum" | null>(null);
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [hb, setHb] = useState("");

  const kadar = hb ? Number(hb.replace(",", ".")) : null;
  const status =
    periksa && diag
      ? tentukanStatus({ pernahPeriksa: periksa === "pernah", kadarHb: kadar, diagnosis: diag, batasHb })
      : null;
  const siap = Boolean(periksa && diag);

  return (
    <form action={aksi} className="contents">
      <HalamanLangkah
        aksi={
          <button type="submit" disabled={!siap || memproses} className={siap ? "btn-utama" : "btn btn-nonaktif"}>
            {memproses ? "Menyimpan…" : "Lihat jadwalku"}
          </button>
        }
      >
        {ulang ? <KepalaLangkah langkah={3} total={0} kembali="/profil" /> : <KepalaLangkah langkah={3} kembali="/mulai/kontak" />}

        <div className="flex flex-col gap-1.5">
          <h1 className="judul-halaman">{ulang ? "Perbarui hasil Hb-mu" : "Cek kondisimu sebentar"}</h1>
          <p className="text-[15px] leading-normal text-muted">
            Supaya jadwal TTD pas untukmu. Jawab sejujurnya ya, tidak ada jawaban salah.
          </p>
        </div>

        <PesanGalat pesan={state?.galat} />

        <fieldset className="kartu flex flex-col gap-3">
          <legend className="contents text-base font-bold">Pernah periksa Hb (hemoglobin)?</legend>
          <Pilihan
            nama="periksa"
            nilai={periksa}
            ubah={setPeriksa}
            opsi={[
              { nilai: "pernah", label: "Pernah" },
              { nilai: "belum", label: "Belum" },
            ]}
          />
          {periksa === "pernah" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kadar_hb" className="label">
                Kadar Hb terakhir <span className="font-normal text-muted">(kosongkan jika lupa)</span>
              </label>
              <div className="flex h-12 items-center overflow-hidden rounded-[14px] border-[1.5px] border-garis bg-blush focus-within:outline-2 focus-within:outline-berry">
                <input
                  id="kadar_hb"
                  name="kadar_hb"
                  inputMode="decimal"
                  value={hb}
                  onChange={(e) => setHb(e.target.value)}
                  placeholder="mis. 11,5"
                  className="h-full min-w-0 flex-1 border-none bg-transparent px-3.5 text-base outline-none"
                />
                <span className="px-3.5 text-[15px] text-muted">g/dL</span>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="kartu flex flex-col gap-3">
          <legend className="contents text-base font-bold">Pernah didiagnosis anemia oleh tenaga kesehatan?</legend>
          <Pilihan
            nama="diagnosis"
            nilai={diag}
            ubah={setDiag}
            opsi={[
              { nilai: "ya", label: "Ya" },
              { nilai: "tidak", label: "Tidak" },
              { nilai: "tidak_tahu", label: "Tidak tahu" },
            ]}
          />
        </fieldset>

        <div
          className={`flex items-center gap-3 rounded-[18px] px-4 py-3.5 ${status ? WARNA_STATUS[status] : "bg-garis-2"}`}
          aria-live="polite"
        >
          <span className="text-sm">Kategori jadwal:</span>
          <b className="text-[15px]">{status ? LABEL_STATUS[status] : "Isi dulu pertanyaan di atas"}</b>
        </div>
        <p className="-mt-2 text-[13px] leading-normal text-muted">
          Ini hanya untuk mengatur jadwal pengingat, bukan diagnosis. Untuk kepastian, tanyakan ke tenaga kesehatan.
        </p>
      </HalamanLangkah>
    </form>
  );
}
