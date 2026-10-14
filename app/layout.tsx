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
  title: "ElevenForge — 36 kulüp. 2 lig. 1 efsane.",
  description:
    "Arkadaşlarınla kurduğun sosyal futbol menajerlik ligi. Her gün ligin seçtiği saatte maçlar, canlı anlatım, transfer pazarı ve taktik tahtası.",
  applicationName: "ElevenForge",
  metadataBase: new URL("https://elevenforge.com"),
  openGraph: {
    title: "ElevenForge — 36 kulüp. 2 lig. 1 efsane.",
    description:
      "Arkadaşlarınla kurduğun sosyal futbol menajerlik ligi. Süper Lig 2026-27 kadroları, her gün maç, canlı Türkçe anlatım.",
    type: "website",
    locale: "tr_TR",
    siteName: "ElevenForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElevenForge — 36 kulüp. 2 lig. 1 efsane.",
    description:
      "Sosyal futbol menajerlik ligi. Davet koduyla kur; her gün maç, canlı anlatım, transfer pazarı.",
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
      /*
        Next asks for this explicitly when the document sets
        `scroll-behavior: smooth`. Without it Next disables smooth scrolling
        during route transitions defensively, because a smooth scroll racing a
        navigation lands the reader partway up the previous page. Declaring it
        keeps the smooth scroll for in-page anchors and tells Next we meant it.
      */
      data-scroll-behavior="smooth"
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
