"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";

/**
 * Redirects legacy /projects/[id] links to the board and syncs selected project.
 */
export default function ProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { projects, selectProject } = useProjectStore();

  useEffect(() => {
    if (projects.length === 0) return;

    const exists = projects.some((p) => p.id === projectId);
    if (!exists) {
      router.replace("/projects");
      return;
    }

    selectProject(projectId);
    router.replace(`/projects/${projectId}/board`);
  }, [projectId, projects, router, selectProject]);

  return (
    <div className="flex h-60 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
