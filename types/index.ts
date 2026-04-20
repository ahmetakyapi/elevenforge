export type Position = "GK" | "DEF" | "MID" | "FWD";

export type Club = {
  id: string;
  name: string;
  short: string;
  city: string;
  color: string;
  color2: string;
};

export type CrewMember = {
  id: string;
  name: string;
  clubId: string;
  isUser: boolean;
  online?: boolean;
  bot?: boolean;
};

export type PlayerStatus = "injured" | "suspended" | "training" | "listed";

export type Player = {
  n: string;
  pos: Position;
  role: string;
  secondaryRoles?: string[];
  num?: number;
  age: number;
  ovr: number;
  pot: number;
  nat: string;
  fit?: number;
  mor?: number;
  wage?: number;
  val?: number;
  form?: number[];
  ctr?: number;
  status?: PlayerStatus;
  id?: string;
  // Position-aware attributes (0-99). Optional because landing-page
  // mock Players don't carry them; the squad query hydrates these from
  // the DB so the premium card can show a role-appropriate stat strip.
  pace?: number;
  shooting?: number;
  passing?: number;
  defending?: number;
  physical?: number;
  goalkeeping?: number;
};

export type TransferListing = {
  n: string;
  pos: Position;
  role: string;
  age: number;
  ovr: number;
  pot: number;
  nat: string;
  price: number;
  hoursOn: number;
  decay: string;
  seller: "bot" | "user";
  sellerName?: string;
  clubId: string;
};

export type GlobalTransfer = {
  buyer: string;
  buyerClub: string;
  player: string;
  price: number;
  seller?: "bot" | "user";
  sellerName?: string;
};

export type CommentaryType =
  | "goal"
  | "shot"
  | "analysis"
  | "card"
  | "sub"
  | "half"
  | "start";

export type Commentary = {
  m: number;
  icon: string;
  type: CommentaryType;
  text: string;
};

export type Formation =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "3-5-2"
  | "5-3-2"
  | "4-1-4-1";

export type FixtureRow = {
  date: string;
  home: string;
  away: string;
  derby: boolean;
  venue: string;
};

export type LeagueRow = {
  clubId: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
  form: Array<"W" | "D" | "L">;
};

export type ChatMessage = {
  from: string;
  text: string;
  t: string;
};

export type GlobalFeedEvent = {
  t: string;
  type: "transfer" | "match" | "scout" | "paper" | "morale";
  text: string;
  clubId: string;
};

export type LiveMatchState = {
  home: string;
  away: string;
  scoreH: number;
  scoreA: number;
  minute: number;
  possessionH: number;
  possessionA: number;
  shotsH: number;
  shotsA: number;
  shotsOnH: number;
  shotsOnA: number;
  cornersH: number;
  cornersA: number;
  cardsH: number;
  cardsA: number;
  crowdEnergy: number;
};

export type TOTWPlayer = {
  n: string;
  pos: string;
  clubId: string;
  rating: number;
};

export type ScorerRow = {
  n: string;
  clubId: string;
  g: number;
};

export type AssistRow = {
  n: string;
  clubId: string;
  a: number;
};
