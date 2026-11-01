export type Hike = {
  id: string;
  number: number;
  title: string;
  date: string | null;
  year: number | null;
  location: string | null;
  state: string | null;
  lengthMiles: number | null;
  heightFeet: number | null;
  elevationGainFeet: number | null;
  elapsedMinutes: number | null;
  elapsedText: string | null;
  ascentMinutes: number | null;
  descentMinutes: number | null;
  averageText: string | null;
  calories: number | null;
  activeCalories: number | null;
  notes: string[];
  photoUrl: string | null;
  sourceBlock: number;
};

export type HikingLibrary = {
  title: string;
  hikes: Hike[];
  totalLengthMiles: number;
  totalElevationGainFeet: number;
  years: Record<number, number>;
  states: Record<string, number>;
  issues: string[];
};

