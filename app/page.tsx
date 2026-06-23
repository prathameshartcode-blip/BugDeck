"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground gradient-hero relative overflow-hidden flex flex-col justify-between">
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none -z-10" />

      {/* Navigation header */}
      <header className="flex h-16 items-center justify-between px-6 sm:px-12 border-b border-border/40 select-none backdrop-blur-md sticky top-0 z-50 bg-background/70">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="font-bold text-base tracking-tight text-gradient">QA Copilot</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-semibold hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/signup">
            <Button size="sm" className="h-8 text-xs font-semibold px-4 rounded-lg">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </header>
      

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary select-none"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Now in Public Beta</span>
          <ChevronRight className="h-3 w-3" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-foreground max-w-4xl"
        >
          AI-Powered Test Case <br />
          <span className="text-gradient">Generation & Management</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium"
        >
          Upload your PRD, requirements, or templates. QA Copilot automatically builds complete, production-grade test suites, checklists, and tracking boards.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-4 items-center justify-center select-none pt-4"
        >
          <Link href="/signup">
            <Button size="lg" className="rounded-xl font-bold flex gap-2 h-12 px-6">
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="rounded-xl font-bold h-12 px-6">
              View Interactive Demo
            </Button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 text-left w-full"
        >
          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all space-y-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">Instant Checklist Generator</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Analyzes requirements document in seconds to detect modules, workflows, forms, and report requirements.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all space-y-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">Multi-Category Testing</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generates functional paths, validation boundary checks, security assertions (XSS, Injection), and Edge cases.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all space-y-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">Live Coverage Heatmap</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track passes, failures, and blocks on a visual heatmap without importing to third-party dashboards.
            </p>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="pt-12 select-none"
        >
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">
            Trusted by developers & QA teams globally
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-50 text-xs font-bold text-muted-foreground">
            <span>VERCEL</span>
            <span>NOTION</span>
            <span>LINEAR</span>
            <span>RAYCAST</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center select-none shrink-0 bg-card/25 text-xs text-muted-foreground">
        <p>© 2026 QA Copilot. Built for modern software delivery. All rights reserved.</p>
      </footer>
    </div>
  );
}
