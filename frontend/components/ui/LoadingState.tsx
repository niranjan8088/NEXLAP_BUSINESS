"use client";

import React from "react";

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="futuristic-card p-5 space-y-3">
          <div className="h-4 w-1/3 skeleton rounded-lg" />
          <div className="h-8 w-1/2 skeleton rounded-xl" />
          <div className="h-3 w-2/3 skeleton rounded-md" />
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="futuristic-table-container">
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 skeleton rounded" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 flex-1 skeleton rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="futuristic-card p-4 space-y-3">
          <div className="aspect-[4/3] w-full skeleton rounded-xl" />
          <div className="h-3 w-1/3 skeleton rounded" />
          <div className="h-5 w-3/4 skeleton rounded" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 w-20 skeleton rounded" />
            <div className="h-8 w-8 skeleton rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

