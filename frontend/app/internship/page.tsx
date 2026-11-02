"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Code2,
  Terminal,
  Smartphone,
  Cpu,
  Globe,
  Database,
  ArrowRight,
  BookmarkCheck,
  Briefcase,
  FileText,
  UserCheck,
  ChevronRight,
  BookOpen,
  Trophy,
  X,
  CheckCircle2,
  Upload,
  Search,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

const DOMAINS_LIST = [
  "Web Development",
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "React Development",
  "Next.js Development",
  "Java Development",
  "Python Development",
  "Android Development",
  "Cloud Computing",
  "Cybersecurity",
  "AI / ML",
  "Data Science",
  "IoT",
  "Embedded Systems",
  "Networking",
  "Database Development",
];

const INTERNSHIP_DOMAINS = [
  {
    id: "embedded",
    title: "Embedded & IoT Systems",
    icon: Cpu,
    tech: ["Arduino", "Raspberry Pi", "ESP32", "Sensors", "IEEE Project Architecture"],
    description: "Learn board assembly, serial programming, firmware builds, and sensor configurations. Great for electronics and electrical engineering curricula.",
  },
  {
    id: "web",
    title: "Full-Stack Web Dev",
    icon: Globe,
    tech: ["React.js", "Node.js", "Express", "MongoDB", "REST APIs"],
    description: "Build premium modern web applications from scratch, deploying databases, handling secure API authorization, and styling glassmorphic frontends.",
  },
  {
    id: "python",
    title: "Python Programming",
    icon: Terminal,
    tech: ["Python Core", "Django", "Flask", "Data Analytics", "API integrations"],
    description: "Master backend logic script compilation, scraping utilities, structural clean syntax, and databases integrations.",
  },
  {
    id: "android",
    title: "Android App Dev",
    icon: Smartphone,
    tech: ["Java", "Kotlin", "Android Studio", "Firebase", "SQLite"],
    description: "Design custom mobile layouts, register user authentication, setup databases, and learn Google Play deployment methodologies.",
  },
];

const STUDENT_SUCCESS = [
  {
    name: "Vikram R.",
    college: "SIT Tumkur",
    project: "IoT Smart Agriculture Irrigation System",
    result: "Scored 100% in Final Project Viva",
    placement: "Placed at TCS as Systems Engineer",
  },
  {
    name: "Pooja Hegde",
    college: "RVCE Bengaluru",
    project: "E-Commerce App with React & Node",
    result: "Selected for Best IEEE Project Award",
    placement: "Placed at Capgemini as Developer",
  },
  {
    name: "Sanjay Gowda",
    college: "PESIT Bengaluru",
    project: "Embedded Anti-Theft GPS Tracker",
    result: "Abstract published in College Journal",
    placement: "Placed at Wipro as IoT Associate",
  },
];

