"use client";

import Link from "next/link";
import { ArrowRight, Kanban, Layers, Download, AlertTriangle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#89295E" }}
          >
            <span className="text-white text-sm font-black">A</span>
          </div>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-black text-base tracking-tight text-white">Artcode</span>
            <span className="text-base font-light text-white/40">·</span>
            <span className="font-black text-base tracking-tight" style={{ color: "#89295E" }}>
              BugDeck
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
            Log in
          </Link>
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
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#89295E" }} />
            By Artcode Pvt. Ltd.
          </div>

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
            Track bugs.<br />
            Ship faster.<br />
            <span className="text-white/25">Skip Jira.</span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Artcode BugDeck is a focused bug tracker for small dev and QA teams. Organize by project and module, drag bugs across status columns, export clean reports.
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

        {/* Kanban preview */}
        <div className="relative">
          <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
            <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-white/8">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 text-[10px] text-white/20 font-mono">artcode-bugdeck.app/projects/mobile-app</span>
            </div>
            <div className="flex gap-3 overflow-hidden">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Backlog</span>
                  <span className="ml-auto text-[10px] text-white/20">2</span>
                </div>
                <div className="space-y-1.5">
                  <BugCard title="Login fails on Safari" module="Auth" priority="high" />
                  <BugCard title="Profile image upload 500" module="Settings" priority="medium" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">In Progress</span>
                  <span className="ml-auto text-[10px] text-white/20">2</span>
                </div>
                <div className="space-y-1.5">
                  <BugCard title="OTP not delivered on resend" module="Auth" priority="high" active />
                  <BugCard title="Dashboard chart flickers" module="Reports" priority="low" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Resolved</span>
                  <span className="ml-auto text-[10px] text-white/20">5</span>
                </div>
                <div className="space-y-1.5">
                  <BugCard title="CSV export missing headers" module="Export" priority="medium" done />
                  <BugCard title="Signup redirect broken" module="Auth" priority="high" done />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -inset-4 rounded-3xl blur-2xl -z-10" style={{ backgroundColor: "rgba(137,41,94,0.07)" }} />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8"><div className="border-t border-white/8" /></div>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-white/8 rounded-2xl overflow-hidden">
          <Step n="01" title="Create a project" desc="One project per product or codebase. Work solo or with your team." border />
          <Step n="02" title="Add modules" desc="Break the project into areas — Auth, Payments, Dashboard. Bugs stay organized." border />
          <Step n="03" title="Track and export" desc="Drag bugs across columns. Export a CSV for your client or sprint report." />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8"><div className="border-t border-white/8" /></div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10">What's inside</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Feature icon={<Kanban className="h-4 w-4" />} title="Kanban board" desc="5 status columns — Backlog, To Test, In Progress, Passed, Failed. Drag and drop bugs between them." />
          <Feature icon={<Layers className="h-4 w-4" />} title="Module management" desc="Each project can have multiple modules. Filter bugs by module on the board." />
          <Feature icon={<Download className="h-4 w-4" />} title="CSV export" desc="Export all bugs with module names, priority, and status. Share with clients or PMs." />
          <Feature icon={<AlertTriangle className="h-4 w-4" />} title="Priority tracking" desc="Mark bugs Low, Medium, or High. Spot critical issues at a glance." />
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
          <div
            className="h-6 w-6 rounded flex items-center justify-center"
            style={{ backgroundColor: "#89295E" }}
          >
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

function BugCard({ title, module, priority, active, done }: {
  title: string; module: string; priority: "low" | "medium" | "high"; active?: boolean; done?: boolean;
}) {
  const priorityColor = { low: "text-white/30", medium: "text-amber-400/70", high: "text-red-400/80" }[priority];
  return (
    <div className={`rounded-lg border p-2 space-y-1.5 ${active ? "border-blue-400/30 bg-blue-400/5" : done ? "border-white/5 bg-white/2 opacity-40" : "border-white/8 bg-white/4"}`}>
      <p className={`text-[10px] font-medium leading-snug ${done ? "line-through text-white/30" : "text-white/80"}`}>{title}</p>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/25 bg-white/8 px-1.5 py-0.5 rounded">{module}</span>
        <span className={`text-[9px] font-semibold uppercase ${priorityColor}`}>{priority}</span>
      </div>
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