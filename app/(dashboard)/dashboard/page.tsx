"use client";

import React from "react";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";

import { TestStatusChart } from "@/components/dashboard/test-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  FolderGit2,
  TestTube2,
  BadgeAlert,
  BadgePercent,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

// Standard mock activities for dashboard rendering
const MOCK_ACTIVITIES = [
  {
    id: "act-1",
    type: "status_changed" as const,
    description: "Marked test case 'Verify Valid Login' as PASSED on E-Commerce Replatforming",
    timestamp: "2026-06-09T09:10:00Z",
    user: "Admin",
  },
  {
    id: "act-2",
    type: "test_created" as const,
    description: "Generated 12 new test cases for Checkout & Payments module",
    timestamp: "2026-06-09T08:30:00Z",
    user: "AI Copilot",
  },
  {
    id: "act-3",
    type: "document_uploaded" as const,
    description: "Uploaded 'Mobile Authentication Specs.pdf' to Mobile Banking App",
    timestamp: "2026-06-08T15:20:00Z",
    user: "Admin",
  },
  {
    id: "act-4",
    type: "status_changed" as const,
    description: "Marked test case 'Test XSS in Profile Display Name' as FAILED",
    timestamp: "2026-06-08T11:45:00Z",
    user: "Admin",
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  // Aggregate project statistics
  const totalProjects = projects.length;
  const totalTestCases = projects.reduce((acc, p) => acc + p.total_test_cases, 0);
  const totalPassed = projects.reduce((acc, p) => acc + p.passed_count, 0); // closed
  const totalFailed = projects.reduce((acc, p) => acc + p.failed_count, 0); // reopen
  const totalBlocked = projects.reduce((acc, p) => acc + p.blocked_count, 0); // todiscuss
  const totalInProgress = projects.reduce((acc, p) => acc + p.in_progress_count, 0); // working
  const totalOpen = projects.reduce((acc, p) => acc + (p.status_counts?.open || 0), 0); // open

  // Average coverage percentage across all test cases
  const overallCoverage = totalTestCases > 0 ? Math.round((totalPassed / totalTestCases) * 100) : 0;
  const pendingTests = totalOpen + totalInProgress + totalFailed + totalBlocked;

  // Data for Recharts BarChart representation
  const chartData = projects.map((p) => ({
    name: p.name.length > 18 ? p.name.substring(0, 15) + "..." : p.name,
    coverage: p.coverage_percentage,
    testCases: p.total_test_cases,
  }));

  // Data for Recharts PieChart representation
  const statusData = [
    { name: "Closed", value: totalPassed, color: "oklch(0.65 0.22 160)" },
    { name: "Reopened", value: totalFailed, color: "oklch(0.65 0.25 27.32)" },
    { name: "To Discuss", value: totalBlocked, color: "oklch(0.70 0.22 45)" },
    { name: "Open", value: totalOpen, color: "oklch(0.7 0.02 240)" },
    { name: "Fixed", value: totalInProgress, color: "oklch(0.75 0.15 80)" },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Greeting Banner */}
      <div className="flex flex-col gap-1.5 text-left border-b border-border/40 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Hello , {user?.full_name || "QA Engineer"}!
        </h1>
        <p className="text-xs text-muted-foreground font-semibold">{currentDate}</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <AnalyticsCard
          title="Total Projects"
          value={totalProjects}
          change={12}
          trend="up"
          icon={FolderGit2}
        />
        <AnalyticsCard
          title="Total Test Cases"
          value={totalTestCases}
          change={24}
          trend="up"
          icon={TestTube2}
        />
        <AnalyticsCard
          title="Overall Coverage"
          value={overallCoverage}
          suffix="%"
          change={5}
          trend="up"
          icon={BadgePercent}
        />
        <AnalyticsCard
          title="Passed Tests"
          value={totalPassed}
          change={18}
          trend="up"
          icon={CheckCircle}
        />
        <AnalyticsCard
          title="Failed Tests"
          value={totalFailed}
          change={12}
          trend="down"
          icon={BadgeAlert}
        />
        <AnalyticsCard
          title="Pending Executions"
          value={pendingTests}
          change={3}
          trend="neutral"
          icon={HelpCircle}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {/* <CoverageChart data={chartData} /> */}
        <TestStatusChart data={statusData} />
      </div>

      {/* Activities Feed */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentActivity activities={MOCK_ACTIVITIES} />
      </div> */}
    </div>
  );
}
