"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    clearError();

    let valid = true;
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
      valid = false;
    }

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
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      valid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    const success = await signup(email, password, fullName);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Create Account</h2>
        <p className="text-xs text-muted-foreground">
          Sign up to begin generating checklists and edge cases.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-3.5">
        <div className="space-y-1">
          <label htmlFor="signup-name" className="text-xs font-semibold text-foreground">
            Full Name
          </label>
          <Input
            id="signup-name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
          {formErrors.fullName && (
            <span className="text-[10px] text-destructive">{formErrors.fullName}</span>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="signup-email" className="text-xs font-semibold text-foreground">
            Email Address
          </label>
          <Input
            id="signup-email"
            type="email"
            placeholder="developer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {formErrors.email && (
            <span className="text-[10px] text-destructive">{formErrors.email}</span>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="signup-password" className="text-xs font-semibold text-foreground">
            Password
          </label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Min 8 characters..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {formErrors.password && (
            <span className="text-[10px] text-destructive">{formErrors.password}</span>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="signup-confirm" className="text-xs font-semibold text-foreground">
            Confirm Password
          </label>
          <Input
            id="signup-confirm"
            type="password"
            placeholder="Repeat password..."
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          {formErrors.confirmPassword && (
            <span className="text-[10px] text-destructive">{formErrors.confirmPassword}</span>
          )}
        </div>

        <Button type="submit" className="w-full flex gap-2 pt-1" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          <span>{loading ? "Creating Account..." : "Create Account"}</span>
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground font-medium">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
