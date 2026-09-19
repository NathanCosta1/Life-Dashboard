import { google } from "googleapis";

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!clientEmail || !privateKey) {
  throw new Error(
    "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
  );
}

const sources = [
  { key: "netWorth", envName: "GOOGLE_SHEET_ID_NET_WORTH" },
  { key: "investing", envName: "GOOGLE_SHEET_ID_INVESTING" },
  { key: "vacationFinances", envName: "GOOGLE_SHEET_ID_VACATION_FINANCES" },
  { key: "housing", envName: "GOOGLE_SHEET_ID_HOUSING" },
  { key: "budget", envName: "GOOGLE_SHEET_ID_BUDGET" },
];

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

function inferType(rows, columnIndex) {
  const samples = rows.map((row) => row[columnIndex] ?? "").filter(Boolean).slice(0, 20);

  if (samples.length === 0) {
    return "empty";
  }

  if (samples.every((value) => !Number.isNaN(Number(value.replace(/[$,%\s,]/g, ""))))) {
    return "number";
  }

  if (samples.every((value) => !Number.isNaN(Date.parse(value)))) {
    return "date-like";
  }

  return "text";
}

async function inspectTab(spreadsheetId, tab) {
  if (!tab.title) {
    return null;
  }

  const range = `'${tab.title.replaceAll("'", "''")}'!A1:Z100`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
  });
  const values = response.data.values ?? [];
  const headers = values[0] ?? [];
  const rows = values.slice(1);

  return {
    tabTitle: tab.title,
    inspectedRange: range,
    declaredRows: tab.gridProperties?.rowCount ?? null,
    declaredColumns: tab.gridProperties?.columnCount ?? null,
    returnedRowCount: rows.length,
    rowShapes: rows.slice(0, 10).map((row, index) => ({
      rowNumber: index + 2,
      populatedCells: row.filter(Boolean).length,
      width: row.length,
    })),
    columns: headers.map((header, index) => ({
      header: header || `column_${index + 1}`,
      inferredType: inferType(rows, index),
      populatedValues: rows.filter((row) => Boolean(row[index]?.trim())).length,
    })),
  };
}

async function inspectSource(source) {
  const spreadsheetId = process.env[source.envName];
  if (!spreadsheetId) {
    throw new Error(`Missing ${source.envName}.`);
  }

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
    fields: "properties(title),sheets(properties(title,index,gridProperties(rowCount,columnCount)))",
  });
  const tabs = metadata.data.sheets ?? [];
  if (tabs.length === 0) {
    throw new Error(`The configured ${source.envName} spreadsheet has no readable tabs.`);
  }

  return {
    source: source.key,
    environmentVariable: source.envName,
    spreadsheetTitle: metadata.data.properties?.title ?? "(untitled)",
    configuredTabCount: tabs.length,
    tabs: (await Promise.all(
      tabs.map(({ properties }) => inspectTab(spreadsheetId, properties ?? {})),
    )).filter(Boolean),
  };
}

const results = await Promise.all(sources.map(inspectSource));
console.log(JSON.stringify({
  inspectedSources: results.length,
  sources: results,
}, null, 2));
