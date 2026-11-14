import type { Metadata } from "next";
import Link from "next/link";
import { siswiSiap } from "@/lib/siswi";
import { kontakSiswi } from "@/lib/kontak";
import { AktifkanNotifikasi } from "@/components/aktifkan-notifikasi";
import { BagikanOrtu } from "@/components/bagikan-ortu";
import { Catatan, HalamanLangkah, KepalaLangkah } from "@/components/ui";
import { IkonGuru } from "@/components/ikon";

export const metadata: Metadata = { title: "Aktifkan pengingat" };

export default async function Aktifkan() {
  const s = await siswiSiap();
  const kontak = await kontakSiswi(s.id);
  const ortu = kontak.filter((k) => k.peran === "ortu");
  const guru = kontak.find((k) => k.peran === "guru");

  return (
    <HalamanLangkah aksi={<Link href="/kalender" className="btn-utama">Lihat kalenderku</Link>}>
      <KepalaLangkah langkah={4} kembali="/mulai/jadwal" />
      <div className="flex flex-col gap-1.5">
        <h1 className="judul-halaman">Satu langkah lagi</h1>
        <p className="text-[15px] leading-normal text-muted">
          Nyalakan pengingat di HP-mu, lalu kirim link ke orang tua supaya mereka ikut mengingatkan.
        </p>
      </div>

      <AktifkanNotifikasi />

      {ortu.map((o) => (
        <BagikanOrtu key={o.id} ortu={o} namaSiswi={s.nama} />
      ))}

      {guru && (
        <Catatan ikon={<IkonGuru />} warna="bg-lavender">
          Link untuk {guru.nama || "guru"} dikirim oleh peneliti, jadi kamu tidak perlu mengirimnya.
        </Catatan>
      )}
    </HalamanLangkah>
  );
}
