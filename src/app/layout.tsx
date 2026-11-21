import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { DaftarkanSW } from "@/components/daftarkan-sw";
import { PendengarNada } from "@/components/pendengar-nada";
import "./globals.css";

// Font sesuai desain terbaru (artifact): Inter untuk judul & isi
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Pengingat TTD", template: "%s · Pengingat TTD" },
  description: "Pengingat minum Tablet Tambah Darah untuk siswi SMA, bersama orang tua dan guru.",
  applicationName: "Pengingat TTD",
  appleWebApp: { capable: true, title: "Pengingat TTD", statusBarStyle: "default" },
  icons: { icon: "/ikon/192", apple: "/ikon/180" },
};

export const viewport: Viewport = {
  themeColor: "#FBF1F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col has-[[data-lebar]]:max-w-6xl">{children}</div>
        <DaftarkanSW />
        <PendengarNada />
      </body>
    </html>
  );
}
