export const hikesSource = {
  environmentVariable: "GOOGLE_DOC_ID_HIKING",
  revalidateSeconds: 60 * 60,
} as const;

export function getHikesDocumentId(): string {
  const documentId = process.env[hikesSource.environmentVariable]?.trim();
  if (!documentId) {
    throw new Error(`Missing ${hikesSource.environmentVariable}.`);
  }
  return documentId;
}

