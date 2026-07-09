"use client";

import Link from "next/link";
import {
  ArrowRight,
  Kanban,
  Layers,
  Download,
  AlertTriangle,
  FlaskConical,
  Upload,
  FileSpreadsheet,
  GripVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  MessageSquare,
  Sparkles,
  Image,
  Bug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#89295E" }}>
            <span className="text-white text-sm font-black">A</span>
          </div>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-black text-base tracking-tight text-white">Artcode</span>
            <span className="text-base font-light text-white/40">·</span>
            <span className="font-black text-base tracking-tight" style={{ color: "#89295E" }}>BugDeck</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Log in</Link>
          <Link
            href="/signup"
            className="text-sm font-bold px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#89295E" }}
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
            style={{ color: "#89295E", backgroundColor: "rgba(137,41,94,0.08)", borderColor: "rgba(137,41,94,0.25)" }}
          >
            <Sparkles className="h-3 w-3" />
            AI-Powered Test &amp; Defect Generation
          </div>

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
            Track bugs.<br />
            Run tests.<br />
            <span className="text-white/25">Supercharged by AI.</span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            BugDeck is a smart QA tool. Track defects, execute test cases, import/export CSV files, and now: **instantly generate test cases or report multi-defect issues using screenshots with our free vision-integrated AI**.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#89295E" }}
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Already have an account →
            </Link>
          </div>
        </div>

        {/* Dual board preview */}
        <div className="relative space-y-3">
          {/* Bug Board preview */}
          <div className="rounded-xl border border-white/10 bg-white/4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Kanban className="h-3.5 w-3.5" style={{ color: "#89295E" }} />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Bug Board</span>
            </div>
            <div className="flex gap-2 overflow-hidden">
              <MiniColumn label="Open" dot="bg-white/30" count={2}>
                <MiniCard title="Login fails on Safari" module="Auth" priority="high" />
                <MiniCard title="Profile upload 500" module="Settings" priority="medium" />
              </MiniColumn>
              <MiniColumn label="Working" dot="bg-sky-400" count={1}>
                <MiniCard title="OTP not delivered" module="Auth" priority="high" active />
              </MiniColumn>
              <MiniColumn label="Closed" dot="bg-emerald-400" count={2}>
                <MiniCard title="CSV missing headers" module="Export" priority="medium" done />
                <MiniCard title="Signup redirect broken" module="Auth" priority="high" done />
              </MiniColumn>
            </div>
          </div>

          {/* RunTest preview */}
          <div className="rounded-xl border border-white/10 bg-white/4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-3.5 w-3.5" style={{ color: "#89295E" }} />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">RunTest</span>
            </div>
            <div className="flex gap-2 overflow-hidden">
              <MiniColumn label="Open" dot="bg-white/30" count={2}>
                <MiniCard title="Verify valid login" module="Auth" priority="critical" />
                <MiniCard title="OTP resend flow" module="Auth" priority="high" />
              </MiniColumn>
              <MiniColumn label="Passed" dot="bg-emerald-400" count={1}>
                <MiniCard title="Dashboard loads" module="Reports" priority="medium" done />
              </MiniColumn>
              <MiniColumn label="Failed" dot="bg-red-400" count={1}>
                <MiniCard title="Export CSV headers" module="Export" priority="high" failed />
              </MiniColumn>
            </div>
          </div>

          <div className="absolute -inset-4 rounded-3xl blur-2xl -z-10" style={{ backgroundColor: "rgba(137,41,94,0.07)" }} />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8"><div className="border-t border-white/8" /></div>

      {/* Two modules section */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10">Two modules, one tool</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Bug Board module */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(137,41,94,0.15)" }}>
                <Kanban className="h-4 w-4" style={{ color: "#89295E" }} />
              </div>
              <div>
                <p className="font-bold text-sm">Bug Board</p>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Defect tracking</p>
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              A kanban board with 5 status columns — Open, Working, Reopen, To Discuss, Closed. Drag bugs across columns, filter by module or priority, and keep the whole team in sync.
            </p>
            <div className="space-y-2">
              <StatusRow icon={<GripVertical className="h-3 w-3" />} label="Drag-and-drop across 5 columns" />
              <StatusRow icon={<Layers className="h-3 w-3" />} label="Filter by module and priority" />
              <StatusRow icon={<Upload className="h-3 w-3" />} label="Import bugs from any CSV in one click" />
              <StatusRow icon={<Download className="h-3 w-3" />} label="Export board to CSV for client reports" />
            </div>
          </div>

          {/* RunTest module */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(137,41,94,0.15)" }}>
                <FlaskConical className="h-4 w-4" style={{ color: "#89295E" }} />
              </div>
              <div>
                <p className="font-bold text-sm">RunTest</p>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Test case execution</p>
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              A dedicated board for executing test cases. Track each case through Open → In Progress → Passed / Failed / Blocked / To Discuss. Log actual results and failure reasons inline.
            </p>
            <div className="space-y-2">
              <StatusRow icon={<CheckCircle2 className="h-3 w-3" />} label="6 execution statuses — Passed, Failed, Blocked and more" />
              <StatusRow icon={<XCircle className="h-3 w-3" />} label="Log actual results and failure reasons per case" />
              <StatusRow icon={<Upload className="h-3 w-3" />} label="Import test cases from CSV in one click" />
              <StatusRow icon={<FileSpreadsheet className="h-3 w-3" />} label="Export execution results with filters applied" />
            </div>
          </div>

          {/* AI Generation module */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-8 space-y-5 md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-10" style={{ backgroundColor: "rgba(137,41,94,0.08)" }} />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm flex items-center gap-2">
                  AI Test &amp; Bug Generator
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-widest">New</span>
                </p>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Groq Vision &amp; LLama 3 Integration</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-white/40 leading-relaxed">
                  Accelerate your QA pipeline. Provide a feature description, or simply upload/paste a screenshot of your UI. Our integrated AI reads the layout, generates structured test cases, detects visual flaws, and reports multiple bugs in one go.
                </p>
                <div className="space-y-2">
                  <StatusRow icon={<Image className="h-3 w-3 text-purple-400" />} label="Ctrl+V Image Paste support for Vision analysis" />
                  <StatusRow icon={<Sparkles className="h-3 w-3 text-purple-400" />} label="Generate 5-8 structured test cases in seconds" />
                  <StatusRow icon={<Bug className="h-3 w-3 text-purple-400" />} label="De-duplicate and separate multiple issues from one input" />
                  <StatusRow icon={<CheckCircle2 className="h-3 w-3 text-purple-400" />} label="Select and import directly to your active boards" />
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/1 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-purple-400" /> AI Insights Preview
                  </span>
                  <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400 bg-purple-500/5">Vision Enabled</Badge>
                </div>
                <div className="space-y-2.5">
                  <div className="bg-white/3 rounded-lg p-2 border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-4 w-4 rounded bg-purple-500/20 flex items-center justify-center text-[9px] font-bold text-purple-400">1</div>
                      <span className="text-[10px] font-bold text-white/70">Analyze screenshot context</span>
                    </div>
                    <p className="text-[10px] text-white/40 pl-6 leading-normal">
                      Pasted dashboard layout: Found misalignment in header and 500 error in auth-status response.
                    </p>
                  </div>
                  <div className="bg-white/3 rounded-lg p-2 border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-4 w-4 rounded bg-purple-500/20 flex items-center justify-center text-[9px] font-bold text-purple-400">2</div>
                      <span className="text-[10px] font-bold text-white/70">Identified Bugs / Test Steps</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <p className="text-[9px] text-red-400 font-semibold flex items-center gap-1">❌ Bug 1: Header rendering overlap (Critical)</p>
                      <p className="text-[9px] text-red-400 font-semibold flex items-center gap-1">❌ Bug 2: Auth status error code 500 (High)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8"><div className="border-t border-white/8" /></div>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 border border-white/8 rounded-2xl overflow-hidden">
          <Step n="01" title="Create a project" desc="One project per product. Work solo or invite your team." border />
          <Step n="02" title="Add modules" desc="Break the project into areas — Auth, Payments, Dashboard." border />
          <Step n="03" title="Track bugs" desc="Drag defects across the Bug Board. Update status with a single drop." border />
          <Step n="04" title="Execute & export" desc="Run test cases in RunTest. Export results as CSV for your sprint report." />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8"><div className="border-t border-white/8" /></div>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10">Everything you need</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature
            icon={<Kanban className="h-4 w-4" />}
            title="Kanban bug board"
            desc="5 status columns for bugs — Open, Working, Reopen, To Discuss, Closed. Drag and drop to update instantly."
          />
          <Feature
            icon={<FlaskConical className="h-4 w-4" />}
            title="RunTest execution"
            desc="A separate board for test case execution with 6 statuses. Log expected vs actual results and failure reasons inline."
          />
          <Feature
            icon={<Upload className="h-4 w-4" />}
            title="One-click CSV import"
            desc="Import bugs or test cases from any CSV. Auto-maps columns, handles mismatched status names, and reports what was skipped."
          />
          <Feature
            icon={<FileSpreadsheet className="h-4 w-4" />}
            title="CSV template download"
            desc="Don't know the format? Download a blank template from the import button and fill it in — no guessing required."
          />
          <Feature
            icon={<Layers className="h-4 w-4" />}
            title="Module management"
            desc="Organize bugs and test cases into modules like Auth, Checkout, or Dashboard. Filter the board by module in one click."
          />
          <Feature
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Priority tracking"
            desc="Mark items Critical, High, Medium, or Low. Spots blockers at a glance across both boards."
          />
          <Feature
            icon={<Download className="h-4 w-4" />}
            title="Filtered CSV export"
            desc="Export the board with active filters — by module, status, or priority. Share a clean report without manual cleanup."
          />
          <Feature
            icon={<MessageSquare className="h-4 w-4" />}
            title="Inline detail editing"
            desc="Click any card to log actual results, failure reasons, screenshot URLs, and step-by-step actions without leaving the board."
          />
          <Feature
            icon={<Sparkles className="h-4 w-4" />}
            title="AI Test Case Generator"
            desc="Write a feature description or paste a screenshot, select a module, and import structured cases directly into your test suites."
          />
          <Feature
            icon={<Bug className="h-4 w-4" />}
            title="AI Bug Reporter"
            desc="Enter a list of problems or paste error designs. AI parses the issues, maps expected/actual results, and splits them into distinct cards."
          />
          <Feature
            icon={<Image className="h-4 w-4" />}
            title="Vision Model Analysis"
            desc="Direct copy-paste (Ctrl+V) from screenshots to enable Groq to extract details, steps, and priority directly from visual mockups."
          />
        </div>
      </section>

      {/* CTA strip */}
      <section className="max-w-6xl mx-auto px-8 pb-20">
        <div
          className="rounded-2xl border px-10 py-12 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ borderColor: "rgba(137,41,94,0.3)", backgroundColor: "rgba(137,41,94,0.07)" }}
        >
          <div>
            <p className="text-xl font-bold">Ready to replace your spreadsheet?</p>
            <p className="text-white/40 text-sm mt-1">Free to use. No credit card needed.</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: "#89295E" }}
          >
            Create your first project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-7 max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded flex items-center justify-center" style={{ backgroundColor: "#89295E" }}>
            <span className="text-white text-[10px] font-black">A</span>
          </div>
          <span className="text-sm font-black text-white">Artcode</span>
          <span className="text-white/20 text-sm">·</span>
          <span className="text-sm font-black" style={{ color: "#89295E" }}>BugDeck</span>
        </div>
        <p className="text-xs text-white/25">© 2026 Artcode Pvt. Ltd. All rights reserved.</p>
      </footer>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniColumn({ label, dot, count, children }: {
  label: string; dot: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-[9px] text-white/20">{count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function MiniCard({ title, module, priority, active, done, failed }: {
  title: string; module: string; priority: string; active?: boolean; done?: boolean; failed?: boolean;
}) {
  const priorityColor: Record<string, string> = {
    low: "text-white/30", medium: "text-amber-400/70", high: "text-red-400/80", critical: "text-red-500",
  };
  return (
    <div className={`rounded-lg border p-2 space-y-1.5 ${
      active  ? "border-sky-400/30 bg-sky-400/5" :
      done    ? "border-white/5 bg-white/2 opacity-40" :
      failed  ? "border-red-400/30 bg-red-400/5" :
                "border-white/8 bg-white/4"
    }`}>
      <p className={`text-[10px] font-medium leading-snug ${done ? "line-through text-white/30" : "text-white/80"}`}>{title}</p>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/25 bg-white/8 px-1.5 py-0.5 rounded">{module}</span>
        <span className={`text-[9px] font-semibold uppercase ${priorityColor[priority] || "text-white/30"}`}>{priority}</span>
      </div>
    </div>
  );
}

function StatusRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-white/40">
      <span style={{ color: "#89295E" }}>{icon}</span>
      {label}
    </div>
  );
}

function Step({ n, title, desc, border }: { n: string; title: string; desc: string; border?: boolean }) {
  return (
    <div className={`p-8 space-y-3 ${border ? "border-r border-white/8" : ""}`}>
      <span className="text-xs font-mono text-white/20">{n}</span>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-6 space-y-3 hover:border-white/15 transition-colors">
      <div style={{ color: "#89295E" }}>{icon}</div>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}