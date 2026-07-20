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
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-6 shrink-0 z-30 select-none sticky top-0 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger onClick={() => setProjectOpen(!projectOpen)}>
            <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background/50 hover:bg-accent/50 px-3 py-1.5 text-sm font-semibold text-foreground transition-all max-w-[280px] shadow-sm ring-1 ring-transparent focus-within:ring-primary/20">
              <div className="p-1 rounded bg-primary/10 text-primary shrink-0">
                <Folder className="h-4 w-4" />
              </div>
              <span className="truncate">
                {activeProject?.name || (projects.length ? "Select Project" : "No Projects")}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent open={projectOpen} onClose={() => setProjectOpen(false)} align="left" className="w-64 rounded-xl shadow-lg border-border/50 bg-card/95 backdrop-blur-xl">
            <div className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Switch Project
            </div>
            {projects.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No projects yet.</div>
            )}
            {projects.map((proj) => (
              <DropdownMenuItem
                key={proj.id}
                onClick={() => handleSelectProject(proj.id)}
                className="flex flex-col items-start gap-1 py-2.5 px-3 mx-1 my-0.5 rounded-md focus:bg-primary/5"
              >
                <span className={`font-semibold ${proj.id === activeProjectId ? "text-primary" : "text-foreground"}`}>
                  {proj.name}
                  {proj.id === activeProjectId ? " ✓" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                  {proj.description || "No description"}
                </span> 
              </DropdownMenuItem>
            ))}
            <div className="border-t border-border/50 mt-1 pt-1">
              <DropdownMenuItem
                onClick={() => {
                  setCreateOpen(true);
                  setProjectOpen(false);
                }}
                className="flex items-center gap-2 text-primary font-semibold py-2.5 px-3 mx-1 mb-1 rounded-md focus:bg-primary/10"
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
