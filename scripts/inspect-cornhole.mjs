import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_CORNHOLE;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_CORNHOLE.");
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
const output = { spreadsheetTitle: metadata.data.properties?.title ?? null, tabs: [] };

for (const tab of metadata.data.sheets ?? []) {
  const title = tab.properties?.title;
  if (!title) continue;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'" + title.replaceAll("'", "''") + "'!A1:L25",
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  output.tabs.push({
    title,
    rowCount: tab.properties?.gridProperties?.rowCount ?? null,
    columnCount: tab.properties?.gridProperties?.columnCount ?? null,
    populatedRows: rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length,
    firstRows: rows,
  });
}

console.log(JSON.stringify(output, null, 2));
