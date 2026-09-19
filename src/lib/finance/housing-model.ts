import type { HousingData } from "./housing-data";

export type HousingDashboardModel = HousingData["workbook"] & {
  moveInTotal: number;
  itemsTotal: number;
  monthlyAverage: number | null;
  latestMonth: HousingData["workbook"]["monthly"][number] | null;
};

export function buildHousingDashboardModel(data: HousingData): HousingDashboardModel {
  const { moveIn, items, monthly } = data.workbook;
  const amounts = (rows: typeof moveIn) => rows.reduce((sum, row) => sum + (Number(row.value.replace(/[$,]/g, "")) || 0), 0);
  const recordedMonthly = monthly.filter((row) => row.total !== null);
  return {
    moveIn,
    items,
    monthly,
    moveInTotal: amounts(moveIn),
    itemsTotal: amounts(items),
    monthlyAverage: recordedMonthly.length ? recordedMonthly.reduce((sum, row) => sum + row.total!, 0) / recordedMonthly.length : null,
    latestMonth: recordedMonthly.at(-1) ?? null,
  };
}
