"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { findBestModuleMatch, matchConfidence } from "@/lib/fuzzy-module-match";
import { cn } from "@/lib/utils";

/** Sentinel value — rows whose CSV module maps to this will NOT be imported */
export const SKIP_MODULE = "__SKIP__";

export interface ProjectModule {
  id: string;
  name: string;
}

interface ModuleMappingDialogProps {
  /** All unique CSV module names that did NOT exactly match a project module */
  unmatchedNames: string[];
  /** All modules available in this project */
  projectModules: ProjectModule[];
  /**
   * Called when the user confirms.
   * mapping: csvName → moduleId | "" (import without module) | SKIP_MODULE (exclude rows)
   */
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export function ModuleMappingDialog({
  unmatchedNames,
  projectModules,
  onConfirm,
  onCancel,
}: ModuleMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Initialise with fuzzy auto-suggestions
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const csvName of unmatchedNames) {
      const best = findBestModuleMatch(csvName, projectModules);
      // Pre-select if confidence ≥ 0.55, else leave blank (force manual pick)
      initial[csvName] = best && best.score >= 0.55 ? best.moduleId : "";
    }
    setMapping(initial);
  }, [unmatchedNames, projectModules]);

  const noModuleCount = unmatchedNames.filter(
    (n) => mapping[n] === "" || mapping[n] === undefined
  ).length;
  const skipCount = unmatchedNames.filter((n) => mapping[n] === SKIP_MODULE).length;
  const mappedCount = unmatchedNames.filter(
    (n) => mapping[n] && mapping[n] !== SKIP_MODULE
  ).length;

  const allDecided = noModuleCount === 0; // every row is either mapped or explicitly skipped

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-50 w-full max-w-2xl mx-4 rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-[18px] w-[18px] text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Module Mapping</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unmatchedNames.length} module name{unmatchedNames.length !== 1 ? "s" : ""}{" "}
                  from your CSV didn't exactly match a project module. Review below before
                  importing.
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> High confidence (auto-matched)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Medium — please verify
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Low — manual pick needed
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm z-10">
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-[42%]">
                    CSV Module Name
                  </th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-24">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {unmatchedNames.map((csvName) => {
                  const best = findBestModuleMatch(csvName, projectModules);
                  const selectedValue = mapping[csvName] ?? "";
                  const isSkipped = selectedValue === SKIP_MODULE;
                  const conf = best ? matchConfidence(best.score) : null;

                  const dotColor =
                    !best || best.score < 0.55
                      ? "bg-red-500"
                      : best.score < 0.85
                      ? "bg-amber-500"
                      : "bg-green-500";

                  return (
                    <tr
                      key={csvName}
                      className={cn(
                        "transition-colors",
                        isSkipped
                          ? "bg-muted/40 opacity-60"
                          : "hover:bg-muted/20"
                      )}
                    >
                      {/* CSV name */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {isSkipped ? (
                            <Ban className="h-3 w-3 text-muted-foreground shrink-0" />
                          ) : (
                            <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
                          )}
                          <code
                            className={cn(
                              "text-xs bg-muted px-1.5 py-0.5 rounded font-mono",
                              isSkipped ? "line-through text-muted-foreground" : "text-foreground"
                            )}
                          >
                            {csvName}
                          </code>
                          {isSkipped && (
                            <span className="text-[10px] text-muted-foreground italic">skipped</span>
                          )}
                        </div>
                      </td>

                      {/* Dropdown */}
                      <td className="px-5 py-3">
                        <select
                          value={selectedValue}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, [csvName]: e.target.value }))
                          }
                          className={cn(
                            "w-full h-8 rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
                            isSkipped
                              ? "border-border text-muted-foreground italic"
                              : selectedValue === ""
                              ? "border-amber-400/60 text-muted-foreground"
                              : "border-input text-foreground"
                          )}
                        >
                          {/* Skip option — prominently at top */}
                          <option value={SKIP_MODULE}>⛔ Skip — don't import these rows</option>

                          {/* Divider group */}
                          <optgroup label="─── Assign to module ───">
                            <option value="">◦ No module (import without assigning)</option>
                            {projectModules.map((mod) => (
                              <option key={mod.id} value={mod.id}>
                                {mod.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </td>

                      {/* Confidence badge */}
                      <td className="px-3 py-3">
                        {isSkipped ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : conf ? (
                          <span className={cn("text-[11px] font-semibold", conf.colorClass)}>
                            {Math.round((best?.score ?? 0) * 100)}% {conf.label}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No modules</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border shrink-0">
            {/* Stats row */}
            <div className="flex flex-wrap gap-3 mb-3">
              {mappedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  {mappedCount} mapped to project module{mappedCount !== 1 ? "s" : ""}
                </span>
              )}
              {noModuleCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                  <AlertTriangle className="h-3 w-3" />
                  {noModuleCount} will import without a module
                </span>
              )}
              {skipCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                  <Ban className="h-3 w-3" />
                  {skipCount} module{skipCount !== 1 ? "s" : ""} skipped (rows excluded)
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-muted-foreground">
                {allDecided
                  ? "✅ All modules decided. Ready to import."
                  : `⚠️ ${noModuleCount} module${noModuleCount !== 1 ? "s" : ""} still unassigned — rows will import without a module.`}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => onConfirm(mapping)} className="gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm &amp; Import
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
