import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_GAMES;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID_GAMES.");
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
const gridMetadata = await sheets.spreadsheets.get({
  spreadsheetId,
  includeGridData: true,
  fields: "sheets(properties(title),data.rowData.values(formattedValue,effectiveFormat.backgroundColor))",
});
const gridByTitle = new Map(
  (gridMetadata.data.sheets ?? []).map((sheet) => [
    sheet.properties?.title,
    sheet.data?.[0]?.rowData ?? [],
  ]),
);

const tabs = await Promise.all(
  (metadata.data.sheets ?? []).map(async ({ properties }) => {
    const title = properties?.title;
    if (!title) return null;

    const declaredRows = properties.gridProperties?.rowCount ?? 0;
    const declaredColumns = properties.gridProperties?.columnCount ?? 0;
    const rowLimit = Math.min(declaredRows, 5000);
    const escapedTitle = title.replaceAll("'", "''");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${escapedTitle}'!A1:Z${rowLimit}`,
      majorDimension: "ROWS",
    });
    const rows = response.data.values ?? [];
    const populatedRows = rows.filter((row) =>
      row.some((cell) => String(cell ?? "").trim()),
    );

    return {
      title,
      declaredRows,
      declaredColumns,
      returnedRows: rows.length,
      populatedRows: populatedRows.length,
      firstRows: rows.slice(0, 20),
      titleRows: title === "Digital" || title === "Watchlist"
        ? rows.slice(1)
            .map((row, index) => ({
              rowNumber: index + 2,
              title: String(row[0] ?? "").trim(),
              platform: String(row[1] ?? "").trim(),
              players: String(row[2] ?? "").trim(),
              favorite: String(row[3] ?? "").trim(),
              favoriteHighlight: title === "Digital"
                ? (() => {
                    const color =
                      gridByTitle.get(title)?.[index + 1]?.values?.[3]
                        ?.effectiveFormat?.backgroundColor ?? null;
                    return color
                      ? {
                          red: color.red ?? 0,
                          green: color.green ?? 0,
                          blue: color.blue ?? 0,
                        }
                      : null;
                  })()
                : null,
              dateOrPurchase: String(row[4] ?? "").trim(),
              cost: String(row[5] ?? "").trim(),
              hasNotes: String(row[6] ?? "").trim().length > 0,
              notes: title === "Digital" ? String(row[6] ?? "").trim() : "",
            }))
            .filter((row) => row.title)
        : [],
      sectionAndTitleRows: title === "Analog"
        ? rows
            .map((row, index) => ({
              rowNumber: index + 1,
              sectionOrTitle: String(row[0] ?? "").trim(),
              detail: String(row[1] ?? "").trim(),
            }))
            .filter((row) => row.sectionOrTitle)
        : [],
      populatedCellsByColumn: rows.reduce((counts, row) => {
        row.forEach((cell, index) => {
          if (String(cell ?? "").trim()) counts[index] = (counts[index] ?? 0) + 1;
        });
        return counts;
      }, {}),
    };
  }),
);

console.log(JSON.stringify({
  inspectedTabCount: tabs.filter(Boolean).length,
  tabs: tabs.filter(Boolean),
}, null, 2));
