import type {
  NamedRaceCount,
  PersonalBest,
  RaceDistance,
  RaceIssue,
  RaceLibrary,
  RaceRecord,
  RaceResultPerson,
  RaceSummary,
} from "./types";

const HEADERS = [
  "Name", "Location", "Date", "DOW", "Time Of Day", "Ran w/", "Training", "Goals",
  "Time", "Place", "Splits", "My Watch Stats", "Course Conditions", "Weather",
  "Weight", "Price", "Amenities", "Playlist", "Results Link", "Pictures Link", "MISC",
] as const;

function normalizeHeader(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function parseDate(raw: string): string | null {
  const value = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return value;
    return null;
  }
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
  if (!slash) return null;
  let year = Number(slash[3]);
  if (slash[3].length === 2) year += year >= 70 ? 1900 : 2000;
  const month = Number(slash[1]);
  const day = Number(slash[2]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDistance(name: string): { distance: RaceDistance | null; label: string | null; meters: number | null } {
  const upper = name.toUpperCase();
  if (/\bHALF\s*MARATHON\b|PRINCESS\s+HALF|\bHALF\b/.test(upper)) {
    return { distance: "half-marathon", label: "Half Marathon", meters: 21097.5 };
  }
  if (/MARATHON/.test(upper) && !/HALF/.test(upper)) {
    return { distance: "marathon", label: "Marathon", meters: 42195 };
  }
  if(/\b10\s*K\b|10K/.test(upper)) {
    return { distance: "10k", label: "10K", meters: 10000 };
  }
  if(/\b5\s*K\b|5K/.test(upper)) {
    return { distance: "5k", label: "5K", meters: 5000 };
  }
  if(/\bPARK\s+RUN\b/.test(upper)) {
    return { distance: "5k", label: "5K", meters: 5000 };
  }
  return { distance: null, label: null, meters: null };
}

function parseDuration(raw: string, distance: RaceDistance | null): number | null {
  const value = raw.trim()
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+(?:at\s+)?\d+(?:\:\d{2})?\s*(?:\/?km|\/?mi|pace)\s*$/i, "")
    .trim();
  if (!value) return null;
  const time = /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!time) return null;
  if (time[3] !== undefined) {
    const first = Number(time[1]);
    const minutes = Number(time[2]);
    const seconds = Number(time[3]);
    if (minutes > 59 || seconds > 59) return null;
    if (distance === "5k" && first >= 20 && first <= 200 && minutes <= 59) {
      return first * 60 + minutes;
    }
    return first * 3600 + minutes * 60 + seconds;
  }
  const minutes = Number(time[1]);
  const seconds = Number(time[2]);
  if (minutes > 24 * 60 || seconds > 59) return null;
  return minutes * 60 + seconds;
}

function parseNamedResults(rawTime: string, rawPlace: string, distance: RaceDistance | null) {
  const people: RaceResultPerson[] = [];
  if (!rawTime.includes("\n") && !rawPlace.includes("\n")) return people;
  const timeLines = rawTime.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const placeLines = rawPlace.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < timeLines.length; index += 1) {
    const colon = timeLines[index].match(/^([^:]+):\s*(.+)$/);
    if (!colon) continue;
    const name = colon[1].trim();
    const label = colon[2].trim();
    const seconds = parseDuration(label, distance);
    const placeLine = placeLines.find((line) => line.toLowerCase().startsWith(name.toLowerCase()));
    people.push({
      name,
      resultTimeSeconds: seconds,
      resultTimeLabel: label,
      placeLabel: placeLine?.replace(/^[^:]*:\s*/, "").trim() || null,
      sourceOrder: index + 1,
    });
  }
  return people;
}

function validUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function parseWeight(raw: string): number | null {
  const match = /^([\d]+(?:\.[\d]+)?)\s*(?:lb|lbs|pounds?)?$/i.exec(raw.trim());
  return match ? Number(match[1]) : null;
}

