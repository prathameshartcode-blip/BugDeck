import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { TestCase, Module } from "@/types/database";
import { useProjectStore } from "./project-store";
import { useAuthStore } from "./auth-store";

interface BoardState {
  testCases: TestCase[];
  modules: Module[];
  loading: boolean;
  error: string | null;

  fetchBoardData: (projectId: string) => Promise<void>;
  createTestCase: (
    input: Omit<TestCase, "id" | "created_at" | "updated_at" | "created_by">
  ) => Promise<TestCase | undefined>;
  updateTestCase: (id: string, updates: Partial<TestCase>) => Promise<void>;
  moveTestCase: (id: string, newStatus: TestCase["status"]) => Promise<void>;
  reorderTestCase: (
    activeId: string,
    newStatus: TestCase["status"],
    overId?: string
  ) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  addModule: (
    name: string,
    description: string,
    projectId: string
  ) => Promise<Module | undefined>;
  _syncProjectStats: (projectId: string) => void;
}

const SEED_MODULES = [
  { name: "Authentication", description: "Login, Signup, JWT refresh logic" },
 
];

export const useBoardStore = create<BoardState>()((set, get) => ({
  testCases: [],
  modules: [],
  loading: false,
  error: null,

  fetchBoardData: async (projectId) => {
    set({ loading: true, error: null });
    try {
      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('project_id', projectId);

      if (modulesError) throw modulesError;

      let modules: Module[] = modulesData || [];

      // Auto-seed modules if empty (in Supabase)
      // if (modules.length === 0) {
      //   const seedData = SEED_MODULES.map(m => ({
      //     project_id: projectId,
      //     name: m.name,
      //     description: m.description,
      //     metadata: null,
      //   }));
      //   const { data: insertedModules, error: insertError } = await supabase
      //     .from('modules')
      //     .insert(seedData)
      //     .select();
        
      //   if (insertError) throw insertError;
      //   if (insertedModules) {
      //     modules = insertedModules;
      //   }
      // }

      // Fetch test cases (cards in DB)
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('project_id', projectId);

      if (cardsError) throw cardsError;

      // Map from DB 'cards' to our local 'TestCase' definition
      const testCases: TestCase[] = (cardsData || []).map((c: any) => ({
        id: c.id,
        module_id: c.module_id || "",
        project_id: c.project_id,
        title: c.title,
        description: c.description,
        type: c.type || "functional",
        priority: c.priority || "medium",
        status: c.column_id || "open",
        steps: c.steps || [],
        expected_result: c.expected_result || "",
        actual_result: c.actual_result || null,
        screenshot_url: c.screenshot_url || null,
        notes: c.notes || null,
        created_by: c.created_by || "",
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      set({ testCases, modules, loading: false });
      get()._syncProjectStats(projectId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch board data', loading: false });
    }
  },

  createTestCase: async (input) => {
    try {
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const dbPayload = {
        project_id: input.project_id,
        module_id: input.module_id,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        column_id: input.status,
        steps: input.steps,
        expected_result: input.expected_result,
        screenshot_url: input.screenshot_url,
        created_by: userId,
      };

      const { data: newCard, error } = await supabase
        .from('cards')
        .insert(dbPayload)
        .select()
        .single();

      if (error) throw error;

      const newTestCase: TestCase = {
        id: newCard.id,
        module_id: newCard.module_id || "",
        project_id: newCard.project_id,
        title: newCard.title,
        description: newCard.description,
        type: newCard.type || "functional",
        priority: newCard.priority || "medium",
        status: newCard.column_id || "open",
        steps: newCard.steps || [],
        expected_result: newCard.expected_result || "",
        actual_result: newCard.actual_result || null,
        screenshot_url: newCard.screenshot_url || null,
        notes: newCard.notes || null,
        created_by: newCard.created_by || "",
        created_at: newCard.created_at,
        updated_at: newCard.updated_at,
      };

      set((state) => ({ testCases: [...state.testCases, newTestCase] }));
      get()._syncProjectStats(input.project_id);
      return newTestCase;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create test case' });
      console.error(err);
    }
  },

  updateTestCase: async (id, updates) => {
    try {
      // Map local to db keys
      const dbUpdates: any = { ...updates };
      if (updates.status) {
        dbUpdates.column_id = updates.status;
        delete dbUpdates.status;
      }
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('cards')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        testCases: state.testCases.map((tc) =>
          tc.id === id ? { ...tc, ...updates, updated_at: dbUpdates.updated_at } : tc
        ),
      }));

      const tc = get().testCases.find((c) => c.id === id);
      if (tc) {
        get()._syncProjectStats(tc.project_id);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update test case' });
      console.error(err);
    }
  },

  moveTestCase: async (id, newStatus) => {
    get().updateTestCase(id, { status: newStatus });
  },

  reorderTestCase: async (activeId, newStatus, overId) => {
    // For visual reordering, we immediately update local state, then let supabase handle the status change
    set((state) => {
      const list = [...state.testCases];
      const currentIndex = list.findIndex(tc => tc.id === activeId);
      if (currentIndex === -1) return state;
      
      const [tc] = list.splice(currentIndex, 1);
      tc.status = newStatus;
      tc.updated_at = new Date().toISOString();
      
      if (overId && overId !== activeId) {
         const overIndex = list.findIndex(c => c.id === overId);
         if (overIndex !== -1) {
            list.splice(overIndex, 0, tc);
         } else {
            list.push(tc);
         }
      } else {
         list.push(tc);
      }
      
      return { testCases: list };
    });
  
    // Async save to db
    const { error } = await supabase
      .from('cards')
      .update({ column_id: newStatus, updated_at: new Date().toISOString() })
      .eq('id', activeId);

    if (error) console.error("Failed to reorder in DB:", error);

    const tc = get().testCases.find((c) => c.id === activeId);
    if (tc) {
      get()._syncProjectStats(tc.project_id);
    }
  },

  deleteTestCase: async (id) => {
    try {
      const tc = get().testCases.find((c) => c.id === id);
      const projectId = tc?.project_id;

      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        testCases: state.testCases.filter((c) => c.id !== id),
      }));

      if (projectId) {
        get()._syncProjectStats(projectId);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete test case' });
      console.error(err);
    }
  },

  addModule: async (moduleName, description, projectId) => {
    try {
      const { data: newModule, error } = await supabase
        .from('modules')
        .insert({
          project_id: projectId,
          name: moduleName,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ modules: [...state.modules, newModule] }));

      const projectStore = useProjectStore.getState();
      const project = projectStore.projects.find((p) => p.id === projectId);
      if (project) {
        projectStore.updateProjectStats(projectId, {
          module_count: project.module_count + 1,
        });
      }

      return newModule;
    } catch (err: any) {
      set({ error: err.message || 'Failed to add module' });
      console.error(err);
    }
  },

  _syncProjectStats: (projectId: string) => {
    const allCases = get().testCases.filter((tc) => tc.project_id === projectId);
    const total = allCases.length;
    const closed = allCases.filter((tc) => tc.status === "closed").length;
    const reopen = allCases.filter((tc) => tc.status === "reopen").length;
    const open = allCases.filter((tc) => tc.status === "open").length;
    const todiscuss = allCases.filter((tc) => tc.status === "todiscuss").length;
    const working = allCases.filter((tc) => tc.status === "working").length;
    const coverage = total > 0 ? Math.round((closed / total) * 100) : 0;

    useProjectStore.getState().updateProjectStats(projectId, {
      total_test_cases: total,
      passed_count: closed,
      failed_count: reopen,
      backlog_count: open,
      blocked_count: todiscuss,
      in_progress_count: working,
      coverage_percentage: coverage,
      status_counts: { open, working, reopen, todiscuss, closed },
      // type_counts: {
      //   functional: allCases.filter((tc) => tc.type === "functional").length,
      //   validation: allCases.filter((tc) => tc.type === "validation").length,
      //   security: allCases.filter((tc) => tc.type === "security").length,
      //   uat: allCases.filter((tc) => tc.type === "uat").length,
      //   regression: allCases.filter((tc) => tc.type === "regression").length,
      //   edge: allCases.filter((tc) => tc.type === "edge").length,
      // },
    });
  },
}));
