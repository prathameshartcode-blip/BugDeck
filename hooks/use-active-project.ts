"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import type { ProjectWithStats } from "@/types/database";
import { getProjectIdFromPath } from "@/lib/active-project";

/**
 * Keeps selectedProject in sync with the URL and returns the project
 * that should drive board/runtest pages and sidebar links.
 */
export function useActiveProject(): {
  activeProjectId: string | null;
  activeProject: ProjectWithStats | null;
  urlProjectId: string | null;
} {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, selectedProject, selectProject, loading } = useProjectStore();
  const urlProjectId = getProjectIdFromPath(pathname);

  useEffect(() => {
    if (loading || !urlProjectId || projects.length === 0) return;

    const exists = projects.some((p) => p.id === urlProjectId);
    if (!exists) {
      router.replace("/projects");
      return;
    }

    if (selectedProject?.id !== urlProjectId) {
      selectProject(urlProjectId);
    }
  }, [urlProjectId, projects, selectedProject?.id, selectProject, loading, router]);

  let activeProjectId: string | null = null;

  if (urlProjectId && projects.some((p) => p.id === urlProjectId)) {
    activeProjectId = urlProjectId;
  } else if (selectedProject && projects.some((p) => p.id === selectedProject.id)) {
    activeProjectId = selectedProject.id;
  } else if (projects.length > 0) {
    activeProjectId = projects[0].id;
  }

  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) ?? null
    : null;

  return { activeProjectId, activeProject, urlProjectId };
}
