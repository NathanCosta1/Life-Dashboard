import { google } from "googleapis";

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.GOOGLE_SHEET_ID_JOBS;

if (!clientEmail || !privateKey) {
  throw new Error(
    "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
  );
}
if (!spreadsheetId) {
  throw new Error("Missing GOOGLE_SHEET_ID_JOBS.");
}

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  includeGridData: false,
  fields: "properties(title),sheets(properties(title,index,gridProperties(rowCount,columnCount)))",
});

const results = [];

for (const { properties } of metadata.data.sheets ?? []) {
  const tabTitle = properties?.title;
  if (!tabTitle) continue;

  const range = `'${tabTitle.replaceAll("'", "''")}'!A1:Z500`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
  });
  const values = response.data.values ?? [];
  const headers = values[0] ?? [];
  const rows = values.slice(1);

  results.push({
    tabTitle,
    declaredRows: properties.gridProperties?.rowCount ?? null,
    declaredColumns: properties.gridProperties?.columnCount ?? null,
    returnedRowCount: rows.length,
    populatedRowCount: rows.filter((row) => row.some((cell) => Boolean(String(cell).trim()))).length,
    headers: headers.map((header, index) => ({
      header: header || `column_${index + 1}`,
      populatedValues: rows.filter((row) => Boolean(String(row[index] ?? "").trim())).length,
    })),
    sampleRows: rows
      .filter((row) => row.some((cell) => Boolean(String(cell).trim())))
      .slice(0, 8)
      .map((row, index) => ({
        rowNumber: index + 2,
        width: row.length,
        populatedCells: row.filter((cell) => Boolean(String(cell).trim())).length,
        values: Object.fromEntries(headers.map((header, columnIndex) => [
          header || `column_${columnIndex + 1}`,
          row[columnIndex] ?? null,
        ])),
      })),
  });
}

console.log(JSON.stringify({
  spreadsheetTitle: metadata.data.properties?.title ?? "(untitled)",
  tabCount: results.length,
  tabs: results,
}, null, 2));
