import { redirect } from "next/navigation";
import { siswiSiap, halamanKalender } from "@/lib/siswi";

export default async function Kalender({ searchParams }: PageProps<"/kalender">) {
  const s = await siswiSiap();
  const q = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const qs = q.toString();
  redirect(halamanKalender(s.status) + (qs ? `?${qs}` : ""));
}
