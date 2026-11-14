"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker sekali di setiap halaman (agar bisa dipasang & menerima push). */
export function DaftarkanSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);
  return null;
}
