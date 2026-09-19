import type { VacationTrip } from "./types";
import type { VacationData } from "./vacations-data";

export type VacationDashboardModel = {
  trips: VacationTrip[];
  years: number[];
  annualTotals: Array<{ year: number; total: number; tripCount: number }>;
  totals: { tripCount: number; totalCost: number | null; averageDuration: number | null; longest: VacationTrip | null; averageCost: number | null; averageCostPerDay: number | null; mostExpensive: VacationTrip | null };
};

export function buildVacationDashboardModel(data: VacationData): VacationDashboardModel {
  const trips = [...data.trips].sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  const dated = trips.filter((trip) => trip.durationDays !== null);
  const priced = trips.filter((trip) => trip.total !== null);
  const costPerDay = trips.filter((trip) => trip.total !== null && trip.durationDays);
  const annualTotals = [...new Set(trips.flatMap((trip) => trip.year === null ? [] : [trip.year]))]
    .sort((a, b) => a - b)
    .map((year) => {
      const yearTrips = trips.filter((trip) => trip.year === year);
      return { year, total: yearTrips.reduce((sum, trip) => sum + (trip.total ?? 0), 0), tripCount: yearTrips.length };
    });
  return {
    trips,
    years: [...new Set(trips.flatMap((trip) => trip.year === null ? [] : [trip.year]))].sort((a, b) => a - b),
    annualTotals,
    totals: {
      tripCount: trips.length,
      totalCost: priced.length ? priced.reduce((sum, trip) => sum + trip.total!, 0) : null,
      averageDuration: dated.length ? dated.reduce((sum, trip) => sum + trip.durationDays!, 0) / dated.length : null,
      longest: dated.reduce<VacationTrip | null>((longest, trip) => !longest || trip.durationDays! > longest.durationDays! ? trip : longest, null),
      averageCost: priced.length ? priced.reduce((sum, trip) => sum + trip.total!, 0) / priced.length : null,
      averageCostPerDay: costPerDay.length ? costPerDay.reduce((sum, trip) => sum + trip.total! / trip.durationDays!, 0) / costPerDay.length : null,
      mostExpensive: priced.reduce<VacationTrip | null>((most, trip) => !most || trip.total! > most.total! ? trip : most, null),
    },
  };
}
