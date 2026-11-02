"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`futuristic-card p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 mb-4 shadow-sm">
        <Icon className="h-8 w-8 text-indigo-500 dark:text-cyan-400" />
      </div>
      <h3 className="heading-h3 mb-2">
        {title}
      </h3>
      <p className="text-readable-secondary max-w-sm mb-6">
        {description}
      </p>
      {actionText && (
        actionHref ? (
          <Link href={actionHref} className="futuristic-btn-primary">
            {actionText}
          </Link>
        ) : (
          <button onClick={onAction} className="futuristic-btn-primary">
            {actionText}
          </button>
        )
      )}
    </div>
  );
}

