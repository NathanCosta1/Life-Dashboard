import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_MOVIES;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_MOVIES.");
if (!clientEmail || !privateKey) throw new Error("Missing Google service-account credentials.");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "properties(title),sheets(properties(title,gridProperties(rowCount,columnCount)))",
});

const output = {
  spreadsheetTitle: metadata.data.properties?.title ?? null,
  tabs: [],
};

for (const tab of metadata.data.sheets ?? []) {
  const title = tab.properties?.title;
  if (!title) continue;
  const rowCount = tab.properties?.gridProperties?.rowCount ?? 0;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title.replaceAll("'", "''")}'!A1:F${Math.min(rowCount, 2500)}`,
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  const headers = rows[0] ?? [];
  const populatedRows = rows.slice(1).filter((row) => row.some((cell) => String(cell ?? "").trim())).length;
  const populatedCellsByColumn = headers.map((header, index) => ({
    header,
    column: index + 1,
    populated: rows.slice(1).filter((row) => String(row[index] ?? "").trim()).length,
  }));
  const tabSummary = { title, declaredRows: rowCount, returnedRows: rows.length, populatedRows, headers, populatedCellsByColumn };
  if (title === "Reviews / Notes") {
    const ratingIndex = headers.findIndex((header) => String(header).trim() === "Rating");
    const dateIndex = headers.findIndex((header) => String(header).trim() === "Watched Date");
    const ratings = rows.slice(1).map((row) => String(row[ratingIndex] ?? "").trim()).filter(Boolean);
    const dates = rows.slice(1).map((row) => String(row[dateIndex] ?? "").trim()).filter(Boolean);
    tabSummary.reviewCount = populatedRows;
    tabSummary.ratingUnits = {
      nOver10: ratings.filter((value) => /^\d+(?:\.\d+)?\s*\/\s*10$/.test(value)).length,
      malformed: ratings.filter((value) => !/^\d+(?:\.\d+)?\s*\/\s*10$/.test(value)).length,
    };
    tabSummary.dateParseFailures = dates.filter((value) => !/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.test(value) && !/^(\d{4})-(\d{2})-(\d{2})$/.test(value)).length;
  }
  if (title === "To Watch") {
    tabSummary.watchlistCount = populatedRows;
  }
  output.tabs.push(tabSummary);
}

console.log(JSON.stringify(output, null, 2));
