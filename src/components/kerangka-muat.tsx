import { NavBawah, type MenuAktif } from "@/components/nav-bawah";

/**
 * Tampilan sementara saat halaman dimuat. Muncul seketika ketika menu diketuk,
 * sehingga aplikasi terasa responsif walau data masih diambil dari server.
 */
export function KerangkaMuat({ aktif, blok = [92, 260, 72] }: { aktif: MenuAktif; blok?: number[] }) {
  return (
    <>
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-12 pb-3" aria-busy="true" aria-label="Memuat">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-garis-2" />
        {blok.map((tinggi, i) => (
          <div key={i} className="animate-pulse rounded-[26px] bg-white" style={{ height: tinggi }} />
        ))}
      </main>
      <NavBawah aktif={aktif} />
    </>
  );
}
