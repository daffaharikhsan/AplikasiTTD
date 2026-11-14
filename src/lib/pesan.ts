/**
 * Semua teks pengingat di satu tempat agar mudah direvisi bersama pembimbing.
 * Nada: singkat, peduli, tanpa menyalahkan (sesuai moodboard).
 */
import type { StatusJadwal } from "@/lib/jadwal";

export type Tahap = 1 | 2 | 3;
export type IsiNotifikasi = { judul: string; isi: string };

export function pesanSiswi(status: StatusJadwal, tahap: Tahap, haid: boolean): IsiNotifikasi {
  const catatanHaid = haid ? " Saat haid tubuh kehilangan zat besi, jadi TTD makin penting." : "";
  if (status === "anemia") {
    if (tahap === 1)
      return { judul: "Waktunya minum TTD", isi: "TTD adalah bagian dari pengobatanmu. Minum sekarang ya." + catatanHaid };
    if (tahap === 2)
      return {
        judul: "Kamu belum minum TTD hari ini",
        isi: "Kalau terputus, Hb bisa tidak naik dan badan tetap mudah lelah. Yuk minum sekarang." + catatanHaid,
      };
    return { judul: "Masih ada waktu hari ini", isi: "TTD hari ini belum dicentang. Minum sebelum tidur, lalu centang ya." };
  }
  const cekHb = status === "belum_diketahui" ? " Jangan lupa periksa Hb juga ya." : "";
  if (tahap === 1)
    return { judul: "Waktunya minum TTD", isi: "Sayangi tubuhmu, cuma butuh semenit." + catatanHaid + cekHb };
  if (tahap === 2)
    return {
      judul: "Kamu belum minum TTD hari ini",
      isi: "Belum sempat? Masih ada waktu, yuk sekarang sebelum lupa lagi." + catatanHaid,
    };
  return { judul: "Pengingat terakhir hari ini", isi: "TTD minggu ini belum dicentang. Minum sebelum tidur ya." };
}

export function pesanOrtu(namaPanggilan: string, tahap: Tahap): IsiNotifikasi {
  if (tahap === 1)
    return { judul: "Pengingat TTD", isi: `Sudah waktunya ${namaPanggilan} minum TTD, mohon diingatkan ya.` };
  return { judul: "Pengingat TTD", isi: `${namaPanggilan} belum minum TTD, mohon diingatkan.` };
}

export function pesanGuru(nama: string[], tahap: Tahap): IsiNotifikasi {
  const daftar = nama.length <= 4 ? nama.join(", ") : `${nama.slice(0, 4).join(", ")} +${nama.length - 4} lainnya`;
  if (tahap === 1)
    return { judul: "Pengingat TTD siswi", isi: `Sudah waktunya minum TTD: ${daftar}. Mohon diingatkan ya.` };
  return { judul: "Siswi belum minum TTD", isi: `Belum minum TTD: ${daftar}. Mohon diingatkan.` };
}

/** Nama panggilan = kata pertama nama lengkap. */
export const namaDepan = (nama: string) => nama.trim().split(/\s+/)[0] ?? nama;

/** Pesan WhatsApp yang dikirim SISWI SENDIRI (lewat wa.me) untuk membagikan link ke ortu. */
export function teksUndanganOrtu(namaSiswi: string, link: string) {
  return (
    `Halo, aku ${namaDepan(namaSiswi)}. Aku ikut penelitian pengingat minum Tablet Tambah Darah (TTD) di sekolah. ` +
    `Boleh bantu ingatkan aku minum TTD? Buka link ini sekali lalu tekan "Aktifkan pengingat":\n${link}`
  );
}

export function teksUndanganGuru(namaGuru: string | null, jumlah: number, link: string) {
  return (
    `Yth. ${namaGuru || "Bapak/Ibu Guru"}, terima kasih telah mendukung penelitian pengingat Tablet Tambah Darah (TTD). ` +
    `Saat ini ${jumlah} siswi mencantumkan Bapak/Ibu sebagai guru pengingat. ` +
    `Buka link berikut sekali lalu tekan "Aktifkan pengingat" untuk menerima ringkasan di jam minum TTD:\n${link}`
  );
}
