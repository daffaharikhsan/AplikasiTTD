"use server";

import { idPenggunaLogin, supabaseAdmin } from "@/lib/supabase/server";
import { zonaValid } from "@/lib/zona";

/** Menyimpan zona waktu HP siswi yang login. Mengembalikan true bila ada perubahan. */
export async function perbaruiZona(zona: string): Promise<boolean> {
  if (!zonaValid(zona)) return false;
  const id = await idPenggunaLogin();
  if (!id) return false;
  const db = supabaseAdmin();
  const { data: lama } = await db.from("siswi").select("zona_waktu").eq("id", id).maybeSingle();
  if (!lama || lama.zona_waktu === zona) return false;
  const { error } = await db.from("siswi").update({ zona_waktu: zona }).eq("id", id);
  return !error;
}
