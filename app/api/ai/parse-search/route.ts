import { NextRequest, NextResponse } from "next/server";
import { callGroqText } from "@/lib/groq";

export interface ParsedSearchFilters {
  action: "filter" | "export" | "summarize";
  modules: string[];
  priorities: ("critical" | "high" | "medium" | "low")[];
  statuses: ("open" | "Fixed" | "reopen" | "todiscuss" | "closed")[];
  textSearch: string | null;
  dateRange: "today" | "yesterday" | "this_week" | "last_7_days" | "this_month" | "last_30_days" | null;
  unsupported: string[];
}

const SYSTEM_PROMPT = `You are a search-query interpreter for a bug tracking board. Convert the user's natural
language query into a structured filter/export/summarize object matching the board's existing filter state.

ACTION:
- "export" if the user is clearly asking to export, download, or generate a CSV/file of bugs
  (e.g. "export the reopened bugs", "download today's bugs", "give me a csv of...").
- "summarize" if the user is asking for an overview, report, or summary of bugs rather than just
  narrowing the board view or downloading a file (e.g. "summary of bugs I added today", "what
  are the new bugs and what's the issue", "give me a rundown of critical bugs in Auth").
- "filter" for everything else — the default, ordinary act of narrowing the board view.

AVAILABLE FILTERS:
- modules: array of module names (must match one of the provided MODULE LIST exactly — 
  fuzzy-match the user's wording to the closest real module name, do not invent new ones)
- priorities: array from ["critical", "high", "medium", "low"]
- statuses: array from ["open", "Fixed", "reopen", "todiscuss", "closed"]
  (map "resolved"/"done" -> "Fixed", "in review"/"pending discussion" -> "todiscuss",
   "reopened"/"regressed" -> "reopen", "done"/"complete" -> "closed")
- dateRange: one of ["today", "yesterday", "this_week", "last_7_days", "this_month", "last_30_days"]
  if the query implies a relative time period bugs were CREATED in (e.g. "added today", "from
  this week", "last month" -> closest is "last_30_days"). Do NOT try to compute actual dates
  yourself — only classify which of these fixed tokens applies. If no time period is implied,
  use null.

RULES:
- Only include a filter key if the query actually implies it. Do not guess unrelated filters.
- "reopened twice" or similar count-based phrasing cannot be expressed as a filter — put it in
  "unsupported" instead of guessing a filter for it.
- A specific/absolute date or range that doesn't map to one of the dateRange tokens above
  (e.g. "since March 5", "between June and July") goes in "unsupported", not dateRange.
- If the query is a plain keyword with no recognizable filter intent (e.g. "login button"),
  put the raw text in "textSearch" so it can be matched against bug titles/descriptions.
- Output ONLY valid JSON. No markdown, no explanation.

OUTPUT FORMAT:
{
  "action": "filter" | "export" | "summarize",
  "modules": string[],
  "priorities": ("critical"|"high"|"medium"|"low")[],
  "statuses": ("open"|"Fixed"|"reopen"|"todiscuss"|"closed")[],
  "textSearch": string | null,
  "dateRange": "today" | "yesterday" | "this_week" | "last_7_days" | "this_month" | "last_30_days" | null,
  "unsupported": string[]
}`;

export async function POST(req: NextRequest) {
  try {
    const { query, moduleNames } = (await req.json()) as {
      query: string;
      moduleNames: string[];
    };

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Search query is required." },
        { status: 400 }
      );
    }

    const userPrompt = `MODULE LIST: ${moduleNames.join(", ") || "(no modules yet)"}\n\nQuery: "${query.trim()}"`;

    const parsed = await callGroqText<ParsedSearchFilters>(SYSTEM_PROMPT, userPrompt, 300);

    // Defensive defaults in case the model omits a key
    const result: ParsedSearchFilters = {
      action: parsed?.action === "export" ? "export" : parsed?.action === "summarize" ? "summarize" : "filter",
      modules: Array.isArray(parsed?.modules) ? parsed.modules : [],
      priorities: Array.isArray(parsed?.priorities) ? parsed.priorities : [],
      statuses: Array.isArray(parsed?.statuses) ? parsed.statuses : [],
      textSearch: parsed?.textSearch ?? null,
      dateRange: parsed?.dateRange ?? null,
      unsupported: Array.isArray(parsed?.unsupported) ? parsed.unsupported : [],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI parse-search] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}