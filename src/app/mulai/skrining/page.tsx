import type { Metadata } from "next";
import { siswiLogin } from "@/lib/siswi";
import { ambilPengaturan } from "@/lib/pengaturan";
import { FormSkrining } from "./form";

export const metadata: Metadata = { title: "Skrining anemia" };

export default async function HalamanSkrining({ searchParams }: PageProps<"/mulai/skrining">) {
  const s = await siswiLogin();
  const cfg = await ambilPengaturan();
  const ulang = Boolean(s.status) || (await searchParams).ulang === "1";
  return <FormSkrining batasHb={cfg.batasHbAnemia} ulang={ulang} />;
}
