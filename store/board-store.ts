import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { TestCase, Module, StatusHistory, Environment } from "@/types/database";
import { useProjectStore } from "./project-store";
import { useAuthStore } from "./auth-store";

interface BoardState {
  testCases: TestCase[];
  modules: Module[];
  environments: Environment[];
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
  deleteMultipleTestCases: (ids: string[]) => Promise<void>;
  moveMultipleTestCases: (ids: string[], newStatus: TestCase["status"]) => Promise<void>;
  addModule: (
    name: string,
    description: string,
    projectId: string
  ) => Promise<Module | undefined>;
  deleteModule: (moduleId: string, projectId: string) => Promise<void>;
  addEnvironment: (
    name: string,
    color: string,
    projectId: string
  ) => Promise<Environment | undefined>;
  deleteEnvironment: (environmentId: string, projectId: string) => Promise<void>;
  _syncProjectStats: (projectId: string) => void;
}

const SEED_MODULES = [
  { name: "Authentication", description: "Login, Signup, JWT refresh logic" },
 
];

// Logs a status transition to status_history. Fire-and-forget by design — a logging
// failure should never block or roll back the actual status change the user just made.
async function logStatusHistory(cardId: string, projectId: string, fromStatus: string | null, toStatus: string) {
  if (fromStatus === toStatus) return; // no real transition happened
  try {
    const { error } = await supabase.from("status_history").insert({
      card_id: cardId,
      project_id: projectId,
      from_status: fromStatus,
      to_status: toStatus,
    });
    if (error) console.error("Failed to log status history:", error);
  } catch (err) {
    console.error("Failed to log status history:", err);
  }
}

