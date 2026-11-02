"use client";

import { useState } from "react";

import {
  Laptop,
  Monitor,
  Wifi,
  Video,
  Code,
  HardDrive,
  Cpu,
  Building,
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Search,
} from "lucide-react";

// Plain Language Problem Categories
const SERVICE_CATEGORIES = [
  {
    id: "laptop",
    title: "Laptop Problems",
    icon: Laptop,
    desc: "Fix screen damage, keyboard keys, battery drains, liquid spills & power issues",
    problems: ["Laptop won't turn on", "Broken screen / display", "Battery draining fast", "Keyboard key missing", "Water / liquid damage"],
    badge: "Same-Day Diagnosis",
  },
  {
    id: "desktop",
    title: "Desktop Problems",
    icon: Monitor,
    desc: "Motherboard repair, graphics card issues, power supply unit (PSU) & fan noise",
    problems: ["No display on monitor", "PC shutting down randomly", "Blue screen error (BSOD)", "Power supply replacement"],
    badge: "Tested Components",
  },
  {
    id: "wifi",
    title: "Internet / WiFi Problems",
    icon: Wifi,
    desc: "Router configuration, slow WiFi speed, office LAN cables & internet disconnects",
    problems: ["WiFi dropping connection", "Slow internet speed", "New router installation", "Office LAN wiring"],
    badge: "Doorstep Setup",
  },
  {
    id: "cctv",
    title: "CCTV Installation & Repair",
    icon: Video,
    desc: "HD security camera setup, DVR box repair, mobile viewing & night vision cameras",
    problems: ["New CCTV setup needed", "Camera video blank", "DVR hard drive full / error", "Mobile app live view setup"],
    badge: "On-Site Support",
  },
  {
    id: "upgrade",
    title: "Computer Upgrade (RAM & SSD)",
    icon: Cpu,
    desc: "Make your slow computer 5x faster with 1TB SSD & RAM memory upgrades",
    problems: ["Slow computer startup", "Storage memory full", "Need 16GB / 32GB RAM upgrade", "Hard drive to SSD upgrade"],
    badge: "Speed Up Guaranteed",
  },
  {
    id: "data",
    title: "Data Recovery & Backup",
    icon: HardDrive,
    desc: "Recover deleted photos, corrupted files, dead hard drive recovery & cloud backup",
    problems: ["Hard disk corrupted", "Accidentally deleted files", "Formatted drive recovery", "Transfer data to new PC"],
    badge: "Confidential Data",
  },
  {
    id: "software",
    title: "Software & Windows Installation",
    icon: Code,
    desc: "Original Windows OS, antivirus protection, driver updates & software fixes",
    problems: ["Windows OS installation", "Virus & malware cleanup", "Tally / Office setup", "Computer hanging issue"],
    badge: "Genuine Software",
  },
  {
    id: "b2b",
    title: "Business IT Support (AMC)",
    icon: Building,
    desc: "Regular monthly maintenance, office IT support contracts & computer health checks",
    problems: ["Annual IT support contract", "Bulk computer maintenance", "Office server management", "Network setup"],
    badge: "Priority B2B Contract",
  },
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const openBookingModal = (itemTitle: string) => {
    window.dispatchEvent(
      new CustomEvent("nexbyte-open-booking-modal", {
        detail: { prefilledItem: itemTitle },
      })
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] py-6 px-2 sm:px-4">
        <div className="mx-auto max-w-7xl">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-3">
              <Wrench className="h-3.5 w-3.5" /> Doorstep &amp; On-Site Support
            </span>
            <h1 className="heading-h1">
              What do you need help with?
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-readable-secondary font-medium leading-relaxed">
              Select your problem below. Fast diagnosis, doorstep service, and tested hardware repairs.
            </p>
          </div>

          {/* 8 Primary Service Problem Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {SERVICE_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="futuristic-card p-5 rounded-2xl flex flex-col justify-between group hover:border-cyan-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        <IconComp className="h-5.5 w-5.5" />
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                        {cat.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1.5">
                      {cat.title}
                    </h3>

                    <p className="text-xs text-readable-secondary leading-relaxed mb-4">
                      {cat.desc}
                    </p>

                    {/* Problem list checkboxes preview */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Common Issues:</span>
                      {cat.problems.slice(0, 3).map((prob, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{prob}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                      onClick={() => openBookingModal(cat.title)}
                      className="futuristic-btn-primary w-full rounded-xl font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Book Service / Repair
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Request Lookup CTA */}
          <div className="futuristic-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Already submitted a repair request?
                </h4>
                <p className="text-xs text-readable-secondary mt-0.5">
                  Track status live using your Request ID (e.g. REQ-2026-00125).
                </p>
              </div>
            </div>

            <a
              href="/customer/requests"
              className="futuristic-btn-secondary rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" /> Track Request Status →
            </a>
          </div>

        </div>
    </div>
  );
}
