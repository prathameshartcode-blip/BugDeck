/**
 * lib/groq.ts
 * Thin wrapper around the Groq REST API (OpenAI-compatible).
 * Supports both text-only and vision (image) calls.
 */

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function getKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set in environment variables.");
  return key;
}

/** Parse JSON from model output robustly — strips markdown fences if present */
function parseJSON<T>(raw: string): T {
  // Strip ```json ... ``` or ``` ... ``` wrappers if present
  const cleaned = raw
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
