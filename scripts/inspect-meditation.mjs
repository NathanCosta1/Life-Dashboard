import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_MEDITATION;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_MEDITATION.");
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
  includeGridData: false,
  fields: "sheets(properties(title,gridProperties(rowCount,columnCount)))",
});

const tabs = [];
for (const sheet of metadata.data.sheets ?? []) {
  const properties = sheet.properties;
  const title = properties?.title;
  if (!title || !/^\d{4}$/.test(title)) continue;
  const rowLimit = Math.max(1, Math.min(properties.gridProperties?.rowCount ?? 5000, 10000));
  const escapedTitle = title.replaceAll("'", "''");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapedTitle}'!A1:F${rowLimit}`,
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  const headers = (rows[0] ?? []).map((value) => String(value ?? "").trim());
  let populatedSessionRows = 0;
  let malformedRows = 0;
  for (const row of rows.slice(1)) {
    const date = String(row[0] ?? "").trim();
    const duration = String(row[4] ?? "").trim();
    if (!date && !duration) continue;
    populatedSessionRows += 1;
    if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(date) && !/^\d{4}-\d{1,2}-\d{1,2}/.test(date)) malformedRows += 1;
    if (!/^\d+(?:\.\d+)?\s*(?:mins?|minutes?)$/i.test(duration)) malformedRows += 1;
  }
  tabs.push({
    title,
    declaredRows: properties.gridProperties?.rowCount ?? null,
    declaredColumns: properties.gridProperties?.columnCount ?? null,
    returnedRows: rows.length,
    headers,
    populatedSessionRows,
    malformedRows,
  });
}

console.log(JSON.stringify({ inspectedTabCount: tabs.length, tabs }, null, 2));
