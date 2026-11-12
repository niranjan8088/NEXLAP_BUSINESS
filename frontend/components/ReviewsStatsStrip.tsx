"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Counter from "@/components/ui/Counter";
import StarRating from "@/components/ui/StarRating";

type Props = {
  averageRating: number;
  totalCount: number;
};

export default function ReviewsStatsStrip({ averageRating, totalCount }: Props) {
  const happyCustomersCount = totalCount;

  return (
    <div className="relative border-b border-white/[0.06] bg-white/[0.01] py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:grid-cols-5 md:divide-x md:divide-white/10 items-center justify-center">
          
          {/* Column 1: Live Reviews Score (Takes full width on mobile) */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center text-center pb-4 md:pb-0">
            <Link href="/reviews" className="group flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl font-bold text-white group-hover:text-nex-blueLight transition-colors">
                  {averageRating}
                </span>
                <span className="text-sm text-nex-mist">/ 5</span>
              </div>
              <div className="mt-1">
                <StarRating rating={Math.round(averageRating)} readOnly size="sm" />
              </div>
              <p className="mt-2 text-[10px] text-nex-blueLight flex items-center gap-1 font-semibold group-hover:underline">
                View {totalCount} verified reviews
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
            </Link>
          </div>

          {/* Column 2: Happy Customers */}
          <div className="flex flex-col items-center justify-center text-center md:px-2">
            <span className="font-display text-3xl font-bold text-gradient-blue">
              <Counter value={happyCustomersCount} suffix="+" />
            </span>
            <span className="mt-1 text-xs font-semibold text-white/95">
              Happy Customers
            </span>
            <p className="text-[9px] text-nex-mist mt-0.5">
              Custom setup & support
            </p>
          </div>

          {/* Column 3: Repairs Completed */}
          <div className="flex flex-col items-center justify-center text-center md:px-2">
            <span className="font-display text-3xl font-bold text-gradient-blue">
              <Counter value={500} suffix="+" />
            </span>
            <span className="mt-1 text-xs font-semibold text-white/95">
              Repairs Completed
            </span>
            <p className="text-[9px] text-nex-mist mt-0.5">
              Doorstep diagnostics
            </p>
          </div>

          {/* Column 4: Training Statistics */}
          <div className="flex flex-col items-center justify-center text-center md:px-2">
            <span className="font-display text-3xl font-bold text-gradient-blue">
              <Counter value={150} suffix="+" />
            </span>
            <span className="mt-1 text-xs font-semibold text-white/95">
              Trainees Certified
            </span>
            <p className="text-[9px] text-nex-mist mt-0.5">
              Hardware repair courses
            </p>
          </div>

          {/* Column 5: Internship Statistics */}
          <div className="flex flex-col items-center justify-center text-center md:pl-2">
            <span className="font-display text-3xl font-bold text-gradient-blue">
              <Counter value={200} suffix="+" />
            </span>
            <span className="mt-1 text-xs font-semibold text-white/95">
              IEEE Projects Done
            </span>
            <p className="text-[9px] text-nex-mist mt-0.5">
              IoT & Fullstack builds
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
