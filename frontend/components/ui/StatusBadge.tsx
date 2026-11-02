"use client";

import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "indigo"
  | "violet";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  withDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, { container: string; dot: string }> = {
  success: {
    container: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  warning: {
    container: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  danger: {
    container: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  info: {
    container: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
  neutral: {
    container: "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
  indigo: {
    container: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  violet: {
    container: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
};

export default function StatusBadge({
  label,
  variant = "neutral",
  withDot = true,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const styles = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${styles.container} ${sizeClasses} ${className}`}
    >
      {withDot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      <span className="truncate">{label}</span>
    </span>
  );
}

// Helper to determine variant from typical status strings
export function getStatusVariant(status: string): BadgeVariant {
  const s = (status || "").toLowerCase().trim();
  if (["delivered", "completed", "paid", "confirmed", "active", "in stock", "verified", "optimal"].includes(s)) {
    return "success";
  }
  if (["pending", "processing", "in_progress", "diagnosing", "low stock", "shipped", "upcoming"].includes(s)) {
    return "warning";
  }
  if (["cancelled", "failed", "out of stock", "rejected", "deleted", "expired"].includes(s)) {
    return "danger";
  }
  if (["new", "draft", "info", "received", "open"].includes(s)) {
    return "info";
  }
  return "neutral";
}

