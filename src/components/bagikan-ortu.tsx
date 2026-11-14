import { IkonBagikan, IkonRumah } from "@/components/ikon";
import { teksUndanganOrtu } from "@/lib/pesan";
import { tampilNomor } from "@/lib/telepon";

export type KontakOrtu = { nama: string | null; hubungan: string | null; no_wa: string; token: string; aktif: boolean };

const urlApp = () => (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

/**
 * Siswi membagikan link pengingat ke orang tua lewat WhatsApp-nya sendiri (wa.me).
 * Tidak perlu bot: pesan dikirim dari HP siswi.
 */
export function BagikanOrtu({ ortu, namaSiswi }: { ortu: KontakOrtu; namaSiswi: string }) {
  const link = `${urlApp()}/o/${ortu.token}`;
  const wa = `https://wa.me/${ortu.no_wa}?text=${encodeURIComponent(teksUndanganOrtu(namaSiswi, link))}`;
  const label = ortu.hubungan || "Orang tua";

  return (
    <div className="kartu flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-petal text-ink">
          <IkonRumah size={18} />
        </span>
        <span className="flex min-w-0 flex-col">
          <b className="text-[15px]">{ortu.nama ? `${label} · ${ortu.nama}` : label}</b>
          <span className="text-[13px] text-muted">{tampilNomor(ortu.no_wa)}</span>
        </span>
        <span className={`chip ml-auto shrink-0 ${ortu.aktif ? "bg-mint" : "bg-garis-2 text-muted"}`}>
          {ortu.aktif ? "Pengingat aktif" : "Belum aktif"}
        </span>
      </div>
      {!ortu.aktif && (
        <>
          <p className="text-sm leading-normal text-ink-2">
            Kirim link ke {label.toLowerCase()} lewat WhatsApp-mu, lalu minta {label.toLowerCase()} membukanya dan menekan
            &ldquo;Aktifkan pengingat&rdquo;.
          </p>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-utama">
            <IkonBagikan />
            Kirim link via WhatsApp
          </a>
        </>
      )}
    </div>
  );
}
