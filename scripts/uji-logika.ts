/**
 * Uji cepat logika jadwal tanpa database.
 * Jalankan: npx tsx scripts/uji-logika.ts
 */
import assert from "node:assert/strict";
import { tentukanStatus, terjadwal, hitungKepatuhan, haidAktif, jadwalBerikutnya } from "../src/lib/jadwal";
import { saatLokal, hariDari, tambahHari, formatTanggalPanjang } from "../src/lib/waktu";
import { normalisasiNomor, tampilNomor } from "../src/lib/telepon";

// Status (kategori jadwal)
assert.equal(tentukanStatus({ pernahPeriksa: true, kadarHb: 11.5, diagnosis: "tidak", batasHb: 12 }), "anemia");
assert.equal(tentukanStatus({ pernahPeriksa: true, kadarHb: 12, diagnosis: "ya", batasHb: 12 }), "tidak_anemia");
assert.equal(tentukanStatus({ pernahPeriksa: true, kadarHb: null, diagnosis: "ya", batasHb: 12 }), "anemia");
assert.equal(tentukanStatus({ pernahPeriksa: true, kadarHb: null, diagnosis: "tidak", batasHb: 12 }), "belum_diketahui");
assert.equal(tentukanStatus({ pernahPeriksa: false, kadarHb: null, diagnosis: "tidak_tahu", batasHb: 12 }), "belum_diketahui");

// Tanggal
assert.equal(hariDari("2026-11-14"), 6); // Sabtu
assert.equal(tambahHari("2026-11-30", 1), "2026-12-01");
assert.equal(formatTanggalPanjang("2026-11-14"), "Sabtu, 14 November");
const wib = saatLokal("Asia/Jakarta", new Date("2026-11-14T17:30:00Z")); // 00:30 WIB tgl 15
assert.deepEqual(wib, { tanggal: "2026-11-15", menit: 30, hari: 0 });

// Jadwal mingguan (Senin) mulai Rabu 11 Nov
const mingguan = { status: "tidak_anemia" as const, hari_minum: 1, mulai_tanggal: "2026-11-11" };
assert.equal(terjadwal(mingguan, "2026-11-09"), false); // sebelum mulai
assert.equal(terjadwal(mingguan, "2026-11-16"), true);
assert.equal(terjadwal(mingguan, "2026-11-17"), false);
assert.equal(jadwalBerikutnya(mingguan, "2026-11-12"), "2026-11-16");

// Kepatuhan: hari ini (23 Nov, Senin) belum dicentang → tidak dihitung
let k = hitungKepatuhan(mingguan, new Set(["2026-11-16"]), "2026-11-23");
assert.deepEqual(k, { jadwal: 1, diminum: 1, persen: 100 });
k = hitungKepatuhan(mingguan, new Set(["2026-11-16", "2026-11-23"]), "2026-11-23");
assert.deepEqual(k, { jadwal: 2, diminum: 2, persen: 100 });
k = hitungKepatuhan(mingguan, new Set([]), "2026-11-24");
assert.deepEqual(k, { jadwal: 2, diminum: 0, persen: 0 });

// Harian (anemia)
const harian = { status: "anemia" as const, hari_minum: null, mulai_tanggal: "2026-11-10" };
k = hitungKepatuhan(harian, new Set(["2026-11-10", "2026-11-11", "2026-11-13"]), "2026-11-14");
assert.deepEqual(k, { jadwal: 4, diminum: 3, persen: 75 });

// Haid otomatis berakhir setelah 7 hari
assert.equal(haidAktif([{ mulai: "2026-11-10", selesai: null }], "2026-11-16", 7)?.hariKe, 7);
assert.equal(haidAktif([{ mulai: "2026-11-10", selesai: null }], "2026-11-17", 7), null);
assert.equal(haidAktif([{ mulai: "2026-11-10", selesai: "2026-11-12" }], "2026-11-13", 7), null);

// Nomor WA
assert.equal(normalisasiNomor("0812-3456-7890"), "6281234567890");
assert.equal(normalisasiNomor("+62 812 3456 7890"), "6281234567890");
assert.equal(normalisasiNomor("812 3456 7890"), "6281234567890");
assert.equal(normalisasiNomor("021 555 1234"), null);
assert.equal(tampilNomor("6281234567890"), "0812-3456-7890");

console.log("Semua uji logika lulus ✓");
