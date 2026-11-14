import type { Metadata } from "next";
import { penelitiMasuk, ambilSemua } from "@/lib/peneliti";
import { ambilPengaturan } from "@/lib/pengaturan";
import { saatLokal } from "@/lib/waktu";
import { LABEL_STATUS, WARNA_STATUS, type StatusJadwal } from "@/lib/jadwal";
import { teksUndanganGuru } from "@/lib/pesan";
import { tampilNomor } from "@/lib/telepon";
import { Logo } from "@/components/ui";
import { FormMasukPeneliti } from "./form-masuk";
import { keluarPeneliti, tandaiConsent } from "./actions";

export const metadata: Metadata = { title: "Peneliti", robots: { index: false, follow: false } };

type SiswiB = {
  id: string; nama: string; kelas: string; sekolah: string; status: StatusJadwal | null;
  jam_minum: string | null; mulai_tanggal: string | null; consent_kertas_diterima: boolean; created_at: string;
};
type RekapB = { siswi_id: string; jumlah_jadwal: number; jumlah_diminum: number; persen_kepatuhan: number | null };
type PenerimaB = { id: string; peran: "ortu" | "guru"; nama: string | null; no_wa: string; token: string; berhenti: boolean };
type RelasiB = { siswi_id: string; penerima_id: string };
type PushB = { siswi_id: string | null; penerima_id: string | null };
type LogB = { status: string; target: string };

const EKSPOR = [
  ["kepatuhan-harian", "Kepatuhan harian (per siswi per jadwal)"],
  ["kepatuhan-siswi", "Rekap kepatuhan per siswi"],
  ["siswi", "Data siswi"],
  ["skrining", "Skrining Hb"],
  ["haid", "Periode haid"],
  ["notifikasi", "Log notifikasi"],
  ["edukasi", "Kunjungan edukasi"],
  ["penerima", "Orang tua & guru"],
  ["siswi-penerima", "Relasi siswi ↔ ortu/guru"],
] as const;

