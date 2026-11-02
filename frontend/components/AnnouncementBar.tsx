"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { AnnouncementBarConfig } from "@/lib/types/settings";

export default function AnnouncementBar() {
  const [config, setConfig] = useState<AnnouncementBarConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check session storage first
    try {
      if (sessionStorage.getItem("nexbyte_announcement_dismissed") === "true") {
        setDismissed(true);
      }
    } catch {}

    const loadSettings = async () => {
      try {
        const res = await fetch("/api/public/settings");
        if (res.ok) {
          const data = await res.json();
          if (data?.storefront?.announcementBar) {
            setConfig(data.storefront.announcementBar);
          }
        }
      } catch {}
    };

    loadSettings();

    const handleBroadcast = (e: any) => {
      if (e.detail?.table === "store_settings") {
        loadSettings();
      }
    };
    window.addEventListener("nexbyte-data-changed", handleBroadcast);
    return () => window.removeEventListener("nexbyte-data-changed", handleBroadcast);
  }, []);

  if (!config || !config.enabled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("nexbyte_announcement_dismissed", "true");
    } catch {}
  };

  const bgColor = config.bgColor || "#1E5BFF";
  const textColor = config.textColor || "#FFFFFF";

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className="relative z-50 px-4 py-2 text-xs font-semibold shadow-sm transition-all animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 text-center text-xs sm:text-sm">
          <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span>{config.text}</span>
          {config.linkUrl && config.linkText && (
            <Link
              href={config.linkUrl}
              className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:opacity-85 transition ml-1"
            >
              {config.linkText} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        {config.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss Announcement"
            className="p-1 rounded-md hover:bg-black/10 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

