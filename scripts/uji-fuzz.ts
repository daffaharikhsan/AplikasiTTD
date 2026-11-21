/**
 * Fuzz test logika inti: puluhan ribu kombinasi acak (seed tetap → bisa diulang).
 * Jalankan: npm run uji-fuzz   (tanpa database / jaringan)
 */
import { tentukanStatus, terjadwal, hitungKepatuhan, haidAktif, sedangHaidPada, jadwalBerikutnya, type StatusJadwal, type Diagnosis } from "../src/lib/jadwal";
import { saatLokal, hariDari, tambahHari, selisihHari, jamKeMenit, menitKeJam, formatTanggalPanjang } from "../src/lib/waktu";
import { normalisasiNomor, tampilNomor } from "../src/lib/telepon";
import { zonaValid, zonaSiswi, labelZona } from "../src/lib/zona";
import { pesanSiswi, pesanOrtu, pesanGuru, namaDepan, teksUndanganOrtu } from "../src/lib/pesan";
import { pesanSkor5L, GEJALA_5L, POLA_MAKAN } from "../src/lib/skrining";
import { tahapJatuhTempo, TOLERANSI_MENIT } from "../src/lib/tahap";

// ---------- PRNG deterministik ----------
let seed = Number(process.env.SEED ?? 20261121);
const acak = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a: number, b: number) => a + Math.floor(acak() * (b - a + 1));
const pilih = <T,>(xs: readonly T[]): T => xs[int(0, xs.length - 1)];
const tanggalAcak = () => tambahHari("2020-01-01", int(0, 365 * 12)); // 2020–2031, termasuk tahun kabisat

const ZONA = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Pontianak", "Asia/Kathmandu", "Asia/Kolkata",
  "Pacific/Kiritimati", "Pacific/Pago_Pago", "Pacific/Chatham", "Australia/Lord_Howe", "Europe/London",
  "America/New_York", "America/St_Johns", "Asia/Tokyo", "UTC", "Africa/Cairo", "America/Sao_Paulo"];
const STATUS: StatusJadwal[] = ["anemia", "tidak_anemia", "belum_diketahui"];
const DIAG: Diagnosis[] = ["ya", "tidak", "tidak_tahu"];

// ---------- Kerangka properti ----------
type Hasil = { nama: string; kasus: number; gagal: number; contoh: string[] };
const hasil: Hasil[] = [];
function properti(nama: string, kasus: number, uji: (i: number) => string | null | void) {
  const h: Hasil = { nama, kasus, gagal: 0, contoh: [] };
  for (let i = 0; i < kasus; i++) {
    let pesan: string | null | void;
    try { pesan = uji(i); } catch (e) { pesan = "CRASH: " + (e as Error).message; }
    if (pesan) { h.gagal++; if (h.contoh.length < 4) h.contoh.push(pesan); }
  }
  hasil.push(h);
}
const temuan: string[] = []; // perilaku yang lolos uji tapi perlu diketahui

// ---------- Waktu & zona ----------
properti("saatLokal: format valid di semua zona & detik acak", 20000, () => {
  const z = pilih(ZONA);
  const w = new Date(Date.UTC(2020, 0, 1) + int(0, 12 * 365 * 86400) * 1000);
  const k = saatLokal(z, w);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k.tanggal)) return `${z} ${w.toISOString()} → tanggal ${k.tanggal}`;
  if (k.menit < 0 || k.menit > 1439 || !Number.isInteger(k.menit)) return `${z} → menit ${k.menit}`;
  if (k.hari !== hariDari(k.tanggal)) return `${z} → hari ${k.hari} ≠ ${hariDari(k.tanggal)}`;
});
properti("saatLokal: WIB/WITA/WIT selalu UTC+7/+8/+9 (tanpa DST)", 10000, () => {
  const w = new Date(Date.UTC(2020, 0, 1) + int(0, 12 * 365 * 86400) * 1000);
  for (const [z, off] of [["Asia/Jakarta", 7], ["Asia/Makassar", 8], ["Asia/Jayapura", 9]] as const) {
    const k = saatLokal(z, w);
    const ref = new Date(w.getTime() + off * 3600000);
    const harap = ref.getUTCHours() * 60 + ref.getUTCMinutes();
    if (k.menit !== harap || k.tanggal !== ref.toISOString().slice(0, 10)) return `${z} ${w.toISOString()}: ${k.tanggal} ${k.menit} vs ${harap}`;
  }
});
properti("tambahHari/selisihHari/hariDari konsisten (kabisat, pergantian tahun)", 20000, () => {
  const t = tanggalAcak(), n = int(-800, 800);
  const u = tambahHari(t, n);
  if (selisihHari(t, u) !== n) return `${t} + ${n} = ${u}, selisih ${selisihHari(t, u)}`;
  if (hariDari(u) !== (((hariDari(t) + n) % 7) + 7) % 7) return `hari ${t}+${n}`;
  if (!formatTanggalPanjang(u).includes(String(Number(u.slice(8))))) return `format ${u}`;
});
properti("jamKeMenit ↔ menitKeJam bolak-balik untuk semua menit sehari", 1440, (m) => {
  const j = menitKeJam(m).replace(".", ":");
  if (jamKeMenit(j) !== m) return `${m} → ${j}`;
  if (jamKeMenit(j + ":00") !== m) return `${j}:00`;
});
properti("zonaValid/zonaSiswi/labelZona tahan input sampah", 5000, () => {
  const sampah = pilih(["", " ", "Asia/", "../etc/passwd", "<script>", "Asia/Jakarta\n", "x".repeat(500), "\u0000", "Etc/GMT+7", "asia/jakarta", null, undefined, 123, {}, "Asia/Jakarta' OR 1=1--"]);
  const v = zonaValid(sampah as unknown);
  const z = zonaSiswi({ zona_waktu: sampah as string }, "Asia/Jakarta");
  if (!zonaValid(z)) return `zonaSiswi hasilkan zona tidak valid untuk ${JSON.stringify(sampah)}`;
  if (typeof sampah === "string" && v) labelZona(sampah);
  if (["<script>", "../etc/passwd", "", "\u0000"].includes(sampah as string) && v) return `${JSON.stringify(sampah)} lolos zonaValid`;
});

