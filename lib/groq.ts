/**
 * lib/groq.ts
 * Thin wrapper around the Groq REST API (OpenAI-compatible).
 * Supports both text-only and vision (image) calls.
 *
 * Model strategy (balancing quality vs quota):
 *  - TEXT_MODEL  : llama-3.1-8b-instant  — tiny, fast, great at structured JSON output
 *  - VISION_MODEL: meta-llama/llama-4-maverick-17b-128e-instruct — best vision on Groq free tier
 *
 * Token budgets per endpoint (passed as max_tokens):
 *  - parse-search      : 300  (just a small JSON filter object)
 *  - summarize-bugs    : 600  (headline + ≤5 bullet strings)
 *  - generate-bugs     : 2048 (up to ~5 bug objects with steps)
 *  - generate-tests    : 2048 (up to 8 test case objects with steps)
 *  - regression-tests  : 1024 (1-3 regression test objects)
 */

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

// llama-3.1-8b-instant: 14,400 req/day, 500K tokens/day — best quota on the free tier
const TEXT_MODEL = "llama-3.1-8b-instant";

// qwen/qwen3.6-27b: only 1K req/day, 200K tokens/day — the ONLY vision model on Groq free tier.
// Keep images compressed (max 900px JPEG 70%) to maximise how many calls fit in quota.
const VISION_MODEL = "qwen/qwen3.6-27b";

function getKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set in environment variables.");
  return key;
}

/** Parse JSON from model output robustly — strips markdown fences and any leaked <think> reasoning blocks */
function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip fully-formed <think>...</think> reasoning blocks some models emit
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Defensive fallback: if an unclosed <think> tag is present, drop everything
  // up to the first { or [ — that's where the actual JSON payload starts.
  if (/<think>/i.test(cleaned)) {
    const jsonStart = cleaned.search(/[\[{]/);
    if (jsonStart !== -1) cleaned = cleaned.slice(jsonStart);
  }

  // Strip ```json ... ``` or ``` ... ``` wrappers if present
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Call Groq with a text-only prompt.
 * @param maxTokens  Right-size this per call site — don't use 4096 for everything.
 */
export async function callGroqText<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<T> {
  const key = getKey();
  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature: 0.35,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return parseJSON<T>(content);
}

/**
 * Call Groq with a vision-capable prompt (text + multiple base64 images).
 * Images should be pre-compressed on the client (max 900px, JPEG 70%) before
 * being passed here — see components/ai/image-drop-zone.tsx.
 * @param maxTokens  Right-size this per call site.
 */
export async function callGroqVision<T>(
  systemPrompt: string,
  userPrompt: string,
  images: Array<{ base64: string; mimeType: string }>,
  maxTokens = 2048
): Promise<T> {
  const key = getKey();

  const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: userPrompt }
  ];

  // Append all images to user message content
  images.forEach((img) => {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType || "image/jpeg"};base64,${img.base64}`,
      },
    });
  });

  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      temperature: 0.35,
      max_tokens: maxTokens,
      reasoning_format: "hidden", // qwen3.6 is a thinking model — suppress <think> blocks from output
      reasoning_effort: "none",   // structured JSON extraction doesn't need deliberation, also faster
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: contentArray },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Vision API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return parseJSON<T>(content);
}

/**
 * Convenience: calls vision model if images are provided, otherwise text model.
 * @param maxTokens  Passed through to the underlying call.
 */
export async function callGroq<T>(
  systemPrompt: string,
  userPrompt: string,
  images?: Array<{ base64: string; mimeType: string }>,
  maxTokens = 2048
): Promise<T> {
  if (images && images.length > 0) {
    return callGroqVision<T>(systemPrompt, userPrompt, images, maxTokens);
  }
  return callGroqText<T>(systemPrompt, userPrompt, maxTokens);
}