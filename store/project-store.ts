import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectWithStats } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './auth-store';

interface ProjectState {
  projects: ProjectWithStats[];
  selectedProject: ProjectWithStats | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (input: { name: string; description?: string }) => Promise<ProjectWithStats>;
  updateProject: (id: string, input: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  updateProjectStats: (id: string, stats: Partial<ProjectWithStats>) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProject: null,
      loading: false,
      error: null,

      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const authStore = useAuthStore.getState();
          const userId = authStore.user?.id;
          if (!userId) {
            set({ projects: [], loading: false });
            return;
          }

          // Fetch project memberships joined with project details
          const { data, error } = await supabase
            .from('project_members')
            .select(`
              role,
              project:projects (
                id,
                name,
                description,
                user_id,
                created_at,
                updated_at
              )
            `)
            .eq('user_id', userId);

          if (error) throw error;

          const projectsWithStats = await Promise.all((data || []).map(async (row: any) => {
            const proj = row.project;
            if (!proj) return null;

            // Fetch cards
            const { data: cards } = await supabase
              .from('cards')
              .select('column_id, type')
              .eq('project_id', proj.id);

            // Fetch modules count
            const { count: moduleCount } = await supabase
              .from('modules')
              .select('id', { count: 'exact', head: true })
              .eq('project_id', proj.id);

            const allCases = cards || [];
            const total = allCases.length;
            
            const closed = allCases.filter((tc: any) => tc.column_id === 'closed').length;
            const reopen = allCases.filter((tc: any) => tc.column_id === 'reopen').length;
            const open = allCases.filter((tc: any) => tc.column_id === 'open').length;
            const todiscuss = allCases.filter((tc: any) => tc.column_id === 'todiscuss').length;
            const working = allCases.filter((tc: any) => tc.column_id === 'working').length;
            const coverage = total > 0 ? Math.round((closed / total) * 100) : 0;

            const projectStats: ProjectWithStats = {
              ...proj,
              role: row.role,
              total_test_cases: total,
              passed_count: closed,
              failed_count: reopen,
              backlog_count: open,
              blocked_count: todiscuss,
              in_progress_count: working,
              coverage_percentage: coverage,
              module_count: moduleCount || 0,
              status_counts: {
                open,
                working,
                reopen,
                todiscuss,
                closed,
              },
              type_counts: {
                functional: allCases.filter((tc: any) => tc.type === 'functional').length,
                validation: allCases.filter((tc: any) => tc.type === 'validation').length,
                security: allCases.filter((tc: any) => tc.type === 'security').length,
                uat: allCases.filter((tc: any) => tc.type === 'uat').length,
                regression: allCases.filter((tc: any) => tc.type === 'regression').length,
                edge: allCases.filter((tc: any) => tc.type === 'edge').length,
              }
            };

            return projectStats;
          }));

          const cleanProjects = projectsWithStats.filter(Boolean) as ProjectWithStats[];

          const currentSelected = get().selectedProject;
          const validSelected =
            currentSelected && cleanProjects.some((p) => p.id === currentSelected.id)
              ? cleanProjects.find((p) => p.id === currentSelected.id)!
              : cleanProjects[0] ?? null;

          set({ projects: cleanProjects, selectedProject: validSelected, loading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch projects', loading: false });
        }
      },

      createProject: async (input) => {
        set({ loading: true, error: null });
        try {
          const authStore = useAuthStore.getState();
          const userId = authStore.user?.id;
          if (!userId) throw new Error('Not authenticated');

          // 1. Insert project
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
              name: input.name.trim(),
              description: input.description?.trim() ?? '',
              user_id: userId,
            })
            .select()
            .single();

          if (projectError) throw projectError;

          // 2. Add creator as owner member
          const { error: memberError } = await supabase
            .from('project_members')
            .insert({
              project_id: project.id,
              user_id: userId,
              role: 'owner',
            });

          if (memberError) throw memberError;

          const newProject: ProjectWithStats = {
            ...project,
            role: 'owner',
            total_test_cases: 0,
            passed_count: 0,
            failed_count: 0,
            backlog_count: 0,
            blocked_count: 0,
            in_progress_count: 0,
            coverage_percentage: 0,
            module_count: 0,
            status_counts: {
              backlog: 0,
              to_test: 0,
              in_progress: 0,
              passed: 0,
              failed: 0,
              blocked: 0,
            },
            type_counts: {
              functional: 0,
              validation: 0,
              security: 0,
              uat: 0,
              regression: 0,
              edge: 0,
            }
          };

          set((state) => ({
            projects: [newProject, ...state.projects],
            selectedProject: state.selectedProject ? state.selectedProject : newProject,
            loading: false,
          }));

          return newProject;
        } catch (err: any) {
          set({ error: err.message || 'Failed to create project', loading: false });
          throw err;
        }
      },

      updateProject: async (id, input) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('projects')
            .update({
              name: input.name,
              description: input.description,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            const updatedProjects = state.projects.map((p) =>
              p.id === id ? { ...p, ...input, updated_at: new Date().toISOString() } : p
            );
            const updatedSelected = state.selectedProject?.id === id
              ? { ...state.selectedProject, ...input, updated_at: new Date().toISOString() }
              : state.selectedProject;

            return {
              projects: updatedProjects,
              selectedProject: updatedSelected,
              loading: false,
            };
          });
        } catch (err: any) {
          set({ error: err.message || 'Failed to update project', loading: false });
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            const remaining = state.projects.filter((p) => p.id !== id);
            const nextSelected =
              state.selectedProject?.id === id ? remaining[0] ?? null : state.selectedProject;
            return {
              projects: remaining,
              selectedProject: nextSelected,
              loading: false,
            };
          });
        } catch (err: any) {
          set({ error: err.message || 'Failed to delete project', loading: false });
        }
      },

      selectProject: (id) => {
        const project = get().projects.find((p) => p.id === id) || null;
        set({ selectedProject: project });
      },

      updateProjectStats: (id, stats) => {
        set((state) => {
          const updatedProjects = state.projects.map((p) =>
            p.id === id ? { ...p, ...stats } : p
          );
          const updatedSelected = state.selectedProject && state.selectedProject.id === id
            ? { ...state.selectedProject, ...stats }
            : state.selectedProject;

          return {
            projects: updatedProjects,
            selectedProject: updatedSelected
          };
        });
      },
    }),
    {
      name: 'qa-copilot-projects',
      partialize: (state) => ({ projects: state.projects, selectedProject: state.selectedProject }),
    }
  )
);

