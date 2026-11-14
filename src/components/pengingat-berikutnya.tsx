"use client";

import { useSyncExternalStore } from "react";
import { IkonLonceng } from "@/components/ikon";

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** Menit sekarang menurut jam HP (diperbarui tiap 30 detik). null saat render di server. */
function useMenitSekarang() {
  return useSyncExternalStore(
    (ubah) => {
      const id = setInterval(ubah, 30_000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
}

/**
 * Menampilkan kapan pengingat pertama berikutnya akan datang, dihitung dari jam HP,
 * agar siswi langsung tahu bila jadwal yang dipilih ternyata baru jatuh minggu depan.
 */
export function PengingatBerikutnya({ mingguan, hari, jam }: { mingguan: boolean; hari: number; jam: string }) {
  const menit = useMenitSekarang();
  if (menit === null || !/^\d{2}:\d{2}$/.test(jam)) return null;

  const [h, m] = jam.split(":").map(Number);
  const mBulat = m - (m % 5); // sama dengan pembulatan di server
  const sekarang = new Date(menit * 60_000);
  const menitHariIni = sekarang.getHours() * 60 + sekarang.getMinutes();

  let tanggal: Date | null = null;
  let selisih = 0;
  for (let i = 0; i < 8; i++) {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() + i);
    if (mingguan && d.getDay() !== hari) continue;
    if (i === 0 && h * 60 + mBulat <= menitHariIni) continue;
    tanggal = d;
    selisih = i;
    break;
  }
  if (!tanggal) return null;

  const kapan = selisih === 0 ? "hari ini" : selisih === 1 ? "besok" : `${selisih} hari lagi`;
  const jamTampil = `${String(h).padStart(2, "0")}.${String(mBulat).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-mint px-4 py-3" aria-live="polite">
      <IkonLonceng size={20} className="shrink-0" />
      <span className="text-sm leading-snug">
        Pengingat berikutnya: <b>{NAMA_HARI[tanggal.getDay()]}, {tanggal.getDate()} {NAMA_BULAN[tanggal.getMonth()]} pukul {jamTampil}</b>{" "}
        <span className="text-ink-2">({kapan})</span>
      </span>
    </div>
  );
}
