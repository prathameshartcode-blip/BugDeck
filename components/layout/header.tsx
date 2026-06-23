"use client";

import React, { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useProjectStore } from "@/store/project-store";
import {
  ChevronDown,
  Plus,
  Folder,
  Search,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

export const Header: React.FC = () => {
  const { projects, selectedProject, selectProject } = useProjectStore();
  const [projectOpen, setProjectOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 z-30 select-none">
      {/* Project Switcher / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger onClick={() => setProjectOpen(!projectOpen)}>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
              <Folder className="h-4 w-4 text-primary" />
              <span>{selectedProject?.name || "Select Project"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent open={projectOpen} onClose={() => setProjectOpen(false)} align="left" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Switch Project
            </div>
            {projects.map((proj) => (
              <DropdownMenuItem
                key={proj.id}
                onClick={() => {
                  selectProject(proj.id);
                  setProjectOpen(false);
                }}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="font-medium">{proj.name}</span>
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

        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
          QA Portal
        </span>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-64 max-md:hidden">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search test cases, modules..."
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Alerts Bell */}
        <button className="p-2 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>

      {/* Create Project modal */}
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </header>
  );
};