export default function InternshipPage() {
  const [activeDomain, setActiveDomain] = useState("embedded");

  // Application Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successApplicationId, setSuccessApplicationId] = useState<string | null>(null);

  // Form Fields
  // Section A
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");

  // Section B
  const [college, setCollege] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("BE / B.Tech");
  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState("Semester 6");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [usn, setUsn] = useState("");

  // Section C
  const [domain, setDomain] = useState("Full Stack Development");
  const [duration, setDuration] = useState("2 Months");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [internshipType, setInternshipType] = useState("Hybrid");
  const [purpose, setPurpose] = useState("Academic Internship");

  // Section D
  const [needProjectSupport, setNeedProjectSupport] = useState(false);
  const [projectType, setProjectType] = useState("Major Project");
  const [projectTitle, setProjectTitle] = useState("");
  const [techPreference, setTechPreference] = useState("");
  const [projectRequirements, setProjectRequirements] = useState("");

  // Section E & F
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; file_type: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Section G
  const [consent, setConsent] = useState(true);

  const handleEnrollClick = (prefDomain?: string) => {
    if (prefDomain) setDomain(prefDomain);
    setShowApplyModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Maximum file size allowed is 5 MB.");
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Only PDF, JPG, PNG, or WEBP documents are allowed.");
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await safeJsonFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to upload document.");
      }

      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          url: res.data.fileUrl || res.data.path || "",
          file_type: file.type,
        },
      ]);
    } catch (err: any) {
      alert(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim() || !college.trim()) {
      setSubmitError("Full Name, Phone Number, Email, and College Name are required.");
      return;
    }

    if (!consent) {
      setSubmitError("Please check the consent box to proceed.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await safeJsonFetch("/api/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          student_name: fullName,
          phone,
          email,
          city,
          state,
          college,
          university,
          course,
          branch,
          semester,
          graduation_year: graduationYear,
          usn,
          domain,
          duration,
          start_date: startDate,
          internship_type: internshipType,
          purpose,
          need_project_support: needProjectSupport,
          project_type: needProjectSupport ? projectType : "",
          project_title: needProjectSupport ? projectTitle : "",
          technology_preference: needProjectSupport ? techPreference : "",
          project_requirements: needProjectSupport ? projectRequirements : "",
          documents: uploadedFiles,
          message,
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to submit internship application.");
      }

      setSuccessApplicationId(res.data.applicationId || res.data.application?.application_id || "INT-2026-SUBMITTED");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-28 pb-16 overflow-hidden">
        {/* Ambient background lights */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-3 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              NexLapTech Academy
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Internships &amp; <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Projects.</span>
            </h1>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Complete your academic requirements with industry-aligned internships. We provide complete IEEE project support from abstract design and circuit assembly to code execution and documentation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button onClick={() => handleEnrollClick()} className="futuristic-btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
                Enroll Now
              </button>
              <a href="#domains" className="futuristic-btn-secondary px-6 py-3 rounded-xl text-sm font-semibold">
                View Domains
              </a>
            </div>
          </div>

          {/* Project Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            <div className="futuristic-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center mb-5">
                <BookmarkCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">IEEE Project Support</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Complete guidance for IEEE papers, covering embedded hardware circuits, microcontrollers, and modern software architectures.
              </p>
            </div>

            <div className="futuristic-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center mb-5">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Mini &amp; Major Projects</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Tailored project codes and document summaries for final year engineering, BCA, MCA, and diploma student modules.
              </p>
            </div>

            <div className="futuristic-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center mb-5">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Industry Internships</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Hands-on internships certifying your technology competency. Learn workflow logic, APIs, databases, and structural coding.
              </p>
            </div>
          </div>

          {/* Domains selection */}
          <div id="domains" className="mb-24 scroll-mt-24">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-2">
                Project Categories
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Choose Your <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Domain</span>
              </h2>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Explore our standard training domains. Our team supports custom IEEE topic abstracts too!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Tab menu */}
              <div className="lg:col-span-4 flex flex-row flex-wrap lg:flex-col gap-2.5">
                {INTERNSHIP_DOMAINS.map((domainItem) => {
                  const Icon = domainItem.icon;
                  const isSelected = activeDomain === domainItem.id;
                  return (
                    <button
                      key={domainItem.id}
                      onClick={() => setActiveDomain(domainItem.id)}
                      className={cn(
                        "flex items-center gap-3 w-auto lg:w-full px-4 py-3 rounded-xl text-left border transition-all text-xs font-semibold",
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25"
                          : "futuristic-card text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/10"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-indigo-600 dark:text-cyan-400")} />
                      <span>{domainItem.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {INTERNSHIP_DOMAINS.map(
                    (domainItem) =>
                      domainItem.id === activeDomain && (
                        <motion.div
                          key={domainItem.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="futuristic-card p-8 rounded-2xl min-h-[300px] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200/50 dark:border-cyan-500/20 flex items-center justify-center">
                                <domainItem.icon className="h-5 w-5" />
                              </div>
                              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{domainItem.title}</h3>
                            </div>
                            <p className="mt-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{domainItem.description}</p>
                            
                            <div className="mt-6">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">Key Technologies:</h4>
                              <div className="flex flex-wrap gap-2">
                                {domainItem.tech.map((t) => (
                                  <span key={t} className="rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>Project Code + report template included</span>
                            <button
                              onClick={() => handleEnrollClick(domainItem.title)}
                              className="futuristic-btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5"
                            >
                              Enroll for {domainItem.title}
                            </button>
                          </div>
                        </motion.div>
                      )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Student Success Stories */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200/60 dark:border-cyan-500/20 mb-2">
                Proven Results
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Student Success <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-400 bg-clip-text text-transparent">Stories</span>
              </h2>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                See what former interns have accomplished during their time at NexLapTech.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STUDENT_SUCCESS.map((student, idx) => (
                <div key={idx} className="futuristic-card p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400">{student.college}</span>
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white mt-1">{student.name}</h4>
                    <div className="h-px bg-slate-200 dark:bg-white/10 my-3" />
                    <p className="text-xs text-slate-700 dark:text-slate-200 italic font-medium">&ldquo;{student.project}&rdquo;</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">{student.result}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <ArrowRight className="h-3 w-3" />
                    {student.placement}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollment CTA Card */}
          <div className="text-center futuristic-card p-10 rounded-3xl max-w-2xl mx-auto shadow-lg">
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Enroll in Project Batches</h3>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Academic slots are filled early. Schedule an expert counselor meeting to select your IEEE project topic.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => handleEnrollClick()} className="futuristic-btn-primary px-6 py-3 rounded-xl text-xs font-semibold">
                Enroll Now
              </button>
              <a href="tel:+918088979706" className="futuristic-btn-secondary px-6 py-3 rounded-xl text-xs font-semibold">
                Call Program Advisor
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* Multi-Section Internship Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md" onClick={() => !submitting && setShowApplyModal(false)} />

          <div className="futuristic-card relative w-full max-w-3xl overflow-y-auto max-h-[90vh] rounded-2xl p-6 sm:p-8 z-10 bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 shadow-2xl">
            <button
              onClick={() => !submitting && setShowApplyModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white z-10"
              disabled={submitting}
            >
              <X className="h-5 w-5" />
            </button>

            {successApplicationId ? (
              /* Success View */
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">✓ Internship Application Submitted</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                    Your application has been successfully submitted to NexLapTech.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 max-w-sm mx-auto space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Application ID</span>
                  <span className="font-mono text-base font-bold text-indigo-600 dark:text-cyan-400 tracking-wider block">{successApplicationId}</span>
                  <span className="inline-block text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase px-2 py-0.5 rounded border border-amber-500/30">
                    Status: Pending Review
                  </span>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <a
                    href={`/track?search=${encodeURIComponent(successApplicationId)}`}
                    className="futuristic-btn-primary !py-2.5 !px-6 text-xs flex items-center justify-center gap-2"
                  >
                    <Search className="h-4 w-4" /> Track Application
                  </a>
                  <button
                    onClick={() => {
                      setShowApplyModal(false);
                      setSuccessApplicationId(null);
                    }}
                    className="futuristic-btn-secondary !py-2.5 !px-6 text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Form View */
              <div>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-cyan-500/20 text-indigo-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Internship Application Form</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Complete all required details to apply for NexLapTech Academic Internship &amp; Project Support.</p>
                  </div>
                </div>

                {submitError && (
                  <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmitApplication} className="space-y-6 text-xs">
                  
                  {/* SECTION A — PERSONAL DETAILS */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">SECTION A — Personal Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Kumar"
                          className="futuristic-input w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="futuristic-input w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. rahul@gmail.com"
                          className="futuristic-input w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Bengaluru"
                          className="futuristic-input w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">State *</label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="e.g. Karnataka"
                          className="futuristic-input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION B — EDUCATION */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">SECTION B — Education</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">College / Institution Name *</label>
                        <input
                          type="text"
                          required
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          placeholder="e.g. RVCE / SIT Tumkur / BMSCE"
                          className="futuristic-input w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">University / Board</label>
                        <input
                          type="text"
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder="e.g. VTU / Autonomous"
                          className="futuristic-input w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Course *</label>
                        <select
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="futuristic-input w-full !py-1.5 text-[11px]"
                        >
                          <option value="Diploma">Diploma</option>
                          <option value="BE / B.Tech">BE / B.Tech</option>
                          <option value="BCA">BCA</option>
                          <option value="BSc">BSc</option>
                          <option value="MCA">MCA</option>
                          <option value="M.Tech">M.Tech</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Branch *</label>
                        <select
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="futuristic-input w-full !py-1.5 text-[11px]"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="Information Science">Information Science</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Mechanical">Mechanical</option>
                          <option value="Civil">Civil</option>
                          <option value="AI & ML">AI &amp; ML</option>
                          <option value="Data Science">Data Science</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Semester / Year *</label>
                        <input
                          type="text"
                          required
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          placeholder="e.g. Sem 6 / 3rd Year"
                          className="futuristic-input w-full !py-1.5 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">Graduation Year *</label>
                        <input
                          type="text"
                          required
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          placeholder="2026"
                          className="futuristic-input w-full !py-1.5 text-[11px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">USN / Registration Number</label>
                      <input
                        type="text"
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                        placeholder="e.g. 1RV21CS001"
                        className="futuristic-input w-full"
                      />
                    </div>
                  </div>

                  {/* SECTION C — INTERNSHIP DETAILS */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">SECTION C — Internship Specifications</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Internship Domain *</label>
                        <select
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          className="futuristic-input w-full"
                        >
                          {DOMAINS_LIST.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Duration *</label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="futuristic-input w-full"
                        >
                          <option value="15 Days">15 Days</option>
                          <option value="1 Month">1 Month</option>
                          <option value="45 Days">45 Days</option>
                          <option value="2 Months">2 Months</option>
                          <option value="3 Months">3 Months</option>
                          <option value="6 Months">6 Months</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Preferred Start Date *</label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="futuristic-input w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Internship Type *</label>
                        <select
                          value={internshipType}
                          onChange={(e) => setInternshipType(e.target.value)}
                          className="futuristic-input w-full"
                        >
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Purpose</label>
                        <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="futuristic-input w-full"
                        >
                          <option value="Academic Internship">Academic Internship</option>
                          <option value="Skill Development">Skill Development</option>
                          <option value="Final Year Requirement">Final Year Requirement</option>
                          <option value="College Requirement">College Requirement</option>
                          <option value="Industrial Training">Industrial Training</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION D — PROJECT REQUIREMENT */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">SECTION D — Project Development Support</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={needProjectSupport}
                          onChange={(e) => setNeedProjectSupport(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Need Project Support?</span>
                      </label>
                    </div>

                    {needProjectSupport && (
                      <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Project Type</label>
                            <select
                              value={projectType}
                              onChange={(e) => setProjectType(e.target.value)}
                              className="futuristic-input w-full !py-1.5 text-xs"
                            >
                              <option value="Mini Project">Mini Project</option>
                              <option value="Major Project">Major Project</option>
                              <option value="IEEE Project">IEEE Project</option>
                              <option value="Final Year Project">Final Year Project</option>
                              <option value="Custom Project">Custom Project</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Project Title / Idea</label>
                            <input
                              type="text"
                              value={projectTitle}
                              onChange={(e) => setProjectTitle(e.target.value)}
                              placeholder="e.g. IoT Smart Agriculture Irrigation System"
                              className="futuristic-input w-full !py-1.5 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Technology Preference</label>
                            <input
                              type="text"
                              value={techPreference}
                              onChange={(e) => setTechPreference(e.target.value)}
                              placeholder="e.g. React.js, Node.js, Arduino, Python"
                              className="futuristic-input w-full !py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Project Requirements Summary</label>
                            <input
                              type="text"
                              value={projectRequirements}
                              onChange={(e) => setProjectRequirements(e.target.value)}
                              placeholder="e.g. Need abstract, block diagram, code execution"
                              className="futuristic-input w-full !py-1.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION E & F — DOCUMENTS & MESSAGE */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">SECTION E &amp; F — Documents &amp; Additional Message</h4>
                    
                    <div>
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                        Optional Supporting Documents (College ID, Student ID, Resume, Request Letter)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="futuristic-btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 cursor-pointer">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingDoc ? "Uploading..." : "Upload File"}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploadingDoc}
                          />
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Max 5MB (PDF, JPG, PNG)</span>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {uploadedFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-[11px] text-slate-800 dark:text-slate-200">
                              <span className="truncate max-w-[250px]">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-red-500 hover:text-red-700 dark:hover:text-white p-0.5"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block mb-1">Additional Message / Requirements</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any additional notes or questions for NexLapTech team..."
                        rows={2}
                        className="futuristic-input w-full resize-none"
                      />
                    </div>
                  </div>

                  {/* SECTION G — CONSENT & SUBMIT */}
                  <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-4">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        I confirm that the information provided is correct and I agree to be contacted by NexLapTech regarding this internship application.
                      </span>
                    </label>

                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowApplyModal(false)}
                        className="futuristic-btn-secondary !py-2 !px-4"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="futuristic-btn-primary !py-2 !px-6 flex items-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
