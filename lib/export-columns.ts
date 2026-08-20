import type { TestCase, TestCaseStatus } from "@/types/database";

/** Identifiers for every exportable bug-board column. */
export type ExportColumnId =
  | "created_at"
  | "module"
  | "title"
  | "description"
  | "steps"
  | "expected_result"
  | "status"
  | "screenshot_urls"
  | "priority"
  | "actual_result"
  | "notes"
  | "type"
  | "updated_at"
  | "tester";

export type ExportColumnEntry = {
  id: ExportColumnId;
  enabled: boolean;
};

/** Project-level export layout stored in the database. */
export type ProjectExportConfig = {
  columns: ExportColumnEntry[];
};

export type ExportFormat = "csv" | "tsv";

export type ExportRowContext = {
  moduleName?: string;
  testerName?: string;
};

type ColumnDef = {
  id: ExportColumnId;
  label: string;
  description: string;
  getValue: (tc: TestCase, ctx: ExportRowContext, format: ExportFormat) => string;
};

const COLUMN_DEFS: Record<ExportColumnId, ColumnDef> = {
  created_at: {
    id: "created_at",
    label: "Created At",
    description: "When the bug was first logged",
    getValue: (tc) => tc.created_at || "",
  },
  module: {
    id: "module",
    label: "Module",
    description: "Feature area or component",
    getValue: (_tc, ctx) => ctx.moduleName || "",
  },
  tester: {
    id: "tester",
    label: "Tester",
    description: "Who logged or tested this bug",
    getValue: (_tc, ctx) => ctx.testerName || "",
  },
  title: {
    id: "title",
    label: "Title",
    description: "Short bug summary",
    getValue: (tc) => tc.title || "",
  },
  description: {
    id: "description",
    label: "Description",
    description: "Detailed bug description",
    getValue: (tc) => tc.description || "",
  },
  steps: {
    id: "steps",
    label: "Steps",
    description: "Reproduction steps",
    getValue: (tc, _ctx, format) => {
      const steps = tc.steps || [];
      if (format === "tsv") {
        return steps
          .map((s, i) => `${s.order || i + 1}. ${s.action} → ${s.expected}`)
          .join(" | ");
      }
      return steps
        .map((s, i) => `${s.order || i + 1}. ${s.action}`)
        .join(" | ");
    },
  },
  expected_result: {
    id: "expected_result",
    label: "Expected Result",
    description: "What should happen",
    getValue: (tc) => tc.expected_result || "",
  },
  status: {
    id: "status",
    label: "Status",
    description: "Current kanban status",
    getValue: (tc, _ctx, format) => {
      const status = (tc.status || "open") as TestCaseStatus;
      return format === "csv" ? status.toLowerCase() : status;
    },
  },
  screenshot_urls: {
    id: "screenshot_urls",
    label: "Screenshot URLs",
    description: "Links to attached screenshots",
    getValue: (tc) => (tc.screenshot_urls || []).join(", "),
  },
  priority: {
    id: "priority",
    label: "Priority",
    description: "Bug severity level",
    getValue: (tc) => tc.priority || "medium",
  },
  actual_result: {
    id: "actual_result",
    label: "Actual Result",
    description: "What actually happened",
    getValue: (tc) => tc.actual_result || "",
  },
  notes: {
    id: "notes",
    label: "Notes",
    description: "Additional QA notes",
    getValue: (tc) => tc.notes || "",
  },
  type: {
    id: "type",
    label: "Type",
    description: "Bug category (functional, security, etc.)",
    getValue: (tc) => tc.type || "functional",
  },
  updated_at: {
    id: "updated_at",
    label: "Updated At",
    description: "Last modification timestamp",
    getValue: (tc) => tc.updated_at || "",
  },
};

const DEFAULT_COLUMN_ORDER: ExportColumnId[] = [
  "created_at",
  "module",
  "title",
  "description",
  "steps",
  "expected_result",
  "status",
  "screenshot_urls",
  "priority",
  "actual_result",
  "notes",
];

/** All column definitions for the configuration UI. */
export function getExportColumnCatalog() {
  return Object.values(COLUMN_DEFS).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
}

