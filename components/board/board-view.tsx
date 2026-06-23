"use client";

import React, { useState, useEffect } from "react";
import { BoardColumn } from "./board-column";
import { useBoardStore } from "@/store/board-store";
import type { TestCase, TestCaseStatus, TestCasePriority, TestCaseType } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardViewProps {
  projectId: string;
}

// REORDERED COLUMNS: Open → Working → Closed → Reopen → To Discuss
const COLUMNS: Array<{ id: TestCaseStatus; title: string; color: string }> = [
  { id: "open", title: "Open", color: "bg-muted-foreground/40" },
  { id: "working", title: "Working", color: "bg-sky-500" },
  { id: "closed", title: "Closed", color: "bg-emerald-500" },
  { id: "reopen", title: "Reopen", color: "bg-amber-500" },
  { id: "todiscuss", title: "To Discuss", color: "bg-red-500" },
];

export const BoardView: React.FC<BoardViewProps> = ({ projectId }) => {
  const { testCases, reorderTestCase, updateTestCase, deleteTestCase, createTestCase, addModule, modules, fetchBoardData } = useBoardStore();

  useEffect(() => {
    if (projectId) {
      fetchBoardData(projectId);
    }
  }, [projectId, fetchBoardData]);
  
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    title: "",
    description: "",
    type: "functional",
    priority: "medium",
    expected_result: "",
    module_id: "",
    screenshot_url: "",
  });
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newSteps, setNewSteps] = useState<{action: string; expected: string}[]>([]);
  const [stepAction, setStepAction] = useState("");
  const [stepExpected, setStepExpected] = useState("");

  const [activeTab, setActiveTab] = useState<"details" | "steps" | "notes">("details");

  // Filters state
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // NEW: Status filter

  // Filtered test cases for the active project
  const projectCases = testCases.filter((tc) => tc.project_id === projectId);
  
  const filteredCases = projectCases.filter((tc) => {
    const matchesType = typeFilter === "all" || tc.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || tc.priority === priorityFilter;
    const matchesModule = moduleFilter === "all" || tc.module_id === moduleFilter;
    const matchesStatus = statusFilter === "all" || tc.status === statusFilter; // NEW: Status filter logic
    return matchesType && matchesPriority && matchesModule && matchesStatus;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropTestCase = async (id: string, newStatus: TestCaseStatus, overId?: string) => {
    await reorderTestCase(id, newStatus, overId);
  };

  const handleTestCaseClick = (tc: TestCase) => {
    setSelectedTestCase(tc);
    setActiveTab("details");
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (status: TestCaseStatus) => {
    if (!selectedTestCase) return;
    await updateTestCase(selectedTestCase.id, { status });
    setSelectedTestCase({ ...selectedTestCase, status });
  };

  const handleSaveNotes = async (notes: string) => {
    if (!selectedTestCase) return;
    await updateTestCase(selectedTestCase.id, { notes });
    setSelectedTestCase({ ...selectedTestCase, notes });
  };

  const handleSaveActualResult = async (actualResult: string) => {
    if (!selectedTestCase) return;
    await updateTestCase(selectedTestCase.id, { actual_result: actualResult });
    setSelectedTestCase({ ...selectedTestCase, actual_result: actualResult });
  };

  const handleDeleteTestCase = async () => {
    if (!selectedTestCase) return;
    if (confirm("Are you sure you want to delete this test case?")) {
      await deleteTestCase(selectedTestCase.id);
      setIsDetailOpen(false);
      setSelectedTestCase(null);
    }
  };

  const handleAddStep = () => {
    if (stepAction && stepExpected) {
      setNewSteps([...newSteps, { action: stepAction, expected: stepExpected }]);
      setStepAction("");
      setStepExpected("");
    }
  };

  const handleCreateTestCase = async () => {
    if (!newTestCase.title || !newTestCase.module_id) return;
    await createTestCase({
      title: newTestCase.title,
      description: newTestCase.description || null,
      type: newTestCase.type as TestCaseType,
      priority: newTestCase.priority as TestCasePriority,
      expected_result: newTestCase.expected_result || "",
      module_id: newTestCase.module_id,
      project_id: projectId,
      status: "open",
      screenshot_url: newTestCase.screenshot_url || null,
      steps: newSteps.map((s, i) => ({ order: i + 1, action: s.action, expected: s.expected })),
      notes: null,
      actual_result: null,
    });
    setIsCreateOpen(false);
    setNewTestCase({ title: "", description: "", type: "functional", priority: "medium", expected_result: "", module_id: "", screenshot_url: "" });
    setNewSteps([]);
  };

  // Helper function to build export URL with all filters
  const getExportUrl = () => {
    const params = new URLSearchParams();
    params.append('projectId', projectId);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (priorityFilter !== 'all') params.append('priority', priorityFilter);
    if (moduleFilter !== 'all') params.append('module', moduleFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter); // NEW: Add status filter to export
    return `/api/testcases/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Board Controls / Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card select-none">
        <div className="flex flex-wrap items-center gap-3">
          {/* Module Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Module</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Modules</option>
              {modules.filter(m => m.project_id === projectId).map((mod) => (
                <option key={mod.id} value={mod.id}>{mod.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter - NEW */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="working">Working</option>
              <option value="closed">Closed</option>
              <option value="reopen">Reopen</option>
              <option value="todiscuss">To Discuss</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Test Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="functional">Functional</option>
              <option value="validation">Validation</option>
              <option value="security">Security</option>
              <option value="uat">UAT</option>
              <option value="regression">Regression</option>
              <option value="edge">Edge Cases</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Priority</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{filteredCases.length}</span> of {projectCases.length} test cases
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(getExportUrl(), '_blank')}>
            Export Bug List
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Test Case
          </Button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none">
        {COLUMNS.map((col) => (
          <BoardColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            testCases={filteredCases.filter((tc) => tc.status === col.id)}
            onTestCaseClick={handleTestCaseClick}
            onDragStart={handleDragStart}
            onDropTestCase={handleDropTestCase}
          />
        ))}
      </div>

      {/* Test Case Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent onClose={() => setIsDetailOpen(false)} className="max-w-2xl">
          {selectedTestCase && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {selectedTestCase.type}
                  </Badge>
                  <Badge className="capitalize text-[10px]">
                    {selectedTestCase.priority} Priority
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">
                    {selectedTestCase.id}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold leading-snug">
                  {selectedTestCase.title}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 leading-normal">
                  {selectedTestCase.description || "No description provided."}
                </DialogDescription>
              </DialogHeader>

              {/* Status Switcher & Actions bar - UPDATED ORDER */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 my-2 bg-muted/40 border border-border/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                  <div className="flex gap-1">
                    {(["open", "working", "closed", "reopen", "todiscuss"] as TestCaseStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-colors border",
                          selectedTestCase.status === st
                            ? st === "closed"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                              : st === "todiscuss"
                              ? "bg-red-500/10 text-red-600 border-red-500/30"
                              : st === "reopen"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-primary/10 text-primary border-primary/30"
                            : "bg-background border-border text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleDeleteTestCase}
                  className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete Test Case"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>

              {/* Dialog Content Tabs */}
              <div className="space-y-4">
                <div className="flex border-b border-border text-xs font-semibold">
                  {["details", "steps", "notes"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-4 py-2 border-b-2 capitalize -mb-px transition-colors",
                        activeTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab: Details */}
                {activeTab === "details" && (
                  <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground">Expected Result</span>
                      <p className="p-3 bg-muted/30 border border-border/50 rounded-lg text-xs leading-normal">
                        {selectedTestCase.expected_result}
                      </p>
                    </div>

                    {selectedTestCase.screenshot_url && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-muted-foreground">Screenshot</span>
                        <a href={selectedTestCase.screenshot_url} target="_blank" rel="noreferrer" className="block p-2 bg-muted/30 border border-border/50 rounded-lg text-xs text-primary hover:underline truncate">
                          {selectedTestCase.screenshot_url}
                        </a>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground">Actual Result / Execution Report</span>
                      <Textarea
                        placeholder="Log the execution output, actual vs expected mismatches, screenshot logs..."
                        value={selectedTestCase.actual_result || ""}
                        onChange={(e) => handleSaveActualResult(e.target.value)}
                        rows={3}
                        className="text-xs font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Steps */}
                {activeTab === "steps" && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-muted-foreground">Execution Steps</span>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {selectedTestCase.steps.map((step) => (
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
                              <strong className="text-[10px] text-muted-foreground uppercase block font-semibold">Expected Response</strong>
                              <span className="text-muted-foreground">{step.expected}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Notes */}
                {activeTab === "notes" && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground">QA Notes & Debug logs</span>
                    <Textarea
                      placeholder="Add specific setup requirements, test user logins, test database states, or debugging tickets..."
                      value={selectedTestCase.notes || ""}
                      onChange={(e) => handleSaveNotes(e.target.value)}
                      rows={5}
                      className="text-xs font-medium leading-relaxed"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-border/60">
                <Button size="sm" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Test Case Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Test Case</DialogTitle>
            <DialogDescription>Add a test case manually to the board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Title</label>
              <Input
                value={newTestCase.title}
                onChange={(e) => setNewTestCase({ ...newTestCase, title: e.target.value })}
                placeholder="e.g. Verify Login Button"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Module</label>
              <div className="flex gap-2">
                <select
                  value={newTestCase.module_id}
                  onChange={(e) => {
                    if (e.target.value === "NEW") {
                      setCreatingModule(true);
                      setNewTestCase({ ...newTestCase, module_id: "" });
                    } else {
                      setNewTestCase({ ...newTestCase, module_id: e.target.value });
                    }
                  }}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={creatingModule}
                >
                  <option value="" disabled>Select Module</option>
                  {modules.filter(m => m.project_id === projectId).map((mod) => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                  <option value="NEW">+ Add New Module</option>
                </select>
              </div>
              {creatingModule && (
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="New module name..." 
                    value={newModuleName} 
                    onChange={e=>setNewModuleName(e.target.value)} 
                    className="text-xs h-8 flex-1"
                  />
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      if (newModuleName) {
                        const m = await addModule(newModuleName, "", projectId);
                        setNewTestCase({...newTestCase, module_id: m?.id});
                        setCreatingModule(false);
                        setNewModuleName("");
                      }
                    }}
                    disabled={!newModuleName}
                    type="button"
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCreatingModule(false)} type="button">Cancel</Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Type</label>
                <select
                  value={newTestCase.type}
                  onChange={(e) => setNewTestCase({ ...newTestCase, type: e.target.value as any })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="functional">Functional</option>
                  <option value="validation">Validation</option>
                  <option value="security">Security</option>
                  <option value="uat">UAT</option>
                  <option value="regression">Regression</option>
                  <option value="edge">Edge Cases</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Priority</label>
                <select
                  value={newTestCase.priority}
                  onChange={(e) => setNewTestCase({ ...newTestCase, priority: e.target.value as any })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Description</label>
              <Textarea
                value={newTestCase.description || ""}
                onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                placeholder="Briefly describe the test..."
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Expected Result</label>
              <Textarea
                value={newTestCase.expected_result}
                onChange={(e) => setNewTestCase({ ...newTestCase, expected_result: e.target.value })}
                placeholder="What should happen overall?"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Screenshot URL (Optional)</label>
              <Input
                value={newTestCase.screenshot_url || ""}
                onChange={(e) => setNewTestCase({ ...newTestCase, screenshot_url: e.target.value })}
                placeholder="https://..."
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-xs font-semibold">Test Steps</label>
              <div className="space-y-2">
                {newSteps.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs items-center bg-muted/40 p-2 rounded-md">
                    <span className="font-bold text-muted-foreground shrink-0">{i+1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate"><span className="font-semibold text-muted-foreground uppercase text-[10px] mr-1">Action</span>{s.action}</div>
                      <div className="truncate"><span className="font-semibold text-muted-foreground uppercase text-[10px] mr-1">Expected</span>{s.expected}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                <Input value={stepAction} onChange={e=>setStepAction(e.target.value)} placeholder="Step action (e.g. Click login button)" className="text-xs h-8" />
                <Input value={stepExpected} onChange={e=>setStepExpected(e.target.value)} placeholder="Expected outcome (e.g. Loading spinner appears)" className="text-xs h-8" />
                <Button variant="secondary" size="sm" onClick={handleAddStep} type="button" disabled={!stepAction || !stepExpected}>
                  Add Step
                </Button>
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTestCase} disabled={!newTestCase.title || !newTestCase.module_id}>Create Test Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};