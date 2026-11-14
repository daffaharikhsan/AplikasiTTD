"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { siswiLogin, langkahBerikutnya, URL_LANGKAH } from "@/lib/siswi";
import { normalisasiNomor } from "@/lib/telepon";
import { ambilPengaturan } from "@/lib/pengaturan";
import { tentukanStatus, type Diagnosis } from "@/lib/jadwal";
import { saatLokal } from "@/lib/waktu";
import { zonaSiswi, zonaValid } from "@/lib/zona";

export type HasilForm = { galat?: string } | undefined;
const ambil = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function hubungkan(siswiId: string, peran: "ortu" | "guru", data: { nama: string | null; hubungan?: string | null; no_wa: string } | null) {
  const db = supabaseAdmin();
  // Lepas penerima lama dengan peran yang sama
  const { data: lama } = await db
    .from("siswi_penerima")
    .select("penerima_id, penerima:penerima_id (peran)")
    .eq("siswi_id", siswiId);
  const idLama = (lama ?? [])
    .filter((r) => (r.penerima as unknown as { peran: string } | null)?.peran === peran)
    .map((r) => r.penerima_id as string);
  if (idLama.length) await db.from("siswi_penerima").delete().eq("siswi_id", siswiId).in("penerima_id", idLama);
  if (!data) return;

  const baris: Record<string, unknown> = { peran, no_wa: data.no_wa };
  if (data.nama) baris.nama = data.nama;
  if (data.hubungan) baris.hubungan = data.hubungan;
  const { data: p, error } = await db
    .from("penerima")
    .upsert(baris, { onConflict: "peran,no_wa" })
    .select("id")
    .single();
  if (error || !p) throw new Error(error?.message ?? "gagal menyimpan kontak");
  await db.from("siswi_penerima").upsert({ siswi_id: siswiId, penerima_id: p.id });
}

export async function simpanKontak(_: HasilForm, fd: FormData): Promise<HasilForm> {
  const s = await siswiLogin();
  const noOrtu = normalisasiNomor(ambil(fd, "no_ortu"));
  if (!noOrtu) return { galat: "Nomor WhatsApp orang tua/wali belum benar." };
  if (noOrtu === s.no_wa) return { galat: "Nomor orang tua tidak boleh sama dengan nomormu sendiri." };

  const rawGuru = ambil(fd, "no_guru");
  const noGuru = rawGuru ? normalisasiNomor(rawGuru) : null;
  if (rawGuru && !noGuru) return { galat: "Nomor WhatsApp guru belum benar." };
  if (noGuru && noGuru === s.no_wa) return { galat: "Nomor guru tidak boleh sama dengan nomormu sendiri." };

  try {
    await hubungkan(s.id, "ortu", { nama: ambil(fd, "nama_ortu") || null, hubungan: ambil(fd, "hubungan") || null, no_wa: noOrtu });
    await hubungkan(s.id, "guru", noGuru ? { nama: ambil(fd, "nama_guru") || null, no_wa: noGuru } : null);
  } catch (e) {
    return { galat: "Gagal menyimpan: " + (e as Error).message };
  }

  if (fd.get("dari") === "profil") redirect("/profil");
  redirect(URL_LANGKAH[langkahBerikutnya({ ...s, jumlah_kontak: Math.max(1, s.jumlah_kontak) })]);
}

export async function simpanSkrining(_: HasilForm, fd: FormData): Promise<HasilForm> {
  const s = await siswiLogin();
  const cfg = await ambilPengaturan();
  const periksa = ambil(fd, "periksa");
  const diagnosis = ambil(fd, "diagnosis") as Diagnosis;
  if (!["pernah", "belum"].includes(periksa)) return { galat: "Jawab dulu: pernah periksa Hb atau belum?" };
  if (!["ya", "tidak", "tidak_tahu"].includes(diagnosis)) return { galat: "Jawab dulu pertanyaan diagnosis anemia." };

  const pernah = periksa === "pernah";
  let kadar: number | null = null;
  if (pernah) {
    const raw = ambil(fd, "kadar_hb").replace(",", ".");
    if (raw) {
      kadar = Number(raw);
      if (!Number.isFinite(kadar) || kadar < 3 || kadar > 20) return { galat: "Kadar Hb sepertinya belum benar (biasanya 8–16 g/dL)." };
    }
  }
  const status = tentukanStatus({ pernahPeriksa: pernah, kadarHb: kadar, diagnosis, batasHb: cfg.batasHbAnemia });

  const db = supabaseAdmin();
  const { error } = await db.from("skrining").insert({
    siswi_id: s.id,
    pernah_periksa_hb: pernah,
    kadar_hb: kadar,
    diagnosis_anemia: diagnosis,
    status_hasil: status,
  });
  if (error) return { galat: "Gagal menyimpan: " + error.message };
  await db.from("siswi").update({ status, updated_at: new Date().toISOString() }).eq("id", s.id);

  if (status === "belum_diketahui") redirect("/mulai/cek-hb");
  const berikut = langkahBerikutnya({ ...s, status });
  redirect(berikut === "selesai" ? "/kalender?skrining=1" : URL_LANGKAH[berikut]);
}

export async function simpanJadwal(_: HasilForm, fd: FormData): Promise<HasilForm> {
  const s = await siswiLogin();
  if (!s.status) redirect("/mulai/skrining");
  const jam = ambil(fd, "jam");
  if (!/^\d{2}:\d{2}$/.test(jam)) return { galat: "Pilih jam minum TTD." };
  const [h, m] = jam.split(":").map(Number);
  if (h > 23 || m > 59) return { galat: "Jam tidak valid." };
  // Pengingat dicek tiap 5 menit → bulatkan ke 5 menit terdekat ke bawah
  const jamBulat = `${String(h).padStart(2, "0")}:${String(m - (m % 5)).padStart(2, "0")}`;

  let hari: number | null = s.hari_minum;
  if (s.status !== "anemia") {
    const raw = ambil(fd, "hari");
    if (raw === "" || !/^[0-6]$/.test(raw)) return { galat: "Pilih hari minum TTD tiap minggu." };
    hari = Number(raw);
  } else if (fd.has("hari") && /^[0-6]$/.test(ambil(fd, "hari"))) {
    hari = Number(ambil(fd, "hari"));
  }

  const cfg = await ambilPengaturan();
  // Jam minum diartikan menurut zona waktu HP siswi saat menyimpan
  const zonaHp = ambil(fd, "zona");
  const zona = zonaValid(zonaHp) ? zonaHp : zonaSiswi(s, cfg.zonaWaktu);
  const update: Record<string, unknown> = {
    jam_minum: jamBulat,
    hari_minum: hari,
    zona_waktu: zona,
    updated_at: new Date().toISOString(),
  };
  if (!s.mulai_tanggal) update.mulai_tanggal = saatLokal(zona).tanggal;
  const { error } = await supabaseAdmin().from("siswi").update(update).eq("id", s.id);
  if (error) return { galat: "Gagal menyimpan: " + error.message };

  if (fd.get("dari") === "pengingat") redirect("/pengingat?tersimpan=1");
  redirect("/mulai/aktifkan");
}
