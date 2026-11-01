import { google } from "googleapis";

const documentId = process.env.GOOGLE_DOC_ID_HIKING;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!documentId) throw new Error("Missing GOOGLE_DOC_ID_HIKING.");
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

const blocks = [];
for (const element of response.data.body?.content ?? []) {
  const paragraph = element.paragraph;
  let text = "";
  for (const paragraphElement of paragraph?.elements ?? []) {
    if (paragraphElement.textRun?.content) text += paragraphElement.textRun.content;
  }
  text = text.replace(/\s+$/g, "").replace(/\r/g, "");
  if (text.trim()) {
    blocks.push({
      style: paragraph?.paragraphStyle?.namedStyleType ?? null,
      text,
    });
  }
}

const entries = blocks
  .filter((block) => /^\d+\)\s*/.test(block.text))
  .map((block) => block.text);

console.log(JSON.stringify({
  title: response.data.title ?? null,
  blockCount: blocks.length,
  characterCount: blocks.map((block) => block.text).join("\n").length,
  entryCount: entries.length,
  entries: entries.slice(0, 100),
}, null, 2));