/** Default layout — matches the original CSV export column set and order. */
export function getDefaultExportConfig(): ProjectExportConfig {
  return {
    columns: DEFAULT_COLUMN_ORDER.map((id) => ({ id, enabled: true })),
  };
}

/** Merge stored config with the catalog so new columns appear and unknown ids are dropped. */
export function normalizeExportConfig(raw: unknown): ProjectExportConfig {
  const fallback = getDefaultExportConfig();
  if (!raw || typeof raw !== "object") return fallback;

  const columnsRaw = (raw as ProjectExportConfig).columns;
  if (!Array.isArray(columnsRaw)) return fallback;

  const knownIds = new Set(Object.keys(COLUMN_DEFS) as ExportColumnId[]);
  const seen = new Set<ExportColumnId>();
  const normalized: ExportColumnEntry[] = [];

  for (const entry of columnsRaw) {
    if (!entry || typeof entry !== "object") continue;
    const id = (entry as ExportColumnEntry).id;
    if (!knownIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push({ id, enabled: Boolean((entry as ExportColumnEntry).enabled) });
  }

  // Append any newly added columns that weren't in the saved config.
  for (const id of Object.keys(COLUMN_DEFS) as ExportColumnId[]) {
    if (!seen.has(id)) {
      normalized.push({ id, enabled: false });
    }
  }

  if (normalized.filter((c) => c.enabled).length === 0) return fallback;
  return { columns: normalized };
}

export function getActiveExportColumns(config: ProjectExportConfig) {
  return config.columns.filter((c) => c.enabled);
}

export function getExportHeaders(config: ProjectExportConfig): string[] {
  return getActiveExportColumns(config).map((c) => COLUMN_DEFS[c.id].label);
}

export function formatExportRow(
  tc: TestCase,
  config: ProjectExportConfig,
  format: ExportFormat,
  ctx: ExportRowContext = {}
): string[] {
  return getActiveExportColumns(config).map((col) =>
    COLUMN_DEFS[col.id].getValue(tc, ctx, format)
  );
}

export function escapeCsv(val: string): string {
  if (!val) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function escapeTsv(val: string): string {
  if (!val) return "";
  return String(val)
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

/** Build tab-separated clipboard content (no header row) for Google Sheets paste. */
export function buildTsvContent(
  cases: TestCase[],
  config: ProjectExportConfig,
  getModuleName: (tc: TestCase) => string
): string {
  const rows = cases.map((tc) =>
    formatExportRow(tc, config, "tsv", { moduleName: getModuleName(tc) }).map(escapeTsv)
  );
  return rows.map((r) => r.join("\t")).join("\n");
}

/** Map a DB card row (with joined module name) to a TestCase for export. */
export function cardRowToTestCase(row: Record<string, unknown>): TestCase {
  const steps = Array.isArray(row.steps) ? row.steps : [];
  const modules = row.modules as { name?: string } | null | undefined;

  return {
    id: String(row.id ?? ""),
    module_id: String(row.module_id ?? ""),
    project_id: String(row.project_id ?? ""),
    environment_id: row.environment_id != null ? String(row.environment_id) : null,
    tester_id: row.tester_id != null ? String(row.tester_id) : null,
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : null,
    priority: (row.priority as TestCase["priority"]) || "medium",
    status: ((row.column_id ?? row.status ?? "open") as TestCaseStatus),
    steps: steps as TestCase["steps"],
    expected_result: String(row.expected_result ?? ""),
    actual_result: row.actual_result != null ? String(row.actual_result) : null,
    screenshot_urls: Array.isArray(row.screenshot_urls)
      ? (row.screenshot_urls as string[])
      : row.screenshot_url
        ? [String(row.screenshot_url)]
        : [],
    notes: row.notes != null ? String(row.notes) : null,
    created_by: String(row.created_by ?? ""),
    type: (row.type as TestCase["type"]) || "functional",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    ...(modules?.name ? {} : {}),
  };
}

export function getModuleNameFromCardRow(row: Record<string, unknown>): string {
  const modules = row.modules as { name?: string } | null | undefined;
  return modules?.name || "";
}

export function getTesterNameFromCardRow(row: Record<string, unknown>): string {
  const testers = row.testers as { name?: string } | null | undefined;
  return testers?.name || "";
}
