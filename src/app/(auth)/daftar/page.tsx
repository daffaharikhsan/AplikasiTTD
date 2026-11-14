import type { Metadata } from "next";
import { FormDaftar } from "./form";

export const metadata: Metadata = { title: "Daftar" };

export default function HalamanDaftar() {
  return <FormDaftar />;
}
