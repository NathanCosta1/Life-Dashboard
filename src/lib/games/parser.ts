import { gamesSource } from "./sources";
import type {
  AnalogGame,
  CompletedGame,
  DigitalGame,
  DislikedGame,
  FavoriteOwner,
  GameIssue,
  GamesLibrary,
  WatchlistGame,
} from "./types";

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizeHeader(value: string): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function isBlank(row: readonly string[]): boolean {
  return row.every((cell) => !String(cell ?? "").trim());
}

function parseOwner(notes: string): FavoriteOwner | null {
  const value = notes.trim().toLocaleUpperCase();
  if (/M\+N\s+FAVORITE\b/.test(value)) return "both";
  if (/\bN\s+FAVORITE\b/.test(value)) return "nathan";
  if (/\bM\s+FAVORITE\b/.test(value)) return "maddy";
  return null;
}

function parseOwnerColor(color: string | null | undefined): FavoriteOwner | null {
  if (!color) return null;
  const [red, green, blue] = color.split(",").map(Number);
  if (![red, green, blue].every(Number.isFinite)) return null;
  if (blue > 0.85 && green > 0.65 && red < 0.75) return "nathan";
  if (red > 0.85 && green > 0.65 && blue < 0.95) return "maddy";
  if (green > 0.75 && red > 0.65 && blue < 0.75) return "both";
  return null;
}

function parsePrice(value: string): number | null {
  const cleaned = value.trim().replace(/[$,\s]/g, "");
  if (!/^(?:\d+(?:\.\d{1,2})?)$/.test(cleaned)) return null;
  return Number(cleaned);
}

function parseDuration(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3}):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function chooseRandomGame<T>(candidates: readonly T[], randomValue = Math.random()): T | null {
  if (candidates.length === 0) return null;
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("randomValue must be in the half-open interval [0, 1)");
  }
  return candidates[Math.floor(randomValue * candidates.length)];
}

function requireHeaders(rows: readonly (readonly string[])[], names: string[]) {
  const found = rows[0]?.map(normalizeHeader) ?? [];
  return names.every((name) => found.includes(normalizeHeader(name)));
}

