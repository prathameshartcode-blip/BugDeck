/**
 * lib/groq.ts
 * Thin wrapper around the Groq REST API (OpenAI-compatible).
 * Supports both text-only and vision (image) calls.
 */

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
// Both models below were updated 2026-07-21 — Groq deprecated the previous
// ones (llama-3.3-70b-versatile, meta-llama/llama-4-scout-17b-16e-instruct)
// on 2026-06-17. See https://console.groq.com/docs/deprecations
const TEXT_MODEL = "openai/gpt-oss-120b";
const VISION_MODEL = "qwen/qwen3.6-27b";

function getKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set in environment variables.");
  return key;
}

/** Parse JSON from model output robustly — strips markdown fences and any leaked <think> reasoning blocks */
function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip fully-formed <think>...</think> reasoning blocks some models
  // (e.g. qwen3.6) can emit inline even when reasoning_format is set to hidden.
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Defensive fallback: if an unclosed <think> tag is present (e.g. the
  // response got cut off mid-reasoning), drop everything up to the first
  // { or [ — that's where the actual JSON payload starts.
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
 * Returns the parsed JSON from the model's response.
 */
export async function callGroqText<T>(
  systemPrompt: string,
  userPrompt: string
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
      temperature: 0.4,
      max_tokens: 4096,
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
 * Returns the parsed JSON from the model's response.
 */
export async function callGroqVision<T>(
  systemPrompt: string,
  userPrompt: string,
  images: Array<{ base64: string; mimeType: string }>
): Promise<T> {
  const key = getKey();
  
  const contentArray: any[] = [
    { type: "text", text: userPrompt }
  ];

  // Append all images to user message content
  images.forEach((img) => {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType || "image/png"};base64,${img.base64}`,
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
      temperature: 0.4,
      max_tokens: 4096,
      reasoning_format: "hidden", // qwen3.6-27b is a thinking model — keep <think> reasoning out of content
      reasoning_effort: "none",   // structured JSON extraction doesn't need deliberation — also faster
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: contentArray,
        },
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
 */
export async function callGroq<T>(
  systemPrompt: string,
  userPrompt: string,
  images?: Array<{ base64: string; mimeType: string }>
): Promise<T> {
  if (images && images.length > 0) {
    return callGroqVision<T>(systemPrompt, userPrompt, images);
  }
  return callGroqText<T>(systemPrompt, userPrompt);
}