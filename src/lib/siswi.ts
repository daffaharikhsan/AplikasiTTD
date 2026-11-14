import "server-only";
import { cache } from "react";
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
  zona_waktu: string | null;
  jumlah_kontak: number;
};

export type Langkah = "kontak" | "skrining" | "jadwal" | "selesai";

/** Siswi yang login (satu kali per permintaan). Jika belum login → /masuk. */
export const siswiLogin = cache(async (): Promise<Siswi> => {
  const id = await idPenggunaLogin();
  if (!id) redirect("/masuk");
  const db = supabaseAdmin();
  // Dua query dijalankan bersamaan agar hanya satu kali bolak-balik ke database
  const [{ data }, { count }] = await Promise.all([
    db
      .from("siswi")
      .select("id, nama, kelas, sekolah, no_wa, status, jam_minum, hari_minum, mulai_tanggal, zona_waktu")
      .eq("id", id)
      .maybeSingle(),
    db.from("siswi_penerima").select("penerima_id", { count: "exact", head: true }).eq("siswi_id", id),
  ]);
  if (!data) redirect("/daftar?lanjut=1");
  return { ...(data as Omit<Siswi, "jumlah_kontak">), jumlah_kontak: count ?? 0 };
});

export function langkahBerikutnya(s: Siswi): Langkah {
  if (!s.jumlah_kontak) return "kontak";
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

export type SiswiSiap = Siswi & { status: StatusJadwal; jam_minum: string; mulai_tanggal: string };

/** Untuk halaman utama aplikasi: pastikan onboarding selesai. */
export async function siswiSiap(): Promise<SiswiSiap> {
  const s = await siswiLogin();
  const l = langkahBerikutnya(s);
  if (l !== "selesai") redirect(URL_LANGKAH[l]);
  return s as SiswiSiap;
}

export const halamanKalender = (status: StatusJadwal) =>
  status === "anemia" ? "/kalender/harian" : "/kalender/mingguan";
