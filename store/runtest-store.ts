import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { RunTestCase, Module } from "@/types/database";
import { useProjectStore } from "./project-store";
import { useAuthStore } from "./auth-store";

interface RunTestState {
  testCases: RunTestCase[];
  modules: Module[];
  loading: boolean;
  error: string | null;

  fetchRunTestData: (projectId: string) => Promise<void>;
  createRunTestCase: (
    input: Omit<RunTestCase, "id" | "created_at" | "updated_at" | "created_by">
  ) => Promise<RunTestCase | undefined>;
  updateRunTestCase: (id: string, updates: Partial<RunTestCase>) => Promise<void>;
  reorderRunTestCase: (
    activeId: string,
    newStatus: RunTestCase["status"],
    overId?: string
  ) => Promise<void>;
  deleteRunTestCase: (id: string) => Promise<void>;
  addModule: (
    name: string,
    description: string,
    projectId: string
  ) => Promise<Module | undefined>;
  deleteModule: (moduleId: string, projectId: string) => Promise<void>;
}

function mapRow(row: Record<string, unknown>): RunTestCase {
  return {
    id: row.id as string,
    module_id: (row.module_id as string) || "",
    project_id: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) || null,
    priority: (row.priority as RunTestCase["priority"]) || "medium",
    status: (row.status as RunTestCase["status"]) || "open",
    steps: (row.steps as RunTestCase["steps"]) || [],
    expected_result: (row.expected_result as string) || "",
    actual_result: (row.actual_result as string) || null,
    failed_reason: (row.failed_reason as string) || null,
    screenshot_url: (row.screenshot_url as string) || null,
    created_by: (row.created_by as string) || "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export const useRunTestStore = create<RunTestState>()((set, get) => ({
  testCases: [],
  modules: [],
  loading: false,
  error: null,

  fetchRunTestData: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("project_id", projectId);

      if (modulesError) throw modulesError;

      const { data: rows, error: casesError } = await supabase
        .from("test_cases")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;

      set({
        testCases: (rows || []).map(mapRow),
        modules: modulesData || [],
        loading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch RunTest data";
      set({ error: message, loading: false });
    }
  },

  createRunTestCase: async (input) => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: row, error } = await supabase
        .from("test_cases")
        .insert({
          project_id: input.project_id,
          module_id: input.module_id || null,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: input.status,
          steps: input.steps,
          expected_result: input.expected_result,
          actual_result: input.actual_result,
          failed_reason: input.failed_reason,
          screenshot_url: input.screenshot_url,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      const newCase = mapRow(row);
      set((state) => ({ testCases: [newCase, ...state.testCases] }));
      return newCase;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create test case";
      set({ error: message });
      console.error(err);
    }
  },

  updateRunTestCase: async (id, updates) => {
    try {
      const dbUpdates: Record<string, unknown> = { ...updates };
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("test_cases")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        testCases: state.testCases.map((tc) =>
          tc.id === id
            ? { ...tc, ...updates, updated_at: dbUpdates.updated_at as string }
            : tc
        ),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update test case";
      set({ error: message });
      console.error(err);
    }
  },

  reorderRunTestCase: async (activeId, newStatus, overId) => {
    set((state) => {
      const list = [...state.testCases];
      const currentIndex = list.findIndex((tc) => tc.id === activeId);
      if (currentIndex === -1) return state;

      const [tc] = list.splice(currentIndex, 1);
      tc.status = newStatus;
      tc.updated_at = new Date().toISOString();

      if (overId && overId !== activeId) {
        const overIndex = list.findIndex((c) => c.id === overId);
        if (overIndex !== -1) list.splice(overIndex, 0, tc);
        else list.push(tc);
      } else {
        list.push(tc);
      }

      return { testCases: list };
    });

    const { error } = await supabase
      .from("test_cases")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", activeId);

    if (error) console.error("Failed to reorder in DB:", error);
  },

  deleteRunTestCase: async (id) => {
    try {
      const { error } = await supabase.from("test_cases").delete().eq("id", id);
      if (error) throw error;

      set((state) => ({
        testCases: state.testCases.filter((c) => c.id !== id),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete test case";
      set({ error: message });
      console.error(err);
    }
  },

  addModule: async (moduleName, description, projectId) => {
    try {
      const { data: newModule, error } = await supabase
        .from("modules")
        .insert({ project_id: projectId, name: moduleName, description })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ modules: [...state.modules, newModule] }));

      const project = useProjectStore.getState().projects.find((p) => p.id === projectId);
      if (project) {
        useProjectStore.getState().updateProjectStats(projectId, {
          module_count: project.module_count + 1,
        });
      }

      return newModule;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add module";
      set({ error: message });
      console.error(err);
    }
  },

  deleteModule: async (moduleId, projectId) => {
    try {
      const { error } = await supabase.from("modules").delete().eq("id", moduleId);
      if (error) throw error;

      set((state) => ({ modules: state.modules.filter((m) => m.id !== moduleId) }));

      const project = useProjectStore.getState().projects.find((p) => p.id === projectId);
      if (project) {
        useProjectStore.getState().updateProjectStats(projectId, {
          module_count: Math.max(0, project.module_count - 1),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete module";
      set({ error: message });
      console.error(err);
    }
  },
}));
