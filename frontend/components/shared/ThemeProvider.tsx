"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "day" | "night";
export type GlobalPolicy = "personal" | "forced";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  mode: "light" | "dark";
  primary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
}

export const THEME_PRESETS: Record<ThemeId, ThemeConfig> = {
  day: {
    id: "day",
    name: "NexLapTech Light",
    description: "Crisp, accessible high-clarity daylight theme",
    mode: "light",
    primary: "#4338CA",
    accent: "#0284C7",
    bg: "#F8FAFC",
    surface: "#FFFFFF",
    text: "#0F172A",
  },
  night: {
    id: "night",
    name: "NexLapTech Obsidian Dark",
    description: "Deep charcoal dark mode with luminous cobalt accents",
    mode: "dark",
    primary: "#38BDF8",
    accent: "#22D3EE",
    bg: "#070B1A",
    surface: "#0B0718",
    text: "#F8FAFC",
  },
};

const normalizeTheme = (value?: ThemeId | string | null): ThemeId => {
  if (value === "night" || value === "dark") return "night";
  return "day";
};

interface ThemeContextType {
  theme: ThemeId;
  activeThemeConfig: ThemeConfig;
  globalPolicy: GlobalPolicy;
  forcedTheme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  toggleTheme: () => void;
  setGlobalPolicy: (policy: GlobalPolicy, forcedThemeId?: ThemeId) => Promise<void>;
  resetToDefault: () => void;
  isForced: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [userTheme, setUserTheme] = useState<ThemeId>("day");
  const [globalPolicy, setGlobalPolicyState] = useState<GlobalPolicy>("personal");
  const [forcedTheme, setForcedThemeState] = useState<ThemeId>("day");
  const [mounted, setMounted] = useState(false);

  // Computed effective active theme
  const effectiveThemeId: ThemeId =
    globalPolicy === "forced"
      ? normalizeTheme(forcedTheme)
      : normalizeTheme(userTheme);

  const activeThemeConfig = THEME_PRESETS[effectiveThemeId] || THEME_PRESETS["day"];

  // Apply DOM attributes & CSS variables
  const applyThemeToDom = (themeId: ThemeId) => {
    const target = normalizeTheme(themeId);
    document.documentElement.setAttribute("data-theme", target);
    if (target === "night") {
      document.documentElement.classList.add("dark", "night");
      document.documentElement.classList.remove("light", "day");
    } else {
      document.documentElement.classList.add("light", "day");
      document.documentElement.classList.remove("dark", "night");
    }
  };

  const mapLegacyTheme = (val: string | null): ThemeId => {
    if (!val) return "day";
    const lower = val.toLowerCase();
    if (lower.includes("night") || lower.includes("dark") || lower.includes("obsidian")) return "night";
    return "day";
  };

  // Initial hydration & server sync
  useEffect(() => {
    setMounted(true);
    try {
      const savedUser =
        localStorage.getItem("nexbyte_theme") ||
        localStorage.getItem("nexbyte-theme") ||
        localStorage.getItem("theme");
      if (savedUser) {
        setUserTheme(normalizeTheme(mapLegacyTheme(savedUser)));
      }
    } catch (e) {}

    // Load admin global policy and settings from server
    fetchSystemSettings();

    // Listen for custom theme broadcasts
    const handleBroadcast = (e: any) => {
      if (e.detail?.table === "system_settings" || e.detail?.table === "store_settings") {
        fetchSystemSettings();
      }
    };
    window.addEventListener("nexbyte-data-changed", handleBroadcast);
    return () => window.removeEventListener("nexbyte-data-changed", handleBroadcast);
  }, []);

  // Fetch admin global policy and dynamic color tokens
  const fetchSystemSettings = async () => {
    try {
      const res = await fetch("/api/system/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.policy) setGlobalPolicyState(data.policy);
        if (data.forcedTheme) {
          setForcedThemeState(normalizeTheme(mapLegacyTheme(data.forcedTheme)));
        }

        // Apply dynamic brand colors if present
        if (data.appearance?.primaryColor) {
          document.documentElement.style.setProperty("--color-primary", data.appearance.primaryColor);
        }
        if (data.appearance?.accentColor) {
          document.documentElement.style.setProperty("--color-accent", data.appearance.accentColor);
        }
        if (data.appearance?.interfaceDensity) {
          document.documentElement.setAttribute("data-density", data.appearance.interfaceDensity);
        }
        if (data.appearance?.cardRadius) {
          document.documentElement.setAttribute("data-radius", data.appearance.cardRadius);
        }
        if (data.appearance?.fontScale) {
          document.documentElement.setAttribute("data-font-scale", data.appearance.fontScale);
        }
      }
    } catch (e) {
      // ignore network errors
    }
  };

  // Sync DOM whenever effectiveThemeId changes
  useEffect(() => {
    if (mounted) {
      applyThemeToDom(effectiveThemeId);
    }
  }, [effectiveThemeId, mounted]);

  const setTheme = (newTheme: ThemeId) => {
    const valid = normalizeTheme(newTheme);
    setUserTheme(valid);
    try {
      localStorage.setItem("nexbyte_theme", valid);
      localStorage.setItem("nexbyte-theme", valid);
      localStorage.setItem("theme", valid);
    } catch (e) {}
    if (globalPolicy !== "forced") {
      applyThemeToDom(valid);
    }
  };

  const toggleTheme = () => {
    const nextTheme = effectiveThemeId === "night" ? "day" : "night";
    setTheme(nextTheme);
  };

  const setGlobalPolicy = async (policy: GlobalPolicy, forcedThemeId?: ThemeId) => {
    const targetForced = normalizeTheme(forcedThemeId ?? forcedTheme);
    const response = await fetch("/api/system/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy, forcedTheme: targetForced }),
    });
    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.error || "Unable to save global appearance settings.");
    }

    setGlobalPolicyState(result.policy === "forced" ? "forced" : "personal");
    setForcedThemeState(normalizeTheme(result.forcedTheme));
  };

  const resetToDefault = () => {
    setTheme("day");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveThemeId,
        activeThemeConfig,
        globalPolicy,
        forcedTheme,
        setTheme,
        toggleTheme,
        setGlobalPolicy,
        resetToDefault,
        isForced: globalPolicy === "forced",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
