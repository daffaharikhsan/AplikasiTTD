"use client";

import { useEffect, useState } from "react";
import { IkonCentang, IkonInfo, IkonLonceng } from "@/components/ikon";

function base64KeUint8(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Keadaan = "memeriksa" | "tidak_didukung" | "perlu_pasang_ios" | "ditolak" | "belum" | "aktif" | "memproses";

/**
 * Tombol "Aktifkan pengingat" untuk siswi (tanpa token) atau ortu/guru (dengan token link).
 * Menangani: browser tidak mendukung, iPhone yang belum dipasang ke Home Screen, izin ditolak.
 */
export function AktifkanNotifikasi({ token, ringkas = false }: { token?: string; ringkas?: boolean }) {
  const [keadaan, setKeadaan] = useState<Keadaan>("memeriksa");
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const terpasang =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setKeadaan(ios && !terpasang ? "perlu_pasang_ios" : "tidak_didukung");
        return;
      }
      if (Notification.permission === "denied") return setKeadaan("ditolak");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        // Sinkronkan ulang ke server (mis. setelah ganti akun / data terhapus)
        fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), token }),
        }).catch(() => {});
        setKeadaan("aktif");
      } else setKeadaan("belum");
    })().catch(() => setKeadaan("tidak_didukung"));
  }, [token]);

  async function aktifkan() {
    setGalat(null);
    setKeadaan("memproses");
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") {
        setKeadaan(izin === "denied" ? "ditolak" : "belum");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64KeUint8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }));
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), token }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).galat || "Gagal menyimpan");
      setKeadaan("aktif");
    } catch (e) {
      setGalat((e as Error).message || "Terjadi kesalahan");
      setKeadaan("belum");
    }
  }

  if (keadaan === "memeriksa") {
    return <div className="kartu h-[88px] animate-pulse" aria-busy="true" />;
  }

  if (keadaan === "aktif") {
    return (
      <div className="flex items-center gap-3 rounded-[20px] bg-mint p-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink">
          <IkonCentang />
        </span>
        <span className="flex flex-col">
          <b className="text-[15px]">Pengingat aktif di HP ini</b>
          {!ringkas && <span className="text-sm text-ink-2">Notifikasi akan muncul di jam minum TTD.</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="kartu flex flex-col gap-3 border-2 border-berry">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-berry text-white">
          <IkonLonceng />
        </span>
        <span className="flex flex-col gap-0.5">
          <b className="text-[15px]">Aktifkan pengingat di HP ini</b>
          <span className="text-sm text-ink-2">Supaya notifikasi muncul tepat di jam minum TTD.</span>
        </span>
      </div>

      {keadaan === "perlu_pasang_ios" && (
        <p className="rounded-2xl bg-blush p-3 text-sm leading-normal">
          Di iPhone, pasang dulu aplikasinya: buka di <b>Safari</b>, ketuk tombol <b>Bagikan</b> lalu{" "}
          <b>Tambahkan ke Layar Utama</b>. Setelah itu buka dari ikon di layar utama dan tekan tombol ini lagi.
        </p>
      )}
      {keadaan === "tidak_didukung" && (
        <p className="rounded-2xl bg-blush p-3 text-sm leading-normal">
          Browser ini belum mendukung notifikasi. Coba buka link ini di <b>Google Chrome</b>.
        </p>
      )}
      {keadaan === "ditolak" && (
        <p className="flex gap-2 rounded-2xl bg-peach p-3 text-sm leading-normal">
          <IkonInfo size={18} className="mt-0.5 shrink-0" />
          <span>
            Izin notifikasi sedang diblokir. Buka pengaturan situs di browser (ikon gembok di sebelah alamat) lalu izinkan{" "}
            <b>Notifikasi</b>, kemudian muat ulang halaman ini.
          </span>
        </p>
      )}
      {galat && (
        <p role="alert" className="text-sm font-semibold text-berry">
          {galat}
        </p>
      )}
      {(keadaan === "belum" || keadaan === "memproses") && (
        <button type="button" onClick={aktifkan} disabled={keadaan === "memproses"} className="btn-utama">
          {keadaan === "memproses" ? "Memproses…" : "Aktifkan pengingat"}
        </button>
      )}
    </div>
  );
}
