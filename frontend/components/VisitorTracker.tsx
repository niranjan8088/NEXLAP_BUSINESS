"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("nexbyte_visitor_id");
  if (!id) {
    id = `vis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      localStorage.setItem("nexbyte_visitor_id", id);
    } catch {}
  }
  return id;
}

function detectDevice(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUa = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);

  if (width < 768 || (isMobileUa && width < 768)) return "mobile";
  if (width >= 768 && width < 1024) return "tablet";
  return "desktop";
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!pathname) return;

    // Do not count administrative or internal API routes as customer visits
    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.includes("_next")) {
      return;
    }

    const now = Date.now();
    // Debounce rapid duplicate fires within 2 seconds on the exact same path
    if (lastPathRef.current === pathname && now - lastTimeRef.current < 2000) {
      return;
    }

    lastPathRef.current = pathname;
    lastTimeRef.current = now;

    const visitorId = getOrCreateVisitorId();
    const device = detectDevice();
    const payload = JSON.stringify({
      path: pathname,
      title: document.title || pathname,
      referrer: document.referrer || "",
      device,
      visitorId,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, [pathname]);

  return null;
}

