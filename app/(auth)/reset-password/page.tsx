"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, MailWarning } from "lucide-react";

export default function ResetPasswordPage() {
  const { resetPassword, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    const success = await resetPassword(email);
    if (success) {
      setIsSuccess(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Reset Password</h2>
        <p className="text-xs text-muted-foreground">
          Enter your email to receive a password reset validation link.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">Recovery Link Dispatched</p>
              <p className="font-medium text-[10px] text-muted-foreground leading-normal">
                Check your mailbox for instructions on configuring your new password credential.
              </p>
            </div>
          </div>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full text-xs font-bold">
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold flex items-center gap-2">
              <MailWarning className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="reset-email" className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <Input
              id="reset-email"
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {emailError && (
              <span className="text-[10px] text-destructive">{emailError}</span>
            )}
          </div>

          <Button type="submit" className="w-full text-xs font-bold" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <p className="text-center text-xs text-muted-foreground font-medium">
            Remembered your credentials?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
