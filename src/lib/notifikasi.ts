import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { IsiNotifikasi } from "@/lib/pesan";

let vapidSiap = false;
function siapkanVapid() {
  if (vapidSiap) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  setVapidDetails(process.env.VAPID_SUBJECT || "mailto:peneliti@example.com", pub, priv);
  vapidSiap = true;
  return true;
}

type Pemilik = { siswiId: string } | { penerimaId: string };

export type HasilKirim = {
  kanal: "push" | "wa" | "tidak_ada";
  status: "terkirim" | "gagal" | "dilewati";
  detail?: string;
};

/**
 * Kirim push ke semua perangkat milik siswi/penerima. Langganan yang sudah
 * kedaluwarsa (404/410) dihapus otomatis. Mengembalikan jumlah yang terkirim.
 */
export async function kirimPush(pemilik: Pemilik, isi: IsiNotifikasi & { url: string; tag?: string }) {
  if (!siapkanVapid()) return { terkirim: 0, total: 0, galat: "VAPID belum diatur" };
  const db = supabaseAdmin();
  const kolom = "siswiId" in pemilik ? "siswi_id" : "penerima_id";
  const nilai = "siswiId" in pemilik ? pemilik.siswiId : pemilik.penerimaId;
  const { data: langganan } = await db
    .from("push_langganan")
    .select("id, endpoint, p256dh, auth")
    .eq(kolom, nilai);

  let terkirim = 0;
  let galat = "";
  const payload = JSON.stringify({ title: isi.judul, body: isi.isi, url: isi.url, tag: isi.tag });
  for (const l of langganan ?? []) {
    try {
      await sendNotification(
        { endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } },
        payload,
        { TTL: 60 * 60 * 6, urgency: "high" },
      );
      terkirim++;
    } catch (e: unknown) {
      const kode = (e as { statusCode?: number }).statusCode;
      if (kode === 404 || kode === 410) {
        await db.from("push_langganan").delete().eq("id", l.id);
      } else {
        galat = `push ${kode ?? ""} ${(e as Error).message ?? ""}`.trim();
      }
    }
  }
  return { terkirim, total: langganan?.length ?? 0, galat };
}

/** WhatsApp cadangan via Fonnte. Tidak melakukan apa pun jika FONNTE_TOKEN kosong. */
export async function kirimWA(nomor: string, teks: string): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return { ok: false, detail: "FONNTE_TOKEN tidak diatur" };
  try {
    const body = new FormData();
    body.set("target", nomor);
    body.set("message", teks);
    body.set("countryCode", "62");
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body,
    });
    const json = (await res.json().catch(() => ({}))) as { status?: boolean; reason?: string; detail?: string };
    return { ok: res.ok && json.status !== false, detail: json.reason || json.detail || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}

export const waAktif = () => Boolean(process.env.FONNTE_TOKEN);

/**
 * Kanal utama push; jika tidak ada perangkat yang terdaftar/terkirim, WA (jika aktif).
 */
export async function kirimKe(
  pemilik: Pemilik,
  nomorWa: string | null,
  isi: IsiNotifikasi & { url: string; tag?: string },
): Promise<HasilKirim> {
  const push = await kirimPush(pemilik, isi);
  if (push.terkirim > 0) return { kanal: "push", status: "terkirim", detail: `${push.terkirim}/${push.total} perangkat` };

  if (nomorWa && waAktif()) {
    const wa = await kirimWA(nomorWa, `*${isi.judul}*\n${isi.isi}\n\n${isi.url}`);
    return { kanal: "wa", status: wa.ok ? "terkirim" : "gagal", detail: wa.detail };
  }
  if (push.total > 0) return { kanal: "push", status: "gagal", detail: push.galat };
  return { kanal: "tidak_ada", status: "dilewati", detail: "Belum mengaktifkan notifikasi" };
}
