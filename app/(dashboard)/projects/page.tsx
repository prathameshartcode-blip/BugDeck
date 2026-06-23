"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/store/project-store";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderGit2 } from "lucide-react";

export default function ProjectsPage() {
  const { projects, deleteProject } = useProjectStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? All associated requirements and test cases will be lost.")) {
      await deleteProject(id);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4 select-none">
        <div className="space-y-1 text-left">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Projects Workspace</h1>
          <p className="text-xs text-muted-foreground">
            Manage your project test vaults and upload functional specifications.
          </p>
        </div>
        
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 h-9 rounded-lg text-xs font-semibold">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 max-w-sm select-none">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-xl p-16 text-center space-y-4 select-none">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-normal">
              Get started by creating a new project to host requirements, modules, and test case vaults.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="rounded-lg">
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
