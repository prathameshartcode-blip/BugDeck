"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Plus, X as XIcon, Check } from "lucide-react";
import { toast } from "sonner";
import type { Environment } from "@/types/database";

interface EnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  environments: Environment[];
  onAddEnvironment: (name: string, color: string, projectId: string) => Promise<Environment | undefined>;
  onDeleteEnvironment: (id: string, projectId: string) => Promise<void>;
}

const DEFAULT_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#0ea5e9", // Sky
  "#64748b", // Slate
];

export function EnvironmentDialog({
  open,
  onOpenChange,
  projectId,
  environments,
  onAddEnvironment,
  onDeleteEnvironment,
}: EnvironmentDialogProps) {
  const [addingName, setAddingName] = useState("");
  const [addingColor, setAddingColor] = useState(DEFAULT_COLORS[0]);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!addingName.trim()) return;
    setAdding(true);
    try {
      await onAddEnvironment(addingName.trim(), addingColor, projectId);
      setAddingName("");
      setAddingColor(DEFAULT_COLORS[0]);
      toast.success("Environment added successfully");
    } catch (error) {
      toast.error("Failed to add environment");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete environment "${name}"? Bugs in this environment will lose their environment assignment.`)) {
      try {
        await onDeleteEnvironment(id, projectId);
        toast.success("Environment deleted successfully");
      } catch (error) {
        toast.error("Failed to delete environment");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Environments</DialogTitle>
          <DialogDescription>
            Add and manage test environments (dev, staging, prod) for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing environments list */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {environments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No environments yet. Add one below.</p>
            )}
            {environments.map((env) => (
              <div
                key={env.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: env.color }}
                  />
                  <span className="font-medium text-foreground">{env.name}</span>
                  {env.is_default && (
                    <span className="text-[10px] text-muted-foreground">(default)</span>
                  )}
                </div>
                {!env.is_default && (
                  <button
                    onClick={() => handleDelete(env.id, env.name)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Delete environment"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new environment */}
          <div className="pt-4 border-t border-border space-y-3">
            <label className="text-xs font-semibold">Add New Environment</label>
            <div className="space-y-2">
              <Input
                placeholder="Environment name (e.g., Staging)"
                value={addingName}
                onChange={(e) => setAddingName(e.target.value)}
                className="text-xs h-8"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && addingName.trim() && !adding) {
                    await handleAdd();
                  }
                }}
              />
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAddingColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      addingColor === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!addingName.trim() || adding}
                className="w-full"
              >
                {adding ? "Adding..." : "Add Environment"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
