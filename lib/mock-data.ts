/**
 * Landing + seed demo data — now thin shim over lib/squad-packs.ts.
 *
 * CLUBS + SQUAD come from the 16 real Süper Lig packs so the landing
 * page, seed script, and create-league action all agree on the same
 * 2025-26 season roster. Direct consumers (lib/utils, primitives,
 * lobby-client, landing-ui) import these names; nothing else.
 */
import type { Club, Commentary, GlobalTransfer, Player } from "@/types";
import { SQUAD_PACKS, USER_PACK } from "./squad-packs";

/**
 * 16 real Süper Lig 2025-26 clubs. IDs map 1:1 to SQUAD_PACKS entries;
 * CLUBS[0] is always Fenerbahçe (the demo user's starter club).
 */
export const CLUBS: Club[] = SQUAD_PACKS.map((p) => ({
  id: p.club.id,
  name: p.club.name,
  short: p.club.short,
  city: p.club.city,
  color: p.club.color,
  color2: p.club.color2,
}));

export const clubById = (id: string): Club | undefined =>
  CLUBS.find((c) => c.id === id);

/**
 * Fenerbahçe 2025-26 squad — pack 0. seed.ts hands this to the Ahmet
 * demo user, and create-league.ts hands it to every new user's first
 * club (they rename the club but keep the recognisable roster).
 * Dual-exported both as the hand-crafted mock `Player[]` that legacy
 * call-sites expect, and inside SQUAD_PACKS for pack-aware flows.
 */
export const SQUAD: Player[] = USER_PACK.players;

// ─── Landing page marquee + commentary ────────────────────────
// Only these two arrays still live outside the pack file — the marketing
// page (landing-ui.tsx) renders narrative copy that name-drops real
// rivals + real signings, so a handwritten version reads better than
// anything derived from the pack data.

export const COMMENTARY: Commentary[] = [
  { m: 74, icon: "⚽", type: "goal",     text: "TALISCA! Ceza yayının sağından, dış kötü ayakla kaleciyi çaresiz bırakacak bir vuruş. Fenerbahçe 2-1 öne geçti. Derbilerde ilk golü atan takım bu sezon %71 kazanıyor." },
  { m: 72, icon: "🎯", type: "shot",     text: "Kerem Aktürkoğlu sol kanattan içeri döndü, vuruşu direğin dibinden auta gitti. Kadıköy inledi." },
  { m: 68, icon: "🟨", type: "card",     text: "Galatasaray forveti sert girdi — sarı kart. Kanté kaşları çatık halde soğukkanlılık çağrısı yapıyor." },
  { m: 64, icon: "🔄", type: "sub",      text: "Cherif Ndiaye yerine Dorgeles Nene — taze bacaklar, kanat baskısı." },
  { m: 58, icon: "📣", type: "analysis", text: "Son 6 dakikada Galatasaray topa daha çok sahip — ev sahibi geri çekildi, tehlike sinyalleri." },
  { m: 52, icon: "⚽", type: "goal",     text: "OSIMHEN EŞİTLEDİ! Orta sahadan gelen topu klasik bir vuruşla filelerle buluşturdu. 1-1!" },
  { m: 45, icon: "⏱", type: "half",     text: "İlk yarı sonu. Fenerbahçe 1, Galatasaray 0. Asensio'nun direkten dönen vuruşu hâlâ aklımda." },
  { m: 38, icon: "⚽", type: "goal",     text: "SZYMAŃSKI! 10 numaranın sol çaprazdan vuruşu köşeye, kalecinin uzandığı yerden bir santim içeri. Fenerbahçe öne geçti!" },
  { m: 24, icon: "🎯", type: "shot",     text: "Asensio'nun frikiği direkten döndü. Milim farkla gol değil." },
  { m: 12, icon: "⚽", type: "start",    text: "Düdük çaldı. Derbi Kadıköy'de başladı. 48.000 kişi ayakta." },
];

export const GLOBAL_TRANSFERS: GlobalTransfer[] = [
  { buyer: "Ahmet D.",  buyerClub: "gs",  player: "M. Guendouzi",     price: 32000000, seller: "bot" },
  { buyer: "Elif Ö.",   buyerClub: "bjk", player: "A. Talisca",       price: 30000000, seller: "bot" },
  { buyer: "Kaan T.",   buyerClub: "ts",  player: "C. Ndiaye",        price:  9500000, seller: "user", sellerName: "Mehmet S." },
  { buyer: "Deniz A.",  buyerClub: "kay", player: "M. Asensio",       price: 24000000, seller: "bot" },
  { buyer: "Zeynep K.", buyerClub: "sam", player: "N. Kanté",         price: 18000000, seller: "bot" },
  { buyer: "Ceren P.",  buyerClub: "gfk", player: "A. Brown",         price: 16000000, seller: "bot" },
];
