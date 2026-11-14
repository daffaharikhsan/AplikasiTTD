import type { Metadata, Viewport } from "next";
import { Outfit, Nunito_Sans } from "next/font/google";
import { DaftarkanSW } from "@/components/daftarkan-sw";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700"] });

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
    <html lang="id" className={`${outfit.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col has-[[data-lebar]]:max-w-6xl">{children}</div>
        <DaftarkanSW />
      </body>
    </html>
  );
}
