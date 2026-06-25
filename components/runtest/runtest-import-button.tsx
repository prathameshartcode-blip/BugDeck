"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, AlertTriangle, Info, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRunTestStore } from "@/store/runtest-store";
import { useAuthStore } from "@/store/auth-store";

const EXPECTED_COLUMNS = [
  { name: "Title", required: false },
  { name: "Description", required: false },
  { name: "Priority", required: false },
  { name: "Status", required: false },
  { name: "Module", required: false },
  { name: "Steps", required: false },
  { name: "Expected Result", required: false },
  { name: "Actual Result", required: false },
  { name: "Failed Reason", required: false },
  { name: "Screenshot URL", required: false },
];

const EXPECTED_COLUMN_NAMES = EXPECTED_COLUMNS.map((c) => c.name.toLowerCase());

const STATUS_MAP: Record<string, string> = {
  open: "open",
  new: "open",
  draft: "open",
  "in progress": "in_progress",
  in_progress: "in_progress",
  running: "in_progress",
  passed: "passed",
  pass: "passed",
  success: "passed",
  failed: "failed",
  fail: "failed",
  blocked: "blocked",
  todiscuss: "to_discuss",
  "to discuss": "to_discuss",
  discussion: "to_discuss",
};

const VALID_PRIORITIES = ["critical", "high", "medium", "low"];

const TEMPLATE_HEADERS = [
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
];

function col(row: Record<string, string>, name: string): string {
  const key = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? (row[key] ?? "").trim() : "";
}

function resolveStatus(rawStatus: string): string {
  const normalized = rawStatus.trim().toLowerCase();
  return STATUS_MAP[normalized] ?? "open";
}

