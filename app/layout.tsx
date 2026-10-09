import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono, Big_Shoulders, Instrument_Serif } from "next/font/google";
import { MotionLayer } from "@/components/motion/motion-layer";
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

/*
 * Display face: stadium signage. A condensed grotesque with an optical-size
 * axis, used only for the big moments — the wordmark, scorelines, section
 * titles. Everything you read in a sentence stays Manrope.
 */
const bigShoulders = Big_Shoulders({
  variable: "--font-stadium",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
});

/* An editorial italic for the one word in a headline that carries emotion. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-editorial",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
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
      className={`${manrope.variable} ${jetbrainsMono.variable} ${bigShoulders.variable} ${instrumentSerif.variable}`}
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
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('ef.tweaks')||'{}');if(t.theme==='light'||t.theme==='dark')document.documentElement.setAttribute('data-theme',t.theme);if(t.accent)document.documentElement.setAttribute('data-accent',t.accent);}catch(e){}try{if(sessionStorage.getItem('ef.intro')==='1')document.documentElement.setAttribute('data-intro-seen','');}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <MotionLayer />
      </body>
    </html>
  );
}
