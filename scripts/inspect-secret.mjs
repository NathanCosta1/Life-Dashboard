import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_SECRET_SHEET;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_SECRET_SHEET.");
if (!clientEmail || !privateKey) {
  throw new Error("Missing Google service-account credentials.");
}

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "sheets(properties(title,gridProperties(rowCount,columnCount)))",
});

const output = [];
for (const sheet of metadata.data.sheets ?? []) {
  const title = sheet.properties?.title;
  if (!title) continue;
  const rowCount = sheet.properties?.gridProperties?.rowCount ?? 0;
  const columnCount = sheet.properties?.gridProperties?.columnCount ?? 0;
  const rowLimit = Math.min(rowCount, 2500);
  const escapedTitle = title.replaceAll("'", "''");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapedTitle}'!A1:Z${rowLimit}`,
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  const populatedRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  output.push({
    title,
    declaredRows: rowCount,
    declaredColumns: columnCount,
    returnedRows: rows.length,
    populatedRows: populatedRows.length,
    firstRows: rows.slice(0, 12),
    populatedCellsByColumn: rows.reduce((counts, row) => {
      row.forEach((cell, index) => {
        if (String(cell ?? "").trim()) counts[index] = (counts[index] ?? 0) + 1;
      });
      return counts;
    }, {}),
  });
}

console.log(JSON.stringify({
  inspectedTabCount: output.length,
  tabs: output,
}, null, 2));
