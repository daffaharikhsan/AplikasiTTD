"use client";

import { useActionState } from "react";
import { kirimUji } from "./actions";

export function TombolUji() {
  const [hasil, aksi, memproses] = useActionState(kirimUji, undefined);
  return (
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
  );
}
