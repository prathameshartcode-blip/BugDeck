"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, LogIn, GitBranch } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("admin@qacopilot.com");
  const [password, setPassword] = useState("password123");
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    let valid = true;
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-xs text-muted-foreground">
          Sign in to access your projects and execute testing checksheets.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-xs font-semibold text-foreground">
            Email Address
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="admin@qacopilot.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {formErrors.email && (
            <span className="text-[10px] text-destructive">{formErrors.email}</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {formErrors.password && (
            <span className="text-[10px] text-destructive">{formErrors.password}</span>
          )}
        </div>

        <Button type="submit" className="w-full flex gap-2" disabled={loading}>
          <LogIn className="h-4 w-4" />
          <span>{loading ? "Signing in..." : "Sign In"}</span>
        </Button>
      </form>

      <div className="relative border-b border-border my-2">
        <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-card px-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          Or Continue With
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" type="button" className="text-xs gap-1.5 font-bold h-9">
          <GitBranch className="h-4 w-4" /> Github
        </Button>
        <Button variant="outline" size="sm" type="button" className="text-xs gap-1.5 font-bold h-9">
          Google
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground font-medium">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary font-bold hover:underline">
          Sign Up Free
        </Link>
      </p>
    </div>
  );
}
