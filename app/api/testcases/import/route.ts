import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Map common status values from external CSVs → internal board statuses
// Internal statuses: open | Fixed | closed | reopen | todiscuss
const STATUS_MAP: Record<string, string> = {
  // open-style
  open:          "open",
  backlog:       "open",
  "to test":     "open",
  to_test:       "open",
  new:           "open",
  // working / in-progress style
  "in progress": "open",
  in_progress:   "open",
  working:       "open",
  assigned:      "open",
  // fixed / resolved style
  fixed:         "Fixed",
  resolved:      "Fixed",
  passed:        "Fixed",
  verified:      "Fixed",
  // reopen style
  reopen:        "reopen",
  reopened:      "reopen",
  "re-open":     "reopen",
  // todiscuss style
  todiscuss:     "todiscuss",
  "to discuss":  "todiscuss",
  discussion:    "todiscuss",
  blocked:       "todiscuss",
  // closed / done style
  closed:        "closed",
  done:          "closed",
  failed:        "closed",
};

const VALID_PRIORITIES = ["critical", "high", "medium", "low"];

// Case-insensitive column lookup helper
function col(row: Record<string, string>, name: string): string {
  const key = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? (row[key] ?? "").trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { projectId, rows } = await req.json() as {
      projectId: string;
      rows: Record<string, string>[];
    };

    if (!projectId || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Fetch existing modules for this project (to match by name)
    const { data: modules } = await supabase
      .from("modules")
      .select("id, name")
      .eq("project_id", projectId);

    const moduleMap: Record<string, string> = {};
    (modules ?? []).forEach((m) => {
      moduleMap[m.name.toLowerCase()] = m.id;
    });

    let imported = 0;
    let skipped  = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header

      const title = col(row, "Title") || `Bug #${rowNum - 1}`;

      // Priority — default medium
      let priority = col(row, "Priority").toLowerCase();
      if (!VALID_PRIORITIES.includes(priority)) priority = "medium";

      // Status — map from external names → internal, default "open"
      const rawStatus = col(row, "Status").toLowerCase();
      const status = STATUS_MAP[rawStatus] ?? "open";

      // Module — match by name (case-insensitive), default null
      const moduleName = col(row, "Module").toLowerCase();
      const moduleId   = moduleName ? (moduleMap[moduleName] ?? null) : null;

      const description    = col(row, "Description")    || null;
      const steps          = col(row, "Steps")          || null;
      const expectedResult = col(row, "Expected Result") || "";
      const actualResult   = col(row, "Actual Result")  || null;
      const notes          = col(row, "Notes")          || null;
      const screenshotUrl  = col(row, "Screenshot URL") || null;

      // Parse steps string into array if it's a pipe-separated list
      // e.g. "Step 1: action|Step 2: action"
      let parsedSteps: { order: number; action: string; expected: string }[] = [];
      if (steps) {
        parsedSteps = steps.split("|").map((s, idx) => ({
          order: idx + 1,
          action: s.trim(),
          expected: "",
        }));
      }

      // Insert into "cards" table (which is what the app uses for test cases)
      const { error } = await supabase.from("cards").insert({
        project_id:      projectId,
        title,
        description,
        column_id:       status,   // board uses column_id for status
        priority,
        module_id:       moduleId,
        steps:           parsedSteps,
        expected_result: expectedResult,
        actual_result:   actualResult,
        notes,
        screenshot_url:  screenshotUrl,
      });

      if (error) {
        skipped++;
        errors.push(`Row ${rowNum}: "${title}" — ${error.message}`);
      } else {
        imported++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
