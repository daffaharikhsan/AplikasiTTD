"use client";

import { useActionState } from "react";
import { kirimUji } from "./actions";
import { putarNadaTTD } from "@/lib/nada";
import { IkonLonceng } from "@/components/ikon";

export function TombolUji() {
  const [hasil, aksi, memproses] = useActionState(kirimUji, undefined);
  return (
    <div className="flex flex-col gap-2">
      <form action={aksi} className="flex flex-col gap-2">
        <button type="submit" disabled={memproses} className="btn-garis">
          {memproses ? "Mengirim…" : "Kirim notifikasi uji"}
        </button>
        {hasil && (
          <p role="status" className={`text-center text-sm font-semibold ${hasil.ok ? "text-ink" : "text-berry"}`}>
            {hasil.pesan}
          </p>
        )}
      </form>
      <button
        type="button"
        onClick={() => void putarNadaTTD()}
        className="mx-auto flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-berry"
      >
        <IkonLonceng size={18} /> Dengar nada pengingat
      </button>
      <p className="text-center text-xs leading-normal text-muted">
        Nada ini berbunyi saat pengingat masuk ketika aplikasi sedang terbuka. Saat aplikasi tertutup, HP memakai suara
        notifikasi bawaannya.
      </p>
    </div>
  );
}
