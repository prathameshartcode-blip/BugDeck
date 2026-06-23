"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, hydrated } = useAuthStore();
  const { fetchProjects } = useProjectStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Basic route protection: redirect to login if not authenticated
    // Only run this on the client once mounted and store is hydrated
    if (mounted && hydrated && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, mounted, hydrated, router]);

  useEffect(() => {
    if (user && mounted && hydrated) {
      fetchProjects();
    }
  }, [user, mounted, hydrated, fetchProjects]);

  // Prevent flash of content if user is redirecting or hasn't mounted/hydrated yet
  if (!mounted || !hydrated || loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background select-none">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground">Authenticating session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Collapsible Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      {/* Main Workspace Frame */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header />
        
        {/* Scrollable Work View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
