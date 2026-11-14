import "server-only";
import { redirect } from "next/navigation";
import { idPenggunaLogin, supabaseAdmin } from "@/lib/supabase/server";
import type { StatusJadwal } from "@/lib/jadwal";

export type Siswi = {
  id: string;
  nama: string;
  kelas: string;
  sekolah: string;
  no_wa: string;
  status: StatusJadwal | null;
  jam_minum: string | null;
  hari_minum: number | null;
  mulai_tanggal: string | null;
};

export type Langkah = "kontak" | "skrining" | "jadwal" | "selesai";

/** Siswi yang login. Jika belum login → /masuk. */
export async function siswiLogin(): Promise<Siswi> {
  const id = await idPenggunaLogin();
  if (!id) redirect("/masuk");
  const { data } = await supabaseAdmin()
    .from("siswi")
    .select("id, nama, kelas, sekolah, no_wa, status, jam_minum, hari_minum, mulai_tanggal")
    .eq("id", id)
    .maybeSingle();
  if (!data) redirect("/daftar?lanjut=1");
  return data as Siswi;
}

export async function langkahBerikutnya(s: Siswi): Promise<Langkah> {
  const { count } = await supabaseAdmin()
    .from("siswi_penerima")
    .select("penerima_id", { count: "exact", head: true })
    .eq("siswi_id", s.id);
  if (!count) return "kontak";
  if (!s.status) return "skrining";
  if (!s.jam_minum || !s.mulai_tanggal || (s.status !== "anemia" && s.hari_minum === null)) return "jadwal";
  return "selesai";
}

export const URL_LANGKAH: Record<Langkah, string> = {
  kontak: "/mulai/kontak",
  skrining: "/mulai/skrining",
  jadwal: "/mulai/jadwal",
  selesai: "/kalender",
};

/** Untuk halaman utama aplikasi: pastikan onboarding selesai. */
export async function siswiSiap(): Promise<Siswi & { status: StatusJadwal; jam_minum: string; mulai_tanggal: string }> {
  const s = await siswiLogin();
  const l = await langkahBerikutnya(s);
  if (l !== "selesai") redirect(URL_LANGKAH[l]);
  return s as Siswi & { status: StatusJadwal; jam_minum: string; mulai_tanggal: string };
}

export const halamanKalender = (status: StatusJadwal) =>
  status === "anemia" ? "/kalender/harian" : "/kalender/mingguan";
