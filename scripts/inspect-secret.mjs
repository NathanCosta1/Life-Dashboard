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
  output.push({
    title,
    declaredRows: rowCount,
    declaredColumns: columnCount,
  });
}

console.log(JSON.stringify({
  inspectedTabCount: output.length,
  tabs: output,
}, null, 2));
