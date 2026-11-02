"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

type HardwareKind =
  | "laptop"
  | "desktop"
  | "ssd"
  | "ram"
  | "gpu"
  | "cpu"
  | "board"
  | "keyboard"
  | "mouse"
  | "headset";

const HARDWARE: { label: string; kind: HardwareKind }[] = [
  { label: "Motherboard", kind: "board" },
  { label: "CPU", kind: "cpu" },
  { label: "RAM", kind: "ram" },
  { label: "Graphics Card", kind: "gpu" },
  { label: "SSD", kind: "ssd" },
  { label: "Desktop PC", kind: "desktop" },
  { label: "Laptop", kind: "laptop" },
  { label: "Keyboard", kind: "keyboard" },
  { label: "Mouse", kind: "mouse" },
  { label: "Headset", kind: "headset" },
];

function HardwareGlyph({ kind }: { kind: HardwareKind }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (kind) {
    case "laptop":
      return <svg {...common}><rect x="8" y="9" width="32" height="23" rx="2" /><path d="M4 37h40l-3 3H7zM15 14h18v13H15z" /></svg>;
    case "desktop":
      return <svg {...common}><rect x="5" y="8" width="27" height="22" rx="2" /><path d="M13 37h11m-5-7v7" /><rect x="35" y="10" width="9" height="29" rx="2" /><circle cx="39.5" cy="34" r="1" /></svg>;
    case "ssd":
      return <svg {...common}><rect x="5" y="15" width="38" height="18" rx="3" /><path d="M11 21h8m-8 5h8m8-5h9m-9 5h9" /><circle cx="9" cy="29" r="1" /><circle cx="39" cy="19" r="1" /></svg>;
    case "ram":
      return <svg {...common}><rect x="6" y="15" width="36" height="17" rx="2" /><path d="M12 20h5v7h-5zm9 0h5v7h-5zm9 0h5v7h-5zM10 32v4m7-4v4m7-4v4m7-4v4m7-4v4" /></svg>;
    case "gpu":
      return <svg {...common}><rect x="4" y="12" width="36" height="24" rx="3" /><circle cx="18" cy="24" r="7" /><circle cx="18" cy="24" r="2" /><path d="M40 18h4v12h-4M7 37v3m28-4v4" /></svg>;
    case "cpu":
      return <svg {...common}><rect x="12" y="12" width="24" height="24" rx="3" /><rect x="18" y="18" width="12" height="12" rx="1" /><path d="M18 5v7m6-7v7m6-7v7m-12 24v7m6-7v7m6-7v7M5 18h7m-7 6h7m-7 6h7m24-12h7m-7 6h7m-7 6h7" /></svg>;
    case "board":
      return <svg {...common}><rect x="7" y="7" width="34" height="34" rx="3" /><rect x="17" y="16" width="12" height="12" rx="2" /><rect x="32" y="13" width="5" height="5" /><rect x="31" y="29" width="7" height="5" /><path d="M12 14h5m-5 5h5m12 3h5m-11 6v6m-5 0h5" /></svg>;
    case "keyboard":
      return <svg {...common}><rect x="4" y="13" width="40" height="23" rx="3" /><path d="M9 19h2m4 0h2m4 0h2m4 0h2m4 0h2m-24 6h2m4 0h2m4 0h2m4 0h2m4 0h2m-21 6h20" /></svg>;
    case "mouse":
      return <svg {...common}><rect x="13" y="5" width="22" height="38" rx="11" /><path d="M24 6v13m-11-2h22" /><circle cx="24" cy="12" r="1" /></svg>;
    case "headset":
      return <svg {...common}><path d="M7 25v-4a17 17 0 0 1 34 0v4" /><rect x="6" y="23" width="8" height="15" rx="3" /><rect x="34" y="23" width="8" height="15" rx="3" /><path d="M34 38a10 10 0 0 1-10 5h-4" /></svg>;
  }
}

