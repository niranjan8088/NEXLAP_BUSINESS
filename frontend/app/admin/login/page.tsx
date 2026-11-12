"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Shield,
  Sparkles,
  HelpCircle,
  KeyRound,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return setErrorMsg("Please enter both email and password.");
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid admin credentials.");
      }

      router.replace("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center bg-[#070B1A] px-4 py-12 sm:px-6 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            aria-label="NEXLAPTECH Storefront"
            className="inline-flex flex-col items-center gap-2 group mb-3"
          >
            <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md transition-transform group-hover:scale-105 shadow-[0_0_24px_rgba(25,195,240,0.15)] flex items-center justify-center">
              <BrandLogo width={96} height={96} sizes="48px" priority className="h-full w-full" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              NEXLAPTECH
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 mb-2">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Quantum Command Gateway
          </div>

          <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Control Panel</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Authorized administrative access &amp; operations only.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {errorMsg && (
            <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-300 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Development credentials helper banner */}
          <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-3.5 text-xs leading-relaxed text-indigo-200">
            <strong className="text-cyan-300 font-bold">Admin credentials:</strong> Email:{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white">
              admin@nexbyte.com
            </code>{" "}
            &nbsp;·&nbsp; Password:{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white">
              admin123
            </code>
          </div>

          {showForgot ? (
            /* Forgot Password Panel */
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="font-display text-base font-bold text-white">Password Recovery</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  Administrative passwords require verified system-level authorization to modify.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-300">
                <p>
                  <strong className="text-white font-bold">1. Supabase Dashboard:</strong> Authentication → Users → Reset password for admin user.
                </p>
                <p>
                  <strong className="text-white font-bold">2. System Administrator:</strong> Contact{" "}
                  <span className="text-cyan-300 font-mono">admin@nexbyte.com</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10"
              >
                ← Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-300">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexbyte.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] font-semibold text-cyan-400 hover:underline"
                  >
                    Need recovery?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-10 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  {/* Accessible 32x32px visibility toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Remember Session (30 Days)</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 py-3.5 text-sm font-extrabold text-slate-950 transition-all shadow-lg hover:shadow-cyan-500/25 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-slate-950" /> Authenticate Command Access <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Return link */}
          <div className="mt-6 border-t border-white/10 pt-5 text-center text-xs text-slate-400">
            <Link href="/" className="font-semibold text-cyan-400 hover:underline">
              ← Return to NexLapTech Storefront
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Quantum Security · Role-Based Access Control Active
          </span>
        </div>
      </div>
    </main>
  );
}
