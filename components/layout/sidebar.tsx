"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  TestTube2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
    { name: "Dashboard",   href: "/dashboard",                          icon: LayoutDashboard },
    { name: "Projects",    href: "/projects",                           icon: FolderKanban    },
    { name: "Test Cases",  href: `/projects/${currentProjectId}/board`, icon: TestTube2       },
  ];

  return (
    <div
      className="flex flex-col h-screen border-r border-border bg-sidebar text-sidebar-foreground select-none relative transition-[width] duration-300"
      style={{ width: collapsed ? 64 : 260 }}
    >
      {/* Logo */}
      <div className="flex items-center p-4 border-b border-sidebar-border h-16 shrink-0 overflow-hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#89295E" }}
          >
            <span className="text-white text-sm font-black">A</span>
          </div>
          {!collapsed && (
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-black text-sm tracking-tight whitespace-nowrap">Artcode</span>
              <span className="text-foreground/20 text-sm">·</span>
              <span className="font-black text-sm tracking-tight whitespace-nowrap" style={{ color: "#89295E" }}>
                BugDeck
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/projects" &&
              pathname.startsWith(item.href.split("/board")[0]));

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
              <item.icon
                className="h-4 w-4 shrink-0 transition-colors"
                style={isActive ? { color: "#89295E" } : {}}
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-14 bg-popover border border-border text-popover-foreground text-xs px-2 py-1 rounded shadow-md hidden group-hover:block z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors focus:outline-none z-50"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0 bg-sidebar-accent/30">
        <div className="flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar fallback={user?.full_name?.charAt(0) || "U"} src={user?.avatar_url} className="h-8 w-8" />
            {!collapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                  {user?.full_name || "QA Engineer"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                  {user?.email || "developer@example.com"}
                </span>
              </div>
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
    </div>
  );
};