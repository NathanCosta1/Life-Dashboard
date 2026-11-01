import "server-only";
import { cookies } from "next/headers";

export const VAULT_COOKIE = "vault-session";

export async function isVaultUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(VAULT_COOKIE)?.value === "1";
}
