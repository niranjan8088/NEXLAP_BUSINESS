"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Cpu,
  BookOpen,
  Award,
  Users,
  Wrench,
  Clock,
  HelpCircle,
  PlayCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const COURSE_TIMELINE = [
  {
    week: "Week 1",
    title: "Fundamentals & Assembly",
    details: "Basic electronics, component identification, PC assembly from scratch, disassembly, and proper cable routing.",
  },
  {
    week: "Week 2",
    title: "Diagnostics & Storage",
    details: "BIOS settings, OS installations (Windows/Linux), drive configurations (SSD/HDD), partition setups, and driver installations.",
  },
  {
    week: "Week 3",
    title: "Diagnostics & Board Diagnostics",
    details: "Troubleshooting SMPS, testing RAM/CPU sockets, motherboard power rails, checking display lines, and testing tools.",
  },
  {
    week: "Week 4",
    title: "Board Repair & Testing",
    details: "Soldering practice, board component replacement, thermal pasting, bios flashing, error code reading, and customer handling.",
  },
];

const LEARNING_OUTCOMES = [
  { id: "smps", label: "SMPS & PSU", icon: Zap, text: "Learn power supply structures, voltage testing, capacitor health checks, and connector pinouts." },
  { id: "motherboard", label: "Motherboards", icon: Cpu, text: "Board-level architectures, socket pin repair, chip testing, voltage rails, and BIOS flashing." },
  { id: "ram", label: "RAM & Memory", icon: BookOpen, text: "Types of RAM (DDR3/DDR4/DDR5), timing configurations, diagnostic beep codes, and memory testing." },
  { id: "cpu", label: "CPU & Chipsets", icon: Cpu, text: "Processor mounting, socket identification, thermal paste application, and handling heating issues." },
  { id: "storage", label: "SSD & HDD", icon: Wrench, text: "Partitioning, data recovery methodologies, bad sector isolation, and speed benchmarking." },
  { id: "cooling", label: "Cooling Systems", icon: Zap, text: "AIO liquid cooling assembly, radiator placement, cabinet airflow tuning, and fan curve settings." },
  { id: "ports", label: "Ports & Interfaces", icon: HelpCircle, text: "Rear panel diagnostics, HDMI/DisplayPort interfaces, front panel headers, and USB controllers." },
  { id: "monitor", label: "Monitors", icon: PlayCircle, text: "Display cable diagnostics, resolution settings, refresh rate checks, and basic power supply testing." },
  { id: "assembly", label: "Assembly & Cabling", icon: ShieldCheck, text: "Premium PC construction, routing cables cleanly, dual-GPU setup, and structural builds." },
];

