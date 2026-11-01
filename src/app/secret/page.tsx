import type { Metadata } from "next";
import { VaultDashboard } from "@/components/vault/vault-dashboard";
import { loadVaultLibrary } from "@/lib/vault/data";
import { isVaultUnlocked } from "@/lib/vault/session";
import "../vault/vault.css";

export const metadata: Metadata = {
  title: "Secret | Life Dashboard",
  description: "Private personal dashboard.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SecretPage() {
  const unlocked = await isVaultUnlocked();
  const data = unlocked ? await loadVaultLibrary() : null;
  return <VaultDashboard data={data} unlocked={unlocked} />;
}
