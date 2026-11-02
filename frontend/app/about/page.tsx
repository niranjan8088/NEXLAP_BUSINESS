"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Target,
  Trophy,
  History,
  Mail,
  Linkedin,
  Globe,
  Award,
  BookOpen,
  Cpu,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

const MILESTONES = [
  { year: "2020", title: "Founding in Tumkur", desc: "NexLapTech established as a dedicated computer repair service center, focusing on chip-level troubleshooting." },
  { year: "2022", title: "Expansion to Bengaluru", desc: "Opened head office in Padmanabhanagar, scaling IT maintenance contracts (AMC) and custom PC construction." },
  { year: "2024", title: "Academy & Training Division", desc: "Launched hardware repair certifications and student IEEE project support courses." },
  { year: "2026", title: "Enterprise Systems Platform", desc: "Integrated cloud management portals, scaling hardware supply chains across Karnataka." },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-28 pb-16 overflow-hidden">
        {/* Glow gradients */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-glow-blue" />
              NEXLAPTECH STORY
            </span>
            <h1 className="heading-h1">
              About Our <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Enterprise.</span>
            </h1>
            <p className="mt-4 text-base text-readable-secondary leading-relaxed">
              NEXLAPTECH is your trusted destination for laptops, computer components, and accessories at the best prices with genuine warranty and reliable support.
            </p>
          </div>

          {/* Vision, Mission, Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {/* Vision */}
            <div className="futuristic-card p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">Our Vision</h3>
                <p className="text-xs text-readable-secondary leading-relaxed">
                  To become the leading systems engineering and technology repair platform in South India, setting the standard for technical accuracy and client transparency.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="futuristic-card p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">Our Mission</h3>
                <p className="text-xs text-readable-secondary leading-relaxed">
                  To deliver premium hardware sales, board-level repairs, networking configurations, and industry-grade training that empowers technicians and corporations.
                </p>
              </div>
            </div>

            {/* Achievements */}
            <div className="futuristic-card p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">Our Achievements</h3>
                <p className="text-xs text-readable-secondary leading-relaxed">
                  Over 500+ micro-soldering board repairs completed, 150+ certified technicians trained, and 200+ academic IEEE IoT project modules fully engineered.
                </p>
              </div>
            </div>
          </div>

          {/* CEO Section - Niranjan M. */}
          <div className="mb-24 scroll-mt-24">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">EXECUTIVE LEADERSHIP</span>
              <h2 className="heading-h2">
                CEO &amp; <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Founder Message</span>
              </h2>
            </div>

            <div className="futuristic-card p-6 md:p-10 rounded-3xl flex flex-col lg:flex-row items-center gap-10 shadow-xl">
              {/* Profile image card */}
              <div className="relative h-64 w-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-white/5 p-4 flex flex-col items-center justify-center">
                <div className="relative h-44 w-44 rounded-full overflow-hidden border-2 border-cyan-500 mb-4 flex items-center justify-center bg-slate-100 dark:bg-[#070B1A]">
                  <User className="h-24 w-24 text-slate-400 dark:text-white/20" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Niranjan M.</h3>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">CEO &amp; Co-Founder</p>
              </div>

              {/* CEO details */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[9px] text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                    Technology Passion
                  </span>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    Systems Architect
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white italic">
                  &ldquo;Our focus is resolving hardware failures others find too complex.&rdquo;
                </h3>

                <p className="text-xs text-readable-secondary leading-relaxed">
                  As the founding technician and director of NexLapTech, I have overseen the troubleshooting of hundreds of liquid-damaged motherboards, micro-chip shorts, and structural laptop failures. Our goal is to extend NexLapTech into a modular corporate supplier, while offering the best hands-on practical academy for aspiring engineers in Karnataka.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-200 dark:border-white/10">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Leadership Focus</h4>
                    <p className="text-[11px] text-readable-secondary mt-0.5">Chip-level diagnostics, circuit board prototyping, and server infrastructure configurations.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Business Goals</h4>
                    <p className="text-[11px] text-readable-secondary mt-0.5">Establishing 5 additional service branches in Karnataka and offering digital certification codes.</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <a
                    href="mailto:nexbytetechnologies@gmail.com"
                    className="h-8.5 w-8.5 rounded-full futuristic-card flex items-center justify-center text-slate-700 dark:text-white hover:text-cyan-500 transition-colors"
                    title="Email CEO"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8.5 w-8.5 rounded-full futuristic-card flex items-center justify-center text-slate-700 dark:text-white hover:text-cyan-500 transition-colors"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Business Growth Timeline */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">HISTORICAL JOURNEY</span>
              <h2 className="heading-h2">
                Business Growth <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Timeline</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {MILESTONES.map((m, idx) => (
                <div key={idx} className="futuristic-card p-6 rounded-2xl relative group shadow-xl">
                  <div className="font-display text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-3">
                    {m.year}
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">{m.title}</h4>
                  <p className="text-[10px] text-readable-secondary leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Credentials & Certificates */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">TRUST &amp; CERTIFICATION</span>
              <h2 className="heading-h2">
                Professional <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Credentials</span>
              </h2>
              <p className="mt-3 text-xs text-readable-secondary max-w-lg mx-auto">
                We are fully registered and carry technical authorizations for industrial hardware services.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                <Award className="h-8 w-8 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">ISO Certified Standards</h4>
                  <p className="text-[9px] text-readable-secondary mt-0.5">Compliant with tech troubleshooting protocols</p>
                </div>
              </div>
              <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                <ShieldCheck className="h-8 w-8 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">MSME Registered</h4>
                  <p className="text-[9px] text-readable-secondary mt-0.5">Government recognized service platform</p>
                </div>
              </div>
              <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                <Cpu className="h-8 w-8 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">IEEE Project Partner</h4>
                  <p className="text-[9px] text-readable-secondary mt-0.5">Authorized technology project mentoring center</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
