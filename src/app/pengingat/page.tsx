import type { Metadata } from "next";
import { siswiSiap } from "@/lib/siswi";
import { ambilPengaturan } from "@/lib/pengaturan";
import { jamKeMenit, menitKeJam } from "@/lib/waktu";
import { namaDepan, pesanSiswi, pesanOrtu } from "@/lib/pesan";
import { HalamanApp } from "@/components/nav-bawah";
import { FormJadwal } from "@/components/form-jadwal";
import { AktifkanNotifikasi } from "@/components/aktifkan-notifikasi";
import { TombolUji } from "./tombol-uji";

export const metadata: Metadata = { title: "Pengingat" };

export default async function Pengingat({ searchParams }: PageProps<"/pengingat">) {
  const s = await siswiSiap();
  const cfg = await ambilPengaturan();
  const tersimpan = (await searchParams).tersimpan === "1";

  const t1 = jamKeMenit(s.jam_minum);
  const jeda = cfg.jedaTahap2Menit[s.status] ?? 60;
  const t2 = t1 + jeda;
  const t3 = jamKeMenit(cfg.jamTahap3);
  const p1 = pesanSiswi(s.status, 1, false);
  const p2 = pesanSiswi(s.status, 2, false);
  const nama = namaDepan(s.nama);

  const langkah = [
    { jam: menitKeJam(t1), judul: "Pengingat pertama", isi: `“${p1.judul}. ${p1.isi.split(".")[0]}.” + ke ortu & guru`, warna: "bg-berry" },
    { jam: menitKeJam(t2), judul: "Lebih tegas", isi: `“${p2.judul}.” + pesan lanjutan ke ortu & guru`, warna: "bg-rose" },
    ...(t3 > t2 ? [{ jam: menitKeJam(t3), judul: "Pengingat terakhir", isi: "Hanya ke kamu, tidak ke ortu/guru", warna: "bg-petal border-[1.5px] border-garis-3" }] : []),
  ];

  return (
    <HalamanApp aktif="pengingat" status={s.status}>
      <h1 className="font-judul text-[28px] font-normal">Pengingat</h1>

      {tersimpan && (
        <p role="status" className="rounded-2xl bg-mint px-4 py-3 text-sm font-semibold">Jadwal tersimpan.</p>
      )}

      <AktifkanNotifikasi ringkas />

      <FormJadwal
        status={s.status}
        jamAwal={s.jam_minum.slice(0, 5)}
        hariAwal={s.hari_minum ?? 1}
        jamSekolah={cfg.jamSekolah}
        hariSekolah={cfg.hariSekolah}
        dari="pengingat"
      />

      <section className="flex flex-col gap-3 rounded-[24px] bg-white p-4">
        <b className="text-base">Kalau belum dicentang</b>
        <ol className="flex flex-col">
          {langkah.map((l, i) => (
            <li key={l.judul} className="flex gap-3">
              <div className="flex w-3.5 flex-col items-center pt-1" aria-hidden="true">
                <span className={`size-3 shrink-0 rounded-full ${l.warna}`} />
                {i < langkah.length - 1 && <span className="w-0.5 flex-1 bg-garis" />}
              </div>
              <div className="flex flex-col gap-0.5 pb-3">
                <b className="text-[15px]">{l.jam} · {l.judul}</b>
                <span className="text-sm text-ink-2">{l.isi}</span>
              </div>
            </li>
          ))}
        </ol>
        <span className="text-[13px] text-muted">
          {s.status === "anemia" ? "Kategori anemia: pengingat kedua dikirim +30 menit." : `Pengingat kedua dikirim +${jeda} menit.`}
        </span>
      </section>

      <section className="flex flex-col gap-2.5 rounded-[24px] bg-white p-4">
        <b className="text-base">Contoh pesan untuk ortu &amp; guru</b>
        {[{ p: pesanOrtu(nama, 1), j: menitKeJam(t1) }, { p: pesanOrtu(nama, 2), j: menitKeJam(t2) }].map(({ p, j }) => (
          <div key={j} className="max-w-[85%] self-start rounded-[18px_18px_18px_6px] bg-mint px-3.5 py-2.5 text-[15px] leading-snug">
            {p.isi}
            <span className="mt-0.5 block text-right text-xs text-ink-2">{j}</span>
          </div>
        ))}
        <span className="text-[13px] text-muted">Maks. 2 pesan/hari. Berhenti otomatis setelah kamu centang.</span>
      </section>

      <TombolUji />
    </HalamanApp>
  );
}
