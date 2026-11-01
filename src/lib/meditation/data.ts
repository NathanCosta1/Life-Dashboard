import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { buildMeditationYearData } from "./model";
import { parseMeditationMatrix } from "./parser";
import {
  getMeditationRange,
  getMeditationSourceTag,
  getMeditationSpreadsheetId,
} from "./sources";
import type { MeditationData } from "./types";

export async function loadMeditationData(): Promise<MeditationData> {
  const spreadsheetId = getMeditationSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const yearTabs = tabs
    .filter((tab) => /^\d{4}$/.test(tab.title))
    .sort((left, right) => Number(right.title) - Number(left.title));

  const years = [];
  for (const tab of yearTabs) {
    const year = Number(tab.title);
    const matrix = await readSheetMatrix({
      spreadsheetId,
      range: getMeditationRange(tab.title, tab.rowCount),
      revalidate: 15 * 60,
      tags: [getMeditationSourceTag(), `meditation:${year}`],
    });
    const parsed = parseMeditationMatrix(matrix, year);
    if (parsed.issues.some((issue) => issue.field === "headers")) continue;
    if (parsed.sessions.length) {
      years.push(buildMeditationYearData(tab.title, year, parsed.sessions));
    }
  }

  return {
    years,
    activeYear: years[0]?.year ?? null,
  };
}
