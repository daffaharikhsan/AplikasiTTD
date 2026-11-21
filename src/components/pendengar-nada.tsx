"use client";

import { useEffect } from "react";
import { putarNadaTTD } from "@/lib/nada";

/**
 * Memutar nada TTD saat pengingat masuk dan aplikasi sedang terbuka di layar.
 * (Saat aplikasi tertutup, HP memakai suara notifikasi bawaan sistem —
 * browser tidak mengizinkan suara khusus untuk notifikasi web.)
 */
export function PendengarNada() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const saatPesan = (e: MessageEvent) => {
      if (e.data?.type === "pengingat-ttd" && document.visibilityState === "visible") void putarNadaTTD();
    };
    navigator.serviceWorker.addEventListener("message", saatPesan);
    // Buka kunci audio pada interaksi pertama, agar nada berikutnya boleh diputar otomatis
    const buka = () => {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) new Ctor().resume().catch(() => {});
    };
    window.addEventListener("pointerdown", buka, { once: true });
    return () => {
      navigator.serviceWorker.removeEventListener("message", saatPesan);
      window.removeEventListener("pointerdown", buka);
    };
  }, []);
  return null;
}
