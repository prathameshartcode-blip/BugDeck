"use client";

import React, { useState, useEffect } from "react";
import { useBoardStore } from "@/store/board-store";
import { PromptColumn } from "./prompt-column";
import type { TestCase, TestCaseStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trash,
  Plus,
  Pencil,
  Check,
  X as XIcon,
  Download,
  Search,
  Loader2,
  Copy,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptViewProps {
  projectId: string;
}

const COLUMNS: Array<{ id: TestCaseStatus; title: string; color: string }> = [
  { id: "open", title: "Open", color: "bg-rose-500" },
  { id: "Fixed", title: "Fixed", color: "bg-emerald-500" },
  { id: "reopen", title: "Reopen", color: "bg-amber-500" },
  { id: "closed", title: "Closed", color: "bg-blue-500" },
];

export const PromptView: React.FC<PromptViewProps> = ({ projectId }) => {
  const {
    testCases,
    modules,
    loading,
    fetchBoardData,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    deleteMultipleTestCases,
    moveMultipleTestCases,
    addModule,
  } = useBoardStore();

  // Load project's cards/modules initially
  useEffect(() => {
    fetchBoardData(projectId);
  }, [projectId, fetchBoardData]);

  // Search and filter states
  const [textSearchFilter, setTextSearchFilter] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");

  // Selection states (bulk actions)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [bulkMoveStatus, setBulkMoveStatus] = useState<TestCaseStatus | "">("");

  // Dialog open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);

  // New prompt input states
  const [newPrompt, setNewPrompt] = useState({
    title: "",
    description: "",
    module_id: "",
    screenshot_urls: [] as string[],
  });
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");

  // Selected prompt detail editing state
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailModuleId, setDetailModuleId] = useState("");
  const [detailScreenshotUrls, setDetailScreenshotUrls] = useState<string[]>([]);
  const [isEditingField, setIsEditingField] = useState<string | null>(null);

  // Filter local testCases to get only prompt cards for this project
  const projectPrompts = testCases.filter(
    (tc) => tc.project_id === projectId && tc.type === "prompt"
  );

  const filteredCases = projectPrompts.filter((tc) => {
    const matchesModule = selectedModuleId === "all" || tc.module_id === selectedModuleId;
    const matchesText =
      textSearchFilter.trim() === "" ||
      tc.title.toLowerCase().includes(textSearchFilter.toLowerCase()) ||
      (tc.description || "").toLowerCase().includes(textSearchFilter.toLowerCase());
    return matchesModule && matchesText;
  });

  // Drag and Drop support
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropTestCase = async (id: string, newStatus: TestCaseStatus, overId?: string) => {
    const target = testCases.find((tc) => tc.id === id);
    if (!target) return;
    if (target.status === newStatus) return;

    try {
      await updateTestCase(id, { status: newStatus });
      toast.success(`Moved prompt to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to move prompt status.");
    }
  };

  // Selection toggle
  const handleSelectToggle = (id: string) => {
    setSelectedCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllInColumn = (ids: string[], selectAll: boolean) => {
    if (selectAll) {
      setSelectedCases((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedCases((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (selectedCases.length === 0) return;
    if (
      !window.confirm(`Are you sure you want to delete ${selectedCases.length} prompt cards?`)
    )
      return;

    try {
      await deleteMultipleTestCases(selectedCases);
      toast.success(`Successfully deleted ${selectedCases.length} prompts.`);
      setSelectedCases([]);
    } catch (err) {
      toast.error("Failed to delete selected prompts.");
    }
  };

  const handleBulkMove = async () => {
    if (selectedCases.length === 0 || !bulkMoveStatus) return;
    try {
      await moveMultipleTestCases(selectedCases, bulkMoveStatus);
      toast.success(`Moved ${selectedCases.length} prompts to ${bulkMoveStatus}.`);
      setSelectedCases([]);
      setBulkMoveStatus("");
    } catch (err) {
      toast.error("Failed to update status for selected prompts.");
    }
  };

  // Create prompt handler
  const handleCreatePrompt = async () => {
    if (!newPrompt.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!newPrompt.module_id) {
      toast.error("Please select a module.");
      return;
    }

    try {
      const added = await createTestCase({
        project_id: projectId,
        module_id: newPrompt.module_id,
        environment_id: null,
        tester_id: null,
        title: newPrompt.title,
        description: newPrompt.description,
        type: "prompt",
        priority: "medium",
        status: "open",
        steps: [],
        expected_result: "Prompt working",
        actual_result: null,
        screenshot_urls: newPrompt.screenshot_urls.filter(Boolean),
        notes: null,
      });

      if (added) {
        toast.success("New prompt card created successfully.");
        setNewPrompt({
          title: "",
          description: "",
          module_id: "",
          screenshot_urls: [],
        });
        setIsCreateOpen(false);
      }
    } catch (err) {
      toast.error("Failed to create prompt card.");
    }
  };

  // Open detail dialog
  const handleCardClick = (tc: TestCase) => {
    setSelectedTestCase(tc);
    setDetailTitle(tc.title);
    setDetailDescription(tc.description || "");
    setDetailModuleId(tc.module_id);
    setDetailScreenshotUrls(tc.screenshot_urls || []);
    setIsEditingField(null);
    setIsDetailOpen(true);
  };

  // Inline/field save in detail dialog
  const handleFieldUpdate = async (field: string) => {
    if (!selectedTestCase) return;

    let updates: Partial<TestCase> = {};
    if (field === "title") {
      if (!detailTitle.trim()) {
        toast.error("Title cannot be empty.");
        return;
      }
      updates.title = detailTitle;
    } else if (field === "description") {
      updates.description = detailDescription;
    } else if (field === "module") {
      updates.module_id = detailModuleId;
    } else if (field === "screenshot_urls") {
      updates.screenshot_urls = detailScreenshotUrls.filter(Boolean);
    }

    try {
      await updateTestCase(selectedTestCase.id, updates);
      toast.success("Field updated successfully.");
      setIsEditingField(null);

      // Refresh local selected state
      setSelectedTestCase((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      toast.error("Failed to save updates.");
    }
  };

  // Delete card from details
  const handleDeleteSelectedCard = async () => {
    if (!selectedTestCase) return;
    if (!window.confirm("Are you sure you want to delete this prompt?")) return;

    try {
      await deleteTestCase(selectedTestCase.id);
      toast.success("Prompt card deleted.");
      setIsDetailOpen(false);
    } catch (err) {
      toast.error("Failed to delete prompt card.");
    }
  };

  // Clipboard TSV formatting
  const handleCopyTsvToClipboard = () => {
    if (filteredCases.length === 0) {
      toast.error("No prompts found in the current filter to copy.");
      return;
    }

    const headers = ["Title", "Description", "Module", "Screenshots"];
    const rows = filteredCases.map((tc) => {
      const modName = modules.find((m) => m.id === tc.module_id)?.name || "";
      const screenshotsStr = (tc.screenshot_urls || []).join(", ");
      return [
        tc.title,
        tc.description || "",
        modName,
        screenshotsStr,
      ].map((val) => {
        let clean = val.replace(/"/g, '""');
        if (clean.includes("\t") || clean.includes("\n") || clean.includes('"')) {
          clean = `"${clean}"`;
        }
        return clean;
      });
    });

    const tsvContent = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");

    navigator.clipboard
      .writeText(tsvContent)
      .then(() => toast.success("Copied prompts to clipboard for Google Sheets!"))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to copy prompts to clipboard.");
      });
  };

  // Export CSV download url builder
  const getExportUrl = () => {
    const params = new URLSearchParams();
    params.set("projectId", projectId);
    params.set("type", "prompt");
    if (selectedModuleId !== "all") {
      params.set("module", selectedModuleId);
    }
    if (textSearchFilter.trim()) {
      params.set("text", textSearchFilter.trim());
    }
    return `/api/testcases/export?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Search / Filters / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/40 p-4 rounded-2xl shadow-sm select-none">
        <div className="flex flex-wrap items-center gap-3">
          {/* Text Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={textSearchFilter}
              onChange={(e) => setTextSearchFilter(e.target.value)}
              placeholder="Search prompts by text..."
              className="pl-9 h-9"
            />
          </div>

          {/* Module filter */}
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Modules</option>
            {modules
              .filter((m) => m.project_id === projectId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>

          {/* Selection toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedCases([]);
            }}
            className={cn(
              "h-9 px-3 text-xs gap-1.5",
              isSelectionMode && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            {isSelectionMode ? "Exit Select" : "Select Cards"}
          </Button>

          {/* Manage Modules button */}
          <Button variant="outline" size="sm" className="h-9" onClick={() => setIsModulesOpen(true)}>
            Manage Modules
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Clipboard Copy */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTsvToClipboard}
            className="h-9 gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy for Sheets
          </Button>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getExportUrl(), "_blank")}
            className="h-9 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          {/* Add Prompt Button */}
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-9 gap-1.5">
            <Plus className="h-4 w-4" /> Add Prompt
          </Button>
        </div>
      </div>

      {/* Bulk actions toolbar when selection mode is enabled */}
      {isSelectionMode && selectedCases.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 bg-primary/5 border border-primary/20 rounded-xl p-3 px-4 animate-in slide-in-from-top duration-150 shadow-inner">
          <span className="text-xs font-bold text-primary">
            {selectedCases.length} prompt cards selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {/* Bulk Move */}
            <select
              value={bulkMoveStatus}
              onChange={(e) => setBulkMoveStatus(e.target.value as any)}
              className="h-8 rounded border border-primary/20 bg-background text-xs px-2 focus:outline-none"
            >
              <option value="" disabled>
                Move to Status...
              </option>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkMove}
              disabled={!bulkMoveStatus}
              className="h-8 text-xs font-bold hover:bg-primary hover:text-white"
            >
              Apply Status
            </Button>

            {/* Bulk Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="h-8 text-xs font-bold flex items-center gap-1"
            >
              <Trash className="h-3.5 w-3.5" /> Delete Prompts
            </Button>
          </div>
        </div>
      )}

      {/* Board Columns container */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex gap-4 pb-6 overflow-x-auto select-none scrollbar-thin">
          {COLUMNS.map((col) => {
            const casesInCol = filteredCases.filter((tc) => tc.status === col.id);
            return (
              <PromptColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                testCases={casesInCol}
                onTestCaseClick={handleCardClick}
                onDragStart={handleDragStart}
                onDropTestCase={handleDropTestCase}
                selectedCases={selectedCases}
                onSelectToggle={handleSelectToggle}
                onSelectAllInColumn={handleSelectAllInColumn}
                isSelectionMode={isSelectionMode}
                modules={modules}
              />
            );
          })}
        </div>
      )}

      {/* ── Create Prompt Card Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>
              Add a prompt card manually to the board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Title</label>
              <Input
                value={newPrompt.title}
                onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                placeholder="e.g. Generation instructions for Authentication module"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Module</label>
              <div className="flex gap-2">
                <select
                  value={newPrompt.module_id}
                  onChange={(e) => {
                    if (e.target.value === "NEW") {
                      setCreatingModule(true);
                      setNewPrompt({ ...newPrompt, module_id: "" });
                    } else {
                      setNewPrompt({ ...newPrompt, module_id: e.target.value });
                    }
                  }}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={creatingModule}
                >
                  <option value="" disabled>
                    Select Module
                  </option>
                  {modules
                    .filter((m) => m.project_id === projectId)
                    .map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  <option value="NEW">+ Add New Module</option>
                </select>
              </div>
              {creatingModule && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New module name..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="text-xs h-8 flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (newModuleName) {
                        const m = await addModule(newModuleName, "", projectId);
                        setNewPrompt({ ...newPrompt, module_id: m?.id || "" });
                        setCreatingModule(false);
                        setNewModuleName("");
                      }
                    }}
                    disabled={!newModuleName}
                    type="button"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreatingModule(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Spacious Description Field for Prompts */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Description (System Instructions)</label>
              <Textarea
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                placeholder="Paste or write detailed system instructions / test prompts here..."
                className="min-h-[180px] font-mono text-xs bg-muted/10"
              />
            </div>

            {/* Screenshot URL input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">Screenshot URLs (Optional)</label>
              <div className="flex gap-2">
                <Input
                  value={newPrompt.screenshot_urls.join(", ")}
                  onChange={(e) =>
                    setNewPrompt({
                      ...newPrompt,
                      screenshot_urls: e.target.value.split(", ").filter(Boolean),
                    })
                  }
                  placeholder="https://..., https://..."
                  className="text-xs h-9 flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentUrls = newPrompt.screenshot_urls || [];
                    setNewPrompt({ ...newPrompt, screenshot_urls: [...currentUrls, ""] });
                  }}
                  className="h-9 px-3"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePrompt}
              disabled={!newPrompt.title.trim() || !newPrompt.module_id}
            >
              Create Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Prompt Detail / Edit Dialog ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent onClose={() => setIsDetailOpen(false)} className="max-w-2xl">
          {selectedTestCase && (
            <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs capitalize font-bold">
                    {selectedTestCase.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    ID: {selectedTestCase.id}
                  </span>
                </div>
                {/* Editable Title */}
                <div className="group relative">
                  {isEditingField === "title" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={detailTitle}
                        onChange={(e) => setDetailTitle(e.target.value)}
                        className="font-bold text-lg"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleFieldUpdate("title")}
                      >
                        <Check className="h-4 w-4 text-emerald-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setDetailTitle(selectedTestCase.title);
                          setIsEditingField(null);
                        }}
                      >
                        <XIcon className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-1.5 rounded"
                      onClick={() => setIsEditingField("title")}
                    >
                      <DialogTitle className="text-xl font-bold tracking-tight">
                        {selectedTestCase.title}
                      </DialogTitle>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </DialogHeader>

              {/* Status stepper / controller */}
              <div className="bg-muted/30 rounded-xl p-3 border border-border/40 select-none">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Status Workflow
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {COLUMNS.map((col) => {
                    const isCurrent = selectedTestCase.status === col.id;
                    return (
                      <Button
                        key={col.id}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDropTestCase(selectedTestCase.id, col.id)}
                        className={cn(
                          "text-xs capitalize font-semibold h-8",
                          isCurrent && "shadow-sm"
                        )}
                      >
                        {col.title}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Core Content Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Module Selector */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">Module</span>
                  <select
                    value={detailModuleId}
                    onChange={(e) => {
                      setDetailModuleId(e.target.value);
                      // Auto-save module change
                      setTimeout(() => {
                        updateTestCase(selectedTestCase.id, { module_id: e.target.value });
                        toast.success("Module updated.");
                      }, 50);
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none"
                  >
                    {modules
                      .filter((m) => m.project_id === projectId)
                      .map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Screenshot URLs */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>Screenshot URLs</span>
                    {isEditingField === "screenshot_urls" ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleFieldUpdate("screenshot_urls")}
                          className="text-[10px] text-emerald-500 font-bold hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setDetailScreenshotUrls(selectedTestCase.screenshot_urls || []);
                            setIsEditingField(null);
                          }}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingField("screenshot_urls")}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </span>
                  {isEditingField === "screenshot_urls" ? (
                    <Input
                      value={detailScreenshotUrls.join(", ")}
                      onChange={(e) =>
                        setDetailScreenshotUrls(e.target.value.split(", ").filter(Boolean))
                      }
                      className="h-8 text-xs"
                      placeholder="Paste comma-separated URLs"
                    />
                  ) : (
                    <div className="text-xs bg-muted/20 p-2 rounded border border-border/40 font-mono truncate">
                      {(selectedTestCase.screenshot_urls || []).join(", ") || "(No screenshots)"}
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Description Section (Spacious Textarea) */}
              <div className="space-y-1 group relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Description / Instructions
                  </span>
                  {isEditingField === "description" ? (
                    <div className="flex gap-1.5">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleFieldUpdate("description")}
                        className="h-6 text-[10px] px-2"
                      >
                        Save
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setDetailDescription(selectedTestCase.description || "");
                          setIsEditingField(null);
                        }}
                        className="h-6 text-[10px] px-2 text-rose-500"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingField("description")}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      Edit Description
                    </button>
                  )}
                </div>
                {isEditingField === "description" ? (
                  <Textarea
                    value={detailDescription}
                    onChange={(e) => setDetailDescription(e.target.value)}
                    className="min-h-[250px] font-mono text-xs p-3 bg-muted/10"
                    placeholder="Write detailed prompt description..."
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingField("description")}
                    className="whitespace-pre-wrap font-mono text-xs bg-muted/30 p-3 rounded-lg border border-border/40 min-h-[150px] cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {selectedTestCase.description || "No description provided. Click to add description."}
                  </div>
                )}
              </div>

              {/* Render Images if any exist */}
              {(selectedTestCase.screenshot_urls || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-muted-foreground block">
                    Screenshot Previews
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTestCase.screenshot_urls || []).map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 p-2 rounded-lg"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Screenshot {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Dialog Footer Actions */}
              <DialogFooter className="pt-4 border-t border-border/60">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelectedCard}
                  className="gap-1 text-xs"
                >
                  <Trash className="h-3.5 w-3.5" /> Delete Prompt
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Manage Modules Dialog ── */}
      <Dialog open={isModulesOpen} onOpenChange={setIsModulesOpen}>
        <DialogContent onClose={() => setIsModulesOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Modules</DialogTitle>
            <DialogDescription>
              Add or remove modules for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex gap-2">
              <Input
                placeholder="New module name..."
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                className="h-9"
              />
              <Button
                onClick={async () => {
                  if (newModuleName.trim()) {
                    await addModule(newModuleName.trim(), "", projectId);
                    setNewModuleName("");
                    toast.success("Module created.");
                  }
                }}
                disabled={!newModuleName.trim()}
              >
                Add
              </Button>
            </div>

            <div className="border border-border/50 rounded-lg max-h-60 overflow-y-auto divide-y divide-border/30">
              {modules
                .filter((m) => m.project_id === projectId)
                .map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between p-2 px-3">
                    <span className="text-xs font-semibold">{mod.name}</span>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsModulesOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
