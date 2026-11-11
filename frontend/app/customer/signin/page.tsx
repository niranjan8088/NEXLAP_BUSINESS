"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function CustomerSignInPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setErrorMsg("Please enter your email/phone number and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await safeJsonFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          password: password.trim(),
          role: "user",
          rememberMe,
        }),
      });

      if (!res.ok || !res.data?.success) {
        // Friendly security-safe error message only
        throw new Error("The email/phone or password is incorrect.");
      }

      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const isCustomer = res.data.role === "user" || res.data.role === "customer";
      const safeNext =
        isCustomer &&
        requestedNext?.startsWith("/") &&
        !requestedNext.startsWith("//") &&
        !requestedNext.startsWith("/customer/signin") &&
        !requestedNext.startsWith("/customer/login")
          ? requestedNext
          : null;
      const redirectUrl = safeNext || res.data.redirectUrl || "/customer";
      window.location.href = redirectUrl;
    } catch (err: any) {
      setErrorMsg(err.message || "The email/phone or password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between selection:bg-nex-blue selection:text-white">
      {/* Minimal Auth Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9">
            <BrandLogo width={72} height={72} sizes="36px" priority className="h-full w-full" />
          </div>
          <span className="font-display text-lg font-bold">
            NEXLAPTECH
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">New to NEXLAPTECH?</span>
          <Link
            href="/customer/signup"
            className="rounded-full bg-nex-blue/10 hover:bg-nex-blue/20 text-nex-blue dark:text-nex-blueLight border border-nex-blue/20 px-4 py-1.5 font-bold transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: Branding Panel (Desktop ~40%) */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-nex-blue/10 border border-nex-blue/20 px-3 py-1 text-[11px] font-bold text-nex-blue dark:text-nex-blueLight mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> NexLapTech Account Portal
              </span>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Technology made simple.
              </h1>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Access your account to manage orders, service requests, bookings, and get expert support.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Track your orders in real-time</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Manage service &amp; repair requests</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Get doorstep technical support faster</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Sign-In Card (60% Desktop, 100% Mobile) */}
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sign in to continue to your NexLapTech customer account.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3.5 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                {/* Email or Phone Input */}
                <div className="space-y-1.5">
                  <label htmlFor="signin-identity" className="font-semibold text-slate-700 dark:text-slate-300">
                    Email Address or Indian Mobile Number *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="signin-identity"
                      type="text"
                      required
                      autoComplete="username"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="e.g. customer@gmail.com or 9876543210"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 pl-10 pr-4 py-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="signin-password" className="font-semibold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    <Link
                      href="/customer/forgot-password"
                      className="text-[11px] font-bold text-nex-blue dark:text-nex-blueLight hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 pl-10 pr-10 py-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-nex-blue focus:ring-nex-blue"
                  />
                  <label htmlFor="remember-me" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                    Remember my sign-in session
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-nex-blue hover:bg-blue-600 text-white font-bold py-3 text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Navigation Link */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/customer/signup" className="font-bold text-nex-blue dark:text-nex-blueLight hover:underline">
                  Create Account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Minimal Auth Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 border-t border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 NexLapTech. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/contact" className="hover:text-nex-blue">Contact</Link>
          <Link href="/contact" className="hover:text-nex-blue">Privacy</Link>
          <Link href="/contact" className="hover:text-nex-blue">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
