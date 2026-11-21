/**
 * Uji keamanan & ketahanan: serangan ke Supabase (RLS) dan ke aplikasi (HTTP).
 * Membuat data uji sementara berpenanda "ZZSERANG", lalu menghapusnya di akhir.
 * Jalankan: npm run uji-keamanan   (butuh .env.local; TARGET=url untuk server lain)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, randomBytes } from "node:crypto";

const TARGET = (process.env.TARGET || process.env.UJI_TARGET || "https://darahsehat-gamma.vercel.app").replace(/\/$/, "");
const SB_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "");
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PENANDA = "ZZSERANG";

type Baris = { lapis: string; nama: string; ok: boolean; rincian?: string };
const laporan: Baris[] = [];
const catat = (lapis: string, nama: string, ok: boolean, rincian?: string) => {
  laporan.push({ lapis, nama, ok, rincian });
  console.log(`${ok ? "✅" : "❌"} [${lapis}] ${nama}${rincian ? ` — ${rincian}` : ""}`);
};
const info = (t: string) => console.log(`   · ${t}`);

async function pool<T>(n: number, tugas: (() => Promise<T>)[]): Promise<T[]> {
  const hasil: T[] = new Array(tugas.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < tugas.length) { const k = i++; hasil[k] = await tugas[k](); } }));
  return hasil;
}
const minta = async (path: string, init: RequestInit = {}) => {
  const t0 = performance.now();
  try {
    const r = await fetch(TARGET + path, { redirect: "manual", ...init });
    const body = r.status === 200 ? await r.text() : (await r.text()).slice(0, 2000);
    return { status: r.status, body, lokasi: r.headers.get("location") ?? "", ms: performance.now() - t0, headers: r.headers };
  } catch (e) {
    return { status: 0, body: String(e), lokasi: "", ms: performance.now() - t0, headers: new Headers() };
  }
};
const hex = (n: number) => randomBytes(n).toString("hex");

// ---------- Data uji ----------
const dibuat = { users: [] as string[], penerima: [] as string[] };
const XSS_NAMA = `${PENANDA} <img src=x onerror=alert(1)><script>alert(2)</script>`;
const FORMULA_NAMA = `=HYPERLINK("http://jahat.example","klik") ${PENANDA}`;

async function buatSiswi(nama: string, opsi: Record<string, unknown> = {}) {
  const no = "6289" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  const email = `${no}@siswi.pengingat-ttd.app`;
  const pin = String(Math.floor(100000 + Math.random() * 899999));
  const u = await admin.auth.admin.createUser({ email, password: pin, email_confirm: true });
  if (u.error) throw u.error;
  dibuat.users.push(u.data.user.id);
  const r = await admin.from("siswi").insert({ id: u.data.user.id, nama, usia: 16, kelas: "XI <b>X</b>", sekolah: `SMA ${PENANDA}`, no_wa: no, setuju_penelitian: true, ...opsi });
  if (r.error) throw r.error;
  return { id: u.data.user.id, email, pin, no };
}
async function buatPenerima(peran: "ortu" | "guru", siswiId: string) {
  const p = await admin.from("penerima").insert({ peran, nama: `${PENANDA} ${peran}`, no_wa: "6289" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0") }).select("id, token").single();
  if (p.error) throw p.error;
  dibuat.penerima.push(p.data.id);
  await admin.from("siswi_penerima").insert({ siswi_id: siswiId, penerima_id: p.data.id });
  return p.data;
}
async function bersihkan() {
  for (const id of dibuat.users) await admin.auth.admin.deleteUser(id);
  if (dibuat.penerima.length) await admin.from("penerima").delete().in("id", dibuat.penerima);
  const sisa = await admin.from("siswi").select("id").like("sekolah", `%${PENANDA}%`);
  const sisaP = await admin.from("penerima").select("id").like("nama", `%${PENANDA}%`);
  return (sisa.data?.length ?? 0) + (sisaP.data?.length ?? 0);
}

// ---------- LAPIS 2: Supabase ----------
const TABEL = ["siswi", "penerima", "siswi_penerima", "skrining", "konsumsi", "periode_haid", "push_langganan", "klaim_pengingat", "log_notifikasi", "kunjungan_edukasi", "pengaturan"];
const VIEW = ["rekap_kepatuhan_harian", "rekap_kepatuhan_siswi", "kunjungan_edukasi_lengkap", "rekap_edukasi_siswi"];

async function serangSupabase(korban: { id: string }, penyerang: { email: string; pin: string; id: string }) {
  const L = "Supabase";
  const anon = createClient(SB_URL, ANON, { auth: { persistSession: false } });
  // Baca dengan kunci publik
  let bocor: string[] = [];
  for (const t of [...TABEL, ...VIEW]) {
    const r = await anon.from(t).select("*").limit(5);
    if (!r.error && (r.data?.length ?? 0) > 0) bocor.push(`${t}(${r.data!.length})`);
  }
  catat(L, "Kunci publik (anon) tidak bisa membaca tabel/view mana pun", bocor.length === 0, bocor.join(", ") || `${TABEL.length + VIEW.length} sumber dicoba`);
  // Tulis dengan kunci publik
  const tulis: string[] = [];
  const percobaan: [string, Record<string, unknown>][] = [
    ["siswi", { id: korban.id, nama: "x", kelas: "x", sekolah: "x", no_wa: "628999" }],
    ["konsumsi", { siswi_id: korban.id, tanggal: "2026-01-01" }],
    ["penerima", { peran: "ortu", no_wa: "6281111111111" }],
    ["push_langganan", { siswi_id: korban.id, endpoint: "https://jahat.example/x", p256dh: "x", auth: "x" }],
    ["pengaturan", { kunci: "zz", nilai: 1 }],
    ["log_notifikasi", { tanggal: "2026-01-01", tahap: 1, target: "siswi", kanal: "push", status: "terkirim" }],
  ];
  for (const [t, v] of percobaan) { const r = await anon.from(t).insert(v); if (!r.error) tulis.push(t); }
  const up = await anon.from("pengaturan").update({ nilai: 99 }).eq("kunci", "batas_hb_anemia").select();
  if ((up.data?.length ?? 0) > 0) tulis.push("UPDATE pengaturan");
  const del = await anon.from("siswi").delete().eq("id", korban.id).select();
  if ((del.data?.length ?? 0) > 0) tulis.push("DELETE siswi");
  catat(L, "Kunci publik tidak bisa menulis/mengubah/menghapus data", tulis.length === 0, tulis.join(", ") || `${percobaan.length + 2} operasi ditolak`);

  // Daftar akun sendiri lewat API Auth publik (melewati form aplikasi)
  const emailIseng = `zzserang${hex(4)}@example.com`;
  const su = await anon.auth.signUp({ email: emailIseng, password: "Rahasia123!" });
  const signupTerbuka = !su.error && Boolean(su.data.user);
  if (su.data.user) await admin.auth.admin.deleteUser(su.data.user.id);
  catat(L, "Pendaftaran langsung ke Supabase Auth (tanpa lewat aplikasi) ditutup", !signupTerbuka,
    signupTerbuka ? "TERBUKA: siapa pun bisa membuat akun Auth kosong (tanpa data siswi). Matikan 'Allow new users to sign up' di Supabase." : su.error?.message);

  // Login sebagai siswi lain → coba akses data korban
  const s = createClient(SB_URL, ANON, { auth: { persistSession: false } });
  const lg = await s.auth.signInWithPassword({ email: penyerang.email, password: penyerang.pin });
  if (lg.error) { catat(L, "Login akun penyerang", false, lg.error.message); return; }
  const lintas: string[] = [];
  const sv = await s.from("siswi").select("id"); if ((sv.data ?? []).some((r) => r.id !== penyerang.id)) lintas.push("siswi lain terbaca");
  for (const t of ["skrining", "konsumsi", "periode_haid"]) { const r = await s.from(t).select("siswi_id").eq("siswi_id", korban.id); if ((r.data?.length ?? 0) > 0) lintas.push(`${t} korban terbaca`); }
  for (const t of ["penerima", "push_langganan", "log_notifikasi", "klaim_pengingat", "kunjungan_edukasi", ...VIEW]) { const r = await s.from(t).select("*").limit(3); if ((r.data?.length ?? 0) > 0) lintas.push(`${t} terbaca`); }
  catat(L, "Siswi yang login tidak bisa membaca data siswi lain / token ortu-guru", lintas.length === 0, lintas.join(", ") || "semua ditolak");
  const ubah: string[] = [];
  const u1 = await s.from("siswi").update({ status: "anemia" }).eq("id", penyerang.id).select(); if ((u1.data?.length ?? 0) > 0) ubah.push("mengubah kategori sendiri");
  const u2 = await s.from("siswi").update({ consent_kertas_diterima: true }).eq("id", penyerang.id).select(); if ((u2.data?.length ?? 0) > 0) ubah.push("menandai consent sendiri");
  const u3 = await s.from("siswi").update({ nama: "dibajak" }).eq("id", korban.id).select(); if ((u3.data?.length ?? 0) > 0) ubah.push("mengubah siswi lain");
  const i1 = await s.from("konsumsi").insert({ siswi_id: penyerang.id, tanggal: "2020-01-01" }); if (!i1.error) ubah.push("centang tanggal bebas langsung ke DB");
  const i2 = await s.from("konsumsi").insert({ siswi_id: korban.id, tanggal: "2020-01-02" }); if (!i2.error) ubah.push("centang atas nama siswi lain");
  const i3 = await s.from("skrining").insert({ siswi_id: penyerang.id, pernah_periksa_hb: true, diagnosis_anemia: "ya", status_hasil: "anemia" }); if (!i3.error) ubah.push("skrining palsu langsung ke DB");
  const d1 = await s.from("periode_haid").delete().eq("siswi_id", korban.id).select(); if ((d1.data?.length ?? 0) > 0) ubah.push("hapus data siswi lain");
  catat(L, "Siswi yang login tidak bisa memalsukan/mengubah data langsung ke database", ubah.length === 0, ubah.join(", ") || "7 serangan ditolak (semua penulisan wajib lewat server)");
}

async function bruteForcePin(email: string) {
  const L = "Supabase";
  const c = createClient(SB_URL, ANON, { auth: { persistSession: false } });
  let dibatasi = 0, gagal = 0;
  const tugas = Array.from({ length: 40 }, (_, i) => async () => {
    const r = await c.auth.signInWithPassword({ email, password: String(100000 + i) });
    if (r.error?.status === 429 || /rate|too many/i.test(r.error?.message ?? "")) dibatasi++;
    else if (r.error) gagal++;
  });
  await pool(8, tugas);
  catat(L, "Tebak PIN beruntun (40x) dibatasi Supabase", dibatasi > 0,
    dibatasi > 0 ? `${dibatasi} percobaan diblokir (rate limit)` : `${gagal} percobaan salah tanpa pembatasan — PIN 6 angka rawan ditebak bila nomor WA diketahui`);
}

// ---------- LAPIS 3: HTTP ----------
async function serangHttp(tokenKorban: string, penelitiCookie: string | null) {
  const L = "HTTP";
  // 3.1 Halaman siswi tanpa login
  const halaman = ["/kalender", "/kalender/harian", "/kalender/mingguan", "/profil", "/pengingat", "/edukasi", "/edukasi/anemia", "/mulai", "/mulai/kontak", "/mulai/skrining", "/mulai/jadwal", "/mulai/aktifkan", "/mulai/cek-hb"];
  const r1 = await pool(6, halaman.map((p) => () => minta(p)));
  // Dialihkan lewat header 3xx, atau (karena loading.tsx men-stream respons) lewat pengalihan di dalam halaman
  const dialihkan = (r: Awaited<ReturnType<typeof minta>>) =>
    ([302, 303, 307].includes(r.status) && r.lokasi.includes("/masuk")) ||
    (r.status === 200 && /NEXT_REDIRECT[^"]*\/masuk|url=\/masuk/.test(r.body) && !r.body.includes(PENANDA));
  const lolos1 = halaman.filter((_, i) => !dialihkan(r1[i]));
  catat(L, "Semua halaman siswi tanpa login dialihkan ke /masuk tanpa data", lolos1.length === 0,
    lolos1.map((p) => `${p}:${r1[halaman.indexOf(p)].status}`).join(", ") || `${halaman.length} halaman`);

  // 3.2 Ekspor & dashboard tanpa/ dengan cookie palsu
  const jenis = ["semua", "siswi", "skrining", "kepatuhan-harian", "kepatuhan-siswi", "haid", "notifikasi", "edukasi", "edukasi-siswi", "penerima", "siswi-penerima", "../../etc/passwd", "siswi%00", "SISWI"];
  const cookiePalsu = ["", "ttd_peneliti=", "ttd_peneliti=true", `ttd_peneliti=${hex(32)}`, `ttd_peneliti=${createHmac("sha256", "").update("peneliti-ttd-v1").digest("hex")}`, `ttd_peneliti=${createHmac("sha256", "password").update("peneliti-ttd-v1").digest("hex")}`, `ttd_peneliti=${"a".repeat(5000)}`];
  const t2 = jenis.flatMap((j) => cookiePalsu.map((c) => () => minta(`/api/ekspor/${j}?format=xlsx`, { headers: c ? { cookie: c } : {} })));
  const r2 = await pool(10, t2);
  const bocor2 = r2.filter((r) => r.status === 200);
  const err2 = r2.filter((r) => r.status >= 500);
  catat(L, "Ekspor data ditolak tanpa login peneliti (termasuk cookie palsu & path aneh)", bocor2.length === 0 && err2.length === 0, `${r2.length} percobaan: ${bocor2.length} bocor, ${err2.length} error server`);
  const dash = await minta("/peneliti", { headers: { cookie: `ttd_peneliti=${hex(32)}` } });
  catat(L, "Dashboard peneliti dengan cookie palsu hanya menampilkan form login", !dash.body.includes(PENANDA) && !dash.body.includes("Dasbor peneliti"), `status ${dash.status}`);

  // 3.3 Cron dengan secret palsu
  const auth = ["", "Bearer", "Bearer ", `Bearer ${hex(24)}`, "bearer " + (process.env.CRON_SECRET ?? ""), `Bearer ${process.env.CRON_SECRET}x`, `Bearer ${(process.env.CRON_SECRET ?? "").slice(0, -1)}`, "Basic YWRtaW46YWRtaW4=", `Bearer ' OR 1=1--`];
  const r3 = await pool(6, auth.flatMap((a) => ["GET", "POST"].map((m) => () => minta(`/api/cron/pengingat?secret=${process.env.CRON_SECRET}`, { method: m, headers: a ? { authorization: a } : {} }))));
  const lolos3 = r3.filter((r) => r.status === 200);
  catat(L, "Endpoint cron menolak secret palsu/varian (termasuk secret di URL)", lolos3.length === 0, `${r3.length} percobaan, ${lolos3.length} lolos`);

  // 3.4 Fuzz token ortu/guru
  const sampelToken: string[] = [];
  for (let i = 0; i < 400; i++) sampelToken.push(hex(18));
  for (let i = 0; i < 100; i++) sampelToken.push(tokenKorban.slice(0, -1) + "0123456789abcdef"[i % 16]); // beda 1 karakter
  sampelToken.push(tokenKorban.toUpperCase(), tokenKorban + "a", tokenKorban.slice(1), "0".repeat(36), "f".repeat(64), "a".repeat(5000));
  const injeksi = ["' OR '1'='1", "1; DROP TABLE siswi;--", "../../../etc/passwd", "%2e%2e%2f%2e%2e%2f", "<script>alert(1)</script>", "${7*7}", "{{7*7}}", "%00", "null", "undefined", "*", "%", "☃☃☃", "\\u0000", "admin'--", "1 UNION SELECT * FROM penerima"];
  for (const s of injeksi) sampelToken.push(encodeURIComponent(s));
  const r4 = await pool(20, sampelToken.map((t) => () => minta(`/o/${t}`)));
  const bocor4 = r4.filter((r) => r.status === 200 && r.body.includes(PENANDA));
  const err4 = r4.filter((r) => r.status >= 500 || r.status === 0);
  catat(L, `Fuzz token ortu/guru (${sampelToken.length} token palsu, injeksi SQL, traversal, 5000 karakter)`, bocor4.length === 0 && err4.length === 0,
    `${bocor4.length} bocor, ${err4.length} error server, status: ${[...new Set(r4.map((r) => r.status))].join("/")}`);
  if (tokenKorban.toUpperCase() !== tokenKorban) info("token huruf besar juga ditolak (pembanding ketat)");

  // 3.5 Fuzz API push
  const besar = JSON.stringify({ subscription: { endpoint: "https://x.example/" + "a".repeat(1_000_000), keys: { p256dh: "a", auth: "b" } } });
  const badan: (string | undefined)[] = [undefined, "", "null", "[]", "{", "not json", "{}", '{"subscription":null}', '{"subscription":{"endpoint":"http://tidak-https.example","keys":{"p256dh":"a","auth":"b"}}}',
    '{"subscription":{"endpoint":"javascript:alert(1)","keys":{"p256dh":"a","auth":"b"}}}', '{"subscription":{"endpoint":"https://x.example"}}',
    `{"subscription":{"endpoint":"https://x.example/${hex(8)}","keys":{"p256dh":"a","auth":"b"}}}`,
    `{"subscription":{"endpoint":"https://x.example/${hex(8)}","keys":{"p256dh":"a","auth":"b"}},"token":"${hex(18)}"}`,
    `{"subscription":{"endpoint":"https://x.example/${hex(8)}","keys":{"p256dh":"a","auth":"b"}},"token":"' OR 1=1--"}`,
    `{"subscription":{"endpoint":"https://x.example/${hex(8)}","keys":{"p256dh":{"$gt":""},"auth":"b"}}}`, besar];
  const r5 = await pool(8, badan.map((b) => () => minta("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: b })));
  const lolos5 = r5.filter((r) => r.status === 200);
  const err5 = r5.filter((r) => r.status >= 500 || r.status === 0);
  catat(L, `API push menolak ${badan.length} payload rusak/berbahaya (termasuk 1 MB)`, lolos5.length === 0 && err5.length === 0,
    `status: ${r5.map((r) => r.status).join(",")}`);
  const sampah = await admin.from("push_langganan").select("id").like("endpoint", "https://x.example%");
  catat(L, "Tidak ada langganan push sampah yang tersimpan", (sampah.data?.length ?? 0) === 0, `${sampah.data?.length ?? 0} baris`);

  // 3.6 XSS & injeksi formula di tampilan ortu/guru dan dashboard
  const o = await minta(`/o/${tokenKorban}`);
  const xssOrtu = /<img src=x onerror|<script>alert\(2\)/.test(o.body);
  catat(L, "Nama siswi berisi kode XSS ditampilkan sebagai teks di halaman ortu/guru", o.status === 200 && !xssOrtu, `status ${o.status}${xssOrtu ? ", KODE TEREKSEKUSI" : ""}`);
  if (penelitiCookie) {
    const d = await minta("/peneliti", { headers: { cookie: penelitiCookie } });
    const xssDash = /<img src=x onerror|<script>alert\(2\)/.test(d.body);
    catat(L, "Nama siswi berisi kode XSS aman di dashboard peneliti", d.status === 200 && d.body.includes("Dasbor peneliti") && !xssDash, `status ${d.status}`);
    const csv = await minta("/api/ekspor/siswi", { headers: { cookie: penelitiCookie } });
    const barisFormula = csv.body.split(/\r?\n/).find((l) => l.includes("HYPERLINK")) ?? "";
    const sel = barisFormula.split(";")[1] ?? "";
    const aman = !/^"?[=+\-@]/.test(sel);
    catat(L, "Ekspor CSV menetralkan sel yang diawali = + - @ (injeksi formula Excel)", csv.status === 200 && aman, `sel nama: ${sel.slice(0, 40)}`);
  } else info("PENELITI_PASSWORD tidak ada — uji XSS dashboard & CSV dilewati");

  // 3.7 Rute lain
  const lain = ["/ikon/999999", "/ikon/-1", "/ikon/abc", "/ikon/512?maskable=%3Cscript%3E", "/api/ekspor", "/api/push", "/api/cron", "/o/", "/edukasi/%2e%2e", "/kalender?bulan=9999-99", "/kalender?bulan=<script>", "/.env", "/.env.local", "/package.json", "/supabase/migrations/0001_skema.sql", "/_next/../.env"];
  const r7 = await pool(8, lain.map((p) => () => minta(p)));
  const bahaya7 = lain.filter((p, i) => r7[i].status >= 500 || (r7[i].status === 200 && /SUPABASE|SERVICE_ROLE|CRON_SECRET|create table/i.test(r7[i].body)));
  catat(L, "Rute aneh & file rahasia (.env, migrasi) tidak bocor / tidak error", bahaya7.length === 0, bahaya7.join(", ") || `${lain.length} rute dicoba`);

  // 3.8 Header keamanan
  const h = (await minta("/masuk")).headers;
  const kurang = [
    ["x-frame-options / CSP frame-ancestors (anti-clickjacking)", h.get("x-frame-options") || /frame-ancestors/.test(h.get("content-security-policy") ?? "")],
    ["x-content-type-options: nosniff", h.get("x-content-type-options") === "nosniff"],
    ["referrer-policy (token /o/ tidak bocor lewat Referer)", Boolean(h.get("referrer-policy"))],
    ["strict-transport-security (HTTPS wajib)", Boolean(h.get("strict-transport-security"))],
  ].filter(([, ok]) => !ok).map(([n]) => n as string);
  catat(L, "Header keamanan HTTP lengkap", kurang.length === 0, kurang.length ? `kurang: ${kurang.join("; ")}` : "lengkap");
}

// ---------- LAPIS 3b: beban & idempotensi cron ----------
async function seranganBeban(tokenKorban: string) {
  const L = "Beban";
  const jalur = ["/", "/masuk", "/daftar", "/persetujuan", "/manifest.webmanifest", `/o/${tokenKorban}`, `/o/${hex(18)}`, "/kalender", "/api/ekspor/siswi"];
  const lokal = /localhost|127\.0\.0\.1/.test(TARGET);
  const jumlah = lokal ? 300 : 1200, serentak = lokal ? 10 : 30;
  const tugas = Array.from({ length: jumlah }, (_, i) => () => minta(jalur[i % jalur.length]));
  const t0 = performance.now();
  const r = await pool(serentak, tugas);
  const dtk = (performance.now() - t0) / 1000;
  const ms = r.map((x) => x.ms).sort((a, b) => a - b);
  const p = (q: number) => Math.round(ms[Math.floor(q * (ms.length - 1))]);
  const err = r.filter((x) => x.status >= 500 || x.status === 0);
  const dibatasi = r.filter((x) => x.status === 429).length;
  const diblokir = r.filter((x) => x.headers.get("x-vercel-mitigated")).length;
  if (diblokir) info(`${diblokir} respons diblokir firewall Vercel (Security Checkpoint) — perlindungan DDoS aktif`);
  catat(L, `${jumlah} request (${serentak} bersamaan) ke 9 jalur`, err.length === 0,
    `${(r.length / dtk).toFixed(0)} req/dtk · p50 ${p(0.5)} ms · p95 ${p(0.95)} ms · p99 ${p(0.99)} ms · ${err.length} error · ${dibatasi} dibatasi`);
}

async function cronSerentak() {
  const L = "Beban";
  const zona = "Asia/Jakarta";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const menit = Number(parts.hour) * 60 + Number(parts.minute);
  const jam = Math.max(0, menit - 10) - (Math.max(0, menit - 10) % 5); // jatuh tempo 10 menit lalu (dalam jendela tahap 1)
  const jamStr = `${String(Math.floor(jam / 60)).padStart(2, "0")}:${String(jam % 60).padStart(2, "0")}`;
  const tgl = `${parts.year}-${parts.month}-${parts.day}`;
  const s = await buatSiswi(`${PENANDA} Cron`, { status: "anemia", jam_minum: jamStr, mulai_tanggal: tgl, zona_waktu: zona });
  await buatPenerima("ortu", s.id);
  const r = await pool(25, Array.from({ length: 25 }, () => () => minta("/api/cron/pengingat", { method: "POST", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })));
  const ok = r.filter((x) => x.status === 200).length;
  const klaim = await admin.from("klaim_pengingat").select("tahap").eq("siswi_id", s.id);
  const log = await admin.from("log_notifikasi").select("target").eq("siswi_id", s.id);
  const perTahap = new Map<number, number>();
  for (const k of klaim.data ?? []) perTahap.set(k.tahap, (perTahap.get(k.tahap) ?? 0) + 1);
  const dobel = [...perTahap.values()].some((n) => n > 1) || (log.data?.filter((l) => l.target === "siswi").length ?? 0) > (klaim.data?.length ?? 0);
  catat(L, "25 panggilan cron bersamaan tidak mengirim pengingat ganda", ok === 25 && (klaim.data?.length ?? 0) >= 1 && !dobel,
    `${ok}/25 sukses · klaim ${klaim.data?.length ?? 0} · log siswi ${log.data?.filter((l) => l.target === "siswi").length ?? 0} · log ortu ${log.data?.filter((l) => l.target === "ortu").length ?? 0}`);
}

// ---------- Main ----------
(async () => {
  console.log(`Uji keamanan & ketahanan → aplikasi: ${TARGET}\n`);
  let sisa = -1;
  try {
    const korban = await buatSiswi(XSS_NAMA, { status: "tidak_anemia", jam_minum: "07:00", hari_minum: 1, mulai_tanggal: "2026-01-05", zona_waktu: "Asia/Jakarta" });
    await admin.from("skrining").insert({ siswi_id: korban.id, pernah_periksa_hb: true, kadar_hb: 13, diagnosis_anemia: "tidak", status_hasil: "tidak_anemia" });
    await admin.from("konsumsi").insert({ siswi_id: korban.id, tanggal: "2026-01-05" });
    await admin.from("periode_haid").insert({ siswi_id: korban.id, mulai: "2026-01-10", selesai: "2026-01-14" });
    const ortu = await buatPenerima("ortu", korban.id);
    await buatSiswi(FORMULA_NAMA);
    const penyerang = await buatSiswi(`${PENANDA} Penyerang`);
    const pw = process.env.PENELITI_PASSWORD;
    const cookie = pw ? `ttd_peneliti=${createHmac("sha256", pw).update("peneliti-ttd-v1").digest("hex")}` : null;

    await serangSupabase(korban, penyerang);
    await serangHttp(ortu.token, cookie);
    await seranganBeban(ortu.token);
    await cronSerentak();
    await bruteForcePin(korban.email);
  } catch (e) {
    catat("Skrip", "Uji berjalan sampai selesai", false, (e as Error).message);
  } finally {
    sisa = await bersihkan();
    console.log(`\nPembersihan: ${dibuat.users.length} akun & ${dibuat.penerima.length} ortu/guru uji dihapus · sisa data uji: ${sisa}`);
  }
  const gagal = laporan.filter((b) => !b.ok);
  console.log(`\n${laporan.length - gagal.length}/${laporan.length} uji aman${gagal.length ? ` · ${gagal.length} perlu perhatian:` : ""}`);
  gagal.forEach((g) => console.log(`  ❌ [${g.lapis}] ${g.nama}: ${g.rincian}`));
  process.exit(gagal.length ? 1 : 0);
})();
