import { NextRequest, NextResponse } from "next/server";
import { callGroqText } from "@/lib/groq";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface AIRegressionTest {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
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

const SYSTEM_PROMPT = `You are an expert QA engineer who writes regression test cases. Your job is to take a bug
that has just been marked as FIXED and convert it into one or more precise regression test
cases that verify the fix holds and the bug does not silently reappear later.

RULES:
- The PRIMARY test case must directly re-verify the exact bug scenario: reproduce the
  original steps and assert the ORIGINAL expected behavior now occurs (not the buggy
  behavior). Use the bug's own repro steps as the backbone — do not invent a different flow.
- If it adds real regression value, you may add 1-2 SECONDARY test cases covering:
  - a boundary/edge variation of the same flow (e.g. same action with different input)
  - a check that the fix didn't break an adjacent, closely related behavior
  Do not pad the output with generic or unrelated tests. If the bug is narrow, output just
  the primary test case.
- Steps must be concrete and executable by a human tester, phrased as action → expected pairs.
- expected_result must describe the CORRECT behavior (the fix), never the original bug behavior.
- Priority should generally match or be one level below the original bug's priority, since a
  regression here means a real fix broke.
- Do not reference "the bug" or ticket IDs inside the test case text — write it as a
  standalone test case a tester could run with no other context.
- Output ONLY a valid JSON array. No markdown, no explanation, no extra text.

OUTPUT FORMAT (strict JSON array):
[
  {
    "title": "string (concise, max 80 chars, phrased as a test — e.g. 'Verify OTP is delivered within 30s of signup')",
    "description": "string (what this test verifies and why it matters)",
    "priority": "critical" | "high" | "medium" | "low",
    "steps": [
      { "action": "string (what the tester does)", "expected": "string (what should happen at this step)" }
    ],
    "expected_result": "string (overall correct behavior — the fixed state)"
  }
]`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      moduleName,
      steps,
      expected_result,
      actual_result,
      priority,
      projectId,
    } = body as {
      title: string;
      description?: string | null;
      moduleName?: string;
      steps?: { order: number; action: string; expected: string }[];
      expected_result?: string | null;
      actual_result?: string | null;
      priority?: string;
      projectId?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Bug title is required to generate a regression test." },
        { status: 400 }
      );
    }

    const projectContext = await getProjectContext(projectId);
    const finalSystemPrompt = projectContext
      ? `PROJECT CONTEXT:\n${projectContext}\n---\n${SYSTEM_PROMPT}`
      : SYSTEM_PROMPT;

    const stepsText =
      steps && steps.length > 0
        ? steps
            .map((s, i) => `${s.order || i + 1}. Action: ${s.action} → Expected: ${s.expected}`)
            .join("\n")
        : "(no repro steps were recorded on the bug)";

    const userPrompt = [
      `The following bug was just marked as Fixed. Generate regression test case(s) to verify it stays fixed.`,
      ``,
      `Bug title: ${title.trim()}`,
      moduleName ? `Module: ${moduleName}` : "",
      description ? `Description: ${description}` : "",
      `Original priority: ${priority || "medium"}`,
      ``,
      `Original repro steps:`,
      stepsText,
      ``,
      `Original expected result (what should have happened): ${expected_result || "Not specified"}`,
      `Original actual result (the bug behavior): ${actual_result || "Not specified"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const tests = await callGroqText<AIRegressionTest[]>(finalSystemPrompt, userPrompt);

    if (!Array.isArray(tests)) {
      throw new Error("AI returned an unexpected format.");
    }

    return NextResponse.json({ tests });
  } catch (err) {
    console.error("[AI generate-regression-tests] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}