// ---------- Nomor WA ----------
const KARAKTER = "0123456789+- ()abc#*. ٠١٢";
properti("normalisasiNomor: input acak tidak crash & hasil selalu 628xxxxxxx", 20000, () => {
  const s = Array.from({ length: int(0, 22) }, () => pilih([...KARAKTER])).join("");
  const n = normalisasiNomor(s);
  if (n !== null && !/^628\d{7,11}$/.test(n)) return `${JSON.stringify(s)} → ${n}`;
  if (n !== null && normalisasiNomor(n) !== n) return `tidak idempoten: ${n}`;
});
properti("normalisasiNomor ↔ tampilNomor bolak-balik untuk nomor valid", 10000, () => {
  const n = "628" + Array.from({ length: int(7, 11) }, () => int(0, 9)).join("");
  const varian = [n, "+" + n, "0" + n.slice(2), n.slice(2), tampilNomor(n), "+62 " + n.slice(2, 5) + "-" + n.slice(5)];
  for (const v of varian) if (normalisasiNomor(v) !== n) return `${v} → ${normalisasiNomor(v)} (harap ${n})`;
});
properti("normalisasiNomor menolak nomor bukan HP Indonesia", 2000, () => {
  const s = pilih(["021555123", "+1 202 555 0100", "0812", "08123456789012345", "62 21 5551234", "abc", "", "6281x34567890"]);
  if (normalisasiNomor(s) !== null) return `${s} diterima → ${normalisasiNomor(s)}`;
});

// ---------- Kategori jadwal (Hb) ----------
properti("tentukanStatus: total & sesuai aturan untuk semua kombinasi", 20000, () => {
  const pernah = acak() < 0.6;
  const kadar = pilih([null, NaN, Infinity, -1, 0, 11.9, 11.99, 12, 12.01, int(30, 200) / 10]);
  const diagnosis = pilih(DIAG);
  const batas = pilih([11, 12, 12.5]);
  const s = tentukanStatus({ pernahPeriksa: pernah, kadarHb: kadar, diagnosis, batasHb: batas });
  if (!STATUS.includes(s)) return `status ${s}`;
  const adaHb = pernah && kadar !== null && !Number.isNaN(kadar);
  const harap: StatusJadwal = adaHb ? (kadar! < batas ? "anemia" : "tidak_anemia") : diagnosis === "ya" ? "anemia" : "belum_diketahui";
  if (s !== harap) return `pernah=${pernah} Hb=${kadar} diag=${diagnosis} batas=${batas} → ${s}, harap ${harap}`;
});

