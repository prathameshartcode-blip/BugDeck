"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PromptExportColumnId =
  | "title"
  | "description"
  | "module"
  | "screenshot_urls"
  | "status"
  | "created_at";

export type PromptExportColumnEntry = {
  id: PromptExportColumnId;
  enabled: boolean;
};

export type PromptExportConfig = {
  columns: PromptExportColumnEntry[];
};

const DEFAULT_PROMPT_EXPORT_ORDER: PromptExportColumnId[] = [
  "title",
  "description",
  "module",
  "screenshot_urls",
  "status",
  "created_at",
];

const COLUMN_CATALOG: Record<PromptExportColumnId, { label: string; description: string }> = {
  title: {
    label: "Title",
    description: "The prompt's main title / summary",
  },
  description: {
    label: "Description",
    description: "The main text / system instructions of the prompt",
  },
  module: {
    label: "Module",
    description: "The assigned module / feature area",
  },
  screenshot_urls: {
    label: "Screenshot URLs",
    description: "Attached image or design URLs",
  },
  status: {
    label: "Status",
    description: "Current status (Open, Fixed, Reopen, Closed)",
  },
  created_at: {
    label: "Created At",
    description: "When the prompt was created",
  },
};

export function getDefaultPromptExportConfig(): PromptExportConfig {
  return {
    columns: DEFAULT_PROMPT_EXPORT_ORDER.map((id) => ({ id, enabled: true })),
  };
}

export function normalizePromptExportConfig(raw: any): PromptExportConfig {
  const fallback = getDefaultPromptExportConfig();
  if (!raw || typeof raw !== "object") return fallback;
  const cols = raw.columns;
  if (!Array.isArray(cols)) return fallback;

  const validIds = new Set<string>(DEFAULT_PROMPT_EXPORT_ORDER);
  const mapped = cols
    .filter((c: any) => c && typeof c === "object" && validIds.has(c.id))
    .map((c: any) => ({ id: c.id as PromptExportColumnId, enabled: !!c.enabled }));

  const missing = DEFAULT_PROMPT_EXPORT_ORDER.filter(
    (id) => !mapped.some((m) => m.id === id)
  );

  return {
    columns: [...mapped, ...missing.map((id) => ({ id, enabled: true }))],
  };
}

interface PromptExportConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSaved: (config: PromptExportConfig) => void;
}

function SortableColumnRow({
  entry,
  label,
  description,
  onToggle,
}: {
  entry: PromptExportColumnEntry;
  label: string;
  description: string;
  onToggle: (enabled: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5",
        isDragging && "z-50 shadow-md ring-2 ring-primary/20 opacity-90",
        !entry.enabled && "opacity-60"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Checkbox
        checked={entry.enabled}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={`Include ${label}`}
      />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-none">{label}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function PromptExportConfigDialog({
  open,
  onOpenChange,
  projectId,
  onSaved,
}: PromptExportConfigDialogProps) {
  const storageKey = `prompt_export_config_${projectId}`;
  const [draft, setDraft] = useState<PromptExportConfig>(getDefaultPromptExportConfig());

  // Load from local storage when opened
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setDraft(normalizePromptExportConfig(JSON.parse(stored)));
        } catch {
          setDraft(getDefaultPromptExportConfig());
        }
      } else {
        setDraft(getDefaultPromptExportConfig());
      }
    }
  }, [open, storageKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraft((prev) => {
      const oldIndex = prev.columns.findIndex((c) => c.id === active.id);
      const newIndex = prev.columns.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return { columns: arrayMove(prev.columns, oldIndex, newIndex) };
    });
  };

  const handleToggle = (id: PromptExportColumnId, enabled: boolean) => {
    setDraft((prev) => ({
      columns: prev.columns.map((c) => (c.id === id ? { ...c, enabled } : c)),
    }));
  };

  const handleReset = () => {
    setDraft(getDefaultPromptExportConfig());
  };

  const handleSave = () => {
    const enabledCount = draft.columns.filter((c) => c.enabled).length;
    if (enabledCount === 0) {
      toast.error("At least one column must be enabled");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }
    toast.success("Prompt export configuration saved successfully");
    onSaved(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Prompt Export Columns</DialogTitle>
          <DialogDescription>
            Choose which columns to include and drag to set their order when copying or exporting prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={draft.columns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {draft.columns.map((col) => {
                  const info = COLUMN_CATALOG[col.id];
                  return (
                    <SortableColumnRow
                      key={col.id}
                      entry={col}
                      label={info.label}
                      description={info.description}
                      onToggle={(enabled) => handleToggle(col.id, enabled)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-8 font-semibold"
            >
              Save Configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
