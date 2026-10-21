import { google } from "googleapis";

const spreadsheetId = process.env.GOOGLE_SHEET_ID_MUSIC;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!spreadsheetId) {
  throw new Error("Missing GOOGLE_SHEET_ID_MUSIC.");
}
if (!clientEmail || !privateKey) {
  throw new Error(
    "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
  );
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

const headerTerms = /\b(album|artist|song|track|title|rank|position|year|release|url|link|artwork|isrc)\b/i;
const relevantPlaylistName = /Albums:\s*To listen|\b(?:19|20)\d{2}\b.*(?:year|everything|top ?100|replay)|(?:year|everything|top ?100|replay).*\b(?:19|20)\d{2}\b/i;
const tabs = await Promise.all(
  (metadata.data.sheets ?? []).map(async ({ properties }) => {
    if (!properties?.title) {
      return null;
    }

    const escapedTitle = properties.title.replaceAll("'", "''");
    const rowLimit = Math.max(1, Math.min(properties.gridProperties?.rowCount ?? 5000, 5000));
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${escapedTitle}'!A1:Z${rowLimit}`,
      majorDimension: "ROWS",
    });
    const rows = response.data.values ?? [];
    const headers = rows[0] ?? [];
    const headerCandidates = rows
      .slice(0, 20)
      .map((row, index) => ({
        rowNumber: index + 1,
        cells: row.map((value, columnIndex) => ({
          column: columnIndex + 1,
          value: String(value ?? "").trim(),
        })),
      }))
      .filter(({ cells }) => cells.filter(({ value }) => headerTerms.test(value)).length >= 2)
      .map(({ rowNumber, cells }) => ({
        rowNumber,
        headers: cells
          .filter(({ value }) => value.length > 0)
          .map(({ column, value }) => ({ column, value })),
      }));
    const headerRow = rows[0] ?? [];
    const columnIndex = (name) => headers.findIndex((value) => String(value ?? "").trim().toLowerCase() === name.toLowerCase());
    const playlistNameColumn = headerRow.findIndex((value) => /^playlist name$/i.test(String(value ?? "").trim()));
    const playlistCounts = new Map();
    const playlistRows = new Map();
    if (playlistNameColumn !== -1) {
      for (const row of rows.slice(1)) {
        const name = String(row[playlistNameColumn] ?? "").trim();
        if (name) {
          playlistCounts.set(name, (playlistCounts.get(name) ?? 0) + 1);
          if (!playlistRows.has(name)) playlistRows.set(name, []);
          playlistRows.get(name).push(row);
        }
      }
    }
    const summaries = [...playlistRows.entries()]
      .filter(([name]) => relevantPlaylistName.test(name))
      .map(([name, playlist]) => {
        const values = (column) => playlist.map((row) => String(row[column] ?? "").trim()).filter(Boolean);
        const unique = (items) => new Set(items.map((item) => item.toLocaleLowerCase())).size;
        const typeValues = values(columnIndex("Type"));
        return {
          name,
          rowCount: playlist.length,
          typeCounts: typeValues.reduce((counts, type) => {
            counts[type] = (counts[type] ?? 0) + 1;
            return counts;
          }, {}),
          distinctIsrcs: unique(values(columnIndex("ISRC"))),
          missingIsrcs: playlist.length - values(columnIndex("ISRC")).length,
          distinctTrackArtistPairs: unique(playlist.map((row) => [
            row[columnIndex("Track name")] ?? "",
            row[columnIndex("Artist name")] ?? "",
          ].map((value) => String(value).trim().toLocaleLowerCase()).join("\u0000").trim())),
          distinctAlbumArtistPairs: unique(playlist.map((row) => [
            row[columnIndex("Album")] ?? "",
            row[columnIndex("Artist name")] ?? "",
          ].map((value) => String(value).trim().toLocaleLowerCase()).join("\u0000").trim()).filter(Boolean)),
        };
      });

    return {
      title: properties.title,
      declaredRows: properties.gridProperties?.rowCount ?? null,
      declaredColumns: properties.gridProperties?.columnCount ?? null,
      returnedRows: rows.length,
      populatedRows: rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length,
      rowShapes: rows.slice(0, 12).map((row, index) => ({
        rowNumber: index + 1,
        populatedCells: row.filter((cell) => String(cell ?? "").trim()).length,
        width: row.length,
      })),
      headerCandidates,
      relevantPlaylists: summaries,
      populatedCellsByColumn: rows.reduce((counts, row) => {
        row.forEach((cell, index) => {
          if (String(cell ?? "").trim()) {
            counts[index] = (counts[index] ?? 0) + 1;
          }
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
