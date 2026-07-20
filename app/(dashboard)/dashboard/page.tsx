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
  const totalBugs      = selectedProject ? selectedProject.total_test_cases : projects.reduce((acc, p) => acc + p.total_test_cases, 0);
  const bugsClosed     = selectedProject ? selectedProject.passed_count     : projects.reduce((acc, p) => acc + p.passed_count, 0);       // closed
  const bugsReopened   = selectedProject ? selectedProject.failed_count     : projects.reduce((acc, p) => acc + p.failed_count, 0);       // reopen
  const bugsOpen       = selectedProject ? (selectedProject.status_counts?.open || 0) : projects.reduce((acc, p) => acc + (p.status_counts?.open || 0), 0);
  const bugsFixed      = selectedProject ? selectedProject.in_progress_count : projects.reduce((acc, p) => acc + p.in_progress_count, 0); // Fixed
  const bugsToDiscuss  = selectedProject ? selectedProject.blocked_count    : projects.reduce((acc, p) => acc + p.blocked_count, 0);      // todiscuss

  const bugStatusData = [
    { name: "Closed",     value: bugsClosed,    color: "oklch(0.65 0.22 160)",   statusKey: "closed"    },
    { name: "Reopened",   value: bugsReopened,  color: "oklch(0.65 0.25 27.32)", statusKey: "reopen"    },
    { name: "To Discuss", value: bugsToDiscuss, color: "oklch(0.70 0.22 45)",    statusKey: "todiscuss" },
    { name: "Open",       value: bugsOpen,      color: "oklch(0.7 0.02 240)",    statusKey: "open"      },
    { name: "Fixed",      value: bugsFixed,     color: "oklch(0.685 0.148 237.3)", statusKey: "Fixed"   },
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
    { name: "Passed",      value: rtPassed,     color: "oklch(0.65 0.22 160)",   statusKey: "passed"      },
    { name: "Failed",      value: rtFailed,     color: "oklch(0.65 0.25 27.32)", statusKey: "failed"      },
    { name: "Blocked",     value: rtBlocked,    color: "oklch(0.70 0.22 45)",    statusKey: "blocked"     },
    { name: "In Progress", value: rtInProgress, color: "oklch(0.60 0.18 220)",   statusKey: "in_progress" },
    { name: "Open",        value: rtOpen,       color: "oklch(0.7 0.02 240)",    statusKey: "open"        },
    { name: "To Discuss",  value: rtToDiscuss,  color: "oklch(0.70 0.20 300)",   statusKey: "to_discuss"  },
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
      <div className="flex flex-col gap-2 text-left border-b border-border/40 pb-6 mb-8 mt-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground bg-clip-text">
          Hello
        </h1>
        <p className="text-sm text-muted-foreground font-medium">{currentDate}</p>
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
        <div className="md:col-span-3">
          <TestStatusChart
            data={bugStatusData}
            title="Bug Board Status"
            description={
              selectedProject
                ? `Distribution of bugs across board columns for "${selectedProject.name}".`
                : "Distribution of bugs across all board columns, all projects."
            }
            projectId={selectedProject?.id}
            boardType="board"
          />
        </div>
        <div className="md:col-span-3">
          <TestStatusChart
            data={runTestStatusData}
            title="Test Cases Execution"
            description={
              selectedProject
                ? `Execution status for "${selectedProject.name}".`
                : "Execution status across all projects."
            }
            projectId={selectedProject?.id}
            boardType="runtest"
          />
        </div>
      </div>
    </div>
  );
}