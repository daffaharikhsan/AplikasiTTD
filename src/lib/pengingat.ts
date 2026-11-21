import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ambilPengaturan } from "@/lib/pengaturan";
import { saatLokal, jamKeMenit, tambahHari, type SaatLokal } from "@/lib/waktu";
import { terjadwal, sedangHaidPada, type StatusJadwal, type Haid } from "@/lib/jadwal";
import { pesanSiswi, pesanOrtu, pesanGuru, namaDepan, type Tahap } from "@/lib/pesan";
import { kirimKe, type HasilKirim } from "@/lib/notifikasi";
import { zonaSiswi } from "@/lib/zona";

const TOLERANSI_MENIT = 120; // pengingat tahap 1/2 masih dikirim sampai 2 jam setelah waktunya

type SiswiBaris = {
  id: string;
  nama: string;
  kelas: string;
  no_wa: string;
  status: StatusJadwal;
  jam_minum: string;
  hari_minum: number | null;
  mulai_tanggal: string;
  zona_waktu: string | null;
};

type PenerimaBaris = {
  id: string;
  peran: "ortu" | "guru";
  nama: string | null;
  no_wa: string;
  token: string;
  berhenti: boolean;
};

const urlApp = () => (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

/**
 * Dipanggil setiap 5 menit oleh pg_cron. Aman dipanggil berulang:
 * setiap (siswi, tanggal, tahap) hanya diproses sekali lewat tabel klaim_pengingat.
 *
 * Waktu dihitung per siswi menurut zona waktu HP-nya (WIB/WITA/WIT/luar negeri),
 * kecuali "jam sekolah" untuk guru yang mengikuti zona waktu sekolah.
 */
export async function jalankanPengingat(waktu: Date = new Date()) {
  const cfg = await ambilPengaturan();
  const sekolah = saatLokal(cfg.zonaWaktu, waktu);
  const ringkasan = { tanggal: sekolah.tanggal, jam: sekolah.menit, diproses: 0, terkirim: 0, dilewati: 0, gagal: 0 };

  const { mulai, selesai } = cfg.periodePenelitian;
  if ((mulai && sekolah.tanggal < mulai) || (selesai && sekolah.tanggal > selesai)) {
    return { ...ringkasan, catatan: "Di luar periode penelitian" };
  }

  // Tanggal lokal siswi bisa berbeda ±1 hari dari tanggal sekolah (zona lain)
  const kemarin = tambahHari(sekolah.tanggal, -1);
  const besok = tambahHari(sekolah.tanggal, 1);

  const db = supabaseAdmin();
  const { data: daftarSiswi, error } = await db
    .from("siswi")
    .select("id, nama, kelas, no_wa, status, jam_minum, hari_minum, mulai_tanggal, zona_waktu")
    .not("status", "is", null)
    .not("jam_minum", "is", null)
    .lte("mulai_tanggal", besok);
  if (error) throw new Error(error.message);

  const kiniPer = new Map<string, SaatLokal>();
  const terjadwalHariIni = ((daftarSiswi ?? []) as SiswiBaris[]).filter((s) => {
    const kini = saatLokal(zonaSiswi(s, cfg.zonaWaktu), waktu);
    kiniPer.set(s.id, kini);
    return terjadwal(s, kini.tanggal);
  });
  if (terjadwalHariIni.length === 0) return ringkasan;
  const ids = terjadwalHariIni.map((s) => s.id);

  const [konsumsiQ, haidQ, klaimQ, relasiQ, logQ] = await Promise.all([
    db.from("konsumsi").select("siswi_id, tanggal").gte("tanggal", kemarin).lte("tanggal", besok).in("siswi_id", ids),
    db
      .from("periode_haid")
      .select("siswi_id, mulai, selesai")
      .in("siswi_id", ids)
      .gte("mulai", tambahHari(kemarin, -cfg.lamaHaidOtomatis)),
    db.from("klaim_pengingat").select("siswi_id, tanggal, tahap").gte("tanggal", kemarin).lte("tanggal", besok).in("siswi_id", ids),
    db
      .from("siswi_penerima")
      .select("siswi_id, penerima:penerima_id (id, peran, nama, no_wa, token, berhenti)")
      .in("siswi_id", ids),
    db
      .from("log_notifikasi")
      .select("penerima_id, tanggal")
      .gte("tanggal", kemarin)
      .lte("tanggal", besok)
      .eq("status", "terkirim")
      .not("penerima_id", "is", null),
  ]);

  const sudahMinum = new Set((konsumsiQ.data ?? []).map((r) => `${r.siswi_id}:${r.tanggal}`));
  const sudahKlaim = new Set((klaimQ.data ?? []).map((r) => `${r.siswi_id}:${r.tanggal}:${r.tahap}`));
  const haidPer = new Map<string, Haid[]>();
  for (const h of haidQ.data ?? []) {
    const arr = haidPer.get(h.siswi_id) ?? [];
    arr.push({ mulai: h.mulai, selesai: h.selesai });
    haidPer.set(h.siswi_id, arr);
  }
  const penerimaPer = new Map<string, PenerimaBaris[]>();
  for (const r of relasiQ.data ?? []) {
    const p = r.penerima as unknown as PenerimaBaris | null;
    if (!p) continue;
    const arr = penerimaPer.get(r.siswi_id) ?? [];
    arr.push(p);
    penerimaPer.set(r.siswi_id, arr);
  }
  // Batas pesan harian per penerima per tanggal
  const jumlahPesan = new Map<string, number>();
  const kunciPesan = (penerimaId: string, tanggal: string) => `${penerimaId}:${tanggal}`;
  for (const r of logQ.data ?? []) {
    const k = kunciPesan(r.penerima_id, r.tanggal);
    jumlahPesan.set(k, (jumlahPesan.get(k) ?? 0) + 1);
  }
  const tambahPesan = (k: string) => jumlahPesan.set(k, (jumlahPesan.get(k) ?? 0) + 1);

  const logBaris: Record<string, unknown>[] = [];
  const catat = (
    tanggal: string,
    target: "siswi" | "ortu" | "guru",
    tahap: Tahap,
    hasil: HasilKirim,
    extra: { siswi_id?: string; siswi_ids?: string[]; penerima_id?: string },
  ) => {
    logBaris.push({ tanggal, tahap, target, kanal: hasil.kanal, status: hasil.status, detail: hasil.detail, ...extra });
    ringkasan[hasil.status === "terkirim" ? "terkirim" : hasil.status === "gagal" ? "gagal" : "dilewati"]++;
  };

  // Guru: hanya pada hari & jam sekolah (zona sekolah); dikumpulkan jadi satu ringkasan per guru per tahap
  const hariSekolah = cfg.hariSekolah.includes(sekolah.hari);
  const jamSekolah =
    sekolah.menit >= jamKeMenit(cfg.jamSekolah.mulai) && sekolah.menit <= jamKeMenit(cfg.jamSekolah.selesai);
  const ringkasanGuru = new Map<string, { guru: PenerimaBaris; tahap: Tahap; siswi: SiswiBaris[] }>();

  const jamTahap3 = jamKeMenit(cfg.jamTahap3);

  for (const s of terjadwalHariIni) {
    const kini = kiniPer.get(s.id)!;
    const hariIni = kini.tanggal;
    if (sudahMinum.has(`${s.id}:${hariIni}`)) continue;

    const t1 = jamKeMenit(s.jam_minum);
    const t2 = t1 + (cfg.jedaTahap2Menit[s.status] ?? 60);
    const kandidat: { tahap: Tahap; dari: number; sampai: number }[] = [
      { tahap: 1, dari: t1, sampai: t1 + TOLERANSI_MENIT },
      { tahap: 2, dari: t2, sampai: t2 + TOLERANSI_MENIT },
    ];
    if (jamTahap3 > t2) kandidat.push({ tahap: 3, dari: jamTahap3, sampai: 24 * 60 });

    const jatuhTempo = kandidat.filter((k) => kini.menit >= k.dari && kini.menit < k.sampai).pop();
    if (!jatuhTempo) continue;
    const tahap = jatuhTempo.tahap;
    if (sudahKlaim.has(`${s.id}:${hariIni}:${tahap}`)) continue;

    // Klaim dulu agar tidak terkirim dua kali jika cron berjalan bersamaan
    const { data: klaim } = await db
      .from("klaim_pengingat")
      .upsert({ siswi_id: s.id, tanggal: hariIni, tahap }, { onConflict: "siswi_id,tanggal,tahap", ignoreDuplicates: true })
      .select();
    if (!klaim || klaim.length === 0) continue;
    ringkasan.diproses++;

    const haid = sedangHaidPada(haidPer.get(s.id) ?? [], hariIni, cfg.lamaHaidOtomatis);
    const hasilSiswi = await kirimKe({ siswiId: s.id }, {
      ...pesanSiswi(s.status, tahap, haid),
      url: `${urlApp()}/kalender`,
      tag: `ttd-${hariIni}`,
    });
    catat(hariIni, "siswi", tahap, hasilSiswi, { siswi_id: s.id });

    if (tahap === 3) continue; // tahap 3 hanya untuk siswi

    for (const p of penerimaPer.get(s.id) ?? []) {
      if (p.berhenti) continue;
      if (p.peran === "guru") {
        if (!hariSekolah || !jamSekolah) continue;
        const kunci = `${p.id}:${tahap}`;
        const g = ringkasanGuru.get(kunci) ?? { guru: p, tahap, siswi: [] };
        g.siswi.push(s);
        ringkasanGuru.set(kunci, g);
        continue;
      }
      const k = kunciPesan(p.id, hariIni);
      if ((jumlahPesan.get(k) ?? 0) >= cfg.maksPesanPerHari) {
        catat(hariIni, "ortu", tahap, { kanal: "tidak_ada", status: "dilewati", detail: "Batas pesan harian" }, { siswi_id: s.id, penerima_id: p.id });
        continue;
      }
      const hasil = await kirimKe({ penerimaId: p.id }, {
        ...pesanOrtu(namaDepan(s.nama), tahap),
        url: `${urlApp()}/o/${p.token}`,
        tag: `ttd-${s.id}-${hariIni}`,
      });
      if (hasil.status === "terkirim") tambahPesan(k);
      catat(hariIni, "ortu", tahap, hasil, { siswi_id: s.id, penerima_id: p.id });
    }
  }

  for (const { guru, tahap, siswi } of ringkasanGuru.values()) {
    const ids = siswi.map((s) => s.id);
    const k = kunciPesan(guru.id, sekolah.tanggal);
    if ((jumlahPesan.get(k) ?? 0) >= cfg.maksPesanPerHari) {
      catat(sekolah.tanggal, "guru", tahap, { kanal: "tidak_ada", status: "dilewati", detail: "Batas pesan harian" }, { siswi_id: ids[0], siswi_ids: ids, penerima_id: guru.id });
      continue;
    }
    const nama = siswi.map((s) => `${namaDepan(s.nama)} (${s.kelas})`);
    const hasil = await kirimKe({ penerimaId: guru.id }, {
      ...pesanGuru(nama, tahap),
      url: `${urlApp()}/o/${guru.token}`,
      tag: `ttd-guru-${sekolah.tanggal}-${tahap}`,
    });
    if (hasil.status === "terkirim") tambahPesan(k);
    catat(sekolah.tanggal, "guru", tahap, hasil, { siswi_id: ids[0], siswi_ids: ids, penerima_id: guru.id });
  }

  if (logBaris.length) await db.from("log_notifikasi").insert(logBaris);
  return ringkasan;
}