export function parseGamesLibrary(
  inputs: Record<"digital" | "watchlist" | "analog" | "completed" | "disliked", readonly (readonly string[])[]>,
  digitalOwnerColors?: Record<number, string | null>,
): GamesLibrary {
  const issues: GameIssue[] = [];
  const source = (tab: string, rowNumber: number, field: string, message: string): GameIssue => ({
    source: "games", tab, rowNumber, field, message,
  });

  if (!requireHeaders(inputs.digital, ["Title", "Where 2 Play?", "Players", "Favorite?"])) {
    issues.push(source(gamesSource.tabs.digital, 1, "headers", "Expected Digital game headers were not found."));
  }
  if (!requireHeaders(inputs.watchlist, ["Title", "Price", "Sale Notifications?", "Players"])) {
    issues.push(source(gamesSource.tabs.watchlist, 1, "headers", "Expected Watchlist headers were not found."));
  }
  if (!requireHeaders(inputs.completed, ["Title", "Date Finished", "Hours", "Notes"])) {
    issues.push(source(gamesSource.tabs.completed, 1, "headers", "Expected Completed game headers were not found."));
  }

  const digital: DigitalGame[] = [];
  const digitalSeen = new Set<string>();
  for (let index = 1; index < inputs.digital.length; index += 1) {
    const row = inputs.digital[index];
    if (isBlank(row)) continue;
    const title = String(row[0] ?? "").trim();
    if (!title) continue;
    const idKey = normalize(title);
    if (digitalSeen.has(idKey)) continue;
    digitalSeen.add(idKey);
    const platformText = String(row[1] ?? "").trim();
    const players = String(row[2] ?? "").trim();
    const favoriteRaw = String(row[3] ?? "").trim();
    const favorite = favoriteRaw.toLocaleUpperCase() === "Y";
    const notes = String(row[6] ?? "").trim();
    const owner = parseOwner(notes) ?? parseOwnerColor(digitalOwnerColors?.[index + 1]);
    if (favoriteRaw && !favorite && !["N", ""].includes(favoriteRaw.toLocaleUpperCase())) {
      issues.push(source(gamesSource.tabs.digital, index + 1, "Favorite?", "Favorite value is not supported."));
    }
    if (owner && !favorite) {
      issues.push(source(gamesSource.tabs.digital, index + 1, "Favorite?", "Owner marker exists without a Y favorite value."));
    }
    digital.push({
      id: `digital-${idKey.replace(/[^a-z0-9]+/g, "-")}`,
      title,
      platforms: platformText ? platformText.split("/").map((value) => value.trim()).filter(Boolean) : [],
      platformText,
      players,
      favorite,
      favoriteOwner: favorite ? owner ?? "unknown" : null,
      dateOrPurchase: String(row[4] ?? "").trim(),
      cost: parsePrice(String(row[5] ?? "").trim()),
      costText: String(row[5] ?? "").trim(),
      notes,
      sourceRow: index + 1,
    });
  }

  const watchlist: WatchlistGame[] = [];
  const watchlistSeen = new Set<string>();
  let releaseStatus: WatchlistGame["releaseStatus"] = "unknown";
  for (let index = 1; index < inputs.watchlist.length; index += 1) {
    const row = inputs.watchlist[index];
    const title = String(row[0] ?? "").trim();
    if (!title) continue;
    if (/^not yet released$/i.test(title)) {
      releaseStatus = "not-yet-released";
      continue;
    }
    if (/^companies\s*\/\s*teams$/i.test(title)) break;
    const idKey = normalize(title);
    if (watchlistSeen.has(idKey)) continue;
    watchlistSeen.add(idKey);
    watchlist.push({
      id: `watch-${idKey.replace(/[^a-z0-9]+/g, "-")}`,
      title,
      price: parsePrice(String(row[1] ?? "").trim()),
      priceText: String(row[1] ?? "").trim(),
      saleNotification: String(row[2] ?? "").trim().toLocaleUpperCase() === "Y",
      players: String(row[3] ?? "").trim(),
      releaseStatus: releaseStatus === "not-yet-released" ? releaseStatus : "available",
      notes: [row[6], row[7], row[8]].filter(Boolean).map((value) => String(value).trim()).filter(Boolean).join(" "),
      sourceRow: index + 1,
    });
  }

  const analog: AnalogGame[] = [];
  const analogSeen = new Set<string>();
  let analogSection = "Other";
  const sectionNames = /^(board games|talking games|card games)$/i;
  for (let index = 0; index < inputs.analog.length; index += 1) {
    const row = inputs.analog[index];
    if (isBlank(row)) continue;
    const first = String(row[0] ?? "").trim();
    const second = String(row[1] ?? "").trim();
    if (sectionNames.test(first)) {
      analogSection = first === "Board Games" ? "Board Games" : first === "Talking Games" ? "Talking Games" : "Card games";
      continue;
    }
    if (!first) continue;
    const partySections = ["Book-on-Head Race", "One-Leg Stand", "Darts", "Hide and Seek"];
    if (!second && partySections.some((name) => first === name)) analogSection = "Party and physical games";
    if (index > 0 && !second && !/Board Games|Talking Games|Card games/i.test(first)) {
      const knownParty = [
        "Book-on-Head Race","Spoon-and-Egg Race","One-Leg Stand","Sock Toss","Paper Airplane Distance + Accuracy",
        "Ping Pong Bounce Challenge","Obstacle Course","Balloon Between Knees Race","Stack Cups Fastest",
        "House of Cards","Cookie Face","Keep it up","Darts","Cup Pong","Hang Man","Sudoku","Hide and Seek",
        "Throw the ball at the ceiling",
      ];
      if (knownParty.some((name) => first.startsWith(name))) analogSection = "Party and physical games";
    }
    const idKey = `${normalize(analogSection)}:${normalize(first)}`;
    if (analogSeen.has(idKey)) continue;
    analogSeen.add(idKey);
    analog.push({
      id: `analog-${idKey.replace(/[^a-z0-9]+/g, "-")}`,
      title: first,
      section: analogSection,
      rules: second,
      sourceRow: index + 1,
    });
  }

  const completed: CompletedGame[] = [];
  const completedSeen = new Set<string>();
  for (let index = 1; index < inputs.completed.length; index += 1) {
    const row = inputs.completed[index];
    const title = String(row[0] ?? "").trim();
    if (!title || isBlank(row)) continue;
    const idKey = normalize(title);
    if (completedSeen.has(idKey)) continue;
    completedSeen.add(idKey);
    const durationText = String(row[2] ?? "").trim();
    completed.push({
      id: `completed-${idKey.replace(/[^a-z0-9]+/g, "-")}`,
      title,
      dateFinished: String(row[1] ?? "").trim(),
      durationMinutes: parseDuration(durationText),
      durationText,
      notes: String(row[3] ?? "").trim(),
      sourceRow: index + 1,
    });
  }

  const disliked: DislikedGame[] = [];
  const dislikedSeen = new Set<string>();
  for (let index = 1; index < inputs.disliked.length; index += 1) {
    const row = inputs.disliked[index];
    const title = String(row[0] ?? "").trim();
    if (!title || /^Games we have tried/i.test(title)) continue;
    const idKey = normalize(title);
    if (dislikedSeen.has(idKey)) continue;
    dislikedSeen.add(idKey);
    disliked.push({
      id: `disliked-${idKey.replace(/[^a-z0-9]+/g, "-")}`,
      title,
      reason: String(row[1] ?? "").trim(),
      sourceRow: index + 1,
    });
  }

  return { digital, analog, watchlist, completed, disliked, issues };
}
