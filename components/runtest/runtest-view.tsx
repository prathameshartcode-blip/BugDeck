"use client";

import React, { useState, useEffect } from "react";
import { RunTestColumn } from "./runtest-column";
import { useRunTestStore } from "@/store/runtest-store";
import type { RunTestCase, RunTestStatus, TestCasePriority } from "@/types/database";
import { RunTestImportButton } from "./runtest-import-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash, Plus, Pencil, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RunTestViewProps {
  projectId: string;
}

const COLUMNS: Array<{ id: RunTestStatus; title: string; color: string }> = [
  { id: "open",         title: "Open",         color: "bg-muted-foreground/40" },
  { id: "in_progress",  title: "In Progress",  color: "bg-sky-500" },
  { id: "passed",       title: "Passed",       color: "bg-emerald-500" },
  { id: "failed",       title: "Failed",       color: "bg-red-500" },
  { id: "blocked",      title: "Blocked",      color: "bg-amber-500" },
  { id: "to_discuss",   title: "To Discuss",   color: "bg-violet-500" },
];

const ALL_STATUSES: RunTestStatus[] = ["open", "in_progress", "passed", "failed", "blocked", "to_discuss"];
const PRIORITIES: TestCasePriority[] = ["critical", "high", "medium", "low"];

function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder = "",
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const save = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex gap-1.5 items-start w-full">
        {multiline ? (
          <Textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className={cn("text-xs font-medium flex-1", className)}
            onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
          />
        ) : (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={cn("text-xs h-8 flex-1", className)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          />
        )}
        <button onClick={save} className="p-1 rounded hover:bg-primary/10 text-primary mt-0.5"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={cancel} className="p-1 rounded hover:bg-destructive/10 text-destructive mt-0.5"><XIcon className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-1.5 w-full">
      <span className={cn("flex-1 text-xs leading-normal", !value && "text-muted-foreground italic", className)}>
        {value || placeholder}
      </span>
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted shrink-0 mt-0.5"
        title="Edit"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

function statusLabel(status: RunTestStatus): string {
  return COLUMNS.find((c) => c.id === status)?.title ?? status;
}

export const RunTestView: React.FC<RunTestViewProps> = ({ projectId }) => {
  const {
    testCases,
    reorderRunTestCase,
    updateRunTestCase,
    deleteRunTestCase,
    createRunTestCase,
    addModule,
    deleteModule,
    modules,
    fetchRunTestData,
  } = useRunTestStore();

  useEffect(() => {
    if (projectId) fetchRunTestData(projectId);
  }, [projectId, fetchRunTestData]);

  const [selectedCase, setSelectedCase] = useState<RunTestCase | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCase, setNewCase] = useState<Partial<RunTestCase>>({
    title: "", description: "", priority: "medium", expected_result: "", module_id: "", screenshot_url: "",
  });
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newSteps, setNewSteps] = useState<{ action: string; expected: string }[]>([]);
  const [stepAction, setStepAction] = useState("");
  const [stepExpected, setStepExpected] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "steps">("details");
  const [editCreatingModule, setEditCreatingModule] = useState(false);
  const [editNewModuleName, setEditNewModuleName] = useState("");
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [addingModuleName, setAddingModuleName] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const projectCases = testCases.filter((tc) => tc.project_id === projectId);
  const filteredCases = projectCases.filter((tc) => {
    const matchesPriority = priorityFilter === "all" || tc.priority === priorityFilter;
    const matchesModule = moduleFilter === "all" || tc.module_id === moduleFilter;
    const matchesStatus = statusFilter === "all" || tc.status === statusFilter;
    return matchesPriority && matchesModule && matchesStatus;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (id: string, newStatus: RunTestStatus, overId?: string) => {
    await reorderRunTestCase(id, newStatus, overId);
  };

  const handleCaseClick = (tc: RunTestCase) => {
    setSelectedCase(tc);
    setActiveTab("details");
    setEditCreatingModule(false);
    setEditNewModuleName("");
    setIsDetailOpen(true);
  };

  const handleFieldUpdate = async (field: keyof RunTestCase, value: string) => {
    if (!selectedCase) return;
    await updateRunTestCase(selectedCase.id, { [field]: value } as Partial<RunTestCase>);
    setSelectedCase({ ...selectedCase, [field]: value });
  };

  const handleUpdateStatus = async (status: RunTestStatus) => {
    if (!selectedCase) return;
    await updateRunTestCase(selectedCase.id, { status });
    setSelectedCase({ ...selectedCase, status });
  };

  const handleDelete = async () => {
    if (!selectedCase) return;
    if (confirm("Are you sure you want to delete this test case?")) {
      await deleteRunTestCase(selectedCase.id);
      setIsDetailOpen(false);
      setSelectedCase(null);
    }
  };

  const handleAddStep = () => {
    if (stepAction && stepExpected) {
      setNewSteps([...newSteps, { action: stepAction, expected: stepExpected }]);
      setStepAction("");
      setStepExpected("");
    }
  };

  const handleCreate = async () => {
    if (!newCase.title || !newCase.module_id) return;
    await createRunTestCase({
      title: newCase.title!,
      description: newCase.description || null,
      priority: newCase.priority as TestCasePriority,
      expected_result: newCase.expected_result || "",
      module_id: newCase.module_id!,
      project_id: projectId,
      status: "open",
      screenshot_url: newCase.screenshot_url || null,
      steps: newSteps.map((s, i) => ({ order: i + 1, action: s.action, expected: s.expected })),
      actual_result: null,
      failed_reason: null,
    });
    setIsCreateOpen(false);
    setNewCase({ title: "", description: "", priority: "medium", expected_result: "", module_id: "", screenshot_url: "" });
    setNewSteps([]);
  };

  const getExportUrl = () => {
    const params = new URLSearchParams();
    params.append("projectId", projectId);
    if (priorityFilter !== "all") params.append("priority", priorityFilter);
    if (moduleFilter !== "all") params.append("module", moduleFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    return `/api/runtest/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card select-none">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Module</span>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="all">All Modules</option>
              {modules.filter((m) => m.project_id === projectId).map((mod) => (
                <option key={mod.id} value={mod.id}>{mod.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>{statusLabel(st)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Priority</span>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{filteredCases.length}</span> of {projectCases.length} test cases
          </div>
          <RunTestImportButton projectId={projectId} onImported={() => fetchRunTestData(projectId)} />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(getExportUrl(), "_blank")}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsModulesOpen(true)}>
            Modules
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Test Case
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none">
        {COLUMNS.map((col) => (
          <RunTestColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            testCases={filteredCases.filter((tc) => tc.status === col.id)}
            onTestCaseClick={handleCaseClick}
            onDragStart={handleDragStart}
            onDropTestCase={handleDrop}
          />
        ))}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent onClose={() => setIsDetailOpen(false)} className="max-w-2xl">
          {selectedCase && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <select
                    value={selectedCase.priority}
                    onChange={(e) => handleFieldUpdate("priority", e.target.value)}
                    className="h-6 rounded border border-input bg-background px-2 text-[10px] font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p} Priority</option>)}
                  </select>

                  {!editCreatingModule ? (
                    <select
                      value={selectedCase.module_id || ""}
                      onChange={async (e) => {
                        if (e.target.value === "NEW") {
                          setEditCreatingModule(true);
                          setEditNewModuleName("");
                        } else {
                          await handleFieldUpdate("module_id", e.target.value);
                        }
                      }}
                      className="h-6 rounded border border-input bg-background px-2 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">No Module</option>
                      {modules.filter((m) => m.project_id === projectId).map((mod) => (
                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                      ))}
                      <option value="NEW">+ Add New Module</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        autoFocus
                        placeholder="Module name…"
                        value={editNewModuleName}
                        onChange={(e) => setEditNewModuleName(e.target.value)}
                        className="h-6 text-[10px] w-32 px-2"
                      />
                      <button
                        onClick={async () => {
                          if (!editNewModuleName.trim()) return;
                          const m = await addModule(editNewModuleName.trim(), "", projectId);
                          if (m?.id) await handleFieldUpdate("module_id", m.id);
                          setEditCreatingModule(false);
                          setEditNewModuleName("");
                        }}
                        className="p-1 rounded hover:bg-primary/10 text-primary"
                      ><Check className="h-3 w-3" /></button>
                      <button
                        onClick={() => { setEditCreatingModule(false); setEditNewModuleName(""); }}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      ><XIcon className="h-3 w-3" /></button>
                    </div>
                  )}

                  <span className="text-xs text-muted-foreground ml-auto font-mono">{selectedCase.id}</span>
                </div>

                <div className="text-base font-bold leading-snug">
                  <InlineEdit
                    value={selectedCase.title}
                    onSave={(v) => handleFieldUpdate("title", v)}
                    placeholder="Enter title…"
                    className="font-bold text-base"
                  />
                </div>

                <div className="text-xs mt-1 leading-normal text-muted-foreground">
                  <InlineEdit
                    value={selectedCase.description || ""}
                    onSave={(v) => handleFieldUpdate("description", v)}
                    multiline
                    placeholder="No description — click to add…"
                  />
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 my-2 bg-muted/40 border border-border/60 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                  <div className="flex flex-wrap gap-1">
                    {ALL_STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors border",
                          selectedCase.status === st
                            ? st === "passed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : st === "failed" ? "bg-red-500/10 text-red-600 border-red-500/30"
                            : st === "blocked" ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : "bg-primary/10 text-primary border-primary/30"
                            : "bg-background border-border text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {statusLabel(st)}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete Test Case"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex border-b border-border text-xs font-semibold">
                  {(["details", "steps"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-2 border-b-2 capitalize -mb-px transition-colors",
                        activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "details" && (
                  <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground">Expected Result</span>
                      <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                        <InlineEdit
                          value={selectedCase.expected_result || ""}
                          onSave={(v) => handleFieldUpdate("expected_result", v)}
                          multiline
                          placeholder="What should happen when this test passes…"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground">Actual Result</span>
                      <Textarea
                        placeholder="Log what happened during execution…"
                        value={selectedCase.actual_result || ""}
                        onChange={(e) => setSelectedCase({ ...selectedCase, actual_result: e.target.value })}
                        onBlur={(e) => handleFieldUpdate("actual_result", e.target.value)}
                        rows={3}
                        className="text-xs font-medium"
                      />
                    </div>

                    {(selectedCase.status === "failed" || selectedCase.failed_reason) && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-muted-foreground">Failed Reason</span>
                        <Textarea
                          placeholder="Why did this test fail?"
                          value={selectedCase.failed_reason || ""}
                          onChange={(e) => setSelectedCase({ ...selectedCase, failed_reason: e.target.value })}
                          onBlur={(e) => handleFieldUpdate("failed_reason", e.target.value)}
                          rows={3}
                          className="text-xs font-medium border-red-200/50"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground">Screenshot URL</span>
                      <div className="p-2 bg-muted/30 border border-border/50 rounded-lg">
                        <InlineEdit
                          value={selectedCase.screenshot_url || ""}
                          onSave={(v) => handleFieldUpdate("screenshot_url", v)}
                          placeholder="Paste screenshot URL…"
                        />
                      </div>
                      {selectedCase.screenshot_url && (
                        <a href={selectedCase.screenshot_url} target="_blank" rel="noreferrer"
                          className="text-[10px] text-primary hover:underline truncate block px-1">
                          Open link ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "steps" && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-muted-foreground">Steps to Check</span>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {selectedCase.steps.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No steps defined.</p>
                      ) : (
                        selectedCase.steps.map((step) => (
                          <div key={step.order} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/10 text-xs">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                              {step.order}
                            </span>
                            <div className="flex-1 space-y-1.5 leading-normal">
                              <div>
                                <strong className="text-[10px] text-muted-foreground uppercase block font-semibold">Action</strong>
                                <span className="text-foreground font-medium">{step.action}</span>
                              </div>
                              <div>
                                <strong className="text-[10px] text-muted-foreground uppercase block font-semibold">Expected</strong>
                                <span className="text-muted-foreground">{step.expected}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-border/60">
                <Button size="sm" onClick={() => setIsDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Test Case</DialogTitle>
            <DialogDescription>Add a test case to RunTest.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Title</label>
              <Input value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })} placeholder="e.g. Verify login with valid credentials" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Module</label>
              <select
                value={newCase.module_id}
                onChange={(e) => {
                  if (e.target.value === "NEW") { setCreatingModule(true); setNewCase({ ...newCase, module_id: "" }); }
                  else { setNewCase({ ...newCase, module_id: e.target.value }); }
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={creatingModule}
              >
                <option value="" disabled>Select Module</option>
                {modules.filter((m) => m.project_id === projectId).map((mod) => (
                  <option key={mod.id} value={mod.id}>{mod.name}</option>
                ))}
                <option value="NEW">+ Add New Module</option>
              </select>
              {creatingModule && (
                <div className="flex gap-2 mt-2">
                  <Input placeholder="New module name..." value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} className="text-xs h-8 flex-1" />
                  <Button size="sm" onClick={async () => {
                    if (newModuleName) {
                      const m = await addModule(newModuleName, "", projectId);
                      setNewCase({ ...newCase, module_id: m?.id || "" });
                      setCreatingModule(false);
                      setNewModuleName("");
                    }
                  }} disabled={!newModuleName} type="button">Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setCreatingModule(false)} type="button">Cancel</Button>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Priority</label>
              <select value={newCase.priority} onChange={(e) => setNewCase({ ...newCase, priority: e.target.value as TestCasePriority })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Description</label>
              <Textarea value={newCase.description || ""} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Expected Result</label>
              <Textarea value={newCase.expected_result} onChange={(e) => setNewCase({ ...newCase, expected_result: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Screenshot URL (Optional)</label>
              <Input value={newCase.screenshot_url || ""} onChange={(e) => setNewCase({ ...newCase, screenshot_url: e.target.value })} className="text-xs h-9" />
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-xs font-semibold">Steps to Check</label>
              {newSteps.map((s, i) => (
                <div key={i} className="flex gap-2 text-xs items-center bg-muted/40 p-2 rounded-md">
                  <span className="font-bold text-muted-foreground shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate"><span className="font-semibold text-[10px] mr-1">Action</span>{s.action}</div>
                    <div className="truncate"><span className="font-semibold text-[10px] mr-1">Expected</span>{s.expected}</div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                <Input value={stepAction} onChange={(e) => setStepAction(e.target.value)} placeholder="Step action" className="text-xs h-8" />
                <Input value={stepExpected} onChange={(e) => setStepExpected(e.target.value)} placeholder="Expected outcome" className="text-xs h-8" />
                <Button variant="secondary" size="sm" onClick={handleAddStep} type="button" disabled={!stepAction || !stepExpected}>Add Step</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newCase.title || !newCase.module_id}>Create Test Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModulesOpen} onOpenChange={setIsModulesOpen}>
        <DialogContent onClose={() => setIsModulesOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Modules</DialogTitle>
            <DialogDescription>Shared modules for bugs and RunTest in this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {modules.filter((m) => m.project_id === projectId).map((mod) => (
                <div key={mod.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs">
                  <span className="font-medium truncate">{mod.name}</span>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete module "${mod.name}"?`)) await deleteModule(mod.id, projectId);
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border space-y-2">
              <label className="text-xs font-semibold">Add New Module</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Module name…"
                  value={addingModuleName}
                  onChange={(e) => setAddingModuleName(e.target.value)}
                  className="text-xs h-8 flex-1"
                />
                <Button
                  size="sm"
                  disabled={!addingModuleName.trim() || addingModule}
                  onClick={async () => {
                    setAddingModule(true);
                    await addModule(addingModuleName.trim(), "", projectId);
                    setAddingModuleName("");
                    setAddingModule(false);
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsModulesOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
