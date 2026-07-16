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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText } from "lucide-react";
import { useProjectStore } from "@/store/project-store";

interface EditContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Called after a successful save, in addition to closing the dialog. */
  onSaved?: (description: string) => void;
}

/**
 * Reusable modal for viewing/editing a project's `description`, which
 * doubles as the "project context" fed into AI bug/test-case generation
 * (see generate-bugs-dialog.tsx / generate-tests-dialog.tsx / the two
 * /api/ai/* routes). No dedicated project-settings page exists yet, so this
 * modal is the single edit surface — opened from the board header and from
 * both AI dialogs.
 */
export function EditContextDialog({
  open,
  onOpenChange,
  projectId,
  onSaved,
}: EditContextDialogProps) {
  const { projects, updateProject } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  const [draft, setDraft] = useState(project?.description ?? "");
  const [saving, setSaving] = useState(false);

  // Re-sync draft with the latest stored value whenever the dialog opens.
  useEffect(() => {
    if (open) setDraft(project?.description ?? "");
  }, [open, project?.description]);

  const handleClose = (next: boolean) => {
    if (!next) setDraft(project?.description ?? "");
    onOpenChange(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProject(projectId, { description: draft.trim() });
      onSaved?.(draft.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={() => handleClose(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Project Context
          </DialogTitle>
          <DialogDescription className="text-xs">
            A short summary of what this project is, its key terms, and
            conventions. This is sent to the AI on every bug/test-case
            generation to make its output more accurate — the more specific,
            the better.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder={`e.g. "BugDeck is a QA bug-tracking tool. Bugs move Open → Fixed → Closed (Fixed means dev pushed a fix, Closed means QA verified it). Reopen and To Discuss are exception states. Every bug belongs to a Module."`}
            className="resize-none text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            {draft.trim().length} characters — keep it concise; this is
            resent on every AI request.
          </p>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              "Save Context"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}