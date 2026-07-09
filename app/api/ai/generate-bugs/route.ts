import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";

export interface AIBug {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  steps: { action: string; expected: string }[];
  expected_result: string;
  actual_result: string;
}

const SYSTEM_PROMPT = `You are an expert QA engineer who specializes in bug reporting. Your job is to analyze a bug description (and optionally a screenshot) and generate one or more well-structured bug reports.

RULES:
- If the description or image contains multiple distinct bugs, generate a SEPARATE bug report for each one.
- If only one bug is present, generate just one.
- Each bug must have a clear title, detailed description, exact reproduction steps, expected vs actual result.
- Steps must be specific enough for a developer to reproduce the bug immediately.
- Set priority realistically: critical for crashes/data loss/security, high for broken core features, medium for degraded UX, low for minor visual issues.
- Output ONLY a valid JSON array. No markdown, no explanation, no extra text.

OUTPUT FORMAT (strict JSON array):
[
  {
    "title": "string (concise, max 80 chars)",
    "description": "string (detailed explanation of the bug)",
    "priority": "critical" | "high" | "medium" | "low",
    "steps": [
      { "action": "string (what to do)", "expected": "string (what should happen)" }
    ],
    "expected_result": "string (correct behavior)",
    "actual_result": "string (what actually happens — the bug)"
  }
]`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, moduleName, images } = body as {
      description: string;
      moduleName?: string;
      images?: Array<{ base64: string; mimeType: string }>;
    };

    if (!description?.trim() && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: "Please provide a description or at least one screenshot." },
        { status: 400 }
      );
    }

    const userPrompt = [
      description?.trim()
        ? `Bug description: ${description.trim()}`
        : "Analyze the attached screenshot(s) and identify all bugs visible.",
      moduleName ? `Module/Feature area: ${moduleName}` : "",
      images && images.length > 0
        ? `We have attached ${images.length} screenshot(s). Carefully examine all of them for UI bugs, error messages, broken layouts, or any visible issues. Generate a separate bug report for each distinct issue you find across the images.`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const bugs = await callGroq<AIBug[]>(
      SYSTEM_PROMPT,
      userPrompt,
      images
    );

    if (!Array.isArray(bugs)) {
      throw new Error("AI returned an unexpected format.");
    }

    return NextResponse.json({ bugs });
  } catch (err) {
    console.error("[AI generate-bugs] error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
