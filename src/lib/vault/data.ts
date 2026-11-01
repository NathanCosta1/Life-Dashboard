import "server-only";
import { listSheetTabs, readSheetMatrix } from "@/lib/sheets";
import { parseVaultLibrary } from "./parser";
import { getVaultSpreadsheetId, vaultSource } from "./sources";
import type { VaultLibrary } from "./types";

export async function loadVaultLibrary(): Promise<VaultLibrary> {
  const spreadsheetId = getVaultSpreadsheetId();
  const tabs = await listSheetTabs(spreadsheetId);
  const entries: Record<number, readonly (readonly string[])[]> = {};

  for (const title of vaultSource.tabs) {
    const tab = tabs.find((item) => item.title === title);
    if (!tab) continue;
    const rowLimit = Math.min(tab.rowCount ?? vaultSource.maxRows, vaultSource.maxRows);
    entries[Number(title)] = await readSheetMatrix({
      spreadsheetId,
      range: `'${title}'!A1:Z${rowLimit}`,
      revalidate: vaultSource.revalidateSeconds,
      tags: ["vault", `vault:${title}`],
    });
  }

  return parseVaultLibrary(entries);
}
