import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface AITestCase {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "functional" | "edge" | "security" | "regression";
  steps: { action: string; expected: string }[];
  expected_result: string;
}

/** Fetches the project's `description` (used as AI context). Returns "" on any failure. */
async function getProjectContext(projectId?: string): Promise<string> {
  if (!projectId) return "";
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select("description")
      .eq("id", projectId)
      .single();
    if (error || !data?.description) return "";
    return String(data.description).trim();
  } catch {
    return "";
  }
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
    const { description, moduleName, images, projectId } = body as {
      description: string;
      moduleName?: string;
      images?: Array<{ base64: string; mimeType: string }>;
      projectId?: string;
    };

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Feature description is required." },
        { status: 400 }
      );
    }

    const projectContext = await getProjectContext(projectId);
    const finalSystemPrompt = projectContext
      ? `PROJECT CONTEXT:\n${projectContext}\n---\n${SYSTEM_PROMPT}`
      : SYSTEM_PROMPT;

    const userPrompt = [
      `Feature to test: ${description.trim()}`,
      moduleName ? `Module/Feature area: ${moduleName}` : "",
      images && images.length > 0
        ? `We have attached ${images.length} screenshot(s) of the UI/design. Use them to generate more specific, context-aware, and detailed test cases referencing the actual visual elements and flows depicted in the images.`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const testCases = await callGroq<AITestCase[]>(
      finalSystemPrompt,
      userPrompt,
      images,
      2048
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