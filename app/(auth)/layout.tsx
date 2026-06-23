"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between select-none relative overflow-hidden">
      {/* Background highlight */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none -z-10" />

      {/* Header logo */}
      <header className="flex h-16 items-center px-8 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="font-bold text-base tracking-tight text-gradient">QA Copilot</span>
        </Link>
      </header>

      {/* Auth Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] bg-card border border-border p-8 rounded-2xl shadow-sm transition-all duration-200">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 text-center text-[10px] text-muted-foreground bg-card/20 shrink-0">
        <p>© 2026 QA Copilot. All credentials validation matches mock sandbox profiles.</p>
      </footer>
    </div>
  );
}
