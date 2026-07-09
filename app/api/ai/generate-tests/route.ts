import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";

export interface AITestCase {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "functional" | "edge" | "security" | "regression";
  steps: { action: string; expected: string }[];
  expected_result: string;
}

const SYSTEM_PROMPT = `You are an expert QA engineer. Your job is to generate thorough, structured test cases based on a feature description (and optionally a UI screenshot).

RULES:
- Generate between 5 and 8 test cases.
- Cover different angles: happy path, edge cases, validation, security, regression.
- Each test case must have clear, numbered steps that a junior tester can follow.
- Keep titles concise but descriptive (max 80 chars).
- Set priority realistically: critical for core flows, high for major features, medium for standard paths, low for minor edge cases.
- Output ONLY a valid JSON array. No markdown, no explanation, no extra text.

OUTPUT FORMAT (strict JSON array):
[
  {
    "title": "string",
    "description": "string",
    "priority": "critical" | "high" | "medium" | "low",
    "type": "functional" | "edge" | "security" | "regression",
    "steps": [
      { "action": "string", "expected": "string" }
    ],
    "expected_result": "string"
  }
]`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, moduleName, imageBase64, mimeType } = body as {
      description: string;
      moduleName?: string;
      imageBase64?: string;
      mimeType?: string;
    };

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Feature description is required." },
        { status: 400 }
      );
    }

    const userPrompt = [
      `Feature to test: ${description.trim()}`,
      moduleName ? `Module/Feature area: ${moduleName}` : "",
      imageBase64
        ? "A screenshot of the UI/design is attached. Use it to generate more specific and context-aware test cases that reference the actual UI elements visible in the image."
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const testCases = await callGroq<AITestCase[]>(
      SYSTEM_PROMPT,
      userPrompt,
      imageBase64,
      mimeType
    );

    if (!Array.isArray(testCases)) {
      throw new Error("AI returned an unexpected format.");
    }

    return NextResponse.json({ testCases });
  } catch (err) {
    console.error("[AI generate-tests] error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
