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
import {
  getDefaultExportConfig,
  getExportColumnCatalog,
  getExportHeaders,
  normalizeExportConfig,
} from "@/lib/export-columns";
import type { ExportColumnEntry, ProjectExportConfig } from "@/types/database";
import { GripVertical, Loader2, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useExportConfig } from "@/hooks/use-export-config";

interface ExportConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Called after a successful save so callers can refresh their cached config. */
  onSaved?: (config: ProjectExportConfig) => void;
}

function SortableColumnRow({
  entry,
  label,
  description,
  onToggle,
}: {
  entry: ExportColumnEntry;
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
        isDragging && "z-10 shadow-md ring-2 ring-primary/20 opacity-90",
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
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ExportConfigDialog({
  open,
  onOpenChange,
  projectId,
  onSaved,
}: ExportConfigDialogProps) {
  const { config: savedConfig, loading, saving, saveConfig } = useExportConfig(projectId);
  const [draft, setDraft] = useState<ProjectExportConfig>(getDefaultExportConfig());

  const catalog = useMemo(() => getExportColumnCatalog(), []);
  const catalogMap = useMemo(
    () => new Map(catalog.map((c) => [c.id, c])),
    [catalog]
  );

  useEffect(() => {
    if (open) setDraft(normalizeExportConfig(savedConfig));
  }, [open, savedConfig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const enabledColumns = draft.columns.filter((c) => c.enabled);
  const previewHeaders = getExportHeaders(draft);

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

  const handleToggle = (id: ExportColumnEntry["id"], enabled: boolean) => {
    setDraft((prev) => ({
      columns: prev.columns.map((c) => (c.id === id ? { ...c, enabled } : c)),
    }));
  };

  const handleReset = () => {
    setDraft(getDefaultExportConfig());
  };

  const handleSave = async () => {
    if (enabledColumns.length === 0) {
      toast.error("Enable at least one column before saving.");
      return;
    }
    try {
      const saved = await saveConfig(draft);
      onSaved?.(saved);
      toast.success("Export configuration saved.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save configuration.");
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) setDraft(normalizeExportConfig(savedConfig));
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={() => handleClose(false)} className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-primary" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose which columns appear and in what order for CSV export and Copy for Google Sheets.
            Settings are saved per project.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid flex-1 gap-4 overflow-y-auto py-2 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Columns
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {enabledColumns.length} of {draft.columns.length} included
                </span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={draft.columns.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {draft.columns.map((entry) => {
                      const meta = catalogMap.get(entry.id);
                      if (!meta) return null;
                      return (
                        <SortableColumnRow
                          key={entry.id}
                          entry={entry}
                          label={meta.label}
                          description={meta.description}
                          onToggle={(enabled) => handleToggle(entry.id, enabled)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                {previewHeaders.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No columns selected — enable at least one column.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <div className="flex min-w-max gap-0 border-b border-border/50 pb-2">
                        {previewHeaders.map((header) => (
                          <div
                            key={header}
                            className="min-w-[88px] px-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                          >
                            {header}
                          </div>
                        ))}
                      </div>
                      <div className="flex min-w-max gap-0 pt-2">
                        {previewHeaders.map((header) => (
                          <div
                            key={`sample-${header}`}
                            className="min-w-[88px] px-2 text-[11px] text-foreground/70"
                          >
                            …
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-[10px] text-muted-foreground">
                      CSV export includes headers. Copy for Sheets pastes data rows only (no header row).
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={loading || saving}
            className="gap-1.5 mr-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
