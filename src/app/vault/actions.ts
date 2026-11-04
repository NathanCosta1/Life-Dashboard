"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createVaultSessionValue, VAULT_COOKIE } from "@/lib/vault/session";

function verifyCode(code: string): boolean {
  const expected = process.env.SECRET_VAULT_PIN;
  if (!expected || !/^\d{4}$/.test(expected)) return false;
  const provided = Buffer.from(code);
  const target = Buffer.from(expected);
  return provided.length === target.length && timingSafeEqual(provided, target);
}

export async function unlockVault(code: string): Promise<{ ok: boolean }> {
  if (!/^\d{4}$/.test(code) || !verifyCode(code)) return { ok: false };
  const sessionSecret = process.env.SECRET_VAULT_SESSION_SECRET;
  if (!sessionSecret) return { ok: false };
  const cookieStore = await cookies();
  cookieStore.set(VAULT_COOKIE, createVaultSessionValue(sessionSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 60,
  });
  return { ok: true };
}

export async function lockVault(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VAULT_COOKIE);
}
