"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { useProjectStore } from "@/store/project-store";
import { useActiveProject } from "@/hooks/use-active-project";
import { getProjectSubRoute, buildProjectPath } from "@/lib/active-project";
import { ChevronDown, Plus, Folder } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, selectProject } = useProjectStore();
  const { activeProject, activeProjectId } = useActiveProject();
  const [projectOpen, setProjectOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    setProjectOpen(false);

    const subRoute = getProjectSubRoute(pathname);
    if (subRoute) {
      router.push(buildProjectPath(projectId, subRoute));
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 z-30 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger onClick={() => setProjectOpen(!projectOpen)}>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors max-w-[280px]">
              <Folder className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                {activeProject?.name || (projects.length ? "Select Project" : "No Projects")}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent open={projectOpen} onClose={() => setProjectOpen(false)} align="left" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Switch Project
            </div>
            {projects.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No projects yet.</div>
            )}
            {projects.map((proj) => (
              <DropdownMenuItem
                key={proj.id}
                onClick={() => handleSelectProject(proj.id)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className={`font-medium ${proj.id === activeProjectId ? "text-primary" : ""}`}>
                  {proj.name}
                  {proj.id === activeProjectId ? " ✓" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">
                  {proj.description || "No description"}
                </span>
              </DropdownMenuItem>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <DropdownMenuItem
                onClick={() => {
                  setCreateOpen(true);
                  setProjectOpen(false);
                }}
                className="flex items-center gap-2 text-primary font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Project</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </header>
  );
};
