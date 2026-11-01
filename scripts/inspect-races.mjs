import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_RACES;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_RACES.");
if (!clientEmail || !privateKey) throw new Error("Missing Google service-account credentials.");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "properties(title),sheets(properties(title,index,gridProperties(rowCount,columnCount)))",
});

const output = {
  spreadsheetTitle: metadata.data.properties?.title ?? null,
  tabs: [],
};

for (const tab of metadata.data.sheets ?? []) {
  const title = tab.properties?.title;
  if (!title) continue;
  const rowCount = tab.properties?.gridProperties?.rowCount ?? 100;
  const columnCount = tab.properties?.gridProperties?.columnCount ?? 26;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title.replaceAll("'", "''")}'!A1:Z${Math.min(rowCount, 1000)}`,
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  output.tabs.push({
    title,
    declaredRows: rowCount,
    declaredColumns: columnCount,
    returnedRows: rows.length,
    populatedRows: rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length,
    headers: rows[0] ?? [],
    firstRows: rows.slice(0, 1000),
  });
}

console.log(JSON.stringify(output, null, 2));
