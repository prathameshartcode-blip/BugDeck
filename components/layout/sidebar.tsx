"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  TestTube2,
  BarChart3,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { selectedProject } = useProjectStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const currentProjectId = selectedProject?.id || "proj-1";

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderKanban,
    },
    {
      name: "Test cases",
      href: `/projects/${currentProjectId}/board`,
      icon: TestTube2,
    },
  ];

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col h-screen border-r border-border bg-sidebar text-sidebar-foreground select-none relative"
      id="sidebar-container"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg gradient-primary text-white shrink-0 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-bold text-lg text-gradient tracking-tight whitespace-nowrap"
            >
              QA Copilot
            </motion.span>
          )}
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 scrollbar-thin">
        {navigation.map((item) => {
          // If pathname starts with item.href (for sub-routes like projects/[id]), mark as active
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && item.href !== "/projects" && pathname.startsWith(item.href.split("/board")[0]));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
              {collapsed && (
                <div className="absolute left-16 bg-popover border border-border text-popover-foreground text-xs px-2 py-1 rounded shadow-md hidden group-hover:block z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse Trigger Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors focus:outline-none z-50"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* User Footer profile */}
      <div className="p-3 border-t border-sidebar-border shrink-0 bg-sidebar-accent/30">
        <div className="flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar fallback={user?.full_name?.charAt(0) || "U"} src={user?.avatar_url} className="h-8 w-8" />
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col text-left min-w-0"
              >
                <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                  {user?.full_name || "QA Engineer"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                  {user?.email || "developer@example.com"}
                </span>
              </motion.div>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