// ---------- Jadwal & kepatuhan ----------
const siswiAcak = () => ({ status: pilih(STATUS), hari_minum: acak() < 0.1 ? null : int(0, 6), mulai_tanggal: tanggalAcak() });
properti("terjadwal: mingguan tepat 1x per 7 hari, harian setiap hari, tidak sebelum mulai", 10000, () => {
  const s = siswiAcak();
  const awal = tambahHari(s.mulai_tanggal, int(-10, 30));
  let n = 0;
  for (let i = 0; i < 7; i++) { const t = tambahHari(awal, i); if (terjadwal(s, t)) { n++; if (t < s.mulai_tanggal) return `terjadwal sebelum mulai ${t} < ${s.mulai_tanggal}`; } }
  const semuaSetelahMulai = awal >= s.mulai_tanggal;
  if (semuaSetelahMulai && s.status === "anemia" && n !== 7) return `anemia ${n}/7`;
  if (semuaSetelahMulai && s.status !== "anemia" && s.hari_minum !== null && n !== 1) return `mingguan ${n}/7`;
  if (s.status !== "anemia" && s.hari_minum === null && n !== 0) return `tanpa hari_minum tetap terjadwal`;
});
properti("hitungKepatuhan: 0 ≤ diminum ≤ jadwal, persen benar, centang di luar jadwal diabaikan", 10000, () => {
  const s = siswiAcak();
  const hariIni = tambahHari(s.mulai_tanggal, int(-5, 60));
  const diminum = new Set<string>();
  for (let i = 0; i < int(0, 40); i++) diminum.add(tambahHari(s.mulai_tanggal, int(-10, 70)));
  const k = hitungKepatuhan(s, diminum, hariIni, acak() < 0.3 ? tambahHari(s.mulai_tanggal, int(0, 40)) : null);
  if (k.diminum < 0 || k.diminum > k.jadwal) return `diminum ${k.diminum} > jadwal ${k.jadwal}`;
  if ((k.jadwal === 0) !== (k.persen === null)) return `persen ${k.persen} untuk jadwal ${k.jadwal}`;
  if (k.persen !== null && (k.persen < 0 || k.persen > 100)) return `persen ${k.persen}`;
  // centang di hari bukan jadwal tidak menambah
  const tanpaLuar = new Set([...diminum].filter((t) => terjadwal(s, t)));
  const k2 = hitungKepatuhan(s, tanpaLuar, hariIni);
  const k1 = hitungKepatuhan(s, diminum, hariIni);
  if (k1.diminum !== k2.diminum || k1.jadwal !== k2.jadwal) return `centang luar jadwal ikut terhitung`;
});
properti("hitungKepatuhan: hari ini yang belum dicentang tidak dihitung terlewat", 5000, () => {
  const s = { ...siswiAcak(), status: "anemia" as StatusJadwal };
  const hariIni = tambahHari(s.mulai_tanggal, int(0, 30));
  const a = hitungKepatuhan(s, new Set(), hariIni);
  const b = hitungKepatuhan(s, new Set([hariIni]), hariIni);
  if (b.jadwal !== a.jadwal + 1 || b.diminum !== 1) return `${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
});
properti("jadwalBerikutnya: selalu hari jadwal ≥ dari, maksimal 7 hari", 10000, () => {
  const s = siswiAcak();
  const dari = tambahHari(s.mulai_tanggal, int(-3, 40));
  const j = jadwalBerikutnya(s, dari);
  if (j === null) {
    if (s.status === "anemia" || s.hari_minum !== null) if (selisihHari(dari, s.mulai_tanggal) <= 0) return `null padahal ada jadwal dari ${dari}`;
    return;
  }
  if (j < dari || selisihHari(dari, j) > 7 || !terjadwal(s, j)) return `${dari} → ${j}`;
});
properti("haid: aktif & sedangHaidPada konsisten, berakhir otomatis", 10000, () => {
  const lama = int(3, 10);
  const daftar = Array.from({ length: int(0, 4) }, () => { const m = tanggalAcak(); return { mulai: m, selesai: acak() < 0.5 ? null : tambahHari(m, int(0, 12)) }; });
  const t = tanggalAcak();
  const a = haidAktif(daftar, t, lama);
  if (Boolean(a) !== sedangHaidPada(daftar, t, lama)) return `haidAktif ${!!a} vs sedangHaidPada`;
  if (a && (a.hariKe < 1 || (a.selesai === null && a.hariKe > lama))) return `hariKe ${a.hariKe} lama ${lama}`;
});

// ---------- Mesin pengingat: simulasi cron tiap 5 menit sepanjang hari ----------
properti("simulasi cron 5 menit: tiap tahap terkirim ≤ 1x, urut 1→2→3, tahap 1 selalu terkirim", 20000, () => {
  const jam = int(0, 287) * 5; // jam minum dibulatkan 5 menit (seperti di aplikasi)
  const jeda = pilih([30, 60, 90, 120]);
  const t3 = pilih([17 * 60, 19 * 60, 21 * 60, 23 * 60 + 55]);
  const terkirim: number[] = [];
  const klaim = new Set<number>();
  const tickAwal = int(0, 4); // cron bisa berjalan di menit ke-0..4 dari tiap 5 menit
  for (let m = tickAwal; m < 1440; m += 5) {
    if (acak() < 0.05) continue; // 5% panggilan cron gagal/terlewat
    const tahap = tahapJatuhTempo(jam, jeda, t3, m);
    if (tahap && !klaim.has(tahap)) { klaim.add(tahap); terkirim.push(tahap); }
  }
  for (let i = 1; i < terkirim.length; i++) if (terkirim[i] <= terkirim[i - 1]) return `jam ${menitKeJam(jam)} jeda ${jeda}: urutan ${terkirim}`;
  if (!terkirim.includes(1) && jam + TOLERANSI_MENIT <= 1440 && jam <= 1430) return `jam ${menitKeJam(jam)}: tahap 1 tidak terkirim (${terkirim})`;
  if (jam + jeda > 1435 && terkirim.includes(2)) return `tahap 2 terkirim padahal lewat tengah malam`;
});
// Catat batas yang dirancang (bukan bug, tapi perlu diketahui)
{
  const tanpaTahap2: string[] = [];
  for (const jeda of [30, 60]) {
    let batas = -1;
    for (let jam = 0; jam < 1440; jam += 5) {
      let ada2 = false;
      for (let m = 0; m < 1440; m += 5) if (tahapJatuhTempo(jam, jeda, 19 * 60, m) === 2) ada2 = true;
      if (!ada2 && batas < 0) batas = jam;
    }
    tanpaTahap2.push(`jeda ${jeda} mnt → jam minum ≥ ${menitKeJam(batas)}`);
  }
  temuan.push(`Pengingat kedua tidak terkirim bila jatuhnya lewat tengah malam: ${tanpaTahap2.join("; ")}.`);
  let tanpa3 = 0;
  for (let jam = 0; jam < 1440; jam += 5) { let ada3 = false; for (let m = 0; m < 1440; m += 5) if (tahapJatuhTempo(jam, 60, 19 * 60, m) === 3) ada3 = true; if (!ada3) tanpa3++; }
  temuan.push(`Pengingat malam (19.00) tidak dikirim untuk ${tanpa3} dari 288 kemungkinan jam minum (jadwal yang pengingat keduanya ≥ 19.00) — sesuai rancangan.`);
}

// ---------- Teks pesan ----------
properti("semua kombinasi teks pesan tidak kosong & tanpa 'undefined'", 3000, () => {
  const nama = pilih(["Ani", "  Siti  Aminah ", "", "<b>Rina</b>", "Dewi 😊", "A".repeat(200), "O'Neil", "=SUM(A1)"]);
  const teks = [
    pesanSiswi(pilih(STATUS), pilih([1, 2, 3] as const), acak() < 0.5),
    pesanOrtu(namaDepan(nama), pilih([1, 2, 3] as const)),
    pesanGuru(Array.from({ length: int(1, 40) }, () => namaDepan(nama) || "?"), pilih([1, 2] as const)),
  ];
  for (const t of teks) if (!t.judul || !t.isi || /undefined|null|NaN/.test(t.judul + t.isi)) return JSON.stringify(t).slice(0, 120);
  const u = teksUndanganOrtu(nama, "https://contoh.app/o/abc");
  if (!u.includes("https://contoh.app/o/abc")) return "undangan tanpa link";
});
properti("pesanGuru meringkas daftar panjang (≤ 4 nama + 'lainnya')", 2000, () => {
  const n = int(1, 300);
  const p = pesanGuru(Array.from({ length: n }, (_, i) => "Siswi" + i), 1);
  if (n > 4 && !p.isi.includes(`+${n - 4} lainnya`)) return `n=${n}: ${p.isi.slice(0, 80)}`;
  if (p.isi.length > 300) return `terlalu panjang (${p.isi.length})`;
});
properti("skor 5L 0–10 selalu punya pesan, pertanyaan skrining lengkap", 11, (skor) => {
  if (!pesanSkor5L(skor)) return `skor ${skor}`;
  if (GEJALA_5L.length !== 5 || new Set(GEJALA_5L.map((g) => g.kolom)).size !== 5) return "5L tidak 5 unik";
  if (POLA_MAKAN.some((q) => q.opsi.length < 2)) return "opsi pola makan < 2";
});

// ---------- Laporan ----------
const total = hasil.reduce((a, h) => a + h.kasus, 0);
const gagal = hasil.filter((h) => h.gagal);
console.log(`\nFuzz logika — ${hasil.length} properti, ${total.toLocaleString("id-ID")} kombinasi (seed ${process.env.SEED ?? 20261121})\n`);
for (const h of hasil) {
  console.log(`${h.gagal ? "❌" : "✅"} ${h.nama} — ${h.kasus.toLocaleString("id-ID")} kasus${h.gagal ? `, ${h.gagal} gagal` : ""}`);
  h.contoh.forEach((c) => console.log(`     ↳ ${c}`));
}
if (temuan.length) { console.log("\nCatatan perilaku:"); temuan.forEach((t) => console.log("  • " + t)); }
console.log(`\n${gagal.length ? `❌ ${gagal.length} properti gagal` : "✅ Semua properti lulus"}`);
process.exit(gagal.length ? 1 : 0);
