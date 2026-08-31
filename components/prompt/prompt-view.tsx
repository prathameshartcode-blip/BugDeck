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
  Sparkles,
  Settings2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PromptExportConfigDialog,
  getDefaultPromptExportConfig,
  normalizePromptExportConfig,
  type PromptExportConfig,
} from "./prompt-export-config-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface PromptViewProps {
  projectId: string;
}

const COLUMNS: Array<{ id: TestCaseStatus; title: string; color: string }> = [
  { id: "open",   title: "Open",   color: "bg-rose-500" },
  { id: "Fixed",  title: "Fixed",  color: "bg-emerald-500" },
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

  // Load customized Prompt export config from localStorage
  const storageKey = `prompt_export_config_${projectId}`;
  const [promptExportConfig, setPromptExportConfig] = useState<PromptExportConfig>(
    getDefaultPromptExportConfig()
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setPromptExportConfig(normalizePromptExportConfig(JSON.parse(stored)));
        } catch {
          setPromptExportConfig(getDefaultPromptExportConfig());
        }
      } else {
        setPromptExportConfig(getDefaultPromptExportConfig());
      }
    }
  }, [projectId, storageKey]);

  // ------- Filter states -------
  const [textSearchFilter, setTextSearchFilter]     = useState("");
  const [statusFilter,     setStatusFilter]         = useState<string[]>([]);
  const [selectedModuleId, setSelectedModuleId]     = useState<string>("all");

  // ------- AI search -------
  const [aiSearchInput,   setAiSearchInput]   = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  // ------- Dialog states -------
  const [isCreateOpen,       setIsCreateOpen]       = useState(false);
  const [isDetailOpen,       setIsDetailOpen]       = useState(false);
  const [isModulesOpen,      setIsModulesOpen]      = useState(false);
  const [isExportConfigOpen, setIsExportConfigOpen] = useState(false);
  const [isMoreMenuOpen,     setIsMoreMenuOpen]     = useState(false);

  // ------- Selection / bulk -------
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCases,   setSelectedCases]   = useState<string[]>([]);
  const [bulkMoveStatus,  setBulkMoveStatus]  = useState<TestCaseStatus | "">("");

  // ------- Create form state -------
  const [newPrompt, setNewPrompt] = useState({
    title: "",
    description: "",
    module_id: "",
    screenshot_urls: [] as string[],
  });
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleName,  setNewModuleName]  = useState("");

  // ------- Detail edit state -------
  const [selectedTestCase,    setSelectedTestCase]    = useState<TestCase | null>(null);
  const [detailTitle,         setDetailTitle]         = useState("");
  const [detailDescription,   setDetailDescription]   = useState("");
  const [detailModuleId,      setDetailModuleId]      = useState("");
  const [detailScreenshotUrls, setDetailScreenshotUrls] = useState<string[]>([]);
  const [isEditingField,      setIsEditingField]      = useState<string | null>(null);

  // ------- Derived data -------
  const projectPrompts = testCases.filter(
    (tc) => tc.project_id === projectId && tc.type === "prompt"
  );

  const filteredCases = projectPrompts.filter((tc) => {
    const matchesModule = selectedModuleId === "all" || tc.module_id === selectedModuleId;
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(tc.status);
    const matchesText =
      textSearchFilter.trim() === "" ||
      tc.title.toLowerCase().includes(textSearchFilter.toLowerCase()) ||
      (tc.description || "").toLowerCase().includes(textSearchFilter.toLowerCase());
    return matchesModule && matchesStatus && matchesText;
  });

  // ------- AI natural language search -------
  const matchModuleNameToId = (name: string): string | null => {
    const projectModules = modules.filter((m) => m.project_id === projectId);
    const exact = projectModules.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (exact) return exact.id;
    const partial = projectModules.find(
      (m) =>
        m.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(m.name.toLowerCase())
    );
    return partial?.id ?? null;
  };

  // Helper function to format content based on export configuration
  const getFormattedRows = (casesToFormat: TestCase[], format: "csv" | "tsv") => {
    const enabledColumns = promptExportConfig.columns.filter((c) => c.enabled);
    
    const headers = enabledColumns.map((col) => {
      switch (col.id) {
        case "title": return "Title";
        case "description": return "Description";
        case "module": return "Module";
        case "screenshot_urls": return "Screenshot URLs";
        case "status": return "Status";
        case "created_at": return "Created At";
        default: return col.id;
      }
    });

    const rows = casesToFormat.map((tc) => {
      return enabledColumns.map((col) => {
        let val = "";
        switch (col.id) {
          case "title":
            val = tc.title || "";
            break;
          case "description":
            val = tc.description || "";
            break;
          case "module":
            val = modules.find((m) => m.id === tc.module_id)?.name || "";
            break;
          case "screenshot_urls":
            val = (tc.screenshot_urls || []).join(", ");
            break;
          case "status":
            val = tc.status || "";
            break;
          case "created_at":
            val = tc.created_at ? new Date(tc.created_at).toLocaleString() : "";
            break;
        }

        // Escape based on format
        const separator = format === "csv" ? "," : "\t";
        let clean = val.replace(/"/g, '""');
        if (clean.includes(separator) || clean.includes("\n") || clean.includes("\r") || clean.includes('"')) {
          clean = `"${clean}"`;
        }
        return clean;
      });
    });

    return { headers, rows };
  };

  const handleAiSearch = async () => {
    if (!aiSearchInput.trim()) return;
    setAiSearchLoading(true);
    try {
      const moduleNames = modules
        .filter((m) => m.project_id === projectId)
        .map((m) => m.name);

      const res = await fetch("/api/ai/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiSearchInput, moduleNames }),
      });
      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error ?? "Search parsing failed");

      const moduleIds = (parsed.modules as string[])
        .map(matchModuleNameToId)
        .filter((id): id is string => id !== null);

      // Apply filters to the view
      if (moduleIds.length > 0) setSelectedModuleId(moduleIds[0]);
      if ((parsed.statuses ?? []).length > 0) setStatusFilter(parsed.statuses);
      if (parsed.textSearch) setTextSearchFilter(parsed.textSearch);

      const unsupportedNote =
        parsed.unsupported && parsed.unsupported.length > 0
          ? ` (couldn't apply: ${parsed.unsupported.join(", ")})`
          : "";

      const getMatches = () => {
        return filteredCases.filter((tc) => {
          const modMatch = moduleIds.length === 0 || moduleIds.includes(tc.module_id);
          const statusMatch =
            (parsed.statuses ?? []).length === 0 || parsed.statuses.includes(tc.status);
          const textMatch =
            !parsed.textSearch ||
            tc.title.toLowerCase().includes(parsed.textSearch.toLowerCase()) ||
            (tc.description || "").toLowerCase().includes(parsed.textSearch.toLowerCase());
          return modMatch && statusMatch && textMatch;
        });
      };

      if (parsed.action === "export") {
        const matches = getMatches();
        if (matches.length === 0) {
          toast.error("No prompts found matching your filters to export.");
          return;
        }
        triggerClientCsvDownload(matches);
        toast.success(`Exported ${matches.length} matching prompts...${unsupportedNote}`);
      } else if (parsed.action === "copy") {
        const matches = getMatches();
        if (matches.length === 0) {
          toast.error("No prompts found matching your filters to copy.");
          return;
        }

        const { headers, rows } = getFormattedRows(matches, "tsv");
        const tsvContent = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");

        navigator.clipboard
          .writeText(tsvContent)
          .then(() =>
            toast.success(
              `Copied ${matches.length} prompts to clipboard! Paste (Ctrl+V) into Google Sheets.${unsupportedNote}`
            )
          )
          .catch(() => toast.error("Failed to copy to clipboard."));
      } else {
        toast.success(`Applied filters${unsupportedNote}`);
      }
    } catch (err: any) {
      toast.error(err.message || "AI search failed.");
    } finally {
      setAiSearchLoading(false);
    }
  };

  const clearAllFilters = () => {
    setTextSearchFilter("");
    setSelectedModuleId("all");
    setStatusFilter([]);
    setAiSearchInput("");
  };

  // ------- Drag & Drop -------
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropTestCase = async (
    id: string,
    newStatus: TestCaseStatus,
    overId?: string
  ) => {
    const target = testCases.find((tc) => tc.id === id);
    if (!target || target.status === newStatus) return;
    try {
      await updateTestCase(id, { status: newStatus });
      toast.success(`Moved prompt to ${newStatus}`);
    } catch {
      toast.error("Failed to move prompt status.");
    }
  };

  // ------- Selection / Bulk -------
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

  const handleBulkDelete = async () => {
    if (selectedCases.length === 0) return;
    if (!window.confirm(`Delete ${selectedCases.length} prompt cards?`)) return;
    try {
      await deleteMultipleTestCases(selectedCases);
      toast.success(`Deleted ${selectedCases.length} prompts.`);
      setSelectedCases([]);
    } catch {
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
    } catch {
      toast.error("Failed to move selected prompts.");
    }
  };

  // ------- Create -------
  const handleCreatePrompt = async () => {
    if (!newPrompt.title.trim()) { toast.error("Please enter a title."); return; }
    if (!newPrompt.module_id)    { toast.error("Please select a module."); return; }

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
        toast.success("Prompt created.");
        setNewPrompt({ title: "", description: "", module_id: "", screenshot_urls: [] });
        setIsCreateOpen(false);
      }
    } catch {
      toast.error("Failed to create prompt.");
    }
  };

  // ------- Detail dialog -------
  const handleCardClick = (tc: TestCase) => {
    setSelectedTestCase(tc);
    setDetailTitle(tc.title);
    setDetailDescription(tc.description || "");
    setDetailModuleId(tc.module_id);
    setDetailScreenshotUrls(tc.screenshot_urls || []);
    setIsEditingField(null);
    setIsDetailOpen(true);
  };

  const handleFieldUpdate = async (field: string) => {
    if (!selectedTestCase) return;
    let updates: Partial<TestCase> = {};
    if (field === "title") {
      if (!detailTitle.trim()) { toast.error("Title cannot be empty."); return; }
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
      toast.success("Saved.");
      setIsEditingField(null);
      setSelectedTestCase((prev) => (prev ? { ...prev, ...updates } : null));
    } catch {
      toast.error("Failed to save.");
    }
  };

  const handleDeleteSelectedCard = async () => {
    if (!selectedTestCase) return;
    if (!window.confirm("Delete this prompt?")) return;
    try {
      await deleteTestCase(selectedTestCase.id);
      toast.success("Prompt deleted.");
      setIsDetailOpen(false);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  // ------- Export / Copy -------
  const handleCopyForSheets = () => {
    if (filteredCases.length === 0) {
      toast.error("No prompts in the current filter to copy.");
      return;
    }
    const { headers, rows } = getFormattedRows(filteredCases, "tsv");
    const content = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    navigator.clipboard
      .writeText(content)
      .then(() =>
        toast.success(`Copied ${filteredCases.length} prompts to clipboard! Paste into Google Sheets.`)
      )
      .catch(() => toast.error("Failed to copy to clipboard."));
  };

  const triggerClientCsvDownload = (casesToDownload: TestCase[]) => {
    const { headers, rows } = getFormattedRows(casesToDownload, "csv");
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prompts-export-${projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    selectedModuleId !== "all" || statusFilter.length > 0 || textSearchFilter.trim();

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-sm select-none">

        {/* Row 1 — AI Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={aiSearchInput}
              onChange={(e) => setAiSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAiSearch(); }}
              placeholder='Try "copy open prompts in Auth" or "export all fixed"'
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <Button
            size="sm"
            onClick={handleAiSearch}
            disabled={aiSearchLoading || !aiSearchInput.trim()}
            className="gap-1.5 h-9"
          >
            {aiSearchLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />}
            Search
          </Button>

          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearAllFilters} className="gap-1 h-9 text-muted-foreground">
              <XIcon className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* Row 2 — Filters + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Module filter */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Module</span>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[120px]"
              >
                <option value="all">All Modules</option>
                {modules
                  .filter((m) => m.project_id === projectId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
              <div className="flex gap-1">
                {COLUMNS.map((col) => {
                  const active = statusFilter.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() =>
                        setStatusFilter((prev) =>
                          active ? prev.filter((s) => s !== col.id) : [...prev, col.id]
                        )
                      }
                      className={cn(
                        "h-8 px-2.5 text-xs rounded-md border font-semibold transition-all",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {col.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selection toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedCases([]); }}
              className={cn(
                "h-8 px-3 text-xs gap-1.5 self-end",
                isSelectionMode && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              {isSelectionMode ? "Exit Select" : "Select Cards"}
            </Button>
          </div>

          <div className="flex items-center gap-2 self-end">
            {/* Count */}
            <span className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-foreground font-bold">{filteredCases.length}</span> of {projectPrompts.length} prompts
            </span>

            {/* Copy for Sheets */}
            <Button variant="outline" size="sm" onClick={handleCopyForSheets} className="gap-1.5 h-8">
              <Copy className="h-3.5 w-3.5" /> Copy for Sheets
            </Button>

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger onClick={() => setIsMoreMenuOpen((v) => !v)}>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <MoreHorizontal className="h-4 w-4" /> More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent open={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} align="right" className="min-w-[170px]">
                <DropdownMenuItem onClick={() => { setIsMoreMenuOpen(false); setIsExportConfigOpen(true); }}>
                  <Settings2 className="mr-2 h-3.5 w-3.5" /> Export Config
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setIsMoreMenuOpen(false); triggerClientCsvDownload(filteredCases); }}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setIsMoreMenuOpen(false); setIsModulesOpen(true); }}>
                  <Layers className="mr-2 h-3.5 w-3.5" /> Manage Modules
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Prompt */}
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-8 gap-1.5">
              <Plus className="h-4 w-4" /> Add Prompt
            </Button>
          </div>
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {isSelectionMode && selectedCases.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 bg-primary/5 border border-primary/20 rounded-xl p-3 px-4 animate-in slide-in-from-top duration-150">
          <span className="text-xs font-bold text-primary">{selectedCases.length} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkMoveStatus}
              onChange={(e) => setBulkMoveStatus(e.target.value as any)}
              className="h-8 rounded border border-primary/20 bg-background text-xs px-2 focus:outline-none"
            >
              <option value="" disabled>Move to Status...</option>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={handleBulkMove} disabled={!bulkMoveStatus} className="h-8 text-xs font-bold hover:bg-primary hover:text-white">
              Apply
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs font-bold gap-1">
              <Trash className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* ── Board Columns ── */}
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

      {/* ── Custom Prompt Export Config Dialog ── */}
      <PromptExportConfigDialog
        open={isExportConfigOpen}
        onOpenChange={setIsExportConfigOpen}
        projectId={projectId}
        onSaved={(newConfig) => setPromptExportConfig(newConfig)}
      />

      {/* ── Create Prompt Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>Add a prompt card manually to the board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Title</label>
              <Input
                value={newPrompt.title}
                onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                placeholder="e.g. System instructions for Auth module"
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
                  <option value="" disabled>Select Module</option>
                  {modules.filter((m) => m.project_id === projectId).map((mod) => (
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
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="text-xs h-8 flex-1"
                  />
                  <Button size="sm" onClick={async () => {
                    if (newModuleName) {
                      const m = await addModule(newModuleName, "", projectId);
                      setNewPrompt({ ...newPrompt, module_id: m?.id || "" });
                      setCreatingModule(false);
                      setNewModuleName("");
                    }
                  }} disabled={!newModuleName} type="button">Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setCreatingModule(false)} type="button">Cancel</Button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Description / System Instructions</label>
              <Textarea
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                placeholder="Paste or write detailed system instructions / test prompts here..."
                className="min-h-[180px] font-mono text-xs bg-muted/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Screenshot URLs (Optional)</label>
              <div className="flex gap-2">
                <Input
                  value={newPrompt.screenshot_urls.join(", ")}
                  onChange={(e) =>
                    setNewPrompt({ ...newPrompt, screenshot_urls: e.target.value.split(", ").filter(Boolean) })
                  }
                  placeholder="https://..., https://..."
                  className="text-xs h-9 flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => {
                  setNewPrompt({ ...newPrompt, screenshot_urls: [...newPrompt.screenshot_urls, ""] });
                }} className="h-9 px-3">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePrompt} disabled={!newPrompt.title.trim() || !newPrompt.module_id}>
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
                      <Button size="icon" variant="ghost" onClick={() => handleFieldUpdate("title")}>
                        <Check className="h-4 w-4 text-emerald-500" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setDetailTitle(selectedTestCase.title); setIsEditingField(null); }}>
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

              {/* Status stepper */}
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
                        className={cn("text-xs capitalize font-semibold h-8", isCurrent && "shadow-sm")}
                      >
                        {col.title}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Module + Screenshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">Module</span>
                  <select
                    value={detailModuleId}
                    onChange={(e) => {
                      setDetailModuleId(e.target.value);
                      setTimeout(() => {
                        updateTestCase(selectedTestCase.id, { module_id: e.target.value });
                        toast.success("Module updated.");
                      }, 50);
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none"
                  >
                    {modules.filter((m) => m.project_id === projectId).map((mod) => (
                      <option key={mod.id} value={mod.id}>{mod.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>Screenshot URLs</span>
                    {isEditingField === "screenshot_urls" ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleFieldUpdate("screenshot_urls")} className="text-[10px] text-emerald-500 font-bold hover:underline">Save</button>
                        <button onClick={() => { setDetailScreenshotUrls(selectedTestCase.screenshot_urls || []); setIsEditingField(null); }} className="text-[10px] text-rose-500 font-bold hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingField("screenshot_urls")} className="text-[10px] text-primary font-bold hover:underline">Edit</button>
                    )}
                  </span>
                  {isEditingField === "screenshot_urls" ? (
                    <Input
                      value={detailScreenshotUrls.join(", ")}
                      onChange={(e) => setDetailScreenshotUrls(e.target.value.split(", ").filter(Boolean))}
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

              {/* Editable Description */}
              <div className="space-y-1 group relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Description / Instructions</span>
                  {isEditingField === "description" ? (
                    <div className="flex gap-1.5">
                      <Button size="xs" variant="outline" onClick={() => handleFieldUpdate("description")} className="h-6 text-[10px] px-2">Save</Button>
                      <Button size="xs" variant="ghost" onClick={() => { setDetailDescription(selectedTestCase.description || ""); setIsEditingField(null); }} className="h-6 text-[10px] px-2 text-rose-500">Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingField("description")} className="text-[10px] text-primary font-bold hover:underline">
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
                    className="whitespace-pre-wrap font-mono text-xs bg-muted/30 p-3 rounded-lg border border-border/40 min-h-[100px] max-h-[350px] overflow-y-auto cursor-pointer hover:bg-muted/50 transition-colors scrollbar-thin"
                  >
                    {selectedTestCase.description || "No description provided. Click to add."}
                  </div>
                )}
              </div>

              {/* Screenshot links */}
              {(selectedTestCase.screenshot_urls || []).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-muted-foreground block">Screenshot Previews</span>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTestCase.screenshot_urls || []).map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 p-2 rounded-lg">
                        <Layers className="h-3.5 w-3.5" />
                        <span>Screenshot {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <DialogFooter className="pt-4 border-t border-border/60">
                <Button variant="destructive" size="sm" onClick={handleDeleteSelectedCard} className="gap-1 text-xs">
                  <Trash className="h-3.5 w-3.5" /> Delete Prompt
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="ml-auto">
                  Close
                </Button>
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
            <DialogDescription>Add or remove modules for this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="flex gap-2">
              <Input
                placeholder="New module name..."
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                className="h-9"
              />
              <Button onClick={async () => {
                if (newModuleName.trim()) {
                  await addModule(newModuleName.trim(), "", projectId);
                  setNewModuleName("");
                  toast.success("Module created.");
                }
              }} disabled={!newModuleName.trim()}>Add</Button>
            </div>
            <div className="border border-border/50 rounded-lg max-h-60 overflow-y-auto divide-y divide-border/30">
              {modules.filter((m) => m.project_id === projectId).map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-2 px-3">
                  <span className="text-xs font-semibold">{mod.name}</span>
                </div>
              ))}
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