async function logStatusHistoryBatch(
  rows: { card_id: string; project_id: string; from_status: string | null; to_status: string }[]
) {
  const realTransitions = rows.filter((r) => r.from_status !== r.to_status);
  if (realTransitions.length === 0) return;
  try {
    const { error } = await supabase.from("status_history").insert(realTransitions);
    if (error) console.error("Failed to log status history batch:", error);
  } catch (err) {
    console.error("Failed to log status history batch:", err);
  }
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  testCases: [],
  modules: [],
  environments: [],
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

      // Fetch environments
      const { data: environmentsData, error: environmentsError } = await supabase
        .from('environments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (environmentsError) throw environmentsError;

      let environments: Environment[] = environmentsData || [];

      // Create default environment if none exists
      if (environments.length === 0) {
        const { data: defaultEnv, error: insertError } = await supabase
          .from('environments')
          .insert({
            project_id: projectId,
            name: 'Development',
            color: '#6366f1',
            is_default: true,
          })
          .select()
          .single();

        if (!insertError && defaultEnv) {
          environments = [defaultEnv];
        }
      }

      // Fetch test cases (cards in DB)
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Map from DB 'cards' to our local 'TestCase' definition
      const testCases: TestCase[] = (cardsData || []).map((c: any) => ({
        id: c.id,
        module_id: c.module_id || "",
        project_id: c.project_id,
        environment_id: c.environment_id || null,
        title: c.title,
        description: c.description,
        type: c.type || "functional",
        priority: c.priority || "medium",
        status: c.column_id || "open",
        steps: c.steps || [],
        expected_result: c.expected_result || "",
        actual_result: c.actual_result || null,
        screenshot_urls: Array.isArray(c.screenshot_urls) ? c.screenshot_urls : (c.screenshot_url ? [c.screenshot_url] : []),
        notes: c.notes || null,
        created_by: c.created_by || "",
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      set({ testCases, modules, environments, loading: false });
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
        environment_id: input.environment_id,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        column_id: input.status,
        steps: input.steps,
        expected_result: input.expected_result,
        actual_result: input.actual_result,
        notes: input.notes,
        screenshot_urls: input.screenshot_urls,
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
        environment_id: newCard.environment_id || null,
        title: newCard.title,
        description: newCard.description,
        type: newCard.type || "functional",
        priority: newCard.priority || "medium",
        status: newCard.column_id || "open",
        steps: newCard.steps || [],
        expected_result: newCard.expected_result || "",
        actual_result: newCard.actual_result || null,
        screenshot_urls: Array.isArray(newCard.screenshot_urls) ? newCard.screenshot_urls : (newCard.screenshot_url ? [newCard.screenshot_url] : []),
        notes: newCard.notes || null,
        created_by: newCard.created_by || "",
        created_at: newCard.created_at,
        updated_at: newCard.updated_at,
      };

      set((state) => ({ testCases: [newTestCase, ...state.testCases] }));
      get()._syncProjectStats(input.project_id);
      return newTestCase;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create test case' });
      console.error(err);
    }
  },

  updateTestCase: async (id, updates) => {
    try {
      // Capture the pre-change status so we can log the transition, if any.
      const beforeTc = get().testCases.find((c) => c.id === id);
      const fromStatus = beforeTc?.status ?? null;

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
        if (updates.status) {
          logStatusHistory(tc.id, tc.project_id, fromStatus, updates.status);
        }
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
    // Capture pre-change status BEFORE the optimistic local mutation below overwrites it.
    const beforeTc = get().testCases.find((tc) => tc.id === activeId);
    const fromStatus = beforeTc?.status ?? null;
    const projectIdForLog = beforeTc?.project_id;

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
      if (projectIdForLog) {
        logStatusHistory(activeId, projectIdForLog, fromStatus, newStatus);
      }
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

  deleteMultipleTestCases: async (ids) => {
    try {
      if (ids.length === 0) return;
      
      const tc = get().testCases.find((c) => ids.includes(c.id));
      const projectId = tc?.project_id;

      const { error } = await supabase
        .from('cards')
        .delete()
        .in('id', ids);

      if (error) throw error;

      set((state) => ({
        testCases: state.testCases.filter((c) => !ids.includes(c.id)),
      }));

      if (projectId) {
        get()._syncProjectStats(projectId);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete multiple test cases' });
      console.error(err);
    }
  },

  moveMultipleTestCases: async (ids, newStatus) => {
    try {
      if (ids.length === 0) return;
      
      const tc = get().testCases.find((c) => ids.includes(c.id));
      const projectId = tc?.project_id;

      // Capture each card's pre-change status for history logging, before the bulk update.
      const beforeCases = get().testCases.filter((c) => ids.includes(c.id));

      const { error } = await supabase
        .from('cards')
        .update({ column_id: newStatus, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      set((state) => ({
        testCases: state.testCases.map((c) => 
          ids.includes(c.id) ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
        ),
      }));

      if (projectId) {
        get()._syncProjectStats(projectId);
      }

      logStatusHistoryBatch(
        beforeCases.map((c) => ({
          card_id: c.id,
          project_id: c.project_id,
          from_status: c.status,
          to_status: newStatus,
        }))
      );
    } catch (err: any) {
      set({ error: err.message || 'Failed to move multiple test cases' });
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

  deleteModule: async (moduleId, projectId) => {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      set((state) => ({ modules: state.modules.filter((m) => m.id !== moduleId) }));

      const projectStore = useProjectStore.getState();
      const project = projectStore.projects.find((p) => p.id === projectId);
      if (project) {
        projectStore.updateProjectStats(projectId, {
          module_count: Math.max(0, project.module_count - 1),
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete module' });
      console.error(err);
    }
  },

  addEnvironment: async (name, color, projectId) => {
    try {
      const { data: newEnvironment, error } = await supabase
        .from('environments')
        .insert({
          project_id: projectId,
          name,
          color,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ environments: [...state.environments, newEnvironment] }));

      return newEnvironment;
    } catch (err: any) {
      set({ error: err.message || 'Failed to add environment' });
      console.error(err);
    }
  },

  deleteEnvironment: async (environmentId, projectId) => {
    try {
      const { error } = await supabase
        .from('environments')
        .delete()
        .eq('id', environmentId);

      if (error) throw error;

      set((state) => ({ environments: state.environments.filter((e) => e.id !== environmentId) }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete environment' });
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
    const Fixed = allCases.filter((tc) => tc.status === "Fixed").length;
    const coverage = total > 0 ? Math.round((closed / total) * 100) : 0;

    useProjectStore.getState().updateProjectStats(projectId, {
      total_test_cases: total,
      passed_count: closed,
      failed_count: reopen,
      backlog_count: open,
      blocked_count: todiscuss,
      in_progress_count: Fixed,
      coverage_percentage: coverage,
      status_counts: { open, Fixed, reopen, todiscuss, closed },
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