export const recipesSource = {
  environmentVariable: "GOOGLE_DOC_ID_RECIPES",
  revalidateSeconds: 60 * 60,
} as const;

export function getRecipesDocumentId(): string {
  const documentId = process.env[recipesSource.environmentVariable]?.trim();
  if (!documentId) {
    throw new Error(`Missing ${recipesSource.environmentVariable}.`);
  }
  return documentId;
}

