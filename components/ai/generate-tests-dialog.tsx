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
import { Badge } from "@/components/ui/badge";
import { ImageDropZone } from "./image-drop-zone";
import { Sparkles, ArrowLeft, ChevronDown, ChevronRight, Loader2, CheckSquare, Square, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/types/database";
import { useProjectStore } from "@/store/project-store";
import { EditContextDialog } from "@/components/projects/edit-context-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AITestCase {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "functional" | "edge" | "security" | "regression";
  steps: { action: string; expected: string }[];
  expected_result: string;
}

interface GenerateTestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  modules: Module[];
  onImport: (
    cases: Array<{
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
  high:     "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low:      "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

const TYPE_COLOR: Record<string, string> = {
  functional: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  edge:       "bg-violet-500/15 text-violet-500 border-violet-500/30",
  security:   "bg-rose-500/15 text-rose-500 border-rose-500/30",
  regression: "bg-amber-500/15 text-amber-500 border-amber-500/30",
};

// ─── Card sub-component ───────────────────────────────────────────────────────

function TestCasePreviewCard({
  tc,
  selected,
  onToggle,
}: {
  tc: AITestCase;
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
      <div
        className="flex items-start gap-3 p-3"
        onClick={onToggle}
      >
        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0 text-primary">
          {selected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 flex-shrink-0">
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", PRIORITY_COLOR[tc.priority])}>
            {tc.priority}
          </span>
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", TYPE_COLOR[tc.type])}>
            {tc.type}
          </span>
        </div>

        {/* Title */}
        <p className="flex-1 text-xs font-semibold text-foreground leading-snug">
          {tc.title}
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
          {tc.description && (
            <p className="text-[11px] text-muted-foreground">{tc.description}</p>
          )}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Steps</p>
            {tc.steps.map((step, i) => (
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
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Expected Result</p>
            <p className="text-[11px] text-foreground">{tc.expected_result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function GenerateTestsDialog({
  open,
  onOpenChange,
  projectId,
  modules,
  onImport,
}: GenerateTestsDialogProps) {
  const [view, setView] = useState<"input" | "results">("input");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [images, setImages] = useState<Array<{ base64: string; mimeType: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<AITestCase[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [contextDialogOpen, setContextDialogOpen] = useState(false);

  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);
  const projectContext = project?.description?.trim() ?? "";

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
      const res = await fetch("/api/ai/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          moduleName,
          images,
          projectId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI request failed");

      const cases: AITestCase[] = json.testCases ?? [];
      setGenerated(cases);
      // Select all by default
      setSelected(new Set(cases.map((_, i) => i)));
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
      .map((tc) => ({
        title: tc.title,
        description: tc.description,
        priority: tc.priority,
        steps: tc.steps,
        expected_result: tc.expected_result,
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
    <>
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
                <Sparkles className="h-4 w-4 text-primary" />
                Generate Test Cases with AI
              </DialogTitle>
              <DialogDescription className="text-xs">
                Describe the feature and optionally paste a screenshot. AI will generate 5–8 structured test cases.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              {/* Project context preview */}
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Project Context
                  </span>
                  <button
                    type="button"
                    onClick={() => setContextDialogOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline flex-shrink-0"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
                {projectContext ? (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {projectContext}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/80 italic">
                    No project context set — add some to improve AI accuracy.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Feature Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder='e.g. "User can reset their password via an OTP sent to their email address"'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
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
                  Screenshots / Designs{" "}
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
                className="gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Test Cases</>
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
                <Sparkles className="h-4 w-4 text-primary" />
                {generated.length} Test Case{generated.length !== 1 ? "s" : ""} Generated
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review and select which ones to import. All are selected by default.
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

            {/* Card list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
              {generated.map((tc, i) => (
                <TestCasePreviewCard
                  key={i}
                  tc={tc}
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
                className="gap-2"
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Import {selected.size} Selected</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

    <EditContextDialog
      open={contextDialogOpen}
      onOpenChange={setContextDialogOpen}
      projectId={projectId}
    />
    </>
  );
}