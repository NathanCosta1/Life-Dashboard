import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_SCREEN_TIME;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_SCREEN_TIME.");
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
  const columnCount = tab.properties?.gridProperties?.columnCount ?? 0;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title.replaceAll("'", "''")}'!A1:Z${Math.min(rowCount, 2500)}`,
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  const populatedCellsByColumn = rows.reduce((counts, row) => {
    row.forEach((cell, index) => {
      if (String(cell ?? "").trim()) counts[index] = (counts[index] ?? 0) + 1;
    });
    return counts;
  }, {});
  output.tabs.push({
    title,
    declaredRows: rowCount,
    declaredColumns: columnCount,
    returnedRows: rows.length,
    populatedRows: rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length,
    firstRows: rows.slice(0, 30),
    populatedCellsByColumn,
  });
}

console.log(JSON.stringify(output, null, 2));
