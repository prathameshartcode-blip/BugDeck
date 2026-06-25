"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2, FolderGit2 } from "lucide-react";
import { ProjectWithStats } from "@/types/database";
import { useProjectStore } from "@/store/project-store";

interface ProjectCardProps {
  project: ProjectWithStats;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const router = useRouter();
  const { selectProject } = useProjectStore();

  const handleOpen = () => {
    selectProject(project.id);
    router.push(`/projects/${project.id}/board`);
  };

  return (
    <div className="relative group">
      <button type="button" onClick={handleOpen} className="block w-full text-left">
        <Card className="h-48 flex flex-col justify-between hover:shadow-md cursor-pointer hover:border-primary/50 transition-all duration-200">
          <CardHeader className="p-5 pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FolderGit2 className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold line-clamp-1">{project.name}</CardTitle>
              </div>
              <Badge variant={project.status === "active" ? "success" : "secondary"} className="capitalize">
                {project.status}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-2 line-clamp-2 leading-relaxed">
              {project.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-5 pt-0 mt-auto">
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Coverage</span>
                <span className="font-semibold text-foreground">{project.coverage_percentage}%</span>
              </div>
              <Progress value={project.coverage_percentage} className="h-1.5" />
              
              <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>{project.total_test_cases} Test Cases</span>
                <span>{project.module_count} Modules</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      {/* Hover Delete Button */}
      <button
        onClick={(e) => onDelete(project.id, e)}
        className="absolute right-3 bottom-3 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        title="Delete Project"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
