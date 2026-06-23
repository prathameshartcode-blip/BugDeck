"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { BoardView } from "@/components/board/board-view";
import { useProjectStore } from "@/store/project-store";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { projects } = useProjectStore();

  const currentProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4 select-none">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5 text-left">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Testing Board — {currentProject?.name || "Project"}
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Drag test cards to advance statuses or log actual responses.
            </p>
          </div>
        </div>
      </div>

      <BoardView projectId={projectId} />
    </div>
  );
}
