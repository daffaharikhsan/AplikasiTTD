import { ImageResponse } from "next/og";

const UKURAN = new Set([96, 180, 192, 512]);

/** Ikon aplikasi (tetes darah berry di atas lingkaran petal) dibuat langsung tanpa file gambar. */
export async function GET(req: Request, ctx: RouteContext<"/ikon/[ukuran]">) {
  const { ukuran } = await ctx.params;
  const n = Number(ukuran);
  if (!UKURAN.has(n)) return new Response("Not found", { status: 404 });
  const maskable = new URL(req.url).searchParams.has("maskable");
  const tetes = Math.round(n * (maskable ? 0.42 : 0.5));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: maskable ? "#F7D6DE" : "#FBF1F2",
        }}
      >
        <div
          style={{
            width: maskable ? n : n * 0.86,
            height: maskable ? n : n * 0.86,
            borderRadius: maskable ? 0 : n,
            background: "#F7D6DE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={tetes} height={tetes} viewBox="0 0 24 24" fill="#A3456A">
            <path d="M12 2.5c3.6 4.6 6 7.9 6 11.2a6 6 0 0 1-12 0c0-3.3 2.4-6.6 6-11.2z" />
          </svg>
        </div>
      </div>
    ),
    { width: n, height: n, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
