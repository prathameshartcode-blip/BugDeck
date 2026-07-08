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

  const priorityFilter = req.nextUrl.searchParams.get("priority");
  const moduleFilter = req.nextUrl.searchParams.get("module");
  const statusFilter = req.nextUrl.searchParams.get("status");
  const idsParam = req.nextUrl.searchParams.get("ids");

  let query = supabase
    .from("test_cases")
    .select("*, modules(name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (priorityFilter && priorityFilter !== "all") {
    const priorities = priorityFilter.split(",").map(p => p.trim()).filter(Boolean);
    if (priorities.length > 0) query = query.in("priority", priorities);
  }
  if (moduleFilter && moduleFilter !== "all") {
    const modulesArr = moduleFilter.split(",").map(m => m.trim()).filter(Boolean);
    if (modulesArr.length > 0) query = query.in("module_id", modulesArr);
  }
  if (statusFilter && statusFilter !== "all") {
    const statuses = statusFilter.split(",").map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) query = query.in("status", statuses);
  }
  if (idsParam) {
    const idsArray = idsParam.split(',').map(id => id.trim()).filter(Boolean);
    if (idsArray.length > 0) {
      query = query.in('id', idsArray);
    }
  }

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "Created At",
    "Module",
    "Title",
    "Status",
    "Priority",
    "Description",
    "Steps",
    "Expected Result",
    "Actual Result",
    "Failed Reason",
    "Screenshot URL",
  ];

  const csvRows = (rows || []).map((tc: Record<string, unknown> & { modules?: { name?: string } }) => [
    escapeCsv((tc.created_at as string) || ""),
    escapeCsv(tc.modules?.name || ""),
    escapeCsv((tc.title as string) || ""),
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
