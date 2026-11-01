import type { Hike, HikingLibrary } from "./types";

export type HikeBlock = { style: string | null; text: string };

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function parseNumber(value: string): number | null {
  const match = value.replace(/,/g, "").match(/-?[\d]+(?:\.[\d]+)?/);
  return match ? Number(match[0]) : null;
}

function parseLength(value: string): number | null {
  if (!/\b(?:mi(?:les?)?|m)\b/i.test(value)) return null;
  return parseNumber(value);
}

function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3}):([0-5]\d)(?:\s*$|\s*\()/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function parseHikeDate(value: string): { date: string; year: number | null } {
  const date = value.trim();
  const parts = date.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!parts) return { date, year: null };
  let year = Number(parts[3]);
  if (year < 100) year += 2000;
  return { date, year };
}

export function extractState(location: string | null): string | null {
  if (!location) return null;
  const known: Record<string, string> = {
    ME: "Maine", NH: "New Hampshire", WV: "West Virginia", NY: "New York",
    MA: "Massachusetts", CT: "Connecticut", RI: "Rhode Island", VT: "Vermont",
  };
  const last = location.split(",").pop()?.trim() ?? "";
  const candidate = last.match(/^([A-Z]{2})(?:\b|$)/)?.[1] ?? last.match(/New Hampshire/i)?.[0];
  if (candidate && known[candidate.toUpperCase()]) return known[candidate.toUpperCase()];
  const commaState = location.match(/,\s*([^,]+)$/)?.[1]?.trim();
  return commaState && commaState.length <= 30 ? commaState : null;
}

function titleFromMatch(raw: string, match: RegExpMatchArray): string {
  return (match[2] || raw.replace(/^(\d+)\)?/, "").trim()).replace(/\s+/g, " ").trim();
}

export function chooseRandomHike<T>(candidates: readonly T[], randomValue = Math.random()): T | null {
  if (!candidates.length) return null;
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("randomValue must be in the half-open interval [0, 1)");
  }
  return candidates[Math.floor(randomValue * candidates.length)];
}

export function filterAndSortHikes(
  hikes: readonly Hike[],
  options: { search?: string; year?: string; state?: string; withPhoto?: boolean; withNotes?: boolean; sort?: string },
): Hike[] {
  const search = normalize(options.search ?? "");
  const filtered = hikes.filter((hike) => {
    if (options.year && options.year !== "All" && String(hike.year ?? "") !== options.year) return false;
    if (options.state && options.state !== "All" && hike.state !== options.state) return false;
    if (options.withPhoto && !hike.photoUrl) return false;
    if (options.withNotes && !hike.notes.length) return false;
    if (!search) return true;
    return normalize([hike.title, hike.location ?? "", hike.state ?? "", hike.date ?? "", ...hike.notes].join(" ")).includes(search);
  });

  return [...filtered].sort((a, b) => {
    switch (options.sort) {
      case "oldest": return (a.year ?? 9999) - (b.year ?? 9999) || a.number - b.number;
      case "longest": return (b.lengthMiles ?? -1) - (a.lengthMiles ?? -1);
      case "elevation": return (b.elevationGainFeet ?? -1) - (a.elevationGainFeet ?? -1);
      case "time": return (b.elapsedMinutes ?? -1) - (a.elapsedMinutes ?? -1);
      default: return b.number - a.number;
    }
  });
}

