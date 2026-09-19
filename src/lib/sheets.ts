import { google, sheets_v4 } from "googleapis";
import { unstable_cache } from "next/cache";

const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DEFAULT_REVALIDATE_SECONDS = 60 * 60;

export type SheetRecord = Record<string, string>;
export type SheetMatrix = string[][];

export type SheetRowParser<T> = (row: SheetRecord, rowNumber: number) => T;

export type ReadSheetOptions<T> = {
  spreadsheetId: string;
  range: string;
  parseRow: SheetRowParser<T>;
  revalidate?: number;
  tags?: string[];
};

function getServiceAccountCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing Google Sheets credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  return { clientEmail, privateKey };
}

function createSheetsClient() {
  const { clientEmail, privateKey } = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [SHEETS_READONLY_SCOPE],
  });

  return google.sheets({ version: "v4", auth });
}

function toSheetRecords(values: string[][]): SheetRecord[] {
  const [headerRow, ...dataRows] = values;

  if (!headerRow || headerRow.length === 0) {
    return [];
  }

  const headers = headerRow.map((header, index) => {
    const normalizedHeader = header.trim();
    return normalizedHeader || `column_${index + 1}`;
  });

  return dataRows.map((row) =>
    headers.reduce<SheetRecord>((record, header, index) => {
      record[header] = row[index] ?? "";
      return record;
    }, {}),
  );
}

async function requestSheetValues(
  client: sheets_v4.Sheets,
  spreadsheetId: string,
  range: string,
) {
  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
  });

  return (response.data.values ?? []) as SheetMatrix;
}

export async function readSheetMatrix({
  spreadsheetId,
  range,
  revalidate = DEFAULT_REVALIDATE_SECONDS,
  tags = [],
}: Omit<ReadSheetOptions<unknown>, "parseRow">): Promise<SheetMatrix> {
  if (!spreadsheetId.trim()) {
    throw new Error("A Google Sheets spreadsheetId is required.");
  }

  if (!range.trim()) {
    throw new Error("A Google Sheets range is required.");
  }

  if (!Number.isInteger(revalidate) || revalidate < 0) {
    throw new Error("The Google Sheets revalidate value must be a non-negative integer.");
  }

  const cacheKey = ["google-sheet-matrix", spreadsheetId, range];
  const getValues = unstable_cache(
    async () => requestSheetValues(createSheetsClient(), spreadsheetId, range),
    cacheKey,
    {
      revalidate,
      tags: ["google-sheets", ...tags],
    },
  );

  return getValues();
}

export async function listSheetTabs(spreadsheetId: string) {
  if (!spreadsheetId.trim()) {
    throw new Error("A Google Sheets spreadsheetId is required.");
  }

  const response = await createSheetsClient().spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
    fields: "sheets(properties(title,index,gridProperties(rowCount,columnCount)))",
  });

  return (response.data.sheets ?? [])
    .map(({ properties }) => properties)
    .filter((properties): properties is NonNullable<typeof properties> & { title: string } => Boolean(properties?.title))
    .map((properties) => ({
      title: properties.title,
      rowCount: properties.gridProperties?.rowCount ?? null,
      columnCount: properties.gridProperties?.columnCount ?? null,
    }));
}

export async function readSheet<T>({
  spreadsheetId,
  range,
  parseRow,
  revalidate = DEFAULT_REVALIDATE_SECONDS,
  tags = [],
}: ReadSheetOptions<T>): Promise<T[]> {
  if (!spreadsheetId.trim()) {
    throw new Error("A Google Sheets spreadsheetId is required.");
  }

  if (!range.trim()) {
    throw new Error("A Google Sheets range is required.");
  }

  if (!Number.isInteger(revalidate) || revalidate < 0) {
    throw new Error("The Google Sheets revalidate value must be a non-negative integer.");
  }

  const cacheKey = ["google-sheet", spreadsheetId, range];
  const getValues = unstable_cache(
    async () => requestSheetValues(createSheetsClient(), spreadsheetId, range),
    cacheKey,
    {
      revalidate,
      tags: ["google-sheets", ...tags],
    },
  );

  const values = await getValues();
  return toSheetRecords(values).map((row, index) => parseRow(row, index + 2));
}

export async function readSheetRecords(
  spreadsheetId: string,
  range: string,
  options?: Omit<ReadSheetOptions<SheetRecord>, "spreadsheetId" | "range" | "parseRow">,
) {
  return readSheet({
    spreadsheetId,
    range,
    ...options,
    parseRow: (row) => row,
  });
}
