"use client";

import { useActionState } from "react";
import { masukPeneliti } from "./actions";
import { PesanGalat } from "@/components/ui";

export function FormMasukPeneliti() {
  const [state, aksi, memproses] = useActionState(masukPeneliti, undefined);
  return (
    <form action={aksi} className="kartu flex flex-col gap-3">
      <PesanGalat pesan={state?.galat} />
      <label htmlFor="sandi" className="label">Kata sandi peneliti</label>
      <input id="sandi" name="sandi" type="password" required autoComplete="current-password" className="isian-lembut" />
      <button type="submit" disabled={memproses} className="btn-utama">{memproses ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
