import Link from "next/link";
import { IkonBuku, IkonKalender, IkonLonceng, IkonProfil } from "@/components/ikon";
import type { StatusJadwal } from "@/lib/jadwal";
import { SinkronZona } from "@/components/sinkron-zona";

const MENU = [
  { kunci: "kalender", href: "/kalender", label: "Kalender", Ikon: IkonKalender },
  { kunci: "edukasi", href: "/edukasi", label: "Edukasi", Ikon: IkonBuku },
  { kunci: "pengingat", href: "/pengingat", label: "Pengingat", Ikon: IkonLonceng },
  { kunci: "profil", href: "/profil", label: "Profil", Ikon: IkonProfil },
] as const;

export type MenuAktif = (typeof MENU)[number]["kunci"];

/** Langsung ke kalender yang sesuai kategori (tanpa pengalihan tambahan) bila status diketahui. */
const hrefKalender = (status?: StatusJadwal) =>
  status ? (status === "anemia" ? "/kalender/harian" : "/kalender/mingguan") : "/kalender";

export function NavBawah({ aktif, status }: { aktif: MenuAktif; status?: StatusJadwal }) {
  return (
    <nav aria-label="Menu utama" className="sticky bottom-0 z-10 bg-gradient-to-t from-blush via-blush/90 to-transparent px-4 pt-2 pb-[max(22px,env(safe-area-inset-bottom))]">
      <div className="flex justify-between rounded-full bg-white p-2 shadow-[0_2px_12px_rgba(61,43,51,0.06)]">
        {MENU.map(({ kunci, href: hrefDasar, label, Ikon }) => {
          const href = kunci === "kalender" ? hrefKalender(status) : hrefDasar;
          return kunci === aktif ? (
            <Link key={kunci} href={href} aria-current="page" className="flex h-12 items-center gap-2 rounded-full bg-petal px-4 text-sm font-bold text-ink no-underline">
              <Ikon />
              {label}
            </Link>
          ) : (
            <Link key={kunci} href={href} aria-label={label} className="flex size-12 items-center justify-center rounded-full text-ink">
              <Ikon />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Kerangka halaman utama (setelah onboarding) dengan navigasi bawah. */
export function HalamanApp({
  aktif,
  status,
  zona,
  children,
}: {
  aktif: MenuAktif;
  status?: StatusJadwal;
  /** Zona waktu tersimpan; bila diberikan, zona HP disinkronkan otomatis. */
  zona?: string | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-12 pb-3">{children}</main>
      <NavBawah aktif={aktif} status={status} />
      {zona !== undefined && <SinkronZona tersimpan={zona} />}
    </>
  );
}
