"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestCase } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIRegressionTest {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  steps: { action: string; expected: string }[];
  expected_result: string;
}

interface GenerateRegressionTestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bug: TestCase;
  moduleName?: string;
  onImport: (
    tests: Array<{
      title: string;
      description: string;
      priority: "critical" | "high" | "medium" | "low";
      steps: { action: string; expected: string }[];
      expected_result: string;
      module_id: string;
    }>
  ) => Promise<void>;
}

// ─── Priority colours ─────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500 border-red-500/30",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

// ─── Preview card ──────────────────────────────────────────────────────────────

function RegressionTestPreviewCard({
  test,
  selected,
  onToggle,
}: {
  test: AIRegressionTest;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all cursor-pointer",
        selected
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-border/70"
      )}
    >
      <div className="flex items-start gap-3 p-3" onClick={onToggle}>
        <div className="mt-0.5 flex-shrink-0 text-primary">
          {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
        </div>

        <span className={cn("mt-0.5 flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", PRIORITY_COLOR[test.priority])}>
          {test.priority}
        </span>

        <p className="flex-1 text-xs font-semibold text-foreground leading-snug">
          {test.title}
        </p>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
          {test.description && (
            <p className="text-[11px] text-muted-foreground">{test.description}</p>
          )}

          {test.steps.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Steps</p>
              {test.steps.map((step, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-foreground">{step.action}</span>
                    {step.expected && <span className="text-muted-foreground"> → {step.expected}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Expected Result</p>
            <p className="text-[11px] text-foreground">{test.expected_result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function GenerateRegressionTestsDialog({
  open,
  onOpenChange,
  bug,
  moduleName,
  onImport,
}: GenerateRegressionTestsDialogProps) {
  const [view, setView] = useState<"intro" | "results">("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<AIRegressionTest[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setView("intro");
    setError(null);
    setGenerated([]);
    setSelected(new Set());
  };

  // Reset whenever a different bug is opened
  useEffect(() => {
    if (open) reset();
  }, [open, bug.id]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-regression-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bug.title,
          description: bug.description,
          moduleName,
          steps: bug.steps,
          expected_result: bug.expected_result,
          actual_result: bug.actual_result,
          priority: bug.priority,
          projectId: bug.project_id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI request failed");

      const tests: AIRegressionTest[] = json.tests ?? [];
      setGenerated(tests);
      setSelected(new Set(tests.map((_, i) => i)));
      setView("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = () => {
    if (selected.size === generated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generated.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const toImport = generated
      .filter((_, i) => selected.has(i))
      .map((test) => ({
        title: test.title,
        description: test.description,
        priority: test.priority,
        steps: test.steps,
        expected_result: test.expected_result,
        module_id: bug.module_id || "",
      }));

    if (toImport.length === 0) return;
    setImporting(true);
    try {
      await onImport(toImport);
      handleClose(false);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={() => handleClose(false)} className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── INTRO VIEW ── */}
        {view === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Generate Regression Test
              </DialogTitle>
              <DialogDescription className="text-xs">
                AI will turn this fixed bug into regression test case(s) in RunTest, so it gets checked on every future run.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", PRIORITY_COLOR[bug.priority])}>
                    {bug.priority}
                  </span>
                  {moduleName && (
                    <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-medium">
                      {moduleName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">{bug.title}</p>
                {bug.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-3">{bug.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {bug.steps.length} repro step{bug.steps.length !== 1 ? "s" : ""} on file
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground">
                💡 The primary test will directly re-verify this exact bug scenario. AI may add 1–2 related edge-case tests where useful.
              </p>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Regression Test</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── RESULTS VIEW ── */}
        {view === "results" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-emerald-500" />
                {generated.length} Regression Test{generated.length !== 1 ? "s" : ""} Ready
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review and select which tests to add to RunTest. All are selected by default.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between px-1 py-1">
              <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline">
                {selected.size === generated.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {selected.size} of {generated.length} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
              {generated.map((test, i) => (
                <RegressionTestPreviewCard
                  key={i}
                  test={test}
                  selected={selected.has(i)}
                  onToggle={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      next.has(i) ? next.delete(i) : next.add(i);
                      return next;
                    })
                  }
                />
              ))}
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView("intro")} className="gap-1.5">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                ) : (
                  <><FlaskConical className="h-4 w-4" /> Add {selected.size} to RunTest</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}