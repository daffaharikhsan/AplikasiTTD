"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin, supabaseSesi } from "@/lib/supabase/server";
import { emailDariNomor, normalisasiNomor } from "@/lib/telepon";
import { zonaValid } from "@/lib/zona";

export type HasilForm = { galat?: string; nilai?: Record<string, string> } | undefined;

const ambil = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function daftar(_: HasilForm, fd: FormData): Promise<HasilForm> {
  const nilai = {
    nama: ambil(fd, "nama"),
    kelas: ambil(fd, "kelas"),
    rombel: ambil(fd, "rombel"),
    sekolah: ambil(fd, "sekolah"),
    no_wa: ambil(fd, "no_wa"),
  };
  const pin = ambil(fd, "pin");
  const setuju = fd.get("setuju") === "on";

  if (nilai.nama.length < 3) return { galat: "Tulis nama lengkapmu ya.", nilai };
  if (!["X", "XI", "XII"].includes(nilai.kelas)) return { galat: "Pilih kelasmu.", nilai };
  if (nilai.sekolah.length < 3) return { galat: "Tulis nama sekolahmu.", nilai };
  const noWa = normalisasiNomor(nilai.no_wa);
  if (!noWa) return { galat: "Nomor WhatsApp belum benar. Contoh: 0812 3456 7890.", nilai };
  if (!/^\d{6}$/.test(pin)) return { galat: "PIN harus 6 angka.", nilai };
  if (!setuju) return { galat: "Centang persetujuan dulu untuk ikut penelitian.", nilai };

  const admin = supabaseAdmin();
  const { data: ada } = await admin.from("siswi").select("id").eq("no_wa", noWa).maybeSingle();
  if (ada) return { galat: "Nomor ini sudah terdaftar. Silakan masuk dengan PIN-mu.", nilai };

  const email = emailDariNomor(noWa);
  let { data: dibuat, error } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { nama: nilai.nama },
  });
  // Akun auth bisa sudah ada tanpa profil (mis. pendaftaran sebelumnya terputus): pakai ulang
  if (error && /already|registered|exists/i.test(error.message)) {
    const { data: daftarUser } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const lama = daftarUser?.users.find((u) => u.email === email);
    if (lama) {
      await admin.auth.admin.updateUserById(lama.id, { password: pin });
      dibuat = { user: lama };
      error = null;
    }
  }
  if (error || !dibuat?.user) return { galat: "Pendaftaran gagal: " + (error?.message ?? "coba lagi"), nilai };

  const kelas = nilai.rombel ? `${nilai.kelas} ${nilai.rombel}` : nilai.kelas;
  const { error: galatProfil } = await admin.from("siswi").insert({
    id: dibuat.user.id,
    nama: nilai.nama,
    kelas,
    sekolah: nilai.sekolah,
    no_wa: noWa,
    setuju_penelitian: true,
    setuju_at: new Date().toISOString(),
    zona_waktu: zonaValid(ambil(fd, "zona")) ? ambil(fd, "zona") : null,
  });
  if (galatProfil) return { galat: "Gagal menyimpan data: " + galatProfil.message, nilai };

  const supabase = await supabaseSesi();
  const { error: galatMasuk } = await supabase.auth.signInWithPassword({ email, password: pin });
  if (galatMasuk) return { galat: "Akun dibuat, tapi gagal masuk. Coba masuk manual.", nilai };

  redirect("/mulai/kontak");
}

export async function masuk(_: HasilForm, fd: FormData): Promise<HasilForm> {
  const nilai = { no_wa: ambil(fd, "no_wa") };
  const noWa = normalisasiNomor(nilai.no_wa);
  const pin = ambil(fd, "pin");
  if (!noWa) return { galat: "Nomor WhatsApp belum benar.", nilai };
  if (!/^\d{6}$/.test(pin)) return { galat: "PIN harus 6 angka.", nilai };

  const supabase = await supabaseSesi();
  const { error } = await supabase.auth.signInWithPassword({ email: emailDariNomor(noWa), password: pin });
  if (error) return { galat: "Nomor atau PIN salah. Lupa PIN? Hubungi peneliti.", nilai };
  redirect("/");
}

export async function keluar() {
  const supabase = await supabaseSesi();
  await supabase.auth.signOut();
  redirect("/");
}
