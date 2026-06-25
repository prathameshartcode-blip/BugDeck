"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { RunTestView } from "@/components/runtest/runtest-view";
import { useActiveProject } from "@/hooks/use-active-project";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RunTestPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { activeProject, urlProjectId } = useActiveProject();

  const currentProject = activeProject?.id === projectId ? activeProject : null;

  if (urlProjectId === projectId && !currentProject) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            Test Cases — {currentProject?.name || "Project"}
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Plan and execute test cases. Drag cards to update execution status.
            </p>
          </div>
        </div>
      </div>

      <RunTestView projectId={projectId} />
    </div>
  );
}
