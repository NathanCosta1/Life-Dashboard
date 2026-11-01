import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseBooksLibrary } from "./parser";
import { booksSource, getBooksSpreadsheetId } from "./sources";
import type { BookLibrary } from "./types";

export async function loadBooksLibrary(): Promise<BookLibrary> {
  const spreadsheetId = getBooksSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const tab = tabs.find((item) => item.title === booksSource.tab);
  if (!tab) {
    throw new Error(`The configured Books sheet is missing the "${booksSource.tab}" tab.`);
  }
  const rowLimit = Math.min(tab.rowCount ?? booksSource.maxRows, booksSource.maxRows);
  const rows = await readSheetMatrix({
    spreadsheetId,
    range: `'${booksSource.tab}'!A1:W${rowLimit}`,
    revalidate: booksSource.revalidateSeconds,
    tags: ["books", "books:library"],
  });
  return parseBooksLibrary(rows);
}
