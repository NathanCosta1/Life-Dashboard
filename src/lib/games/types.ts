export type FavoriteOwner = "maddy" | "nathan" | "both" | "unknown";

export type GameIssue = {
  source: "games";
  tab: string;
  rowNumber: number;
  field: string;
  message: string;
};

export type DigitalGame = {
  id: string;
  title: string;
  platforms: string[];
  platformText: string;
  players: string;
  favorite: boolean;
  favoriteOwner: FavoriteOwner | null;
  dateOrPurchase: string;
  cost: number | null;
  costText: string;
  notes: string;
  sourceRow: number;
};

export type AnalogGame = {
  id: string;
  title: string;
  section: string;
  rules: string;
  sourceRow: number;
};

export type WatchlistGame = {
  id: string;
  title: string;
  price: number | null;
  priceText: string;
  saleNotification: boolean;
  players: string;
  releaseStatus: "not-yet-released" | "available" | "unknown";
  notes: string;
  sourceRow: number;
};

export type CompletedGame = {
  id: string;
  title: string;
  dateFinished: string;
  durationMinutes: number | null;
  durationText: string;
  notes: string;
  sourceRow: number;
};

export type DislikedGame = {
  id: string;
  title: string;
  reason: string;
  sourceRow: number;
};

export type GamesLibrary = {
  digital: DigitalGame[];
  analog: AnalogGame[];
  watchlist: WatchlistGame[];
  completed: CompletedGame[];
  disliked: DislikedGame[];
  issues: GameIssue[];
};
