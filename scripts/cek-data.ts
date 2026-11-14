/**
 * Cek kualitas data penelitian (hanya membaca, tidak mengubah apa pun).
 * Jalankan: npm run cek-data   (membutuhkan .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { terjadwal, hitungKepatuhan, type StatusJadwal } from "../src/lib/jadwal";
import { saatLokal, tambahHari } from "../src/lib/waktu";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "");
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

type Siswi = {
  id: string; nama: string; kelas: string; status: StatusJadwal | null; jam_minum: string | null;
  hari_minum: number | null; mulai_tanggal: string | null; zona_waktu: string | null; consent_kertas_diterima: boolean;
};

let jumlahMasalah = 0;
let jumlahPeringatan = 0;
const ok = (t: string) => console.log(`  ✅ ${t}`);
const masalah = (t: string, rincian: string[] = []) => {
  jumlahMasalah++;
  console.log(`  ❌ ${t}`);
  rincian.slice(0, 15).forEach((r) => console.log(`       - ${r}`));
  if (rincian.length > 15) console.log(`       … dan ${rincian.length - 15} lainnya`);
};
const peringatan = (t: string, rincian: string[] = []) => {
  jumlahPeringatan++;
  console.log(`  ⚠️  ${t}`);
  rincian.slice(0, 15).forEach((r) => console.log(`       - ${r}`));
  if (rincian.length > 15) console.log(`       … dan ${rincian.length - 15} lainnya`);
};
const judul = (t: string) => console.log(`\n${t}`);

async function semua<T>(tabel: string, kolom: string): Promise<T[]> {
  const hasil: T[] = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await db.from(tabel).select(kolom).range(dari, dari + 999);
    if (error) throw new Error(`${tabel}: ${error.message}`);
    hasil.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return hasil;
}

(async () => {
  const pengaturan = await semua<{ kunci: string; nilai: unknown }>("pengaturan", "kunci, nilai");
  const cfg = Object.fromEntries(pengaturan.map((p) => [p.kunci, p.nilai])) as Record<string, unknown>;
  const zonaSekolah = (cfg.zona_waktu as string) ?? "Asia/Jakarta";
  const periode = (cfg.periode_penelitian ?? {}) as { mulai: string | null; selesai: string | null };

  const [siswi, relasi, penerima, push, skrining, konsumsi, haid, log, rekap] = await Promise.all([
    semua<Siswi>("siswi", "id, nama, kelas, status, jam_minum, hari_minum, mulai_tanggal, zona_waktu, consent_kertas_diterima"),
    semua<{ siswi_id: string; penerima_id: string }>("siswi_penerima", "siswi_id, penerima_id"),
    semua<{ id: string; peran: string; nama: string | null; berhenti: boolean }>("penerima", "id, peran, nama, berhenti"),
    semua<{ siswi_id: string | null; penerima_id: string | null; user_agent: string | null }>("push_langganan", "siswi_id, penerima_id, user_agent"),
    semua<{ siswi_id: string; status_hasil: string; created_at: string }>("skrining", "siswi_id, status_hasil, created_at"),
    semua<{ siswi_id: string; tanggal: string }>("konsumsi", "siswi_id, tanggal"),
    semua<{ siswi_id: string; mulai: string; selesai: string | null }>("periode_haid", "siswi_id, mulai, selesai"),
    semua<{ target: string; status: string; kanal: string }>("log_notifikasi", "target, status, kanal"),
    semua<{ siswi_id: string; jumlah_jadwal: number; jumlah_diminum: number }>("rekap_kepatuhan_siswi", "siswi_id, jumlah_jadwal, jumlah_diminum"),
  ]);

  const nama = (id: string) => {
    const s = siswi.find((x) => x.id === id);
    return s ? `${s.nama} (${s.kelas})` : id.slice(0, 8);
  };
  const penerimaPer = new Map(penerima.map((p) => [p.id, p]));
  const kontak = (sid: string, peran: string) =>
    relasi.filter((r) => r.siswi_id === sid).map((r) => penerimaPer.get(r.penerima_id)).filter((p) => p?.peran === peran);

  console.log(`Cek data Pengingat TTD — ${new Date().toLocaleString("id-ID", { timeZone: zonaSekolah })} (${zonaSekolah})`);
  console.log(`Siswi: ${siswi.length} · Ortu/guru: ${penerima.length} · Centang minum: ${konsumsi.length}`);
  if (periode.mulai || periode.selesai) console.log(`Periode penelitian: ${periode.mulai ?? "?"} s.d. ${periode.selesai ?? "?"}`);
  else peringatan("periode_penelitian belum diisi di tabel pengaturan (isi sebelum penelitian dimulai)");

  const uji = siswi.filter((s) => /^uji/i.test(s.nama) || /uji coba/i.test(s.nama));
  if (uji.length) peringatan(`${uji.length} akun berpenanda UJI masih ada (hapus sebelum penelitian)`, uji.map((s) => s.nama));

  // 1. Kelengkapan
  judul("1. Kelengkapan data siswi");
  const belumSkrining = siswi.filter((s) => !s.status);
  const belumJadwal = siswi.filter((s) => s.status && (!s.jam_minum || !s.mulai_tanggal || (s.status !== "anemia" && s.hari_minum === null)));
  const tanpaOrtu = siswi.filter((s) => kontak(s.id, "ortu").length === 0);
  const tanpaGuru = siswi.filter((s) => kontak(s.id, "guru").length === 0);
  const tanpaConsent = siswi.filter((s) => !s.consent_kertas_diterima);
  const tanpaZona = siswi.filter((s) => !s.zona_waktu);
  if (belumSkrining.length) masalah(`${belumSkrining.length} siswi belum menyelesaikan skrining`, belumSkrining.map((s) => nama(s.id)));
  else ok("Semua siswi sudah skrining");
  if (belumJadwal.length) masalah(`${belumJadwal.length} siswi belum memilih jadwal minum`, belumJadwal.map((s) => nama(s.id)));
  else ok("Semua siswi yang sudah skrining punya jadwal");
  if (tanpaOrtu.length) masalah(`${tanpaOrtu.length} siswi tanpa kontak orang tua`, tanpaOrtu.map((s) => nama(s.id)));
  else ok("Semua siswi punya kontak orang tua");
  if (tanpaGuru.length) peringatan(`${tanpaGuru.length} siswi tanpa kontak guru`, tanpaGuru.map((s) => nama(s.id)));
  else ok("Semua siswi punya kontak guru");
  if (tanpaConsent.length) peringatan(`${tanpaConsent.length} siswi belum ditandai consent kertas diterima`, tanpaConsent.map((s) => nama(s.id)));
  else ok("Semua consent kertas sudah ditandai");
  if (tanpaZona.length) peringatan(`${tanpaZona.length} siswi belum terbaca zona waktunya (akan terisi saat membuka aplikasi)`, tanpaZona.map((s) => nama(s.id)));
  else ok("Zona waktu semua siswi terbaca");

  // 2. Notifikasi
  judul("2. Pengingat aktif");
  const siswiPush = new Set(push.map((p) => p.siswi_id).filter(Boolean));
  const penerimaPush = new Set(push.map((p) => p.penerima_id).filter(Boolean));
  const siapPush = siswi.filter((s) => s.status && s.jam_minum);
  const siswiTanpaPush = siapPush.filter((s) => !siswiPush.has(s.id));
  if (siswiTanpaPush.length) masalah(`${siswiTanpaPush.length} siswi belum mengaktifkan pengingat di HP`, siswiTanpaPush.map((s) => nama(s.id)));
  else ok("Semua siswi sudah mengaktifkan pengingat");
  const ortuTanpaPush = siapPush.filter((s) => kontak(s.id, "ortu").length && !kontak(s.id, "ortu").some((p) => p && penerimaPush.has(p.id)));
  if (ortuTanpaPush.length) masalah(`${ortuTanpaPush.length} siswi yang orang tuanya belum mengaktifkan pengingat`, ortuTanpaPush.map((s) => nama(s.id)));
  else ok("Semua orang tua sudah mengaktifkan pengingat");
  const guru = penerima.filter((p) => p.peran === "guru");
  const guruTanpaPush = guru.filter((g) => !penerimaPush.has(g.id));
  if (guruTanpaPush.length) peringatan(`${guruTanpaPush.length} guru belum mengaktifkan pengingat`, guruTanpaPush.map((g) => g.nama ?? g.id.slice(0, 8)));
  else ok("Semua guru sudah mengaktifkan pengingat");
  const berhenti = penerima.filter((p) => p.berhenti);
  if (berhenti.length) peringatan(`${berhenti.length} ortu/guru memilih berhenti menerima pengingat`, berhenti.map((p) => `${p.peran}: ${p.nama ?? p.id.slice(0, 8)}`));
  const hitungHp = new Map<string, number>();
  for (const p of push) {
    const k = `${p.siswi_id ?? p.penerima_id}|${p.user_agent ?? ""}`;
    hitungHp.set(k, (hitungHp.get(k) ?? 0) + 1);
  }
  const ganda = [...hitungHp.entries()].filter(([, n]) => n > 1);
  if (ganda.length) peringatan(`${ganda.length} pengguna terdaftar ganda di HP yang sama (notifikasi bisa muncul 2x; terhapus sendiri bila salah satunya kedaluwarsa)`);

  // 3. Konsistensi
  judul("3. Konsistensi data");
  const skriningTerakhir = new Map<string, string>();
  for (const k of [...skrining].sort((a, b) => a.created_at.localeCompare(b.created_at))) skriningTerakhir.set(k.siswi_id, k.status_hasil);
  const tidakCocok = siswi.filter((s) => s.status && skriningTerakhir.get(s.id) !== s.status);
  if (tidakCocok.length) masalah("Kategori siswi berbeda dengan hasil skrining terakhir", tidakCocok.map((s) => `${nama(s.id)}: ${s.status} vs ${skriningTerakhir.get(s.id) ?? "tidak ada skrining"}`));
  else ok("Kategori siswi sesuai skrining terakhir");

  const centangAneh: string[] = [];
  for (const k of konsumsi) {
    const s = siswi.find((x) => x.id === k.siswi_id);
    if (!s || !s.status) { centangAneh.push(`${nama(k.siswi_id)} ${k.tanggal}: siswi tanpa kategori`); continue; }
    const hariIni = saatLokal(s.zona_waktu ?? zonaSekolah).tanggal;
    if (k.tanggal > hariIni) centangAneh.push(`${nama(s.id)} ${k.tanggal}: tanggal di masa depan`);
    else if (!terjadwal(s as Siswi & { status: StatusJadwal }, k.tanggal)) centangAneh.push(`${nama(s.id)} ${k.tanggal}: bukan hari jadwal (mungkin kategori/hari minum diubah setelah centang)`);
  }
  if (centangAneh.length) peringatan(`${centangAneh.length} centang di luar jadwal yang berlaku sekarang (tidak dihitung di rekap)`, centangAneh);
  else ok("Semua centang jatuh di hari jadwal");

  const haidPanjang = haid.filter((h) => h.selesai && tambahHari(h.mulai, 14) < h.selesai);
  if (haidPanjang.length) peringatan(`${haidPanjang.length} periode haid lebih dari 14 hari (kemungkinan lupa menekan "selesai")`, haidPanjang.map((h) => `${nama(h.siswi_id)} ${h.mulai} → ${h.selesai}`));
  else ok("Tidak ada periode haid yang janggal");
  const yatim = penerima.filter((p) => !relasi.some((r) => r.penerima_id === p.id));
  if (yatim.length) peringatan(`${yatim.length} ortu/guru tidak terhubung ke siswi mana pun`, yatim.map((p) => `${p.peran}: ${p.nama ?? p.id.slice(0, 8)}`));
  else ok("Semua ortu/guru terhubung ke siswi");

  // 4. Kepatuhan: aplikasi vs rekap ekspor
  judul("4. Angka kepatuhan (kalender siswi vs file ekspor)");
  const beda: string[] = [];
  for (const s of siswi.filter((x) => x.status && x.mulai_tanggal)) {
    const hariIni = saatLokal(s.zona_waktu ?? zonaSekolah).tanggal;
    const diminum = new Set(konsumsi.filter((k) => k.siswi_id === s.id).map((k) => k.tanggal));
    const app = hitungKepatuhan(s as Siswi & { status: StatusJadwal }, diminum, hariIni, periode.selesai);
    const r = rekap.find((x) => x.siswi_id === s.id);
    const jadwalHariIniBelum = terjadwal(s as Siswi & { status: StatusJadwal }, hariIni) && !diminum.has(hariIni) ? 1 : 0;
    const jadwalRekap = Number(r?.jumlah_jadwal ?? 0) - jadwalHariIniBelum; // rekap ikut menghitung hari ini walau belum lewat
    if (!r || jadwalRekap !== app.jadwal || Number(r.jumlah_diminum) !== app.diminum)
      beda.push(`${nama(s.id)}: aplikasi ${app.diminum}/${app.jadwal}, ekspor ${r?.jumlah_diminum ?? 0}/${r?.jumlah_jadwal ?? 0}`);
  }
  if (beda.length) masalah("Angka kepatuhan aplikasi dan ekspor berbeda", beda);
  else ok("Angka kepatuhan di kalender siswi sama dengan file ekspor");
  console.log("     Catatan: selama hari berjalan, ekspor sudah menghitung jadwal hari ini (diminum=0) walau siswi masih punya waktu.");
  console.log("     Untuk analisis akhir, unduh data setelah periode penelitian selesai.");

  // 5. Pengiriman
  judul("5. Keandalan pengiriman notifikasi");
  const relevan = log.filter((l) => l.status !== "dilewati");
  const terkirim = relevan.filter((l) => l.status === "terkirim").length;
  const dilewati = log.filter((l) => l.status === "dilewati").length;
  if (!relevan.length) peringatan("Belum ada notifikasi yang dicoba dikirim");
  else {
    const persen = Math.round((terkirim / relevan.length) * 100);
    (persen >= 95 ? ok : masalah)(`Notifikasi terkirim ${terkirim}/${relevan.length} (${persen}%) · target ≥ 95%`);
  }
  if (dilewati) peringatan(`${dilewati} notifikasi dilewati (penerima belum mengaktifkan pengingat / batas harian)`);

  console.log(`\nSelesai: ${jumlahMasalah} masalah, ${jumlahPeringatan} peringatan.`);
})().catch((e) => {
  console.error("Gagal:", e.message);
  process.exit(1);
});
