/**
 * Manifest khusus link orang tua/guru: ikon di layar utama langsung membuka
 * halaman /o/<token> miliknya (bukan beranda siswi).
 */
export async function GET(_: Request, ctx: RouteContext<"/o/[token]/manifest.webmanifest">) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{20,64}$/.test(token)) return new Response("Not found", { status: 404 });
  const halaman = `/o/${token}`;
  const manifest = {
    id: halaman,
    name: "Pengingat TTD",
    short_name: "Pengingat TTD",
    description: "Pengingat minum Tablet Tambah Darah untuk orang tua dan guru.",
    start_url: halaman,
    scope: halaman,
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF1F2",
    theme_color: "#FBF1F2",
    lang: "id",
    icons: [
      { src: "/ikon/192", sizes: "192x192", type: "image/png" },
      { src: "/ikon/512", sizes: "512x512", type: "image/png" },
      { src: "/ikon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" },
  });
}
