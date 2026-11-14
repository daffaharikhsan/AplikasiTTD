import { redirect } from "next/navigation";
import { siswiLogin, langkahBerikutnya, URL_LANGKAH } from "@/lib/siswi";

/** Mengarahkan ke langkah onboarding yang belum selesai. */
export default async function Mulai() {
  const s = await siswiLogin();
  redirect(URL_LANGKAH[langkahBerikutnya(s)]);
}
