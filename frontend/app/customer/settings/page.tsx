"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  MapPin,
  Shield,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Moon,
  Sun,
  Laptop,
  Check,
  Lock,
  ExternalLink,
  Sliders,
  Type,
  RefreshCw,
} from "lucide-react";
import { CustomerPreferences } from "@/lib/types/settings";
import { DEFAULT_CUSTOMER_PREFERENCES } from "@/lib/data/defaultSettings";
import { useTheme } from "@/components/ThemeProvider";

export default function CustomerSettingsPage() {
  const { theme, setTheme, isForced, forcedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<CustomerPreferences>(DEFAULT_CUSTOMER_PREFERENCES);
  const [initialPreferences, setInitialPreferences] = useState<CustomerPreferences>(DEFAULT_CUSTOMER_PREFERENCES);
  const [policy, setPolicy] = useState<{
    isThemeLocked: boolean;
    forcedTheme: string;
    customerThemePolicy: string;
    defaultDensity: string;
    defaultFontScale: string;
  }>({
    isThemeLocked: false,
    forcedTheme: "day",
    customerThemePolicy: "personal",
    defaultDensity: "comfortable",
    defaultFontScale: "base",
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadCustomerPreferences();
  }, []);

  const loadCustomerPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
          setInitialPreferences(data.preferences);
        }
        if (data.policy) {
          setPolicy(data.policy);
        }
      }
    } catch (e) {
      // fallback to defaults
    } finally {
      setLoading(false);
    }
  };

  const isDirty = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await fetch("/api/customer/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPreferences(data.preferences);
        setInitialPreferences(data.preferences);
        // Also sync theme locally if personal policy
        if (!policy.isThemeLocked && preferences.theme !== "system") {
          setTheme(preferences.theme as any);
        }
        setFeedback({ type: "success", message: "Your preferences were saved successfully." });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to update preferences." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Network error saving preferences." });
    } finally {
      setSaving(false);
    }
  };

  const handleExportMyData = () => {
    const dataStr = JSON.stringify(
      {
        preferences,
        exportedAt: new Date().toISOString(),
        service: "NexLapTech Customer Portal",
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NexLapTech_Preferences_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="h-7 w-7 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
            <SettingsIcon className="h-3.5 w-3.5" /> Customer Preferences Center
          </span>
          {isDirty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              Unsaved changes
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Personal Experience &amp; Notifications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Personalize your storefront theme, interface density, notification channels, and delivery preferences.
        </p>

        {feedback && (
          <div
            className={`mt-3 rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2 border ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* ── SECTION 1: THEME & APPEARANCE ──────────────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-600" /> Color Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose whether to view NexLapTech in bright daytime clarity or obsidian night mode.
          </p>
        </div>

        {policy.isThemeLocked ? (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 dark:bg-blue-950/40 p-4 text-xs flex items-start gap-3">
            <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-blue-900 dark:text-blue-200 block">
                Store Theme Configured by Administrator
              </span>
              <span className="text-blue-700 dark:text-blue-300">
                The administrator has configured a unified storefront policy (
                <strong>{policy.forcedTheme === "night" ? "Dark Mode" : "Light Mode"}</strong>). Personal overrides are temporarily disabled to ensure branding consistency.
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setPreferences({ ...preferences, theme: "day" });
                setTheme("day");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                preferences.theme === "day"
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sun className="h-5 w-5 text-amber-500" />
                {preferences.theme === "day" && <Check className="h-4 w-4 text-blue-600" />}
              </div>
              <p className="text-xs font-bold">Light (Day)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">High-contrast daytime clarity</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreferences({ ...preferences, theme: "night" });
                setTheme("night");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                preferences.theme === "night"
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Moon className="h-5 w-5 text-indigo-400" />
                {preferences.theme === "night" && <Check className="h-4 w-4 text-blue-600" />}
              </div>
              <p className="text-xs font-bold">Dark (Night)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Obsidian palette with glowing accents</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreferences({ ...preferences, theme: "system" });
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                preferences.theme === "system"
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Laptop className="h-5 w-5 text-slate-400" />
                {preferences.theme === "system" && <Check className="h-4 w-4 text-blue-600" />}
              </div>
              <p className="text-xs font-bold">System Default</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sync with your device settings</p>
            </button>
          </div>
        )}
      </div>

      {/* ── SECTION 2: INTERFACE DENSITY & TYPOGRAPHY ──────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" /> Interface Density &amp; Text Scale
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adjust information spacing and reading font size within supported bounds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Interface Density</label>
            <select
              value={preferences.interfaceDensity}
              onChange={(e) => setPreferences({ ...preferences, interfaceDensity: e.target.value as any })}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="compact">Compact (Tighter Tables &amp; Lists)</option>
              <option value="comfortable">Comfortable (Standard)</option>
              <option value="spacious">Spacious (Relaxed Touch Target Size)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reading Text Scale</label>
            <select
              value={preferences.fontScale}
              onChange={(e) => setPreferences({ ...preferences, fontScale: e.target.value as any })}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Small (90% - Dense)</option>
              <option value="base">Standard Medium (100%)</option>
              <option value="lg">Large (110% - Accessibility)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: NOTIFICATION PREFERENCES ─────────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" /> Notification Channels &amp; Alerts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose which communication channels you wish to receive order updates and promotional discounts on.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer hover:border-blue-200 transition-colors">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Email Order &amp; Repair Status Updates
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Receive invoice PDFs, dispatch tracking numbers, and technician diagnostic reports via email.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailOrderUpdates}
              onChange={(e) => setPreferences({ ...preferences, emailOrderUpdates: e.target.checked })}
              className="h-4 w-4 accent-blue-600 rounded shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer hover:border-blue-200 transition-colors">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                SMS Technician Dispatch &amp; Delivery Alerts
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Immediate SMS ping when our repair technician departs or your parcel is out for delivery.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.smsTechnicianAlerts}
              onChange={(e) => setPreferences({ ...preferences, smsTechnicianAlerts: e.target.checked })}
              className="h-4 w-4 accent-blue-600 rounded shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer hover:border-blue-200 transition-colors">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Promotional Offers &amp; Hardware Clearance Coupons
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Occasional exclusive discounts on refurbished laptops, RAM/SSD upgrades, and B2B pricing.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
              className="h-4 w-4 accent-blue-600 rounded shrink-0"
            />
          </label>
        </div>
      </div>

      {/* ── SECTION 4: DELIVERY & ADDRESS MANAGEMENT ────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" /> Delivery Pincode &amp; Addresses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your default destination pincode for quick availability checking across product pages.
            </p>
          </div>
          <Link
            href="/customer/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Manage Addresses <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Preferred 6-Digit Delivery Pincode
          </label>
          <input
            type="text"
            maxLength={6}
            value={preferences.preferredPickupPincode || ""}
            onChange={(e) => setPreferences({ ...preferences, preferredPickupPincode: e.target.value.trim() })}
            placeholder="e.g. 572102 or 560001"
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-400">Used for 1-click delivery date estimation</p>
        </div>
      </div>

      {/* ── SECTION 5: PRIVACY & DATA EXPORT ────────────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" /> Privacy &amp; Data Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Download your personal settings record or manage authenticated session credentials.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportMyData}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" /> Export My Preferences (JSON)
          </button>
        </div>
      </div>

      {/* ── SAVE BOTTOM BAR ────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2">
        {isDirty && (
          <button
            type="button"
            onClick={() => setPreferences(JSON.parse(JSON.stringify(initialPreferences)))}
            className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
          >
            Discard
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-7 py-3 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving Preferences..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
