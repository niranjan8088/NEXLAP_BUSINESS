"use client";

import React from "react";

interface FuturisticCardProps {
  children: React.ReactNode;
  interactive?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function FuturisticCard({
  children,
  interactive = false,
  glow = false,
  className = "",
  onClick,
}: FuturisticCardProps) {
  return (
    <div
      onClick={onClick}
      className={`futuristic-card p-5 sm:p-6 ${
        interactive ? "futuristic-card-hover cursor-pointer" : ""
      } ${glow ? "futuristic-card-glow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

