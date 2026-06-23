import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Module } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface ModuleState {
  modules: Module[];
  loading: boolean;
  error: string | null;
  fetchModules: (projectId: string) => Promise<void>;
  createModule: (projectId: string, name: string, description?: string) => Promise<Module | null>;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set, get) => ({
      modules: [],
      loading: false,
      error: null,

      fetchModules: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('modules')
            .select('*')
            .eq('project_id', projectId);
          if (error) throw error;
          set({ modules: data || [], loading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to load modules', loading: false });
        }
      },

      createModule: async (projectId: string, name: string, description: string = '') => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('modules')
            .insert({ project_id: projectId, name, description })
            .select()
            .single();
          if (error) throw error;

          const newModule = data;
          set((state) => ({
            modules: [...state.modules, newModule],
            loading: false,
          }));
          return newModule;
        } catch (err: any) {
          set({ error: err.message || 'Failed to create module', loading: false });
          return null;
        }
      },
    }),
    {
      name: 'qa-copilot-modules',
      partialize: (state) => ({ modules: state.modules }),
    }
  )
);

