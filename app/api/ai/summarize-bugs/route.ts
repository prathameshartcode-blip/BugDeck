import { NextRequest, NextResponse } from "next/server";
import { callGroqText } from "@/lib/groq";

interface BugSummaryInput {
  title: string;
  description: string | null;
  priority: string;
  status: string;
  moduleName: string;
}

export interface BugSummaryResult {
  headline: string;
  insights: string[];
}

const SYSTEM_PROMPT = `You are a QA analyst writing a short summary of a set of bugs for a developer.

You will be given the user's original request, a set of pre-computed statistics (these numbers
are already correct — verified by code, not by you), and a list of the actual bugs.

RULES:
- Do NOT recompute or restate raw counts as if you calculated them — the stats given to you are
  already correct. You may reference them naturally in the headline, but never contradict them
  or make up different numbers.
- "headline" is one sentence directly answering the user's original request.
- "insights" is an array of up to 5 short bullet-point observations: notable patterns (e.g. many
  bugs clustered in one module), anything critical/high priority worth flagging first, or a
  useful one-line synthesis of what the bugs are actually about. Do not just restate the list —
  say something the raw list doesn't make obvious at a glance.
- If there are zero bugs, "headline" should say so plainly and "insights" should be an empty array.
- Do not invent bugs, causes, or details not present in the given list.
- Output ONLY valid JSON, no markdown.

OUTPUT FORMAT:
{
  "headline": "string",
  "insights": ["string", ...]
}`;

export async function POST(req: NextRequest) {
  try {
    const { originalQuery, stats, bugs } = (await req.json()) as {
      originalQuery: string;
      stats: {
        total: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
        byModule: Record<string, number>;
      };
      bugs: BugSummaryInput[];
    };

    if (!originalQuery?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    // Cap how many bug bodies we send — stats already cover the full set, we only
    // need a representative sample of actual bugs for the AI to describe *what* they're about.
    const sample = bugs.slice(0, 40);

    const bugsText = sample
      .map(
        (b, i) =>
          `${i + 1}. [${b.priority}/${b.status}] (${b.moduleName}) ${b.title}${
            b.description ? ` — ${b.description}` : ""
          }`
      )
      .join("\n");

    const userPrompt = [
      `Original request: "${originalQuery}"`,
      ``,
      `PRE-COMPUTED STATS (already correct — do not recalculate):`,
      `Total bugs: ${stats.total}`,
      `By status: ${JSON.stringify(stats.byStatus)}`,
      `By priority: ${JSON.stringify(stats.byPriority)}`,
      `By module: ${JSON.stringify(stats.byModule)}`,
      ``,
      `BUGS${bugs.length > sample.length ? ` (showing first ${sample.length} of ${bugs.length})` : ""}:`,
      stats.total === 0 ? "(no bugs matched)" : bugsText,
    ].join("\n");

    const result = await callGroqText<BugSummaryResult>(SYSTEM_PROMPT, userPrompt, 600);

    return NextResponse.json({
      headline: result?.headline ?? "Summary unavailable.",
      insights: Array.isArray(result?.insights) ? result.insights : [],
    });
  } catch (err) {
    console.error("[AI summarize-bugs] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}