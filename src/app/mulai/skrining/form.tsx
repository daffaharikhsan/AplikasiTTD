"use client";

import { useActionState, useState } from "react";
import { simpanSkrining } from "../actions";
import { HalamanLangkah, KepalaLangkah, PesanGalat } from "@/components/ui";
import { LABEL_STATUS, WARNA_STATUS, tentukanStatus, type Diagnosis } from "@/lib/jadwal";
import { GEJALA_5L, POLA_MAKAN, SKALA_5L, pesanSkor5L } from "@/lib/skrining";

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
            className={`flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-full px-2 py-1.5 text-center text-[14px] leading-tight font-bold has-focus-visible:outline-2 has-focus-visible:outline-berry ${
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
  const [gejala, setGejala] = useState<Record<string, string>>({});
  const [makan, setMakan] = useState<Record<string, string>>({});

  const kadar = hb ? Number(hb.replace(",", ".")) : null;
  const status =
    periksa && diag
      ? tentukanStatus({ pernahPeriksa: periksa === "pernah", kadarHb: kadar, diagnosis: diag, batasHb })
      : null;
  const gejalaLengkap = GEJALA_5L.every((g) => gejala[g.kolom] !== undefined);
  const makanLengkap = POLA_MAKAN.every((q) => makan[q.kolom] !== undefined);
  const skor5L = gejalaLengkap ? GEJALA_5L.reduce((n, g) => n + Number(gejala[g.kolom]), 0) : null;
  const siap = Boolean(periksa && diag) && gejalaLengkap && makanLengkap;

  return (
    <form action={aksi} className="contents">
      <HalamanLangkah
        aksi={
          <button type="submit" disabled={!siap || memproses} className={siap ? "btn-utama" : "btn btn-nonaktif"}>
            {memproses ? "Menyimpan…" : siap ? "Lihat jadwalku" : "Jawab semua pertanyaan dulu"}
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

        <div className="flex flex-col gap-1 pt-2">
          <h2 className="text-lg font-semibold">Gejala yang kamu rasakan</h2>
          <p className="text-sm leading-normal text-muted">
            Jawabanmu rahasia, tidak dilihat teman atau guru, dan bukan untuk menilaimu. Ini membantumu lebih mengenali
            tubuhmu.
          </p>
        </div>
        {GEJALA_5L.map((g) => (
          <fieldset key={g.kolom} className="kartu flex flex-col gap-3">
            <legend className="contents">
              <span className="flex flex-col gap-0.5">
                <span className="text-xs font-bold tracking-[0.08em] text-muted uppercase">{g.nama}</span>
                <span className="text-[15px] leading-snug font-semibold">{g.tanya}</span>
              </span>
            </legend>
            <Pilihan
              nama={g.kolom}
              nilai={gejala[g.kolom] ?? null}
              ubah={(v) => setGejala((x) => ({ ...x, [g.kolom]: v }))}
              opsi={SKALA_5L.map((o) => ({ nilai: String(o.nilai), label: o.label }))}
            />
          </fieldset>
        ))}
        {skor5L !== null && (
          <div className="flex flex-col gap-1 rounded-[18px] bg-lavender px-4 py-3.5" aria-live="polite">
            <span className="text-sm">
              Skor gejalamu: <b className="text-base">{skor5L}/10</b>
            </span>
            <span className="text-sm leading-snug text-ink-2">{pesanSkor5L(skor5L)}</span>
          </div>
        )}

        <div className="flex flex-col gap-1 pt-2">
          <h2 className="text-lg font-semibold">Kebiasaan makanmu</h2>
          <p className="text-sm leading-normal text-muted">Pilih yang paling sesuai dengan kebiasaanmu sehari-hari.</p>
        </div>
        {POLA_MAKAN.map((q) => (
          <fieldset key={q.kolom} className="kartu flex flex-col gap-3">
            <legend className="contents text-[15px] leading-snug font-semibold">{q.tanya}</legend>
            <Pilihan
              nama={q.kolom}
              nilai={makan[q.kolom] ?? null}
              ubah={(v) => setMakan((x) => ({ ...x, [q.kolom]: v }))}
              opsi={q.opsi.map((o) => ({ nilai: o.nilai as string, label: o.label }))}
            />
          </fieldset>
        ))}

        <div
          className={`flex items-center gap-3 rounded-[18px] px-4 py-3.5 ${status ? WARNA_STATUS[status] : "bg-garis-2"}`}
          aria-live="polite"
        >
          <span className="text-sm">Kategori jadwal:</span>
          <b className="text-[15px]">{status ? LABEL_STATUS[status] : "Jawab pertanyaan Hb di atas"}</b>
        </div>
        <p className="-mt-2 text-[13px] leading-normal text-muted">
          Kategori hanya ditentukan dari riwayat Hb dan diagnosis, untuk mengatur jadwal pengingat, bukan diagnosis.
          Skor gejala dan kebiasaan makan tidak mengubah jadwal.
        </p>
      </HalamanLangkah>
    </form>
  );
}
