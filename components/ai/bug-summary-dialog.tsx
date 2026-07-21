"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BugSummaryStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byModule: Record<string, number>;
}

interface BugSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  loading: boolean;
  stats: BugSummaryStats | null;
  headline: string | null;
  insights: string[];
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-slate-500/15 text-slate-500 border-slate-500/30",
  Fixed: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  reopen: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  todiscuss: "bg-red-500/15 text-red-500 border-red-500/30",
  closed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500 border-red-500/30",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

function StatRow({ label, counts, colorMap }: { label: string; counts: Record<string, number>; colorMap?: Record<string, string> }) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, value]) => (
          <span
            key={key}
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              colorMap?.[key] || "bg-muted text-muted-foreground border-border"
            )}
          >
            {key}: {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BugSummaryDialog({ open, onOpenChange, query, loading, stats, headline, insights }: BugSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Bug Summary
          </DialogTitle>
          <DialogDescription className="text-xs italic">"{query}"</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-xs">Analyzing matching bugs…</p>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {/* Headline */}
            <p className="text-sm font-semibold text-foreground leading-snug">{headline}</p>

            {/* Code-computed stats — always accurate, not AI-generated */}
            {stats && stats.total > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <ListChecks className="h-3.5 w-3.5" /> {stats.total} bug{stats.total !== 1 ? "s" : ""} matched
                </div>
                <StatRow label="By Status" counts={stats.byStatus} colorMap={STATUS_COLOR} />
                <StatRow label="By Priority" counts={stats.byPriority} colorMap={PRIORITY_COLOR} />
                <StatRow label="By Module" counts={stats.byModule} />
              </div>
            )}

            {/* AI narrative insights */}
            {insights.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Insights</p>
                <ul className="space-y-1.5">
                  {insights.map((insight, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}