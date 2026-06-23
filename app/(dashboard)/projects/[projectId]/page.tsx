"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project-store";
import { useBoardStore } from "@/store/board-store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FolderKanban, Plus, FolderOpen } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { projects, selectProject } = useProjectStore();
  const { testCases, modules, addModule, fetchBoardData } = useBoardStore();

  const [activeTab, setActiveTab] = useState<"overview" | "modules">("overview");
  
  // Module Creation form state
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  const [isAddingModule, setIsAddingModule] = useState(false);

  const currentProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (projectId) {
      selectProject(projectId);
      fetchBoardData(projectId);
    }
  }, [projectId, selectProject, fetchBoardData]);

  if (!currentProject) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground select-none">
        Project not found.
      </div>
    );
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    setIsAddingModule(true);
    try {
      await addModule(newModuleName.trim(), newModuleDesc.trim(), projectId);
      setNewModuleName("");
      setNewModuleDesc("");
    } catch (err) {
      console.error("Failed to add module:", err);
    } finally {
      setIsAddingModule(false);
    }
  };

  const projectModules = modules.filter((m) => m.project_id === projectId);

  return (
    <div className="space-y-6">
      {/* Project Banner Header */}
      <div className="flex flex-col gap-2 p-6 rounded-xl border border-border bg-card select-none">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{currentProject.name}</h1>
          <div className="flex gap-2.5">
            <Button
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/board`)}
              className="text-xs font-semibold flex gap-1.5 items-center"
            >
              <FolderOpen className="h-4 w-4" /> Go to Board
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
          {currentProject.description || "No description loaded."}
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border text-xs font-semibold select-none">
        {["overview", "modules"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 border-b-2 capitalize -mb-px transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6 select-none">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Welcome to your project Dashboard</CardTitle>
                <CardDescription>View statistics and navigate modules.</CardDescription>
              </CardHeader>
              <CardContent className="text-xs leading-normal font-medium text-muted-foreground">
                <p>
                  Use the tabs above to manage project modules or click "Go to Board" to organize, execute and track your test cases.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Metrics sidebar */}
          <div className="space-y-6 select-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 font-semibold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Test Cases:</span>
                  <span>{currentProject.total_test_cases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passed:</span>
                  <span className="text-emerald-500">{currentProject.passed_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed (Reopened):</span>
                  <span className="text-red-500">{currentProject.failed_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Coverage:</span>
                  <span>{currentProject.coverage_percentage}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "modules" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="text-sm font-bold text-foreground">Project Modules</h3>
              <span className="text-xs text-muted-foreground font-semibold">
                {projectModules.length} Modules Loaded
              </span>
            </div>

            {projectModules.length === 0 ? (
              <div className="flex h-36 items-center justify-center border border-dashed border-border/80 rounded-xl text-xs text-muted-foreground select-none">
                No modules identified. Create a module using the form on the right.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projectModules.map((mod) => {
                  const cases = testCases.filter((tc) => tc.module_id === mod.id && tc.project_id === projectId);
                  
                  return (
                    <Card key={mod.id} className="hover:border-primary/20 transition-all select-none">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-xs font-bold">{mod.name}</CardTitle>
                          <CardDescription className="text-[10px] line-clamp-2 mt-1 leading-normal">
                            {mod.description || "No description provided."}
                          </CardDescription>
                        </div>
                        <Badge className="shrink-0 text-[9px]">{cases.length} cases</Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 mt-3 flex justify-between items-center border-t border-border/40">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {cases.filter(c => c.status === "closed").length} closed / {cases.filter(c => c.status === "reopen").length} reopened
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Module Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <FolderKanban className="h-4 w-4 text-primary" /> Create Module
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Add a new component or module to classify test cases.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateModule} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Module Name
                    </label>
                    <Input
                      placeholder="e.g. Authentication"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      disabled={isAddingModule}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Description
                    </label>
                    <Textarea
                      placeholder="Enter module functionality..."
                      value={newModuleDesc}
                      onChange={(e) => setNewModuleDesc(e.target.value)}
                      disabled={isAddingModule}
                      className="text-xs h-20 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-xs font-bold gap-1 h-9"
                    disabled={isAddingModule || !newModuleName.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" /> Create
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