export default function AppExperience({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [entryVisible, setEntryVisible] = useState(true);
  const [entryExiting, setEntryExiting] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const [entryProgress, setEntryProgress] = useState(0);
  const [navigationVisible, setNavigationVisible] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [pagePhase, setPagePhase] = useState<"idle" | "leaving" | "entering">("idle");
  const previousPath = useRef(pathname);
  const entrySafetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationFailsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    let seen = false;
    try {
      seen = sessionStorage.getItem("nexlap-entry-seen") === "1";
    } catch {}

    if (seen && !root.classList.contains("nexlap-entry-active")) {
      setEntryVisible(false);
      return;
    }

    root.classList.add("nexlap-entry-active");
    setEntryVisible(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let finished = false;

    const finishEntry = () => {
      if (finished) return;
      finished = true;
      setEntryProgress(100);
      setEntryComplete(true);
      setEntryExiting(true);
      const exitDelay = reduceMotion ? 60 : 400;
      entrySafetyTimer.current = setTimeout(() => {
        root.classList.remove("nexlap-entry-active");
        try {
          sessionStorage.setItem("nexlap-entry-seen", "1");
        } catch {}
        setEntryVisible(false);
      }, exitDelay);
    };

    const updateProgress = () => {
      const images = Array.from(document.images);
      const imageProgress = images.length
        ? images.filter((image) => image.complete).length / images.length
        : 1;
      const stateProgress = document.readyState === "complete" ? 100 : document.readyState === "interactive" ? 58 : 24;
      setEntryProgress((current) => Math.max(current, Math.min(96, Math.round(stateProgress + imageProgress * 35))));
      if (document.readyState === "complete") finishEntry();
    };

    document.addEventListener("readystatechange", updateProgress);
    document.addEventListener("load", updateProgress, true);
    document.addEventListener("error", updateProgress, true);
    window.addEventListener("load", finishEntry, { once: true });
    updateProgress();
    entrySafetyTimer.current = setTimeout(finishEntry, 400);

    return () => {
      document.removeEventListener("readystatechange", updateProgress);
      document.removeEventListener("load", updateProgress, true);
      document.removeEventListener("error", updateProgress, true);
      window.removeEventListener("load", finishEntry);
      if (entrySafetyTimer.current) clearTimeout(entrySafetyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (navigationFailsafe.current) clearTimeout(navigationFailsafe.current);
    if (navigationProgressInterval.current) clearInterval(navigationProgressInterval.current);
    setNavigationVisible(true);
    setNavigationProgress(100);
    setPagePhase("entering");
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    navigationTimer.current = setTimeout(() => {
      setNavigationVisible(false);
      setNavigationProgress(0);
      setPagePhase("idle");
    }, 220);
  }, [pathname]);

  useEffect(() => {
    const finishPendingNavigation = () => {
      if (navigationProgressInterval.current) clearInterval(navigationProgressInterval.current);
      setNavigationProgress(100);
      setPagePhase("idle");
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      navigationTimer.current = setTimeout(() => {
        setNavigationVisible(false);
        setNavigationProgress(0);
      }, 150);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        (anchor.target && anchor.target.toLowerCase() !== "_self") ||
        anchor.hasAttribute("download")
      ) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (destination.pathname === window.location.pathname && destination.hash) return;

      // Instant top progress bar response without blacking out the screen
      setNavigationVisible(true);
      setNavigationProgress(30);
      if (navigationProgressInterval.current) clearInterval(navigationProgressInterval.current);
      let progress = 30;
      navigationProgressInterval.current = setInterval(() => {
        if (progress >= 85) return;
        progress = Math.min(85, progress + 12);
        setNavigationProgress(progress);
      }, 50);
      if (navigationFailsafe.current) clearTimeout(navigationFailsafe.current);
      navigationFailsafe.current = setTimeout(finishPendingNavigation, 1200);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      if (navigationProgressInterval.current) clearInterval(navigationProgressInterval.current);
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      if (navigationFailsafe.current) clearTimeout(navigationFailsafe.current);
    };
  }, []);

  return (
    <>
      <div id="nexlap-page-frame" className={`nexlap-page-frame nexlap-page--${pagePhase}`}>
        {children}
      </div>

      <div
        id="nexlap-entry-loader"
        className={`nexlap-entry-loader${entryExiting ? " is-exiting" : ""}${entryComplete ? " is-complete" : ""}`}
        role="status"
        aria-live="polite"
        aria-hidden={!entryVisible}
      >
        <div className="nexlap-loader-content">
          <div className="nexlap-logo-wrap">
            <BrandLogo width={768} height={768} sizes="(max-width: 640px) 124px, 160px" priority className="h-[124px] w-[124px] sm:h-40 sm:w-40" />
          </div>
          <div className="nexlap-hardware" aria-label="Assembling computer hardware">
            {HARDWARE.map((part, index) => (
              <div className="nexlap-hardware-part" style={{ "--part-delay": `${index * 55}ms` } as React.CSSProperties} key={part.kind}>
                <HardwareGlyph kind={part.kind} />
                <span>{part.label}</span>
              </div>
            ))}
          </div>
          <div className="nexlap-progress-row">
            <div className="nexlap-progress-track" aria-hidden="true">
              <div className="nexlap-progress-value" style={{ transform: `scaleX(${entryProgress / 100})` }} />
            </div>
            <span className="nexlap-progress-number">{entryProgress}%</span>
          </div>
          <p className="nexlap-loader-caption">Powering up NexLapTech…</p>
        </div>
      </div>

      <div className={`nexlap-route-progress${navigationVisible ? " is-visible" : ""}`} aria-hidden="true">
        <span style={{ transform: `scaleX(${navigationProgress / 100})` }} />
      </div>
    </>
  );
}
