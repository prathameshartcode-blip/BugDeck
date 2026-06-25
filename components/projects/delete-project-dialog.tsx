"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/store/project-store";
import type { ProjectWithStats } from "@/types/database";
import { AlertTriangle } from "lucide-react";

export const DELETE_CONFIRM_PHRASE = "please delete project";

interface DeleteProjectDialogProps {
  project: ProjectWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  project,
  open,
  onOpenChange,
}) => {
  const { deleteProject } = useProjectStore();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed =
    confirmText.trim().toLowerCase() === DELETE_CONFIRM_PHRASE.toLowerCase();

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!project || !isConfirmed) return;

    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            This will permanently remove{" "}
            <span className="font-semibold text-foreground">{project?.name}</span>, including
            all bugs, RunTest cases, and modules. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          <p className="text-xs text-muted-foreground">
            Type{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {DELETE_CONFIRM_PHRASE}
            </code>{" "}
            to confirm.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={DELETE_CONFIRM_PHRASE}
            disabled={isDeleting}
            autoComplete="off"
            className="text-sm"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