export default function TrainingPage() {
  const [activeOutcome, setActiveOutcome] = useState("smps");

  const handleEnrollClick = () => {
    window.dispatchEvent(new CustomEvent("nexbyte-open-enrollment-modal", {
      detail: { type: "training", item: "Desktop & Laptop Hardware Diagnostics" }
    }));
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-28 pb-16 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          {/* Hero Banner Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-3 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              NexLapTech Academy
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Desktop Repair <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Training.</span>
            </h1>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Transform from a tech enthusiast into a certified systems hardware engineer. Get 100% practical, hands-on experience working on real, functional computer hardware under expert supervision.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button onClick={handleEnrollClick} className="futuristic-btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
                Book Training Seat
              </button>
              <a href="#outcomes" className="futuristic-btn-secondary px-6 py-3 rounded-xl text-sm font-semibold">
                Explore Curriculum
              </a>
            </div>
          </div>

          {/* Quick Overview Strip */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-20">
            <div className="futuristic-card p-6 rounded-2xl flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-medium">Course Duration</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">4 Weeks Intensive</p>
              </div>
            </div>

            <div className="futuristic-card p-6 rounded-2xl flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center shrink-0">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-medium">Practical Ratio</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">100% Hands-on Lab</p>
              </div>
            </div>

            <div className="futuristic-card p-6 rounded-2xl flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trainer Ratio</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Personal Mentorship</p>
              </div>
            </div>

            <div className="futuristic-card p-6 rounded-2xl flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certification</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">NexLapTech Verified</p>
              </div>
            </div>
          </div>

          {/* Interactive Learning Outcomes Section */}
          <div id="outcomes" className="mb-24 scroll-mt-24">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-2">
                Curriculum Breakdown
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                What You Will <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Master</span>
              </h2>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Select any topic category below to preview key topics and learning structures covered during the program.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Tab list */}
              <div className="lg:col-span-4 flex flex-row flex-wrap lg:flex-col gap-2.5">
                {LEARNING_OUTCOMES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeOutcome === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveOutcome(item.id)}
                      className={cn(
                        "flex items-center gap-3 w-auto lg:w-full px-4 py-3 rounded-xl text-left border transition-all text-xs font-semibold",
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25"
                          : "futuristic-card text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/10"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-indigo-600 dark:text-cyan-400")} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Details display */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {LEARNING_OUTCOMES.map(
                    (item) =>
                      item.id === activeOutcome && (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="futuristic-card p-8 min-h-[260px] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center">
                                <item.icon className="h-5 w-5" />
                              </div>
                              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{item.label}</h3>
                            </div>
                            <p className="mt-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.text}</p>
                            
                            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <li className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                                <ChevronRight className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                                Hands-on hardware diagnostics
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                                <ChevronRight className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                                Real troubleshooting boards
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                                <ChevronRight className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                                Practical kit tool exercises
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                                <ChevronRight className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                                Interactive failure simulations
                              </li>
                            </ul>
                          </div>

                          <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Topic Status: Included in Standard Kit</span>
                            <span className="font-semibold text-indigo-600 dark:text-cyan-400">100% Lab Verified</span>
                          </div>
                        </motion.div>
                      )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Timeline and Journey Section */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-2">
                Learning Schedule
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Course <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Timeline</span>
              </h2>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Our curriculum progresses logically from base assembly basics up to advanced chip-level diagnostics and client support.
              </p>
            </div>

            <div className="relative border-l border-slate-200 dark:border-white/10 ml-4 md:ml-12 space-y-10">
              {COURSE_TIMELINE.map((step, idx) => (
                <div key={idx} className="relative pl-8 md:pl-12 group">
                  {/* Pin */}
                  <div className="absolute left-[-7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white dark:bg-[#070B1A] group-hover:bg-cyan-400 transition-colors" />
                  <div className="absolute left-[-16px] top-[-8px] h-9 w-9 rounded-full bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                    {step.week}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {step.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Target Audience / Who Can Attend */}
          <div className="mb-24">
            <div className="futuristic-card p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-2">
                  Who Can Enroll
                </span>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  No Prior Tech Experience <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Required.</span>
                </h3>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Whether you are a student, hobbyist, looking for employment, or trying to start a laptop-repair side business, this course is designed from raw basics up to commercial hardware skills.
                </p>
                
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {["Diploma & Engineering Students", "Tech Enthusiasts & Hobbyists", "Hardware Repair Business Owners", "Job Seekers"].map((audience) => (
                    <span key={audience} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] px-3.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-200 font-semibold">
                      <ChevronRight className="h-3 w-3 text-indigo-600 dark:text-cyan-400" />
                      {audience}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative h-48 w-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 p-4 bg-white flex items-center justify-center shrink-0 shadow-md">
                <BrandLogo width={280} height={280} className="h-full w-full object-contain" />
              </div>
            </div>
          </div>

          {/* Sample Certificate preview */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-2">
                Industry Recognition
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Get <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Certified</span>
              </h2>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Upon successful completion of all practical labs and final diagnostic tests, receive your verified systems certificate.
              </p>
            </div>

            <div className="futuristic-card p-6 md:p-12 max-w-3xl mx-auto border-indigo-200 dark:border-cyan-500/20 relative overflow-hidden rounded-2xl shadow-xl">
              {/* Background emblem watermark */}
              <div className="absolute right-0 bottom-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transform translate-x-12 translate-y-12">
                <Cpu size={320} />
              </div>

              {/* Certificate Border decoration */}
              <div className="absolute inset-2 border border-dashed border-indigo-200 dark:border-white/10 rounded-xl pointer-events-none" />

              <div className="relative z-10 text-center border-2 border-indigo-100 dark:border-white/[0.04] p-6 md:p-10 rounded-lg bg-white/40 dark:bg-white/[0.02]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase font-semibold">Reg ID: NB-2026-TR8</span>
                  <Award className="h-8 w-8 text-indigo-600 dark:text-cyan-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase font-semibold">NEXLAPTECH Academy</span>
                </div>

                <span className="font-display text-[10px] tracking-[0.3em] text-indigo-600 dark:text-cyan-400 font-bold uppercase block mb-4">
                  Certificate of Hardware Engineering
                </span>
                
                <h3 className="font-display text-lg md:text-2xl font-bold text-slate-900 dark:text-white italic">
                  [Your Name Here]
                </h3>
                
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto my-4" />

                <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                  has successfully completed the intensive course in Desktop Repair, Diagnostics, and Board-level Assembly, demonstrating core competencies in SMPS diagnosis, motherboard power testing, systems construction, and hardware servicing.
                </p>

                <div className="mt-10 flex justify-between items-end border-t border-slate-200 dark:border-white/10 pt-6 text-[9px] text-slate-500 dark:text-slate-400">
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 dark:text-slate-200">NexLapTech Technical Director</p>
                    <p className="mt-0.5">Authorised Signature</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-200">Bengaluru, Karnataka</p>
                    <p className="mt-0.5">Issued Date: {new Date().toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enrolment Footer Card */}
          <div className="text-center futuristic-card p-10 rounded-3xl max-w-2xl mx-auto shadow-lg">
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Ready to Start Learning?</h3>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Batch sizes are strictly limited to ensure personal workstations and trainer support. Secure your seat today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleEnrollClick} className="futuristic-btn-primary px-6 py-3 rounded-xl text-xs font-semibold">
                Book Practical Batch
              </button>
              <a href="tel:+918088979706" className="futuristic-btn-secondary px-6 py-3 rounded-xl text-xs font-semibold">
                Call Support
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

// Utility class name compiler
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
