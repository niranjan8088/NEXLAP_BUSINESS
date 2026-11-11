"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Tag,
  HelpCircle,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function CustomerSignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("Not Specified");
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successName, setSuccessName] = useState<string | null>(null);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "" };
    if (pass.length < 8) return { label: "Weak (min 8 chars)", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
    if (pass.length >= 10 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { label: "Strong", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    }
    return { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!dateOfBirth) {
      setErrorMsg("Date of Birth is required for customer accounts.");
      return;
    }
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
      setErrorMsg("Date of Birth cannot be in the future.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("You must agree to the Terms & Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Call existing auth signup API (forces role = user / customer)
      const res = await safeJsonFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: cleanPhone,
          dateOfBirth,
          gender,
          password: password.trim(),
          role: "user", // Strictly forced to customer role only
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to create customer account.");
      }

      setSuccessName(fullName.trim());
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between selection:bg-nex-blue selection:text-white">
      {/* Minimal Header */}
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
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Already have an account?</span>
          <Link
            href="/customer/signin"
            className="rounded-full bg-nex-blue/10 hover:bg-nex-blue/20 text-nex-blue dark:text-nex-blueLight border border-nex-blue/20 px-4 py-1.5 font-bold transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: Benefits Panel */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-nex-blue/10 border border-nex-blue/20 px-3 py-1 text-[11px] font-bold text-nex-blue dark:text-nex-blueLight mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Customer Registration
              </span>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                All your tech needs in one account.
              </h1>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Join NexLapTech to manage hardware orders, laptop repairs, service bookings, and verified certificates.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ShoppingBag className="h-4 w-4 text-nex-blue shrink-0" />
                <span>Orders &amp; Instant Checkout</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Wrench className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Laptop &amp; Desktop Repairs</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Tag className="h-4 w-4 text-purple-500 shrink-0" />
                <span>Active Offers &amp; Referral Discounts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Doorstep &amp; On-Site Support</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Sign-Up Card */}
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
              {successName ? (
                <div className="text-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">Account created successfully!</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Welcome to NexLapTech, <strong>{successName}</strong>. Your customer session is active.
                    </p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <button
                      onClick={() => { window.location.href = "/customer"; }}
                      type="button"
                      className="w-full rounded-xl bg-nex-blue hover:bg-blue-600 text-white py-3 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <span>Go to Customer Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <Link
                      href="/customer/signin"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>Sign In with another account</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Create your NexLapTech account
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Join NexLapTech to manage purchases, repairs and services in one place.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3.5 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label htmlFor="signup-fullname" className="font-semibold text-slate-700 dark:text-slate-300">
                        Full Name *
                      </label>
                      <input
                        id="signup-fullname"
                        type="text"
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email */}
                      <div className="space-y-1">
                        <label htmlFor="signup-email" className="font-semibold text-slate-700 dark:text-slate-300">
                          Email Address *
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. ramesh@gmail.com"
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label htmlFor="signup-phone" className="font-semibold text-slate-700 dark:text-slate-300">
                          Indian Mobile Number *
                        </label>
                        <input
                          id="signup-phone"
                          type="tel"
                          required
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Date of Birth */}
                      <div className="space-y-1">
                        <label htmlFor="signup-dob" className="font-semibold text-slate-700 dark:text-slate-300">
                          Date of Birth *
                        </label>
                        <input
                          id="signup-dob"
                          type="date"
                          required
                          max={new Date().toISOString().split("T")[0]}
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-1">
                        <label htmlFor="signup-gender" className="font-semibold text-slate-700 dark:text-slate-300">
                          Gender (Optional)
                        </label>
                        <select
                          id="signup-gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="Not Specified">Prefer not to say</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="signup-pass" className="font-semibold text-slate-700 dark:text-slate-300">
                          Password *
                        </label>
                        {passwordStrength.label && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="signup-pass"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 pl-3.5 pr-10 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
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

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label htmlFor="signup-confirm-pass" className="font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          id="signup-confirm-pass"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 pl-3.5 pr-10 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Terms Agreement Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        id="agree-terms"
                        type="checkbox"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-nex-blue focus:ring-nex-blue"
                      />
                      <label htmlFor="agree-terms" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                        I agree to the Terms &amp; Privacy Policy *
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
                            <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                          </>
                        ) : (
                          <>
                            <span>Create Account</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-500">
                    Already have an account?{" "}
                    <Link href="/customer/signin" className="font-bold text-nex-blue dark:text-nex-blueLight hover:underline">
                      Sign In
                    </Link>
                  </div>
                </>
              )}
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
