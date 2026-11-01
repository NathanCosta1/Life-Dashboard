export type RaceDistance =
  | "5k"
  | "10k"
  | "half-marathon"
  | "marathon"
  | "other";

export type RaceStatus = "completed" | "upcoming" | "unknown";

export type RaceIssue = {
  source: "races";
  tab: "Races";
  rowNumber: number;
  field: string;
  message: string;
};

export type RaceResultPerson = {
  name: string;
  resultTimeSeconds: number | null;
  resultTimeLabel: string | null;
  placeLabel: string | null;
  sourceOrder: number;
};

export type RaceRecord = {
  id: string;
  name: string;
  location: string | null;
  date: string | null;
  dateLabel: string | null;
  dayOfWeek: string | null;
  timeOfDay: string | null;
  companions: string[];
  companionText: string | null;
  training: string | null;
  goals: string | null;
  primaryTimeSeconds: number | null;
  primaryTimeLabel: string | null;
  placeLabel: string | null;
  distanceLabel: string | null;
  distanceMeters: number | null;
  distance: RaceDistance | null;
  splits: string[];
  splitLabels: string[];
  watchStats: string | null;
  courseConditions: string | null;
  weather: string | null;
  weight: number | null;
  weightRaw: string | null;
  price: string | null;
  amenities: string | null;
  playlist: string | null;
  resultsUrl: string | null;
  picturesUrl: string | null;
  notes: string | null;
  people: RaceResultPerson[];
  status: RaceStatus;
  sourceRowNumber: number;
};

export type NamedRaceCount = {
  name: RaceDistance | "unknown";
  label: string;
  count: number;
};

export type RaceYearCount = {
  year: number;
  count: number;
};

export type PersonalBest = {
  distance: "5k" | "10k" | "half-marathon";
  label: string;
  race: RaceRecord;
};

export type RaceSummary = {
  raceCount: number;
  completedCount: number;
  upcomingCount: number;
  unknownCount: number;
  validTimeCount: number;
  firstRace: RaceRecord | null;
  latestRace: RaceRecord | null;
  personalBests: PersonalBest[];
  racesByYear: RaceYearCount[];
  racesByDistance: NamedRaceCount[];
  notesCount: number;
  watchStatsCount: number;
  multiPersonRaceCount: number;
  podiumCount: number;
};

export type RaceLibrary = {
  title: string;
  races: RaceRecord[];
  summary: RaceSummary;
  issues: RaceIssue[];
};
