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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      data-accent="indigo"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/*
          Apply the saved theme BEFORE first paint.

          The server always renders data-theme="dark" (it cannot know the
          preference), and the tweaks panel only corrects it after React
          mounts — so a light-mode user got a full dark flash on every single
          navigation. This is the standard no-flash shim: a tiny blocking
          script that reads the same `ef.tweaks` key the panel writes and
          stamps both attributes before the browser paints anything.

          It must stay inline and synchronous. Deferring it, or moving it into
          a component, puts it after the first paint and reintroduces exactly
          the flash it exists to prevent.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('ef.tweaks')||'{}');if(t.theme==='light'||t.theme==='dark')document.documentElement.setAttribute('data-theme',t.theme);if(t.accent)document.documentElement.setAttribute('data-accent',t.accent);}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
