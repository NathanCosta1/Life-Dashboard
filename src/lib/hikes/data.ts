import "server-only";
import { google } from "googleapis";
import { unstable_cache } from "next/cache";
import { parseHikingDocument, type HikeBlock } from "./parser";
import { getHikesDocumentId, hikesSource } from "./sources";

function textForElement(element: Record<string, unknown>): { text: string; style: string | null } {
  const paragraph = element.paragraph as {
    paragraphStyle?: { namedStyleType?: string };
    elements?: Array<Record<string, unknown>>;
  } | undefined;
  const parts: string[] = [];
  for (const part of paragraph?.elements ?? []) {
    const textRun = part.textRun as { content?: string } | undefined;
    if (textRun?.content) parts.push(textRun.content);
  }
  return {
    text: parts.join("").replace(/\s+$/g, ""),
    style: paragraph?.paragraphStyle?.namedStyleType ?? null,
  };
}

async function fetchHikes() {
  const documentId = getHikesDocumentId();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("Missing Google service-account credentials.");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/documents.readonly"],
  });
  const docs = google.docs({ version: "v1", auth });
  const response = await docs.documents.get({
    documentId,
    suggestionsViewMode: "PREVIEW_WITHOUT_SUGGESTIONS",
  });

  const blocks: HikeBlock[] = [];
  for (const element of response.data.body?.content ?? []) {
    const block = textForElement(element as Record<string, unknown>);
    if (block.text.trim()) {
      blocks.push({ style: block.style, text: block.text.replace(/\r/g, "") });
    }
  }
  return parseHikingDocument(response.data.title ?? null, blocks);
}

export async function loadHikingLibrary() {
  const documentId = getHikesDocumentId();
  const cached = unstable_cache(fetchHikes, ["google-doc-hikes", documentId], {
    revalidate: hikesSource.revalidateSeconds,
    tags: ["hikes", "google-docs"],
  });
  return cached();
}