function downloadTemplate() {
  const csvContent = TEMPLATE_HEADERS.join(",") + "\n";
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "runtest-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Modal({
  open, onClose, title, className, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative z-50 w-full rounded-xl border border-border bg-card p-6 shadow-lg mx-4",
              "max-h-[90vh] overflow-y-auto",
              className ?? "max-w-lg"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface RunTestImportButtonProps {
  projectId: string;
  onImported: () => void;
}

export function RunTestImportButton({ projectId, onImported }: RunTestImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { modules } = useRunTestStore();
  const { user } = useAuthStore();

  const [guideOpen, setGuideOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
    unmatchedColumns: string[];
  } | null>(null);

  const parseCsv = (text: string): Record<string, string>[] => {
    const cleaned = text.replace(/^\uFEFF/, "");
    if (!cleaned.trim()) return [];

    const firstLineEnd = cleaned.indexOf("\n");
    const firstLine = firstLineEnd === -1 ? cleaned : cleaned.slice(0, firstLineEnd);
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

    const parseAllRows = (src: string): string[][] => {
      const rows: string[][] = [];
      let row: string[] = [];
      let cur = "";
      let inQuote = false;

      for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        const next = src[i + 1];

        if (inQuote) {
          if (ch === '"' && next === '"') { cur += '"'; i++; }
          else if (ch === '"') { inQuote = false; }
          else { cur += ch; }
        } else {
          if (ch === '"') inQuote = true;
          else if (ch === delimiter) { row.push(cur.trim()); cur = ""; }
          else if (ch === "\r" && next === "\n") { row.push(cur.trim()); rows.push(row); row = []; cur = ""; i++; }
          else if (ch === "\n") { row.push(cur.trim()); rows.push(row); row = []; cur = ""; }
          else cur += ch;
        }
      }
      if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
      return rows;
    };

    const allRows = parseAllRows(cleaned).filter((r) => r.some((cell) => cell.length > 0));
    if (allRows.length < 2) return [];

    const headers = allRows[0].map((h) =>
      h.replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim()
    );

    return allRows.slice(1).map((values) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return row;
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const text = await file.text();
    const rows = parseCsv(text);

    if (!rows.length) {
      setResult({ imported: 0, skipped: 0, errors: ["The file appears to be empty or has no data rows."], unmatchedColumns: [] });
      setResultOpen(true);
      return;
    }

    const fileColumns = Object.keys(rows[0]);
    const unmatchedColumns = fileColumns.filter(
      (fc) =>
        !EXPECTED_COLUMN_NAMES.includes(fc.toLowerCase()) &&
        fc.toLowerCase() !== "test case id" &&
        fc.toLowerCase() !== "created at"
    );

    const moduleMap: Record<string, string> = {};
    modules
      .filter((m) => m.project_id === projectId)
      .forEach((m) => { moduleMap[m.name.toLowerCase()] = m.id; });

    setImporting(true);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = col(row, "Title") || `Test Case #${i + 1}`;

      let priority = col(row, "Priority").toLowerCase();
      if (!VALID_PRIORITIES.includes(priority)) priority = "medium";

      const status = resolveStatus(col(row, "Status"));
      const moduleName = col(row, "Module").toLowerCase();
      const moduleId = moduleName ? (moduleMap[moduleName] ?? null) : null;

      const stepsRaw = col(row, "Steps");
      const steps = stepsRaw
        ? stepsRaw.split("|").map((s, idx) => ({ order: idx + 1, action: s.trim(), expected: "" }))
        : [];

      const payload = {
        project_id: projectId,
        title,
        description: col(row, "Description") || null,
        status,
        priority,
        module_id: moduleId,
        steps,
        expected_result: col(row, "Expected Result") || "",
        actual_result: col(row, "Actual Result") || null,
        failed_reason: col(row, "Failed Reason") || null,
        screenshot_url: col(row, "Screenshot URL") || null,
        ...(user?.id ? { created_by: user.id } : {}),
      };

      const { error } = await supabase.from("test_cases").insert(payload);

      if (error) {
        skipped++;
        errors.push(`Row ${i + 2}: "${title}" — ${error.message}`);
      } else {
        imported++;
      }
    }

    setImporting(false);
    setResult({ imported, skipped, errors, unmatchedColumns });
    setResultOpen(true);
    if (imported > 0) onImported();
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

      <Button variant="outline" size="sm" disabled={importing} onClick={() => fileRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        {importing ? "Importing…" : "Import CSV"}
      </Button>

      <Button variant="ghost" size="sm" onClick={downloadTemplate} title="Download empty CSV template">
        <Download className="mr-2 h-4 w-4" />
        Template
      </Button>

      <button
        onClick={() => setGuideOpen(true)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Column guide
      </button>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="RunTest CSV Column Guide" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these column names (case-insensitive). Extra columns are ignored.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download empty CSV template
          </Button>
          <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Valid values
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Priority:</span> critical, high, medium, low
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Status:</span> open, in_progress, passed, failed, blocked, to_discuss
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Steps:</span> Separate with a pipe <code className="bg-muted px-1 rounded">|</code>
            </p>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setGuideOpen(false)}>Got it</Button>
          </div>
        </div>
      </Modal>

      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Import Result" className="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-3 text-center">
              <p className="text-2xl font-black text-green-600 dark:text-green-400">{result?.imported ?? 0}</p>
              <p className="text-xs text-green-700 dark:text-green-500 font-medium mt-0.5">Imported</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-black text-muted-foreground">{result?.skipped ?? 0}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Skipped</p>
            </div>
          </div>

          {(result?.unmatchedColumns?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Unrecognised columns (ignored):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result?.unmatchedColumns.map((c) => (
                  <span key={c} className="font-mono text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">{c}</span>
                ))}
              </div>
            </div>
          )}

          {(result?.errors?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 space-y-1 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Errors:</p>
              {result?.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
              ))}
            </div>
          )}

          {(result?.imported ?? 0) > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                {result?.imported} test case{result?.imported !== 1 ? "s" : ""} added to RunTest.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setResultOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
