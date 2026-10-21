import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseMusicLibrary } from "./parser";
import {
  getMusicLibraryRange,
  getMusicSourceTag,
  getMusicSpreadsheetId,
  musicSource,
} from "./sources";

export async function loadMusicLibrary() {
  const spreadsheetId = getMusicSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const libraryTab = tabs.find((tab) => tab.title === musicSource.libraryTab);
  if (!libraryTab) {
    throw new Error(`The configured Music sheet is missing the "${musicSource.libraryTab}" tab.`);
  }

  const rows = await readSheetMatrix({
    spreadsheetId,
    range: getMusicLibraryRange(libraryTab.rowCount),
    revalidate: musicSource.revalidateSeconds,
    tags: [getMusicSourceTag()],
  });
  const data = parseMusicLibrary(rows, musicSource.libraryTab);
  if (data.issues.some((issue) => issue.field === "headers")) {
    throw new Error("The configured Music library tab does not have the expected columns.");
  }
  return data;
}
