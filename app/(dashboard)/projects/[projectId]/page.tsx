"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useBoardStore } from "@/store/board-store";
import { useProjectStore } from "@/store/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { BoardColumn } from "@/components/board/board-column";
import { TestCaseCard } from "@/components/board/test-case-card";
import { ImportButton } from "@/components/board/import-button";
import type { TestCase, TestStatus } from "@/types/database";

const COLUMNS: { id: TestStatus; label: string; color: string }[] = [
  { id: "backlog",      label: "Backlog",      color: "bg-gray-100 text-gray-600"   },
  { id: "to_test",     label: "To Test",       color: "bg-blue-100 text-blue-600"   },
  { id: "in_progress", label: "In Progress",   color: "bg-yellow-100 text-yellow-600" },
  { id: "passed",      label: "Passed",        color: "bg-green-100 text-green-600" },
  { id: "failed",      label: "Failed",        color: "bg-red-100 text-red-600"     },
];

export default function BoardPage() {
  const params    = useParams();
  const router    = useRouter();
  const projectId = params.id as string;

  const { projects }                                                         = useProjectStore();
  const { testCases, loading, fetchTestCases, createTestCase, updateStatus } = useBoardStore();

  const [open,     setOpen]     = useState(false);
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [priority, setPriority] = useState<TestCase["priority"]>("medium");
  const [creating, setCreating] = useState(false);
  const [activeCard, setActiveCard] = useState<TestCase | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchTestCases(projectId); }, [projectId, fetchTestCases]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveCard(testCases.find((tc) => tc.id === e.active.id) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCard(null);
    if (!over) return;
    const newStatus = over.id as TestStatus;
    const card = testCases.find((tc) => tc.id === active.id);
    if (card && card.status !== newStatus) updateStatus(card.id, newStatus);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    await createTestCase(projectId, title.trim(), desc.trim(), priority);
    setCreating(false);
    setOpen(false);
    setTitle("");
    setDesc("");
    setPriority("medium");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.push("/projects")} className="rounded p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.name ?? "Board"}</h1>
          {project?.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <ImportButton
            projectId={projectId}
            onImported={() => fetchTestCases(projectId)}
          />
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Test Case
          </Button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                cards={testCases.filter((tc) => tc.status === col.id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard ? <TestCaseCard card={activeCard} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title="Add Test Case">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="e.g. Verify login with valid credentials"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Steps or notes..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TestCase["priority"])}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Add</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
