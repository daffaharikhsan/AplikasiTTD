"use client";

import { useEffect, useRef } from "react";

/** Input tersembunyi berisi zona waktu HP (mis. "Asia/Makassar"), ikut terkirim bersama form. */
export function InputZona() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      if (ref.current) ref.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      /* biarkan kosong: server memakai zona sekolah */
    }
  }, []);
  return <input ref={ref} type="hidden" name="zona" defaultValue="" />;
}
