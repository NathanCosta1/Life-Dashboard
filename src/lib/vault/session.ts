import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const VAULT_COOKIE = "vault-session";
const VAULT_MAX_AGE_SECONDS = 30 * 60;

export function createVaultSessionValue(secret: string): string {
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret).update(timestamp).digest("base64url");
  return `${timestamp}.${signature}`;
}

function verifyVaultSessionValue(value: string, secret: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [timestampText, signature] = parts;
  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp)) return false;
  if (timestamp > Date.now() + 5 * 60 * 1000) return false;
  if (Date.now() - timestamp >= VAULT_MAX_AGE_SECONDS * 1000) return false;
  const expected = createHmac("sha256", secret).update(timestampText).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function isVaultUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  const secret = process.env.SECRET_VAULT_SESSION_SECRET;
  const value = cookieStore.get(VAULT_COOKIE)?.value;
  return Boolean(secret && value && verifyVaultSessionValue(value, secret));
}
