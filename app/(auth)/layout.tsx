"use client";

import React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between select-none">

      {/* Header */}
      <header className="flex h-16 items-center px-8 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#89295E" }}
          >
            <span className="text-white text-sm font-black">A</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-base tracking-tight text-white">Artcode</span>
            <span className="text-white/25 text-base">·</span>
            <span className="font-black text-base tracking-tight" style={{ color: "#89295E" }}>BugDeck</span>
          </div>
        </Link>
      </header>

      {/* Auth Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] bg-white/4 border border-white/10 p-8 rounded-2xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 py-5 text-center text-xs text-white/25">
        © 2026 Artcode Pvt. Ltd. All rights reserved.
      </footer>

    </div>
  );
}