"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />}
              {crumb.href && idx < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-indigo-600 dark:text-cyan-400 font-bold">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Main Heading Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-50 dark:border-cyan-500/20 dark:bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-cyan-400">
              {eyebrow}
            </div>
          )}
          <h1 className="heading-h1">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-readable-body max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

