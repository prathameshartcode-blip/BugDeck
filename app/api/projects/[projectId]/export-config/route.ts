import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getDefaultExportConfig,
  normalizeExportConfig,
  type ProjectExportConfig,
} from "@/lib/export-columns";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { projectId } = await context.params;
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("export_config")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    // Column may not exist yet — return defaults so the UI still works.
    if (error.message?.includes("export_config")) {
      return NextResponse.json({ config: getDefaultExportConfig() });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const config = normalizeExportConfig(data?.export_config ?? null);
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { projectId } = await context.params;
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  let body: { config?: ProjectExportConfig };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const config = normalizeExportConfig(body.config);
  const enabledCount = config.columns.filter((c) => c.enabled).length;
  if (enabledCount === 0) {
    return NextResponse.json(
      { error: "At least one column must be enabled" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({
      export_config: config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config });
}