function parsePrimaryTime(raw: string, distance: RaceDistance | null, issues: RaceIssue[], rowNumber: number) {
  const clean = raw.trim();
  if (!clean) return null;
  if (clean.includes("\n")) return null;
  const seconds = parseDuration(clean, distance);
  if (seconds === null) {
    issues.push({ source: "races", tab: "Races", rowNumber, field: "Time", message: `Time "${clean}" could not be parsed.` });
  }
  return seconds;
}

function getPrimaryResultSeconds(race: RaceRecord): number | null {
  if (race.primaryTimeSeconds !== null) return race.primaryTimeSeconds;
  const ownerResult = race.people.find((person) =>
    person.name.trim().toLowerCase() === "me" || person.name.trim().toLowerCase() === "nathan"
  );
  if (ownerResult?.resultTimeSeconds !== null && ownerResult?.resultTimeSeconds !== undefined) {
    return ownerResult.resultTimeSeconds;
  }
  return race.people[0]?.resultTimeSeconds ?? null;
}

export function parseRaceLibrary(rows: readonly (readonly string[])[], now = new Date()): RaceLibrary {
  const issues: RaceIssue[] = [];
  const header = rows[0] ?? [];
  for (const name of HEADERS) {
    if (!header.some((value) => normalizeHeader(String(value)) === normalizeHeader(name))) {
      issues.push({ source: "races", tab: "Races", rowNumber: 1, field: name, message: `Missing expected header "${name}".` });
    }
  }
  const column = (name: string) => header.findIndex((value) => normalizeHeader(String(value)) === normalizeHeader(name));
  const races: RaceRecord[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (row.every((cell) => !String(cell ?? "").trim())) continue;
    const rowNumber = index + 1;
    const name = String(row[column("Name")] ?? "").trim();
    if (!name) {
      issues.push({ source: "races", tab: "Races", rowNumber, field: "Name", message: "Race row has no name and was skipped." });
      continue;
    }
    const rawDate = String(row[column("Date")] ?? "").trim();
    const date = rawDate ? parseDate(rawDate) : null;
    if (rawDate && !date) issues.push({ source: "races", tab: "Races", rowNumber, field: "Date", message: `Date "${rawDate}" could not be parsed.` });
    const distance = getDistance(name);
    const rawTime = String(row[column("Time")] ?? "").trim();
    const rawPlace = String(row[column("Place")] ?? "").trim();
    const primaryTimeSeconds = parsePrimaryTime(rawTime, distance.distance, issues, rowNumber);
    const people = parseNamedResults(rawTime, rawPlace, distance.distance);
    const companionText = String(row[column("Ran w/")] ?? "").trim() || null;
    const companions = companionText ? companionText.split(/(?:,\s+|\n)/).map((value) => value.trim()).filter(Boolean) : [];
    const rawWeight = String(row[column("Weight")] ?? "").trim();
    const weight = rawWeight ? parseWeight(rawWeight) : null;
    if (rawWeight && weight === null) issues.push({ source: "races", tab: "Races", rowNumber, field: "Weight", message: `Weight "${rawWeight}" could not be normalized safely.` });
    const rawSplits = String(row[column("Splits")] ?? "").trim();
    const splits = rawSplits ? rawSplits.split(/\r?\n|,(?:\s*)/).map((value) => value.trim()).filter(Boolean) : [];
    const notes = String(row[column("MISC")] ?? "").replace(/\r\n/g, "\n").trim() || null;
    const status: RaceRecord["status"] = date && new Date(`${date}T23:59:59`) > now && primaryTimeSeconds === null
      ? "upcoming"
      : primaryTimeSeconds !== null || people.length > 0 || rawPlace.trim()
        ? "completed"
        : "unknown";
    races.push({
      id: `${rowNumber}-${name}`,
      name,
      location: String(row[column("Location")] ?? "").trim() || null,
      date,
      dateLabel: rawDate || null,
      dayOfWeek: String(row[column("DOW")] ?? "").trim() || null,
      timeOfDay: String(row[column("Time Of Day")] ?? "").trim() || null,
      companions,
      companionText,
      training: String(row[column("Training")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      goals: String(row[column("Goals")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      primaryTimeSeconds,
      primaryTimeLabel: rawTime || null,
      placeLabel: rawPlace || null,
      distanceLabel: distance.label,
      distanceMeters: distance.meters,
      distance: distance.distance,
      splits,
      splitLabels: splits,
      watchStats: String(row[column("My Watch Stats")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      courseConditions: String(row[column("Course Conditions")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      weather: String(row[column("Weather")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      weight,
      weightRaw: rawWeight || null,
      price: String(row[column("Price")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      amenities: String(row[column("Amenities")] ?? "").replace(/\r\n/g, "\n").trim() || null,
      playlist: String(row[column("Playlist")] ?? "").trim() || null,
      resultsUrl: validUrl(String(row[column("Results Link")] ?? "")),
      picturesUrl: validUrl(String(row[column("Pictures Link")] ?? "")),
      notes,
      people,
      status,
      sourceRowNumber: rowNumber,
    });
  }

  races.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.sourceRowNumber - b.sourceRowNumber);
  const completed = races.filter((race) => race.status === "completed");
  const dated = races.filter((race) => race.date !== null);
  const personalBests: PersonalBest[] = [];
  for (const distance of ["5k", "10k", "half-marathon"] as const) {
    const candidates = completed.filter((race) => race.distance === distance && getPrimaryResultSeconds(race) !== null);
    const best = candidates.reduce<RaceRecord | null>((current, race) => {
      const currentSeconds = current ? getPrimaryResultSeconds(current) : null;
      const raceSeconds = getPrimaryResultSeconds(race);
      return !current || (currentSeconds !== null && raceSeconds !== null && raceSeconds < currentSeconds) ? race : current;
    }, null);
    if (best) personalBests.push({ distance, label: distance === "5k" ? "5K" : distance === "10k" ? "10K" : "Half Marathon", race: best });
  }

  const yearMap = new Map<number, number>();
  for (const race of dated) {
    const year = Number((race.date as string).slice(0, 4));
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
  }
  const distanceLabels = new Map<RaceDistance | "unknown", string>([
    ["5k", "5K"], ["10k", "10K"], ["half-marathon", "Half Marathon"], ["marathon", "Marathon"], ["other", "Other"], ["unknown", "Unknown"],
  ]);
  const distanceMap = new Map<RaceDistance | "unknown", number>();
  for (const race of races) {
    const key = race.distance ?? "unknown";
    distanceMap.set(key, (distanceMap.get(key) ?? 0) + 1);
  }
  const racesByDistance: NamedRaceCount[] = [...distanceMap.entries()]
    .map(([name, count]) => ({ name, label: distanceLabels.get(name) ?? "Unknown", count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const summary: RaceSummary = {
    raceCount: races.length,
    completedCount: completed.length,
    upcomingCount: races.filter((race) => race.status === "upcoming").length,
    unknownCount: races.filter((race) => race.status === "unknown").length,
    validTimeCount: races.filter((race) => getPrimaryResultSeconds(race) !== null).length,
    firstRace: dated[0] ?? null,
    latestRace: dated.at(-1) ?? null,
    personalBests,
    racesByYear: [...yearMap.entries()].sort(([a], [b]) => a - b).map(([year, count]) => ({ year, count })),
    racesByDistance,
    notesCount: races.filter((race) => race.notes !== null).length,
    watchStatsCount: races.filter((race) => race.watchStats !== null).length,
    multiPersonRaceCount: races.filter((race) => race.people.length > 1 || race.companions.length > 1).length,
    podiumCount: completed.filter((race) => /^1(?:st)?\b|^1\s*\/|^1\b.*?\//i.test((race.placeLabel ?? "").trim())).length,
  };
  return { title: "Races", races, summary, issues };
}
