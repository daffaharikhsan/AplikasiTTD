import { NextResponse } from "next/server";
import { idPenggunaLogin, supabaseAdmin } from "@/lib/supabase/server";

type Body = {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  token?: string;
};

/** Menyimpan langganan push untuk siswi yang login, atau ortu/guru (dengan token link). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth || !sub.endpoint.startsWith("https://")) {
    return NextResponse.json({ galat: "Data langganan tidak valid" }, { status: 400 });
  }

  const db = supabaseAdmin();
  let pemilik: { siswi_id: string | null; penerima_id: string | null };

  if (body.token) {
    const { data: p } = await db.from("penerima").select("id").eq("token", body.token).maybeSingle();
    if (!p) return NextResponse.json({ galat: "Link tidak dikenal" }, { status: 404 });
    pemilik = { siswi_id: null, penerima_id: p.id };
    await db.from("penerima").update({ berhenti: false }).eq("id", p.id);
  } else {
    const id = await idPenggunaLogin();
    if (!id) return NextResponse.json({ galat: "Silakan masuk dulu" }, { status: 401 });
    pemilik = { siswi_id: id, penerima_id: null };
  }

  const { error } = await db.from("push_langganan").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      ...pemilik,
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ galat: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
