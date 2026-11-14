import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ambilPengaturan } from "@/lib/pengaturan";
import { saatLokal, jamKeMenit, menitKeJam, formatTanggalPanjang, tambahHari, NAMA_HARI } from "@/lib/waktu";
import { terjadwal, jadwalBerikutnya, type StatusJadwal } from "@/lib/jadwal";
import { namaDepan } from "@/lib/pesan";
import { zonaSiswi } from "@/lib/zona";
import { AktifkanNotifikasi } from "@/components/aktifkan-notifikasi";
import { Logo } from "@/components/ui";
import { IkonCentang } from "@/components/ikon";

export const metadata: Metadata = { title: "Pengingat TTD", robots: { index: false, follow: false } };

type SiswiRingkas = {
  id: string;
  nama: string;
  kelas: string;
  status: StatusJadwal | null;
  jam_minum: string | null;
  hari_minum: number | null;
  mulai_tanggal: string | null;
  zona_waktu: string | null;
};

async function ambilPenerima(token: string) {
  if (!/^[a-f0-9]{20,64}$/.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from("penerima")
    .select("id, peran, nama, hubungan, berhenti")
    .eq("token", token)
    .maybeSingle();
  return data;
}

async function ubahLangganan(fd: FormData) {
  "use server";
  const token = String(fd.get("token") ?? "");
  const p = await ambilPenerima(token);
  if (!p) return;
  await supabaseAdmin().from("penerima").update({ berhenti: fd.get("berhenti") === "1" }).eq("id", p.id);
  revalidatePath(`/o/${token}`);
}

/**
 * Halaman untuk orang tua/wali dan guru — dibuka dari link pribadi, tanpa akun.
 * Sengaja tidak menampilkan data kesehatan (Hb / kategori anemia), hanya jadwal & status minum.
 */
export default async function HalamanPenerima({ params }: PageProps<"/o/[token]">) {
  const { token } = await params;
  const p = await ambilPenerima(token);
  if (!p) notFound();

  const cfg = await ambilPengaturan();
  // Tanggal di kepala halaman memakai zona sekolah; status tiap siswi memakai zona HP siswi
  const hariIni = saatLokal(cfg.zonaWaktu).tanggal;
  const db = supabaseAdmin();
  const { data: relasi } = await db
    .from("siswi_penerima")
    .select("siswi:siswi_id (id, nama, kelas, status, jam_minum, hari_minum, mulai_tanggal, zona_waktu)")
    .eq("penerima_id", p.id);
  const daftar = (relasi ?? [])
    .map((r) => r.siswi as unknown as SiswiRingkas | null)
    .filter((s): s is SiswiRingkas => Boolean(s));
  const ids = daftar.map((s) => s.id);
  const dari7 = tambahHari(hariIni, -7);
  const { data: konsumsi } = ids.length
    ? await db.from("konsumsi").select("siswi_id, tanggal").in("siswi_id", ids).gte("tanggal", dari7)
    : { data: [] };
  const sudah = new Set((konsumsi ?? []).map((k) => `${k.siswi_id}:${k.tanggal}`));

  const guru = p.peran === "guru";
  const baris = daftar
    .map((s) => {
      const hariIni = saatLokal(zonaSiswi(s, cfg.zonaWaktu)).tanggal;
      const siap = s.status && s.jam_minum && s.mulai_tanggal;
      const hariIniJadwal = siap ? terjadwal(s as Required<SiswiRingkas> & { status: StatusJadwal }, hariIni) : false;
      const minum = sudah.has(`${s.id}:${hariIni}`);
      const berikut = siap ? jadwalBerikutnya(s as SiswiRingkas & { status: StatusJadwal }, tambahHari(hariIni, 1)) : null;
      const jam = s.jam_minum ? menitKeJam(jamKeMenit(s.jam_minum)) : null;
      // 7 hari terakhir (untuk ortu)
      const riwayat = siap
        ? Array.from({ length: 7 }, (_, i) => tambahHari(hariIni, i - 6))
            .filter((t) => terjadwal(s as SiswiRingkas & { status: StatusJadwal }, t))
            .map((t) => ({ t, ok: sudah.has(`${s.id}:${t}`) }))
        : [];
      return { s, siap, hariIniJadwal, minum, berikut, jam, riwayat, hariIni };
    })
    .sort((a, b) => Number(a.minum) - Number(b.minum) || a.s.kelas.localeCompare(b.s.kelas));

  const sapaan = guru ? `Yth. ${p.nama || "Bapak/Ibu Guru"}` : `Halo, ${p.hubungan || "Bapak/Ibu"}`;

  return (
    <main className="flex flex-1 flex-col gap-3.5 px-5 pt-12 pb-10">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="text-[15px] font-bold">Pengingat TTD</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">{formatTanggalPanjang(hariIni)}</span>
        <h1 className="font-judul text-[27px] leading-tight font-normal">{sapaan}</h1>
        <p className="text-[15px] leading-normal text-ink-2">
          {guru
            ? "Terima kasih ikut mengingatkan siswi minum Tablet Tambah Darah (TTD). Ringkasan dikirim di jam minum, hanya pada jam sekolah."
            : `Terima kasih ikut mengingatkan ${daftar.map((s) => namaDepan(s.nama)).join(" & ") || "anak Anda"} minum Tablet Tambah Darah (TTD).`}
        </p>
      </div>

      {p.berhenti ? (
        <div className="kartu flex flex-col gap-3">
          <b>Anda sudah berhenti menerima pengingat.</b>
          <form action={ubahLangganan}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="berhenti" value="0" />
            <button type="submit" className="btn-utama">Terima pengingat lagi</button>
          </form>
        </div>
      ) : (
        <AktifkanNotifikasi token={token} />
      )}

      <section className="flex flex-col gap-2.5 rounded-[26px] bg-white p-4" aria-label="Status hari ini">
        <b className="text-base">{guru ? `Siswi (${daftar.length})` : "Hari ini"}</b>
        {baris.length === 0 && <p className="text-sm text-muted">Belum ada siswi yang terhubung.</p>}
        <ul className="flex flex-col gap-2">
          {baris.map(({ s, siap, hariIniJadwal, minum, berikut, jam, riwayat, hariIni }) => (
            <li key={s.id} className="flex flex-col gap-2 rounded-[18px] bg-blush p-3">
              <div className="flex items-center gap-3">
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="truncate text-[15px]">{guru ? `${namaDepan(s.nama)} · ${s.kelas}` : s.nama}</b>
                  <span className="text-[13px] text-muted">
                    {!siap
                      ? "Belum selesai mengatur jadwal"
                      : hariIniJadwal
                        ? `Jadwal hari ini · ${jam}`
                        : berikut
                          ? `Berikutnya: ${NAMA_HARI[new Date(berikut + "T00:00:00Z").getUTCDay()]} · ${jam}`
                          : ""}
                  </span>
                </span>
                {siap && hariIniJadwal && (
                  <span className={`chip shrink-0 ${minum ? "bg-berry text-white" : "bg-peach"}`}>
                    {minum ? (
                      <>
                        <IkonCentang size={14} className="mr-1" /> Sudah minum
                      </>
                    ) : (
                      "Belum minum"
                    )}
                  </span>
                )}
              </div>
              {!guru && riwayat.length > 1 && (
                <div className="flex flex-wrap gap-1.5" aria-label="Riwayat 7 hari terakhir">
                  {riwayat.map((r) => (
                    <span
                      key={r.t}
                      className={`flex h-8 min-w-10 items-center justify-center rounded-lg px-1.5 text-xs font-bold ${
                        r.ok ? "bg-berry text-white" : r.t === hariIni ? "border-[1.5px] border-dashed border-berry text-berry" : "bg-peach"
                      }`}
                      title={r.ok ? "Sudah minum" : r.t === hariIni ? "Hari ini" : "Terlewat"}
                    >
                      {NAMA_HARI[new Date(r.t + "T00:00:00Z").getUTCDay()].slice(0, 3)}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="prosa rounded-[22px] bg-white p-4">
        <h2 className="mt-0!">Cara membantu</h2>
        <ul>
          <li>Ingatkan dengan cara yang hangat, bukan menegur.</li>
          <li>TTD diminum dengan air putih, tidak bersama teh, kopi, atau susu.</li>
          <li>Mual ringan atau tinja hitam umumnya normal. Jika keluhan berat, konsultasikan ke tenaga kesehatan.</li>
        </ul>
      </section>

      {!p.berhenti && (
        <form action={ubahLangganan} className="text-center">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="berhenti" value="1" />
          <button type="submit" className="min-h-11 px-2 text-sm text-muted underline">
            Berhenti menerima pengingat
          </button>
        </form>
      )}
    </main>
  );
}