const persen = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export default async function Peneliti() {
  if (!(await penelitiMasuk())) {
    return (
      <main data-lebar className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-4 px-6 py-12">
        <div className="flex items-center gap-2.5"><Logo /><b>Pengingat TTD · Peneliti</b></div>
        <FormMasukPeneliti />
      </main>
    );
  }

  const cfg = await ambilPengaturan();
  const hariIni = saatLokal(cfg.zonaWaktu).tanggal;
  const [siswi, rekap, penerima, relasi, push, log] = await Promise.all([
    ambilSemua<SiswiB>("siswi", "id, nama, kelas, sekolah, status, jam_minum, mulai_tanggal, consent_kertas_diterima, created_at", [{ kolom: "nama" }]),
    ambilSemua<RekapB>("rekap_kepatuhan_siswi", "siswi_id, jumlah_jadwal, jumlah_diminum, persen_kepatuhan"),
    ambilSemua<PenerimaB>("penerima", "id, peran, nama, no_wa, token, berhenti"),
    ambilSemua<RelasiB>("siswi_penerima", "siswi_id, penerima_id"),
    ambilSemua<PushB>("push_langganan", "siswi_id, penerima_id"),
    ambilSemua<LogB>("log_notifikasi", "status, target"),
  ]);

  const rekapPer = new Map(rekap.map((r) => [r.siswi_id, r]));
  const pushSiswi = new Set(push.map((p) => p.siswi_id).filter(Boolean));
  const pushPenerima = new Set(push.map((p) => p.penerima_id).filter(Boolean));
  const penerimaPer = new Map(penerima.map((p) => [p.id, p]));
  const jumlahSiswiPerPenerima = new Map<string, number>();
  const ortuAktifPerSiswi = new Map<string, boolean>();
  for (const r of relasi) {
    jumlahSiswiPerPenerima.set(r.penerima_id, (jumlahSiswiPerPenerima.get(r.penerima_id) ?? 0) + 1);
    const p = penerimaPer.get(r.penerima_id);
    if (p?.peran === "ortu" && pushPenerima.has(p.id)) ortuAktifPerSiswi.set(r.siswi_id, true);
  }

  const skriningSelesai = siswi.filter((s) => s.status).length;
  const siap = siswi.filter((s) => s.status && s.jam_minum && s.mulai_tanggal).length;
  const totalJadwal = rekap.reduce((a, r) => a + Number(r.jumlah_jadwal), 0);
  const totalMinum = rekap.reduce((a, r) => a + Number(r.jumlah_diminum), 0);
  const patuh80 = rekap.filter((r) => (r.persen_kepatuhan ?? 0) >= 80).length;
  const logOrtuGuru = log.filter((l) => l.target !== "siswi" && l.status !== "dilewati");
  const terkirimOrtuGuru = logOrtuGuru.filter((l) => l.status === "terkirim").length;
  const guru = penerima.filter((p) => p.peran === "guru");
  const ortu = penerima.filter((p) => p.peran === "ortu");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  const statistik = [
    { label: "Siswi terdaftar", nilai: String(siswi.length) },
    { label: "Skrining selesai", nilai: `${skriningSelesai}`, ket: `${persen(skriningSelesai, siswi.length)} · target ≥ 90%` },
    { label: "Jadwal aktif", nilai: `${siap}` },
    { label: "Kepatuhan total", nilai: persen(totalMinum, totalJadwal), ket: `${totalMinum}/${totalJadwal} jadwal` },
    { label: "Siswi patuh ≥ 80%", nilai: `${patuh80}`, ket: persen(patuh80, rekap.length) },
    { label: "Pesan ortu/guru terkirim", nilai: persen(terkirimOrtuGuru, logOrtuGuru.length), ket: `${terkirimOrtuGuru}/${logOrtuGuru.length} · target ≥ 95%` },
    { label: "Push aktif", nilai: `${pushSiswi.size} siswi`, ket: `${ortu.filter((o) => pushPenerima.has(o.id)).length}/${ortu.length} ortu · ${guru.filter((g) => pushPenerima.has(g.id)).length}/${guru.length} guru` },
  ];

  return (
    <main data-lebar className="flex flex-1 flex-col gap-5 px-5 py-10 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Logo />
        <div className="flex flex-col">
          <h1 className="font-judul text-2xl font-normal">Dasbor peneliti</h1>
          <span className="text-sm text-muted">Data per {hariIni} ({cfg.zonaWaktu})</span>
        </div>
        <form action={keluarPeneliti} className="ml-auto">
          <button type="submit" className="min-h-11 rounded-full border-[1.5px] border-garis-3 px-4 text-sm font-bold">Keluar</button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {statistik.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-[20px] bg-white p-4">
            <span className="text-[13px] text-muted">{s.label}</span>
            <b className="font-judul text-2xl font-medium">{s.nilai}</b>
            {s.ket && <span className="text-xs text-muted">{s.ket}</span>}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-[24px] bg-white p-5">
        <h2 className="font-judul text-lg font-medium">Ekspor ke Excel (CSV)</h2>
        <div className="flex flex-wrap gap-2">
          {EKSPOR.map(([k, l]) => (
            <a key={k} href={`/api/ekspor/${k}`} className="flex min-h-11 items-center rounded-full bg-petal px-4 text-sm font-bold text-ink no-underline">
              {l}
            </a>
          ))}
        </div>
        <p className="text-[13px] text-muted">
          File memakai pemisah titik koma (cocok untuk Excel berbahasa Indonesia). Untuk SPSS/R tambahkan{" "}
          <code>?pemisah=koma</code> di akhir alamat unduhan.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-[24px] bg-white p-5">
        <h2 className="font-judul text-lg font-medium">Guru ({guru.length})</h2>
        <p className="text-[13px] text-muted">Kirim link ke setiap guru. Guru membuka link lalu menekan &ldquo;Aktifkan pengingat&rdquo;.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-muted">
              <tr><th className="py-2 pr-3">Nama</th><th className="pr-3">Nomor</th><th className="pr-3">Siswi</th><th className="pr-3">Status</th><th /></tr>
            </thead>
            <tbody>
              {guru.map((g) => {
                const n = jumlahSiswiPerPenerima.get(g.id) ?? 0;
                const link = `${appUrl}/o/${g.token}`;
                const wa = `https://wa.me/${g.no_wa}?text=${encodeURIComponent(teksUndanganGuru(g.nama, n, link))}`;
                return (
                  <tr key={g.id} className="border-t border-garis-2">
                    <td className="py-2 pr-3 font-semibold">{g.nama || "—"}</td>
                    <td className="pr-3">{tampilNomor(g.no_wa)}</td>
                    <td className="pr-3">{n}</td>
                    <td className="pr-3">{g.berhenti ? "Berhenti" : pushPenerima.has(g.id) ? "Push aktif" : "Belum aktif"}</td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="mr-3 font-bold">Kirim via WA</a>
                      <a href={link} target="_blank" rel="noopener noreferrer">Buka link</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[24px] bg-white p-5">
        <h2 className="font-judul text-lg font-medium">Siswi ({siswi.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-3">Nama</th><th className="pr-3">Kelas</th><th className="pr-3">Sekolah</th><th className="pr-3">Kategori</th>
                <th className="pr-3">Jam</th><th className="pr-3">Kepatuhan</th><th className="pr-3">Push siswi</th><th className="pr-3">Push ortu</th><th>Consent kertas</th>
              </tr>
            </thead>
            <tbody>
              {siswi.map((s) => {
                const r = rekapPer.get(s.id);
                return (
                  <tr key={s.id} className="border-t border-garis-2">
                    <td className="py-2 pr-3 font-semibold">{s.nama}</td>
                    <td className="pr-3">{s.kelas}</td>
                    <td className="pr-3">{s.sekolah}</td>
                    <td className="pr-3">{s.status ? <span className={`chip ${WARNA_STATUS[s.status]}`}>{LABEL_STATUS[s.status]}</span> : <span className="text-muted">Belum skrining</span>}</td>
                    <td className="pr-3">{s.jam_minum?.slice(0, 5) ?? "—"}</td>
                    <td className="pr-3">{r ? `${r.persen_kepatuhan ?? 0}% (${r.jumlah_diminum}/${r.jumlah_jadwal})` : "—"}</td>
                    <td className="pr-3">{pushSiswi.has(s.id) ? "Ya" : "—"}</td>
                    <td className="pr-3">{ortuAktifPerSiswi.get(s.id) ? "Ya" : "—"}</td>
                    <td className="py-1">
                      <form action={tandaiConsent}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="nilai" value={s.consent_kertas_diterima ? "0" : "1"} />
                        <button type="submit" className={`min-h-9 rounded-full px-3 text-xs font-bold ${s.consent_kertas_diterima ? "bg-mint" : "border-[1.5px] border-garis-3"}`}>
                          {s.consent_kertas_diterima ? "✓ Diterima" : "Tandai diterima"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
