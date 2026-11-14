import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type KontakSiswi = {
  id: string;
  peran: "ortu" | "guru";
  nama: string | null;
  hubungan: string | null;
  no_wa: string;
  token: string;
  berhenti: boolean;
  aktif: boolean; // sudah punya langganan push
};

/** Kontak ortu/guru milik siswi beserta status aktif push-nya. */
export async function kontakSiswi(siswiId: string): Promise<KontakSiswi[]> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("siswi_penerima")
    .select("penerima:penerima_id (id, peran, nama, hubungan, no_wa, token, berhenti)")
    .eq("siswi_id", siswiId);
  const daftar = (data ?? [])
    .map((r) => r.penerima as unknown as Omit<KontakSiswi, "aktif"> | null)
    .filter((p): p is Omit<KontakSiswi, "aktif"> => Boolean(p));
  if (!daftar.length) return [];
  const { data: langganan } = await db
    .from("push_langganan")
    .select("penerima_id")
    .in("penerima_id", daftar.map((p) => p.id));
  const aktif = new Set((langganan ?? []).map((l) => l.penerima_id));
  return daftar.map((p) => ({ ...p, aktif: aktif.has(p.id) }));
}
