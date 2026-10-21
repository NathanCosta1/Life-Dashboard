import { buildFireOverviewPrompt, extractFireOverview, fireOverviewSystemPrompt, parseFireOverviewScenario } from "@/lib/finance/fire-overview";

export const runtime = "nodejs";

const maxRequestBytes = 4_096;
const responseHeaders = { "Cache-Control": "no-store" };

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: responseHeaders });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return jsonError("Request origin is not allowed.", 403);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return jsonError("Scenario request is too large.", 413);
  }

  const bodyText = await request.text();
  if (new TextEncoder().encode(bodyText).byteLength > maxRequestBytes) {
    return jsonError("Scenario request is too large.", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const scenario = parseFireOverviewScenario(body);
  if (!scenario) {
    return jsonError("Scenario values are missing or invalid.", 400);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    return jsonError("AI overview is not configured. Add the server-side OpenRouter key and model.", 503);
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: fireOverviewSystemPrompt },
          { role: "user", content: buildFireOverviewPrompt(scenario) },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonError("The AI overview request timed out. Please try again.", 504);
    }
    return jsonError("The AI overview service could not be reached. Please try again.", 502);
  }

  if (!upstream.ok) {
    return jsonError("The AI overview provider returned an error. Please try again later.", 502);
  }

  let responseBody: unknown;
  try {
    responseBody = await upstream.json();
  } catch {
    return jsonError("The AI overview provider returned an unreadable response.", 502);
  }

  const overview = extractFireOverview(responseBody);
  if (!overview) return jsonError("The AI provider did not return a usable overview. Please try again.", 502);

  return Response.json({ overview }, { headers: responseHeaders });
}
