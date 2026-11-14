import Link from "next/link";
import { redirect } from "next/navigation";
import { siswiSiap, halamanKalender } from "@/lib/siswi";
import { ambilPengaturan } from "@/lib/pengaturan";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  terjadwal,
  hitungKepatuhan,
  haidAktif,
  sedangHaidPada,
  jadwalBerikutnya,
  BATAS_CENTANG_MUNDUR_HARI,
  type Haid,
} from "@/lib/jadwal";
import { saatLokal, tambahHari, hariDari, formatTanggalPanjang, NAMA_BULAN, NAMA_HARI, jamKeMenit, menitKeJam } from "@/lib/waktu";
import { namaDepan } from "@/lib/pesan";
import { HalamanApp } from "@/components/nav-bawah";
import { ChipStatus } from "@/components/ui";
import { IkonKembali, IkonLanjut, IkonPuskesmas, IkonTetes } from "@/components/ikon";
import { centangMinum, batalCentang, aturHaid } from "./actions";
import { TombolMinum, TombolHaid } from "./tombol";

type Jenis = "harian" | "mingguan";

export async function HalamanKalender({ jenis, bulan }: { jenis: Jenis; bulan?: string }) {
  const s = await siswiSiap();
  // Pastikan siswi berada di kalender yang sesuai kategorinya
  const seharusnya = halamanKalender(s.status);
  if (!seharusnya.endsWith(jenis)) redirect(seharusnya);

  const cfg = await ambilPengaturan();
  const hariIni = saatLokal(cfg.zonaWaktu).tanggal;
  const db = supabaseAdmin();
  const [{ data: konsumsi }, { data: haidData }] = await Promise.all([
    db.from("konsumsi").select("tanggal").eq("siswi_id", s.id),
    db.from("periode_haid").select("mulai, selesai").eq("siswi_id", s.id).order("mulai", { ascending: false }).limit(24),
  ]);
  const diminum = new Set((konsumsi ?? []).map((k) => k.tanggal as string));
  const haid: Haid[] = haidData ?? [];
  const lama = cfg.lamaHaidOtomatis;
  const haidNow = haidAktif(haid, hariIni, lama);

  const terjadwalHariIni = terjadwal(s, hariIni);
  const sudahHariIni = diminum.has(hariIni);
  const kepatuhan = hitungKepatuhan(s, diminum, hariIni, cfg.periodePenelitian.selesai);

  // Jadwal terlewat yang masih boleh dicentang (lupa centang)
  let terlewat: string | null = null;
  for (let i = 1; i <= BATAS_CENTANG_MUNDUR_HARI; i++) {
    const t = tambahHari(hariIni, -i);
    if (terjadwal(s, t) && !diminum.has(t)) {
      terlewat = t;
      break;
    }
  }
  const berikut = jadwalBerikutnya(s, tambahHari(hariIni, 1));
  const jam = menitKeJam(jamKeMenit(s.jam_minum));
  const harian = jenis === "harian";

  // ---- Bulan yang ditampilkan ----
  const bulanIni = hariIni.slice(0, 7);
  const tampil = bulan && /^\d{4}-\d{2}$/.test(bulan) ? bulan : bulanIni;
  const [ty, tm] = tampil.split("-").map(Number);
  const awal = `${tampil}-01`;
  const jumlahHari = new Date(Date.UTC(ty, tm, 0)).getUTCDate();
  const kosongDepan = (hariDari(awal) + 6) % 7; // minggu dimulai Senin
  const geser = (n: number) => {
    const d = new Date(Date.UTC(ty, tm - 1 + n, 1));
    return d.toISOString().slice(0, 7);
  };
  const sel = Array.from({ length: jumlahHari }, (_, i) => {
    const t = `${tampil}-${String(i + 1).padStart(2, "0")}`;
    const dijadwal = terjadwal(s, t);
    const sudah = diminum.has(t);
    const lewat = t < hariIni;
    const isHaid = sedangHaidPada(haid, t, lama) && t <= hariIni;
    let kelas = "text-muted";
    let ket = "";
    if (sudah) {
      kelas = "bg-berry text-white";
      ket = "sudah minum";
    } else if (dijadwal && lewat) {
      kelas = "bg-peach text-ink";
      ket = "terlewat";
    } else if (dijadwal) {
      kelas = "border-[1.5px] border-dashed border-berry text-berry";
      ket = "jadwal";
    } else if (isHaid) {
      kelas = "bg-petal text-ink";
    }
    if (t === hariIni && !sudah) kelas += " outline-2 outline-ink -outline-offset-2 text-ink";
    return { t, d: i + 1, kelas, ket, isHaid, hariIni: t === hariIni };
  });

  // ---- Teks ----
  const dosis = harian ? cfg.dosisAnemia : cfg.dosisPencegahan;
  let pesan: string;
  if (harian) {
    pesan = haidNow
      ? "Tetap minum setiap hari walau sedang haid ya. Haidmu sudah dicatat."
      : "TTD adalah bagian dari pengobatanmu. Kalau terputus, Hb bisa turun lagi.";
  } else {
    pesan = haidNow
      ? "Haidmu sudah dicatat. Saat haid tubuh kehilangan zat besi, jadi jangan lewatkan TTD di hari jadwalmu ya."
      : "Sayangi tubuhmu, jangan lupa minum TTD minggu ini.";
  }
  const hariKe = harian ? Math.max(1, Math.round((Date.parse(hariIni) - Date.parse(s.mulai_tanggal)) / 86_400_000) + 1) : null;

  return (
    <HalamanApp aktif="kalender" status={s.status}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted">{formatTanggalPanjang(hariIni)}</span>
          <h1 className="font-judul text-[27px] font-normal">Hai, {namaDepan(s.nama)}</h1>
        </div>
        <ChipStatus status={s.status} />
      </div>

      {/* Kartu hari ini */}
      <section className="flex flex-col gap-3 rounded-[26px] bg-white p-[18px]" aria-label="Jadwal hari ini">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold tracking-[0.08em] text-muted uppercase">
              {terjadwalHariIni
                ? harian
                  ? `Hari ke-${hariKe} · ${jam}`
                  : `Jadwal hari ini · ${jam}`
                : `Jadwal berikutnya`}
            </span>
            <span className="font-judul text-[20px] leading-snug font-medium">
              {terjadwalHariIni ? dosis : berikut ? `${formatTanggalPanjang(berikut)} · ${jam}` : "—"}
            </span>
          </div>
          {haidNow ? (
            <span className="flex min-h-11 items-center gap-1.5 rounded-full bg-berry px-3 text-[13px] font-bold whitespace-nowrap text-white">
              <IkonTetes size={16} />
              Haid hari ke-{haidNow.hariKe}
            </span>
          ) : (
            <form action={aturHaid}>
              <input type="hidden" name="aksi" value="mulai" />
              <TombolHaid aktif={false} label={harian ? "Sedang haid" : "Saya sedang haid"} />
            </form>
          )}
        </div>
        {haidNow && (
          <form action={aturHaid} className="-mt-1 self-end">
            <input type="hidden" name="aksi" value="selesai" />
            <button type="submit" className="min-h-11 px-1 text-[13px] font-bold text-berry underline">
              Haid sudah selesai
            </button>
          </form>
        )}

        <p className="text-[15px] leading-snug text-ink-2">
          {terjadwalHariIni ? pesan : haidNow ? pesan : "Hari ini tidak ada jadwal minum. Sampai ketemu di jadwal berikutnya!"}
        </p>

        {terjadwalHariIni && (
          <form action={sudahHariIni ? batalCentang : centangMinum}>
            <input type="hidden" name="tanggal" value={hariIni} />
            <TombolMinum sudah={sudahHariIni} label={sudahHariIni && !harian ? "Sudah diminum — hebat!" : undefined} />
          </form>
        )}

        {terlewat && (
          <div className="flex flex-col gap-2 rounded-[18px] bg-peach p-3">
            <span className="text-sm leading-snug">
              TTD <b>{NAMA_HARI[hariDari(terlewat)]}, {Number(terlewat.slice(8))} {NAMA_BULAN[Number(terlewat.slice(5, 7)) - 1]}</b> belum
              dicentang. Sudah diminum tapi lupa centang?
            </span>
            <form action={centangMinum}>
              <input type="hidden" name="tanggal" value={terlewat} />
              <button type="submit" className="flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-bold text-berry">
                Ya, sudah aku minum
              </button>
            </form>
          </div>
        )}

        <span className="text-[13px] text-muted">Minum dengan air putih, jangan bersama teh, kopi, atau susu.</span>
      </section>

      {/* Kalender bulan */}
      <section className="flex flex-col gap-2.5 rounded-[26px] bg-white p-4" aria-label="Kalender">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Link href={`?bulan=${geser(-1)}`} aria-label="Bulan sebelumnya" className="flex size-9 items-center justify-center rounded-full text-ink hover:bg-blush">
              <IkonKembali size={18} />
            </Link>
            <b className="text-base">
              {NAMA_BULAN[tm - 1]} {ty}
            </b>
            <Link href={`?bulan=${geser(1)}`} aria-label="Bulan berikutnya" className="flex size-9 items-center justify-center rounded-full text-ink hover:bg-blush">
              <IkonLanjut size={18} />
            </Link>
          </div>
          <span className="text-right text-sm text-muted">
            Kepatuhan <b className="text-berry">{kepatuhan.persen === null ? "–" : `${kepatuhan.persen}%`}</b>
            <br className="min-[400px]:hidden" />
            <span className="max-[399px]:text-xs">
              {" "}· {kepatuhan.diminum} dari {kepatuhan.jadwal} {harian ? "hari" : "jadwal"}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted" aria-hidden="true">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {Array.from({ length: kosongDepan }, (_, i) => (
            <li key={`k${i}`} aria-hidden="true" />
          ))}
          {sel.map((c) => (
            <li
              key={c.t}
              className={`relative flex h-9 items-center justify-center rounded-xl text-sm font-semibold ${c.kelas}`}
              aria-label={`${c.d} ${NAMA_BULAN[tm - 1]}${c.ket ? `, ${c.ket}` : ""}${c.isHaid ? ", haid" : ""}${c.hariIni ? ", hari ini" : ""}`}
              aria-current={c.hariIni ? "date" : undefined}
            >
              {c.d}
              {c.isHaid && c.kelas.includes("bg-") && !c.kelas.includes("bg-petal") && (
                <span className="absolute inset-x-1.5 bottom-0.5 h-1 rounded-full bg-petal" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3 text-xs text-ink-2">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-berry" />Sudah minum</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-peach" />Terlewat</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded border-[1.5px] border-dashed border-berry" />Jadwal</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-full border border-garis-3 bg-petal" />Haid</span>
        </div>
      </section>

      {s.status === "anemia" && (
        <div className="flex items-center gap-3 rounded-[20px] bg-peach px-4 py-3.5">
          <IkonPuskesmas size={22} className="shrink-0" />
          <span className="text-sm leading-snug">
            Jangan lupa <b>kontrol Hb ke puskesmas</b> sesuai jadwal dari tenaga kesehatan.
          </span>
        </div>
      )}
      {s.status === "tidak_anemia" && (
        <div className="flex items-center gap-3 rounded-[20px] bg-mint px-4 py-3.5">
          <IkonPuskesmas size={22} className="shrink-0" />
          <span className="text-sm leading-snug">
            Hb-mu normal. Tetap <b>cek Hb berkala</b> di UKS atau puskesmas ya.
          </span>
        </div>
      )}
      {s.status === "belum_diketahui" && (
        <div className="flex flex-col gap-2.5 rounded-[20px] bg-lavender px-4 py-3.5">
          <span className="flex items-center gap-3 text-sm leading-snug">
            <IkonPuskesmas size={22} className="shrink-0" />
            <span>Kamu belum tahu kadar Hb-mu. Yuk <b>periksa Hb</b> di UKS atau puskesmas.</span>
          </span>
          <Link href="/mulai/skrining?ulang=1" className="flex h-11 items-center justify-center rounded-full bg-white text-sm font-bold text-ink no-underline">
            Sudah periksa? Isi kadar Hb
          </Link>
        </div>
      )}
    </HalamanApp>
  );
}
