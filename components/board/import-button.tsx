"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useBoardStore } from "@/store/board-store";
import { useAuthStore } from "@/store/auth-store";

// ── Expected columns ───────────────────────────────────────────────
const EXPECTED_COLUMNS = [
  { name: "Title",           required: false },
  { name: "Description",     required: false },
  { name: "Priority",        required: false },
  { name: "Status",          required: false },
  { name: "Module",          required: false },
  { name: "Steps",           required: false },
  { name: "Expected Result", required: false },
  { name: "Actual Result",   required: false },
  { name: "Notes",           required: false },
  { name: "Screenshot URL",  required: false },
];

const EXPECTED_COLUMN_NAMES = EXPECTED_COLUMNS.map((c) => c.name.toLowerCase());

// Map any common status name → our internal board statuses
const STATUS_MAP: Record<string, string> = {
  open:          "open",
  backlog:       "open",
  "to test":     "open",
  to_test:       "open",
  new:           "open",
  "in progress": "open",
  in_progress:   "open",
  working:       "open",
  assigned:      "open",
  fixed:         "Fixed",
  resolved:      "Fixed",
  passed:        "Fixed",
  verified:      "Fixed",
  reopen:        "reopen",
  reopened:      "reopen",
  "re-open":     "reopen",
  todiscuss:     "todiscuss",
  "to discuss":  "todiscuss",
  discussion:    "todiscuss",
  blocked:       "todiscuss",
  closed:        "closed",
  done:          "closed",
  failed:        "closed",
};

const VALID_PRIORITIES = ["critical", "high", "medium", "low"];

// Case-insensitive column lookup
function col(row: Record<string, string>, name: string): string {
  const key = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? (row[key] ?? "").trim() : "";
}

// ── Inline Modal (no external Dialog dependency) ───────────────────
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

// ── Props ──────────────────────────────────────────────────────────
interface ImportButtonProps {
  projectId: string;
  onImported: () => void;
}

