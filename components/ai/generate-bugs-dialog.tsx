"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageDropZone } from "./image-drop-zone";
import { Bug, ArrowLeft, ChevronDown, ChevronRight, Loader2, CheckSquare, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIBug {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  steps: { action: string; expected: string }[];
  expected_result: string;
  actual_result: string;
}

interface GenerateBugsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  modules: Module[];
  onImport: (
    bugs: Array<{
      title: string;
      description: string;
      priority: "critical" | "high" | "medium" | "low";
      steps: { action: string; expected: string }[];
      expected_result: string;
      actual_result: string;
      module_id: string;
    }>
  ) => Promise<void>;
}

// ─── Priority colours ─────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low:      "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

// ─── Card sub-component ───────────────────────────────────────────────────────

function BugPreviewCard({
  bug,
  selected,
  onToggle,
}: {
  bug: AIBug;
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
      {/* Header row */}
      <div className="flex items-start gap-3 p-3" onClick={onToggle}>
        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0 text-primary">
          {selected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Priority badge */}
        <span className={cn("mt-0.5 flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", PRIORITY_COLOR[bug.priority])}>
          {bug.priority}
        </span>

        {/* Title */}
        <p className="flex-1 text-xs font-semibold text-foreground leading-snug">
          {bug.title}
        </p>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
          {bug.description && (
            <p className="text-[11px] text-muted-foreground">{bug.description}</p>
          )}

          {bug.steps.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Steps to Reproduce</p>
              {bug.steps.map((step, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-foreground">{step.action}</span>
                    {step.expected && (
                      <span className="text-muted-foreground"> → {step.expected}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Expected</p>
              <p className="text-[11px] text-foreground">{bug.expected_result}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase">Actual (Bug)</p>
              <p className="text-[11px] text-foreground">{bug.actual_result}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function GenerateBugsDialog({
  open,
  onOpenChange,
  projectId,
  modules,
  onImport,
}: GenerateBugsDialogProps) {
  const [view, setView] = useState<"input" | "results">("input");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [images, setImages] = useState<Array<{ base64: string; mimeType: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<AIBug[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  const projectModules = modules.filter((m) => m.project_id === projectId);

  const reset = () => {
    setView("input");
    setDescription("");
    setModuleId("");
    setImages([]);
    setError(null);
    setGenerated([]);
    setSelected(new Set());
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleGenerate = async () => {
    if (!description.trim() && images.length === 0) return;
    if (!moduleId) {
      setError("Please select a module before generating.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const moduleName = projectModules.find((m) => m.id === moduleId)?.name;
      const res = await fetch("/api/ai/generate-bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          moduleName,
          images,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI request failed");

      const bugs: AIBug[] = json.bugs ?? [];
      setGenerated(bugs);
      setSelected(new Set(bugs.map((_, i) => i)));
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
      .map((bug) => ({
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
        steps: bug.steps,
        expected_result: bug.expected_result,
        actual_result: bug.actual_result,
        module_id: moduleId,
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
      <DialogContent
        onClose={() => handleClose(false)}
        className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* ── INPUT VIEW ── */}
        {view === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Bug className="h-4 w-4 text-red-500" />
                Report Bug(s) with AI
              </DialogTitle>
              <DialogDescription className="text-xs">
                Describe what went wrong and optionally paste a screenshot. AI will detect and generate one bug report per issue found.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  What went wrong?{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional if screenshot provided)
                  </span>
                </label>
                <Textarea
                  placeholder={`e.g. "The OTP input accepts non-numeric characters and the timer shows wrong time. Also the resend button doesn't work on mobile."`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  💡 Tip: Describe multiple bugs in one sentence — AI will separate them into individual bug reports
                </p>
              </div>

              {/* Module */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Module <span className="text-destructive">*</span>
                </label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className={cn(
                    "w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                    !moduleId && error?.includes("module") ? "border-destructive" : "border-input"
                  )}
                >
                  <option value="">Select a module…</option>
                  {projectModules.map((mod) => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
                {!moduleId && error?.includes("module") && (
                  <p className="text-[11px] text-destructive">Please select a module before generating.</p>
                )}
              </div>

              {/* Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Bug Screenshots{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional — add up to 5 images for reference)
                  </span>
                </label>
                <ImageDropZone
                  images={images}
                  onImageAdd={(b64, mime) => setImages((prev) => [...prev, { base64: b64, mimeType: mime }])}
                  onImageRemove={(idx) => setImages((prev) => prev.filter((_, i) => i !== idx))}
                />
              </div>

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
                disabled={loading || (!description.trim() && images.length === 0) || !moduleId}
                className="gap-2 bg-red-500 hover:bg-red-600 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Analyze &amp; Generate Bugs</>
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
                <Bug className="h-4 w-4 text-red-500" />
                {generated.length} Bug{generated.length !== 1 ? "s" : ""} Found
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review and select which bugs to add to the board. All are selected by default.
              </DialogDescription>
            </DialogHeader>

            {/* Select all toggle */}
            <div className="flex items-center justify-between px-1 py-1">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selected.size === generated.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {selected.size} of {generated.length} selected
              </span>
            </div>

            {/* Bug cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
              {generated.map((bug, i) => (
                <BugPreviewCard
                  key={i}
                  bug={bug}
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
              <Button variant="ghost" size="sm" onClick={() => setView("input")} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="gap-2 bg-red-500 hover:bg-red-600 text-white"
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                ) : (
                  <><Bug className="h-4 w-4" /> Add {selected.size} Bug{selected.size !== 1 ? "s" : ""} to Board</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
