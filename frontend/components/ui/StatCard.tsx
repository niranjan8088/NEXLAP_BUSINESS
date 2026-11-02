"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  tone?: "indigo" | "cyan" | "violet" | "emerald" | "amber" | "rose";
  href?: string;
  loading?: boolean;
  className?: string;
}

const TONE_STYLES = {
  indigo: {
    iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
    glow: "hover:border-indigo-500/40 dark:hover:border-indigo-500/30",
  },
  cyan: {
    iconBg: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40",
    glow: "hover:border-cyan-500/40 dark:hover:border-cyan-400/30",
  },
  violet: {
    iconBg: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40",
    glow: "hover:border-violet-500/40 dark:hover:border-violet-500/30",
  },
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    glow: "hover:border-emerald-500/40 dark:hover:border-emerald-500/30",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    glow: "hover:border-amber-500/40 dark:hover:border-amber-500/30",
  },
  rose: {
    iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
    glow: "hover:border-rose-500/40 dark:hover:border-rose-500/30",
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  tone = "indigo",
  href,
  loading = false,
  className = "",
}: StatCardProps) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.indigo;

  const content = (
    <div
      className={`futuristic-card p-5 flex items-center justify-between gap-4 transition-all duration-200 ${
        href ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${styles.glow} ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
          {label}
        </span>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          {loading ? (
            <div className="h-8 w-20 skeleton rounded-lg" />
          ) : (
            value
          )}
        </div>
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  trend.positive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
            )}
            {subtext && (
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${styles.iconBg} shadow-sm`}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

