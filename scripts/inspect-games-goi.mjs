import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_GAMES_GOI;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_GAMES_GOI.");
if (!clientEmail || !privateKey) throw new Error("Missing Google service-account credentials.");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "properties(title),sheets(properties(title,rowCount,columnCount))",
});
const tabs = metadata.data.sheets ?? [];
const values = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: "'Sheet1'!A1:F500",
  majorDimension: "ROWS",
});
const rows = values.data.values ?? [];
console.log(JSON.stringify({
  spreadsheetTitle: metadata.data.properties?.title ?? null,
  tabs: tabs.map((tab) => ({
    title: tab.properties?.title ?? null,
    rowCount: tab.properties?.gridProperties?.rowCount ?? null,
    columnCount: tab.properties?.gridProperties?.columnCount ?? null,
  })),
  returnedRows: rows.length,
  populatedRows: rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length,
  firstRows: rows.slice(0, 12),
}, null, 2));
