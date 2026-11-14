import Link from "next/link";
import { IkonKembali, IkonTetes } from "@/components/ikon";
import { LABEL_STATUS, WARNA_STATUS, type StatusJadwal } from "@/lib/jadwal";

/** Kepala halaman onboarding: tombol kembali / logo + "Langkah x dari 4" + bar progres. */
export function KepalaLangkah({ langkah, total = 4, kembali }: { langkah: number; total?: number; kembali?: string }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        {kembali ? (
          <Link href={kembali} aria-label="Kembali" className="flex size-11 items-center justify-center rounded-full bg-white text-ink">
            <IkonKembali />
          </Link>
        ) : (
          <>
            <Logo />
            <span className="text-[15px] font-bold">Pengingat TTD</span>
          </>
        )}
        {total > 0 && (
          <span className="ml-auto text-sm text-muted">
            Langkah {langkah} dari {total}
          </span>
        )}
      </div>
      <div className={`flex gap-1.5 ${total > 0 ? "" : "hidden"}`} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < langkah ? "bg-berry" : "bg-garis-2"}`} />
        ))}
      </div>
    </>
  );
}

export function Logo({ besar = false }: { besar?: boolean }) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-petal text-berry ${besar ? "size-14" : "size-10"}`}>
      <IkonTetes size={besar ? 28 : 20} />
    </div>
  );
}

export function ChipStatus({ status, teks }: { status: StatusJadwal; teks?: string }) {
  return <span className={`chip text-ink ${WARNA_STATUS[status]}`}>{teks ?? LABEL_STATUS[status]}</span>;
}

/** Wadah halaman onboarding: isi bisa digulir + tombol aksi menempel di bawah. */
export function HalamanLangkah({ children, aksi }: { children: React.ReactNode; aksi: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-[18px] px-6 pt-[52px] pb-4">{children}</div>
      <div className="sticky bottom-0 bg-blush/95 px-6 pt-3 pb-7 backdrop-blur">{aksi}</div>
    </main>
  );
}

export function PesanGalat({ pesan }: { pesan?: string | null }) {
  if (!pesan) return null;
  return (
    <p role="alert" className="rounded-2xl bg-peach px-4 py-3 text-sm font-semibold text-ink">
      {pesan}
    </p>
  );
}

export function Catatan({ children, ikon, warna = "bg-petal" }: { children: React.ReactNode; ikon?: React.ReactNode; warna?: string }) {
  return (
    <div className={`flex gap-2.5 rounded-[18px] p-3.5 text-sm leading-normal ${warna}`}>
      {ikon && <span className="mt-px shrink-0">{ikon}</span>}
      <span>{children}</span>
    </div>
  );
}

/** Lingkaran bertumpuk + tetes darah (motif moodboard) */
export function MotifLingkaran({ ukuran = 220 }: { ukuran?: number }) {
  const s = ukuran / 220;
  return (
    <div className="relative" style={{ width: 220 * s, height: 200 * s }} aria-hidden="true">
      <div className="absolute rounded-full bg-lavender" style={{ left: 10 * s, top: 20 * s, width: 150 * s, height: 150 * s }} />
      <div className="absolute rounded-full bg-petal mix-blend-multiply" style={{ left: 70 * s, top: 40 * s, width: 140 * s, height: 140 * s }} />
      <div className="absolute inset-0 flex items-center justify-center text-berry">
        <IkonTetes size={84 * s} />
      </div>
    </div>
  );
}
