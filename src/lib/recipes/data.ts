import "server-only";
import { google } from "googleapis";
import { unstable_cache } from "next/cache";
import { parseRecipeDocument, type RecipeBlock } from "./parser";
import { getRecipesDocumentId, recipesSource } from "./sources";

function textForElement(element: Record<string, unknown>): { text: string; style: string | null } {
  const paragraph = element.paragraph as {
    paragraphStyle?: { namedStyleType?: string };
    elements?: Array<Record<string, unknown>>;
  } | undefined;
  const parts: string[] = [];
  for (const paragraphElement of paragraph?.elements ?? []) {
    const textRun = paragraphElement.textRun as { content?: string } | undefined;
    if (textRun?.content) parts.push(textRun.content);
  }
  return {
    text: parts.join("").replace(/\s+$/g, ""),
    style: paragraph?.paragraphStyle?.namedStyleType ?? null,
  };
}

async function fetchRecipes() {
  const documentId = getRecipesDocumentId();
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

  const blocks: RecipeBlock[] = [];
  for (const element of response.data.body?.content ?? []) {
    const block = textForElement(element as Record<string, unknown>);
    if (!block.text.trim()) continue;
    blocks.push({
      style: block.style,
      text: block.text.replace(/\r/g, ""),
    });
  }

  return parseRecipeDocument(response.data.title ?? null, blocks);
}

export async function loadRecipesLibrary() {
  const documentId = getRecipesDocumentId();
  const cached = unstable_cache(fetchRecipes, ["google-doc-recipes", documentId], {
    revalidate: recipesSource.revalidateSeconds,
    tags: ["recipes", "google-docs"],
  });
  return cached();
}
