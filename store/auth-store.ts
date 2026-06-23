import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  setHydrated: (state: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null,
      hydrated: false,
      setHydrated: (state) => set({ hydrated: state }),

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (!data.user) throw new Error('No user returned');

          const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || null,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: data.user.created_at,
          };

          set({
            user,
            accessToken: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            loading: false,
          });

          if (data.session) {
            localStorage.setItem('access_token', data.session.access_token);
            localStorage.setItem('refresh_token', data.session.refresh_token);
          }
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Login failed', loading: false });
          return false;
        }
      },

      signup: async (email, password, fullName) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              }
            }
          });
          if (error) throw error;
          if (!data.user) throw new Error('No user returned');

          const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || null,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: data.user.created_at,
          };

          set({
            user,
            accessToken: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            loading: false,
          });

          if (data.session) {
            localStorage.setItem('access_token', data.session.access_token);
            localStorage.setItem('refresh_token', data.session.refresh_token);
          }
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Signup failed', loading: false });
          return false;
        }
      },

      logout: async () => {
        set({ loading: true });
        await supabase.auth.signOut();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, loading: false, error: null });
      },

      resetPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          set({ loading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Password reset failed', loading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'qa-copilot-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

