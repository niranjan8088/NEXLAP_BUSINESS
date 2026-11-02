"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Phone,
  FileText,
  CheckCircle2,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<"user" | "reseller">("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      return setErrorMsg("Please fill in all required fields.");
    }
    if (password.length < 6) {
      return setErrorMsg("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return setErrorMsg("Passwords do not match.");
    }
    if (!phone.trim()) {
      return setErrorMsg("Phone number is required.");
    }
    if (selectedRole === "user") {
      if (!dateOfBirth) {
        return setErrorMsg("Date of Birth is required for customer accounts.");
      }
      const dobDate = new Date(dateOfBirth);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        return setErrorMsg("Date of Birth cannot be a future date or invalid.");
      }
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          dateOfBirth: selectedRole === "user" ? dateOfBirth : undefined,
          role: selectedRole,
          businessName: selectedRole === "reseller" ? businessName : undefined,
          gstin: selectedRole === "reseller" ? gstin : undefined,
          businessDescription: selectedRole === "reseller" ? businessDescription : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      if (selectedRole === "reseller") {
        setSuccessMsg("Reseller application submitted! An admin will review and approve your account.");
      } else {
        setSuccessMsg("Account created successfully! Redirecting to sign in...");
      }
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected registration error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0718] shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#070B1A] via-[#0B0718] to-indigo-950 p-8 text-white lg:flex lg:flex-col lg:justify-between border-r border-slate-200 dark:border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_40%)]" />
            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                  <BrandLogo width={64} height={64} sizes="36px" priority className="h-9 w-9" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">NexLapTech</p>
                  <p className="text-xl font-bold">Join the network</p>
                </div>
              </div>

              <h1 className="max-w-sm text-4xl font-black leading-tight">Build an account designed for growth.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                Create a customer or reseller account and unlock faster shopping, stronger support, and business-ready tools.
              </p>
            </div>

            <div className="relative z-10 grid gap-3 text-sm text-slate-300">
              {[
                "Instant access to your portal",
                "Trusted commerce and support",
                "Fast onboarding for partners",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-base font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between gap-3">
              <Link href="/" className="inline-flex items-center gap-3" aria-label="NexLapTech home">
                <div className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2">
                  <BrandLogo width={72} height={72} sizes="36px" priority className="h-9 w-9" />
                </div>
                <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">NEXLAPTECH</span>
              </Link>

              <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-white/10">
                Sign in
              </Link>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Create account</p>
              <h2 className="heading-h1">Get started</h2>
              <p className="mt-2 text-sm text-readable-secondary">Choose your account type and complete your profile.</p>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("user");
                    setErrorMsg("");
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-[11px] font-bold transition-all ${
                    selectedRole === "user" ? "bg-white dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-sm ring-1 ring-cyan-500/30" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <User className="mb-1 h-4 w-4" />
                  CUSTOMER
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("reseller");
                    setErrorMsg("");
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-[11px] font-bold transition-all ${
                    selectedRole === "reseller" ? "bg-white dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm ring-1 ring-violet-500/30" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Building2 className="mb-1 h-4 w-4" />
                  RESELLER
                </button>
              </div>
            </div>

            {selectedRole === "reseller" && (
              <div className="mb-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 text-[12px] leading-6 text-violet-700 dark:text-violet-300">
                <strong className="font-bold">Reseller application:</strong> your account will be reviewed by NexLapTech admin before approval.
              </div>
            )}

            {errorMsg && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedRole === "reseller" ? "Full Name / Business Owner" : "Full Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="futuristic-input w-full rounded-xl px-3.5 py-3 text-sm"
                />
              </div>

              {selectedRole === "reseller" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Business Name *</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="TechZone Computers"
                        className="futuristic-input w-full rounded-xl py-3 pl-10 pr-3 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">GSTIN (Optional)</label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="29ABCDE1234F1Z5"
                        className="futuristic-input w-full rounded-xl py-3 pl-10 pr-3 text-sm uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Business Description</label>
                    <textarea
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Tell us about your business, products you sell, areas you serve..."
                      rows={2}
                      className="futuristic-input w-full resize-none rounded-xl px-3.5 py-3 text-sm"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="futuristic-input w-full rounded-xl py-3 pl-10 pr-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="futuristic-input w-full rounded-xl py-3 pl-10 pr-3 text-sm"
                    />
                  </div>
                </div>
              </div>

              {selectedRole === "user" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="futuristic-input w-full rounded-xl py-3 pl-10 pr-3 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="futuristic-input w-full rounded-xl py-3 pl-10 pr-11 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`futuristic-input w-full rounded-xl py-3 pl-10 pr-11 text-sm ${
                        confirmPassword && confirmPassword !== password
                          ? "!border-red-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1 text-[10px] text-red-500">Passwords do not match.</p>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading} className="futuristic-btn-primary w-full py-3.5 text-sm font-bold rounded-xl flex items-center justify-center">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {selectedRole === "reseller" ? "Submit Reseller Application" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-slate-200 dark:border-white/10 pt-5 text-center text-xs text-readable-secondary">
              Already have an account? <Link href="/login" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline">Sign in</Link>
            </div>

            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
                Secure onboarding
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
