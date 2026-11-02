"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Palette,
  Bell,
  MapPin,
  Shield,
  Download,
  CheckCircle2,
  AlertTriangle,
  Save,
  Moon,
  Sun,
  Laptop,
  Check,
  Lock,
  ExternalLink,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { CustomerPreferences } from "@/lib/types/settings";
import { DEFAULT_CUSTOMER_PREFERENCES } from "@/lib/data/defaultSettings";
import { useTheme } from "@/components/ThemeProvider";

export default function CustomerPreferencesSection() {
  const { setTheme } = useTheme();

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
          if (data.preferences.fontScale) {
            document.documentElement.setAttribute("data-font-scale", data.preferences.fontScale);
          }
          if (data.preferences.interfaceDensity) {
            document.documentElement.setAttribute("data-density", data.preferences.interfaceDensity);
          }
        }
        if (data.policy) {
          setPolicy(data.policy);
        }
      }
    } catch (e) {
      // fallback
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
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2 border ${feedback.type === "success"
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

      {/* Theme Selection */}
      <div className="glass-card border border-white/10 bg-nex-ink p-6 rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-400" /> Color Theme
          </h3>
          <p className="text-xs text-nex-mist mt-0.5">
            Choose whether to view NexLapTech in bright daytime clarity or obsidian night mode.
          </p>
        </div>

        {policy.isThemeLocked ? (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-300 flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              The administrator has enforced a global store theme (
              <strong>{policy.forcedTheme === "night" ? "Dark Mode" : "Light Mode"}</strong>).
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setPreferences({ ...preferences, theme: "day" });
                setTheme("day");
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${preferences.theme === "day"
                ? "border-nex-blue bg-nex-blue/20 text-white shadow-glow-blue"
                : "border-white/10 hover:border-white/20 text-nex-mist"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Sun className="h-4 w-4 text-amber-400" />
                {preferences.theme === "day" && <Check className="h-3.5 w-3.5 text-blue-400" />}
              </div>
              <p className="text-xs font-bold text-white">Light (Day)</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreferences({ ...preferences, theme: "night" });
                setTheme("night");
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${preferences.theme === "night"
                ? "border-nex-blue bg-nex-blue/20 text-white shadow-glow-blue"
                : "border-white/10 hover:border-white/20 text-nex-mist"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Moon className="h-4 w-4 text-indigo-400" />
                {preferences.theme === "night" && <Check className="h-3.5 w-3.5 text-blue-400" />}
              </div>
              <p className="text-xs font-bold text-white">Dark (Night)</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreferences({ ...preferences, theme: "system" });
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${preferences.theme === "system"
                ? "border-nex-blue bg-nex-blue/20 text-white shadow-glow-blue"
                : "border-white/10 hover:border-white/20 text-nex-mist"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Laptop className="h-4 w-4 text-slate-400" />
                {preferences.theme === "system" && <Check className="h-3.5 w-3.5 text-blue-400" />}
              </div>
              <p className="text-xs font-bold text-white">System Default</p>
            </button>
          </div>
        )}
      </div>

      {/* Density & Font Scale */}
      <div className="glass-card border border-white/10 bg-nex-ink p-6 rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-400" /> Interface Density &amp; Text Scale
          </h3>
          <p className="text-xs text-nex-mist mt-0.5">
            Adjust information spacing and reading font scale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Interface Density</label>
            <select
              value={preferences.interfaceDensity}
              onChange={(e) => {
                const val = e.target.value as any;
                setPreferences({ ...preferences, interfaceDensity: val });
                document.documentElement.setAttribute("data-density", val);
              }}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-nex-blue focus:outline-none"
            >
              <option value="compact" className="bg-slate-900 text-white">Compact</option>
              <option value="comfortable" className="bg-slate-900 text-white">Comfortable (Standard)</option>
              <option value="spacious" className="bg-slate-900 text-white">Spacious</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Reading Text Scale</label>
            <select
              value={preferences.fontScale}
              onChange={(e) => {
                const val = e.target.value as any;
                setPreferences({ ...preferences, fontScale: val });
                document.documentElement.setAttribute("data-font-scale", val);
              }}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-nex-blue focus:outline-none"
            >
              <option value="sm" className="bg-slate-900 text-white">Small (90%)</option>
              <option value="base" className="bg-slate-900 text-white">Standard (100%)</option>
              <option value="lg" className="bg-slate-900 text-white">Large (110%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card border border-white/10 bg-nex-ink p-6 rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-400" /> Notification Channels
          </h3>
          <p className="text-xs text-nex-mist mt-0.5">
            Manage your communication preferences for repair alerts and orders.
          </p>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
            <span className="text-xs text-white font-medium">Email Order &amp; Repair Status Updates</span>
            <input
              type="checkbox"
              checked={preferences.emailOrderUpdates}
              onChange={(e) => setPreferences({ ...preferences, emailOrderUpdates: e.target.checked })}
              className="h-4 w-4 accent-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
            <span className="text-xs text-white font-medium">SMS Technician Dispatch &amp; Delivery Alerts</span>
            <input
              type="checkbox"
              checked={preferences.smsTechnicianAlerts}
              onChange={(e) => setPreferences({ ...preferences, smsTechnicianAlerts: e.target.checked })}
              className="h-4 w-4 accent-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
            <span className="text-xs text-white font-medium">Promotional Hardware Clearance Deals</span>
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
              className="h-4 w-4 accent-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Delivery & Pincode */}
      <div className="glass-card border border-white/10 bg-nex-ink p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" /> Delivery Pincode &amp; Addresses
            </h3>
            <p className="text-xs text-nex-mist mt-0.5">
              Default destination pincode for 1-click delivery estimates.
            </p>
          </div>
          <Link
            href="/customer/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-nex-blue hover:underline"
          >
            Manage Addresses <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="max-w-xs space-y-1">
          <label className="text-xs text-white/80 font-semibold">Preferred 6-Digit Pincode</label>
          <input
            type="text"
            maxLength={6}
            value={preferences.preferredPickupPincode || ""}
            onChange={(e) => setPreferences({ ...preferences, preferredPickupPincode: e.target.value.trim() })}
            placeholder="e.g. 572102"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:border-nex-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        {isDirty && (
          <button
            type="button"
            onClick={() => setPreferences(JSON.parse(JSON.stringify(initialPreferences)))}
            className="btn-secondary !py-2.5 !px-5 text-xs"
          >
            Discard
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-glow-blue flex items-center gap-2"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

