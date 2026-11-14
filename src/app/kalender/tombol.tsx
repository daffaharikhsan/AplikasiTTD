"use client";

import { useFormStatus } from "react-dom";
import { IkonCentang, IkonTetes } from "@/components/ikon";

export function TombolMinum({ sudah, label }: { sudah: boolean; label?: string }) {
  const { pending } = useFormStatus();
  if (sudah) {
    return (
      <button type="submit" disabled={pending} className="btn-sudah" aria-label="Sudah diminum. Ketuk untuk membatalkan">
        <IkonCentang />
        {pending ? "Membatalkan…" : label ?? "Sudah diminum — terima kasih!"}
      </button>
    );
  }
  return (
    <button type="submit" disabled={pending} className="btn-utama">
      {pending ? "Menyimpan…" : label ?? "Sudah minum TTD"}
    </button>
  );
}

export function TombolHaid({ aktif, label }: { aktif: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={aktif}
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap disabled:opacity-60 ${
        aktif ? "bg-berry text-white" : "border-[1.5px] border-garis bg-white text-berry"
      }`}
    >
      <IkonTetes size={16} />
      {label}
    </button>
  );
}
