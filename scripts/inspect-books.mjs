import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_BOOKS;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_BOOKS.");
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
for (const { properties } of metadata.data.sheets ?? []) {
  const title = properties?.title;
  if (!title) continue;
  const rowCount = Math.min(properties.gridProperties?.rowCount ?? 1000, 1000);
  const escapedTitle = title.replaceAll("'", "''");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapedTitle}'!A1:W${rowCount}`,
    majorDimension: "ROWS",
  });
  const rows = response.data.values ?? [];
  const headers = rows[0] ?? [];
  const populatedRows = rows.slice(1).filter((row) =>
    row.some((cell) => String(cell ?? "").trim()),
  );
  const counts = headers.map((header, index) => ({
    header,
    populated: populatedRows.filter((row) => String(row[index] ?? "").trim()).length,
  }));
  const exclusiveIndex = headers.findIndex((header) =>
    /^exclusive shelf$/i.test(String(header ?? "").trim()),
  );
  const ratingIndex = headers.findIndex((header) =>
    /^my rating$/i.test(String(header ?? "").trim()),
  );
  const dateReadIndex = headers.findIndex((header) =>
    /^date read$/i.test(String(header ?? "").trim()),
  );
  const exclusiveShelfCounts = {};
  const ratingCounts = {};
  const readByYear = {};
  for (const row of populatedRows) {
    const shelf = String(row[exclusiveIndex] ?? "").trim() || "(blank)";
    exclusiveShelfCounts[shelf] = (exclusiveShelfCounts[shelf] ?? 0) + 1;
    const rating = String(row[ratingIndex] ?? "").trim() || "(blank)";
    ratingCounts[rating] = (ratingCounts[rating] ?? 0) + 1;
    const date = String(row[dateReadIndex] ?? "").trim();
    if (/^\d{4}\//.test(date)) {
      const year = date.slice(0, 4);
      readByYear[year] = (readByYear[year] ?? 0) + 1;
    }
  }
  tabs.push({
    title,
    rowCount: properties.gridProperties?.rowCount ?? null,
    columnCount: properties.gridProperties?.columnCount ?? null,
    returnedRows: rows.length,
    populatedBookRows: title === "goodreads_library_export" ? populatedRows.length : null,
    headers,
    counts,
    exclusiveShelfCounts: title === "goodreads_library_export" ? exclusiveShelfCounts : undefined,
    ratingCounts: title === "goodreads_library_export" ? ratingCounts : undefined,
    readByYear: title === "goodreads_library_export" ? readByYear : undefined,
  });
}

console.log(JSON.stringify({
  tabCount: tabs.length,
  tabs,
}, null, 2));
