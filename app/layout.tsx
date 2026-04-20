import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ElevenForge — 16 arkadaş. 1 lig. 1 efsane.",
  description:
    "Arkadaşlarınla kurduğun sosyal futbol menajerlik ligi. Her gece 21:00'de maçlar, canlı anlatım, transfer pazarı, taktik board.",
  applicationName: "ElevenForge",
  metadataBase: new URL("https://elevenforge.com"),
  openGraph: {
    title: "ElevenForge — 16 arkadaş. 1 lig. 1 efsane.",
    description:
      "Arkadaşlarınla kurduğun sosyal futbol menajerlik ligi. Süper Lig 2025-26 kadroları, her gece maç, canlı Türkçe anlatım.",
    type: "website",
    locale: "tr_TR",
    siteName: "ElevenForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElevenForge — 16 arkadaş. 1 lig. 1 efsane.",
    description:
      "Sosyal futbol menajerlik ligi. Davet kodu ile kur, her gece 21:00 maç, canlı anlatım, transfer pazarı.",
  },
};

export const viewport: Viewport = {
  themeColor: "#04070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