export function parseHikingDocument(title: string | null, blocks: readonly HikeBlock[]): HikingLibrary {
  const issues: string[] = [];
  const hikes: Hike[] = [];
  const seenNumbers = new Set<number>();
  let current: {
    number: number; title: string; sourceBlock: number; date: string | null; year: number | null;
    location: string | null; lengthMiles: number | null; heightFeet: number | null;
    elevationGainFeet: number | null; elapsedMinutes: number | null; elapsedText: string | null;
    ascentMinutes: number | null; descentMinutes: number | null; averageText: string | null;
    calories: number | null; activeCalories: number | null; notes: string[]; photoUrl: string | null;
  } | null = null;

  const finish = () => {
    if (!current || seenNumbers.has(current.number)) return;
    seenNumbers.add(current.number);
    const state = extractState(current.location);
    hikes.push({
      id: `hike-${current.number}`,
      ...current,
      state,
    });
  };

  for (let index = 0; index < blocks.length; index += 1) {
    const raw = String(blocks[index].text ?? "").replace(/\r/g, "").trim();
    if (!raw) continue;
    const start = raw.match(/^(\d+)\)\s*(.*)$/);
    if (start) {
      finish();
      const number = Number(start[1]);
      current = {
        number,
        title: titleFromMatch(raw, start),
        sourceBlock: index + 1,
        date: null,
        year: null,
        location: null,
        lengthMiles: null,
        heightFeet: null,
        elevationGainFeet: null,
        elapsedMinutes: null,
        elapsedText: null,
        ascentMinutes: null,
        descentMinutes: null,
        averageText: null,
        calories: null,
        activeCalories: null,
        notes: [],
        photoUrl: null,
      };
      continue;
    }
    if (!current) continue;

    const photo = raw.match(/https?:\/\/photos\.app\.goo\.gl\/[^\s]+/i)?.[0];
    if (photo) {
      current.photoUrl = photo;
      continue;
    }

    const field = raw.match(/^([^:]+):\s*(.*)$/);
    if (field) {
      const label = field[1].trim().toLocaleLowerCase();
      const value = field[2].trim();
      if (label === "date" || label === "dates") {
        const parsed = parseHikeDate(value);
        current.date = parsed.date;
        current.year = parsed.year;
      } else if (label === "where") {
        current.location = value;
      } else if (label === "length") {
        current.lengthMiles = parseLength(value);
      } else if (label === "height") {
        current.heightFeet = parseNumber(value);
      } else if (label === "elevation gain" || label === "elevationgain") {
        current.elevationGainFeet = parseNumber(value);
      } else if (label === "time") {
        current.elapsedText = value;
        current.elapsedMinutes = parseTime(value);
        const ascent = value.match(/([0-5]?\d(?::[0-5]\d)?|\d+\s*(?:hr|hours?|mins?))\s*(?:min(?:ute)?s?)?\s*up/i);
        const descent = value.match(/([0-5]?\d(?::[0-5]\d)?|\d+\s*(?:hr|hours?|mins?))\s*(?:min(?:ute)?s?)?\s*down/i);
        if (ascent) current.ascentMinutes = parseTime(`${ascent[1].includes(":") ? ascent[1] : "0:" + ascent[1]}`);
        if (descent) current.descentMinutes = parseTime(`${descent[1].includes(":") ? descent[1] : "0:" + descent[1]}`);
      } else if (label === "average") {
        current.averageText = value;
      } else if (label === "calories") {
        current.calories = parseNumber(value);
        const active = value.match(/\(([\d,]+)\s*active\)/i);
        if (active) current.activeCalories = parseNumber(active[1]);
      } else {
        current.notes.push(raw);
      }
      continue;
    }
    current.notes.push(raw);
  }
  finish();

  if (!hikes.length) issues.push("No numbered hike entries were found.");

  const totalLengthMiles = hikes.reduce((total, hike) => total + (hike.lengthMiles ?? 0), 0);
  const totalElevationGainFeet = hikes.reduce((total, hike) => total + (hike.elevationGainFeet ?? 0), 0);
  const years: Record<number, number> = {};
  const states: Record<string, number> = {};
  for (const hike of hikes) {
    if (hike.year) years[hike.year] = (years[hike.year] ?? 0) + 1;
    if (hike.state) states[hike.state] = (states[hike.state] ?? 0) + 1;
  }
  return {
    title: title?.trim() || "Hike journal",
    hikes,
    totalLengthMiles: Math.round(totalLengthMiles * 10) / 10,
    totalElevationGainFeet,
    years,
    states,
    issues,
  };
}
