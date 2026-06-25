import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function escapeCsv(val: string): string {
  if (!val) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const priorityFilter = req.nextUrl.searchParams.get("priority") || "all";
  const moduleFilter = req.nextUrl.searchParams.get("module") || "all";
  const statusFilter = req.nextUrl.searchParams.get("status") || "all";

  let query = supabase
    .from("test_cases")
    .select("*, modules(name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
  if (moduleFilter !== "all") query = query.eq("module_id", moduleFilter);
  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "Title",
    "Module",
    "Status",
    "Priority",
    "Description",
    "Steps",
    "Expected Result",
    "Actual Result",
    "Failed Reason",
    "Screenshot URL",
    "Test Case ID",
    "Created At",
  ];

  const csvRows = (rows || []).map((tc: Record<string, unknown> & { modules?: { name?: string } }) => [
    escapeCsv((tc.title as string) || ""),
    escapeCsv(tc.modules?.name || ""),
    escapeCsv((tc.status as string) || "open"),
    escapeCsv((tc.priority as string) || "medium"),
    escapeCsv((tc.description as string) || ""),
    escapeCsv(
      ((tc.steps as { order?: number; action?: string }[]) || [])
        .map((s, i) => `${s.order || i + 1}. ${s.action}`)
        .join(" | ")
    ),
    escapeCsv((tc.expected_result as string) || ""),
    escapeCsv((tc.actual_result as string) || ""),
    escapeCsv((tc.failed_reason as string) || ""),
    escapeCsv((tc.screenshot_url as string) || ""),
    escapeCsv((tc.id as string) || ""),
    escapeCsv((tc.created_at as string) || ""),
  ]);

  const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

  return new NextResponse("\uFEFF" + csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="runtest-list-${projectId}.csv"`,
    },
  });
}
