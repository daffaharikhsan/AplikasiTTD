"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { perbaruiZona } from "@/app/zona-actions";

/**
 * Jika zona waktu HP berbeda dengan yang tersimpan (mis. siswi bepergian ke
 * daerah WITA atau ke luar negeri), simpan zona baru lalu muat ulang tampilan
 * agar "hari ini" dan jam pengingat mengikuti waktu setempat.
 */
export function SinkronZona({ tersimpan }: { tersimpan: string | null }) {
  const router = useRouter();
  useEffect(() => {
    let zona = "";
    try {
      zona = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return;
    }
    if (!zona || zona === tersimpan) return;
    perbaruiZona(zona)
      .then((berubah) => {
        if (berubah) router.refresh();
      })
      .catch(() => {});
  }, [tersimpan, router]);
  return null;
}
