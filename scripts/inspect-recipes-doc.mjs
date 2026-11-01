import { google } from "googleapis";

const documentId = process.env.GOOGLE_DOC_ID_RECIPES;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!documentId) throw new Error("Missing GOOGLE_DOC_ID_RECIPES.");
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

function textForElement(element) {
  const parts = [];
  for (const paragraphElement of element.paragraph?.elements ?? []) {
    if (paragraphElement.textRun?.content) parts.push(paragraphElement.textRun.content);
  }
  return parts.join("").replace(/\s+$/g, "");
}

const body = response.data.body?.content ?? [];
const blocks = [];
for (const element of body) {
  const text = textForElement(element);
  if (!text) continue;
  const style = element.paragraph?.paragraphStyle?.namedStyleType ?? null;
  blocks.push({
    style,
    text: text.replace(/\r/g, ""),
  });
}

const plainText = blocks.map((block) => block.text).join("\n");
console.log(JSON.stringify({
  title: response.data.title ?? null,
  revisionId: response.data.revisionId ?? null,
  blockCount: blocks.length,
  characterCount: plainText.length,
  blocks: blocks.slice(0, 500),
}, null, 2));