export function ImportButton({ projectId, onImported }: ImportButtonProps) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const { modules } = useBoardStore();
  const { user }    = useAuthStore();

  const [guideOpen,  setGuideOpen]  = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped:  number;
    errors:   string[];
    unmatchedColumns: string[];
  } | null>(null);

  // ── Parse CSV → array of row objects ──────────────────────────
  const parseCsv = (text: string): Record<string, string>[] => {
    // Strip leading BOM if present
    const cleaned = text.replace(/^\uFEFF/, "");
    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Auto-detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

    // Parse a single line respecting quoted fields
    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let cur = "", inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"')                    { inQuote = !inQuote; }
        else if (ch === delimiter && !inQuote)  { values.push(cur.trim()); cur = ""; }
        else                                    { cur += ch; }
      }
      values.push(cur.trim());
      return values;
    };

    // Strip BOM + quotes from every header, then trim
    const headers = parseLine(firstLine).map((h) =>
      h.replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim()
    );

    return lines.slice(1).map((line) => {
      const values = parseLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return row;
    });
  };


  // ── Handle file selected ───────────────────────────────────────
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

    const fileColumns     = Object.keys(rows[0]);
    const unmatchedColumns = fileColumns.filter(
      (fc) =>
        !EXPECTED_COLUMN_NAMES.includes(fc.toLowerCase()) &&
        fc.toLowerCase() !== "bug id" &&
        fc.toLowerCase() !== "created at"
    );

    // Check required columns
    const missingRequired = EXPECTED_COLUMNS
      .filter((c) => c.required)
      .filter((c) => !fileColumns.some((fc) => fc.toLowerCase() === c.name.toLowerCase()));

    if (missingRequired.length > 0) {
      setResult({
        imported: 0,
        skipped:  rows.length,
        errors:   [`Missing required column: "${missingRequired.map((c) => c.name).join('", "')}"`],
        unmatchedColumns,
      });
      setResultOpen(true);
      return;
    }

    // ── Build module name → id map from store (same project) ──
    const moduleMap: Record<string, string> = {};
    modules
      .filter((m) => m.project_id === projectId)
      .forEach((m) => { moduleMap[m.name.toLowerCase()] = m.id; });

    // ── Insert rows using the same supabase client as the board store ──
    setImporting(true);
    let imported = 0;
    let skipped  = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2;

      // Use title from CSV, or fall back to "Bug #N" so no row is ever skipped
      const title = col(row, "Title") || `Bug #${i + 1}`;

      // Priority — default medium
      let priority = col(row, "Priority").toLowerCase();
      if (!VALID_PRIORITIES.includes(priority)) priority = "medium";

      // Status — map → internal, default "open"
      const rawStatus = col(row, "Status").toLowerCase();
      const status    = STATUS_MAP[rawStatus] ?? "open";

      // Module — match by name (case-insensitive)
      const moduleName = col(row, "Module").toLowerCase();
      const moduleId   = moduleName ? (moduleMap[moduleName] ?? null) : null;

      // Steps — pipe-separated string → array
      const stepsRaw = col(row, "Steps");
      const steps = stepsRaw
        ? stepsRaw.split("|").map((s, idx) => ({ order: idx + 1, action: s.trim(), expected: "" }))
        : [];

      const payload = {
        project_id:      projectId,
        title,
        description:     col(row, "Description")     || null,
        column_id:       status,       // same field the board store uses
        priority,
        module_id:       moduleId,
        steps,
        expected_result: col(row, "Expected Result") || "",
        actual_result:   col(row, "Actual Result")   || null,
        notes:           col(row, "Notes")           || null,
        screenshot_url:  col(row, "Screenshot URL")  || null,
        // created_by is set only when we have a logged-in user
        ...(user?.id ? { created_by: user.id } : {}),
      };

      const { error } = await supabase.from("cards").insert(payload);

      if (error) {
        skipped++;
        errors.push(`Row ${rowNum}: "${title}" — ${error.message}`);
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
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

      {/* Import button */}
      <Button
        variant="outline"
        size="sm"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {importing ? "Importing…" : "Import CSV"}
      </Button>

      {/* Column guide link */}
      <button
        onClick={() => setGuideOpen(true)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Column guide
      </button>

      {/* ── Column Guide Modal ── */}
      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="CSV Column Guide" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your CSV file must use these exact column names. Column names are case-insensitive.
            Extra columns are ignored. Missing optional columns get default values.
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2 font-semibold text-xs">Column Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Required</th>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Default if missing</th>
                </tr>
              </thead>
              <tbody>
                {EXPECTED_COLUMNS.map((c, i) => (
                  <tr key={c.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="px-3 py-2 font-mono text-xs">{c.name}</td>
                    <td className="px-3 py-2">
                      {c.required
                        ? <span className="text-xs font-semibold text-red-500">Required</span>
                        : <span className="text-xs text-muted-foreground">Optional</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {c.name === "Priority" && "medium"}
                      {c.name === "Status"   && "open"}
                      {c.name === "Module"   && "none"}
                      {!["Priority","Status","Module"].includes(c.name) && (c.required ? "—" : "empty")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Valid values
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Priority:</span> critical, high, medium, low
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Status:</span> open, fixed, closed, reopen, todiscuss
              <span className="text-muted-foreground/60 ml-1">(also: backlog, passed, failed, working, blocked, in progress…)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Module:</span> Must match an existing module name in this project.
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Steps:</span> Separate multiple steps with a pipe <code className="bg-muted px-1 rounded">|</code>
            </p>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setGuideOpen(false)}>Got it</Button>
          </div>
        </div>
      </Modal>

      {/* ── Import Result Modal ── */}
      <Modal open={resultOpen} onClose={() => setResultOpen(false)} title="Import Result" className="max-w-lg">
        <div className="space-y-4">
          {/* Summary */}
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

          {/* Unmatched columns warning */}
          {(result?.unmatchedColumns?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                These columns were not recognised and were ignored:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result?.unmatchedColumns.map((c) => (
                  <span key={c} className="font-mono text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">{c}</span>
                ))}
              </div>
              <p className="text-[11px] text-amber-600">
                Check the{" "}
                <button onClick={() => { setResultOpen(false); setGuideOpen(true); }} className="underline font-medium">
                  Column guide
                </button>{" "}
                for expected names.
              </p>
            </div>
          )}

          {/* Errors */}
          {(result?.errors?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 space-y-1 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Errors:</p>
              {result?.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
              ))}
            </div>
          )}

          {result?.imported === 0 && !result?.errors?.length && (
            <p className="text-sm text-muted-foreground text-center py-2">No rows were imported. Check your file format.</p>
          )}

          {(result?.imported ?? 0) > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                {result?.imported} bug{result?.imported !== 1 ? "s" : ""} successfully added to the board.
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
