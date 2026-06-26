"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";
import { useRunTestStore } from "@/store/runtest-store";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { TestStatusChart } from "@/components/dashboard/test-status-chart";
import {
  FolderGit2,
  Bug,
  CheckCircle2,
  XCircle,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { projects, selectedProject } = useProjectStore();
  const { testCases, fetchRunTestData } = useRunTestStore();

  useEffect(() => {
    if (selectedProject?.id) {
      fetchRunTestData(selectedProject.id);
    }
  }, [selectedProject?.id, fetchRunTestData]);

  // ── Bug Board stats ──────────────────────────────────────────────────────
  const totalBugs      = projects.reduce((acc, p) => acc + p.total_test_cases, 0);
  const bugsClosed     = projects.reduce((acc, p) => acc + p.passed_count, 0);       // closed
  const bugsReopened   = projects.reduce((acc, p) => acc + p.failed_count, 0);       // reopen
  const bugsOpen       = projects.reduce((acc, p) => acc + (p.status_counts?.open || 0), 0);
  const bugsWorking    = projects.reduce((acc, p) => acc + p.in_progress_count, 0);  // working
  const bugsToDiscuss  = projects.reduce((acc, p) => acc + p.blocked_count, 0);      // todiscuss

  const bugStatusData = [
    { name: "Closed",     value: bugsClosed,    color: "oklch(0.65 0.22 160)"  },
    { name: "Reopened",   value: bugsReopened,  color: "oklch(0.65 0.25 27.32)"},
    { name: "To Discuss", value: bugsToDiscuss, color: "oklch(0.70 0.22 45)"   },
    { name: "Open",       value: bugsOpen,      color: "oklch(0.7 0.02 240)"   },
    { name: "Fixed",      value: bugsWorking,   color: "oklch(0.75 0.15 80)"   },
  ];

  // ── RunTest stats ────────────────────────────────────────────────────────
  const runCases = selectedProject
    ? testCases.filter((tc) => tc.project_id === selectedProject.id)
    : testCases;

  const rtTotal      = runCases.length;
  const rtPassed     = runCases.filter((tc) => tc.status === "passed").length;
  const rtFailed     = runCases.filter((tc) => tc.status === "failed").length;
  const rtBlocked    = runCases.filter((tc) => tc.status === "blocked").length;
  const rtInProgress = runCases.filter((tc) => tc.status === "in_progress").length;
  const rtOpen       = runCases.filter((tc) => tc.status === "open").length;
  const rtToDiscuss  = runCases.filter((tc) => tc.status === "to_discuss").length;

  const runTestStatusData = [
    { name: "Passed",      value: rtPassed,     color: "oklch(0.65 0.22 160)"  },
    { name: "Failed",      value: rtFailed,     color: "oklch(0.65 0.25 27.32)"},
    { name: "Blocked",     value: rtBlocked,    color: "oklch(0.70 0.22 45)"   },
    { name: "In Progress", value: rtInProgress, color: "oklch(0.60 0.18 220)"  },
    { name: "Open",        value: rtOpen,       color: "oklch(0.7 0.02 240)"   },
    { name: "To Discuss",  value: rtToDiscuss,  color: "oklch(0.70 0.20 300)"  },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col gap-1.5 text-left border-b border-border/40 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Hello, {user?.full_name || "QA Engineer"}!
        </h1>
        <p className="text-xs text-muted-foreground font-semibold">{currentDate}</p>
      </div>

      {/* 6 Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Bug Board */}
        <AnalyticsCard
          title="Total Projects"
          value={projects.length}
          trend="neutral"
          icon={FolderGit2}
        />
        <AnalyticsCard
          title="Total Bugs"
          value={totalBugs}
          trend="neutral"
          icon={Bug}
        />
        <AnalyticsCard
          title="Bugs Closed"
          value={bugsClosed}
          trend="up"
          icon={CheckCircle2}
        />
        {/* RunTest */}
        <AnalyticsCard
          title="Test Cases"
          value={rtTotal}
          trend="neutral"
          icon={FlaskConical}
        />
        <AnalyticsCard
          title="Tests Passed"
          value={rtPassed}
          trend="up"
          icon={ShieldCheck}
        />
        <AnalyticsCard
          title="Tests Failed"
          value={rtFailed}
          trend={rtFailed > 0 ? "down" : "neutral"}
          icon={XCircle}
        />
      </div>

      {/* Charts — Bug Board + RunTest side by side */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <TestStatusChart
          data={bugStatusData}
          title="Bug Board Status"
          description="Distribution of bugs across all board columns."
        />
        <TestStatusChart
          data={runTestStatusData}
          title="Test Cases Execution"
          description={
            selectedProject
              ? `Execution status for "${selectedProject.name}".`
              : "Execution status across all projects."
          }
        />
      </div>
    </div>
  );
}