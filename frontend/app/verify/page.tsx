"use client";

import React, { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Loader2, Award, Download, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { getSafeImageSrc } from "@/lib/utils";

export default function VerifyPage() {
  const [regId, setRegId] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  
  const printRef = useRef<HTMLDivElement>(null);

  // Auto load if regid in query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("regid");
      if (queryId) {
        setRegId(queryId);
        fetchCertificate(queryId);
      }
    }
  }, []);

  const fetchCertificate = async (idToSearch: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/verify?regid=${encodeURIComponent(idToSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setCertificate(data);
      } else {
        setCertificate(null);
      }
    } catch {
      alert("Error verifying certificate record.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regId.trim()) return;
    fetchCertificate(regId);
  };

  const handleDownload = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-28 pb-16 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-glow-blue" />
              NexLapTech Systems Accreditation
            </span>
            <h1 className="heading-h1">
              Verify <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Certificate.</span>
            </h1>
            <p className="mt-3 text-xs text-readable-secondary leading-relaxed">
              Verify credentials issued by NexLapTech. Enter the Registration ID to view authentic training records and placement certification.
            </p>
          </div>

          {/* Form */}
          <div className="futuristic-card p-6 max-w-xl mx-auto mb-12 print:hidden shadow-xl rounded-2xl">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-readable-secondary">Registration ID *</label>
                <input
                  type="text"
                  required
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="e.g. NBT-TR-2026-001"
                  className="futuristic-input w-full rounded-xl px-4 py-2.5 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full futuristic-btn-primary flex items-center justify-center gap-2 text-xs py-3.5 rounded-xl font-bold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accredit Certificate"}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="max-w-3xl mx-auto">
            {loading && (
              <div className="text-center py-20 print:hidden">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
                <p className="text-xs text-readable-secondary mt-3">Fetching verified records...</p>
              </div>
            )}

            {hasSearched && !loading && !certificate && (
              <div className="text-center py-16 futuristic-card border-red-500/20 rounded-3xl p-8 print:hidden">
                <span className="text-3xl block mb-3">❌</span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Registration ID not found.</h3>
                <p className="text-xs text-readable-secondary mt-1 max-w-sm mx-auto">
                  Accreditation record is either pending generation or has been deactivated/revoked by admin dashboard.
                </p>
              </div>
            )}

            {hasSearched && !loading && certificate && (
              <div className="space-y-6">
                {certificate.status === "revoked" ? (
                  <div className="text-center py-16 futuristic-card border-red-500/40 bg-red-500/10 rounded-3xl p-8 space-y-3">
                    <span className="text-4xl block">⛔</span>
                    <h3 className="font-display text-xl font-bold text-red-600 dark:text-red-400">Certificate Revoked</h3>
                    <p className="text-xs text-slate-700 dark:text-white/80 max-w-md mx-auto leading-relaxed">
                      This accreditation record (<strong className="font-mono text-slate-900 dark:text-white">{certificate.registrationId}</strong> issued to {certificate.studentName}) has been officially <strong className="text-red-600 dark:text-red-400">REVOKED</strong> by NexLapTech and is no longer valid for academic or professional verification.
                    </p>
                    <div className="pt-2 text-[10px] text-red-600/70 dark:text-red-300/60 font-mono">
                      Revocation Status: REVOKED • Issue Date: {certificate.completionDate || certificate.issueDate || "N/A"}
                    </div>
                  </div>
                ) : (
                  <React.Fragment>
                    {/* Visual Certificate Card */}
                    <div 
                      ref={printRef}
                      className="futuristic-card p-8 md:p-12 border-2 border-cyan-500 shadow-xl relative overflow-hidden rounded-3xl print:p-0 print:border-none print:shadow-none print:bg-white print:text-black print:rounded-none"
                    >
                      
                      {/* Decorative verified watermark badge */}
                      <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-12 translate-y-12 print:hidden">
                        <Award size={360} />
                      </div>

                      {/* Stamp Banner */}
                      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 dark:border-white/10 pb-6 gap-4 print:border-black/10">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/20 print:bg-cyan-100">
                            <Award className="h-6 w-6" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white print:text-black">NEXLAPTECH Academy</h3>
                            <span className="text-[9px] text-readable-muted uppercase tracking-widest block">Systems Certification Portal</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider print:bg-green-100 print:text-green-800 print:border-green-200">
                          <ShieldCheck className="h-4 w-4 shrink-0" /> Verified by NexLapTech
                        </div>
                      </div>

                      {/* Student Photo and Bio details */}
                      <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative h-32 w-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 shrink-0 flex items-center justify-center mx-auto md:mx-0 print:border-black/10">
                          <Image
                            src={getSafeImageSrc(certificate.photoUrl, "/assets/nexlaptech-logo.png")}
                            alt={certificate.studentName || "Student Photo"}
                            fill
                            sizes="128px"
                            className="object-contain p-2"
                          />
                        </div>

                        <div className="flex-1 space-y-4 text-center md:text-left w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Student Name</span>
                              <span className="font-bold text-slate-900 dark:text-white block mt-0.5 text-base print:text-black">{certificate.studentName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">College / Institution</span>
                              <span className="font-bold text-slate-900 dark:text-white block mt-0.5 print:text-black">{certificate.college || "NEXLAPTECH Academy"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Course Title</span>
                              <span className="font-bold text-slate-900 dark:text-white block mt-0.5 print:text-black">{certificate.courseTitle || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Training Domain</span>
                              <span className="font-medium text-slate-900 dark:text-white block mt-0.5 print:text-black">{certificate.trainingType || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Internship Domain</span>
                              <span className="font-medium text-slate-900 dark:text-white block mt-0.5 print:text-black">{certificate.internshipType || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Live Project Title</span>
                              <span className="font-medium text-slate-900 dark:text-white block mt-0.5 print:text-black">{certificate.projectTitle || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Completion Date</span>
                              <span className="font-medium text-slate-900 dark:text-white block mt-0.5 print:text-black">
                                {certificate.completionDate
                                  ? new Date(certificate.completionDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-readable-secondary block uppercase">Issue Date</span>
                              <span className="font-medium text-slate-900 dark:text-white block mt-0.5 print:text-black">
                                {certificate.issueDate
                                  ? new Date(certificate.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR and Registration ID */}
                      <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 print:border-black/10">
                        <div className="text-center sm:text-left space-y-1 text-xs">
                          <span className="text-[10px] text-readable-secondary block uppercase font-bold">Registration ID</span>
                          <span className="font-mono text-base font-bold text-cyan-600 dark:text-cyan-400 block print:text-black">{certificate.registrationId}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1.5">
                          <div className="relative h-24 w-24 bg-white rounded-xl p-1.5 flex items-center justify-center overflow-hidden border border-slate-200">
                            {certificate.qrCodeUrl && (
                              <img
                                src={certificate.qrCodeUrl}
                                alt="Verification QR code"
                                className="object-contain h-full w-full"
                              />
                            )}
                          </div>
                          <span className="text-[8px] text-readable-muted uppercase tracking-wider">Verification QR Code</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden max-w-2xl mx-auto mt-8">
                      <button 
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            navigator.clipboard.writeText(window.location.origin + "/verify?regid=" + certificate.registrationId);
                            alert("Verification link copied to clipboard!");
                          }
                        }}
                        className="futuristic-btn-secondary py-3 px-4 text-[11px] rounded-xl flex items-center justify-center gap-2 font-bold"
                      >
                         Copy Verification Link
                      </button>

                      {certificate.pdfUrl ? (
                        <a 
                          href={certificate.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="futuristic-btn-secondary py-3 px-4 text-[11px] rounded-xl flex items-center justify-center gap-2 font-bold"
                        >
                           View Certificate
                        </a>
                      ) : (
                        <div />
                      )}

                      <a 
                        href={certificate.pdfUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!certificate.pdfUrl) {
                            e.preventDefault();
                            window.print();
                          }
                        }}
                        className="futuristic-btn-accent py-3 px-4 text-[11px] rounded-xl flex items-center justify-center gap-2 font-bold"
                        download={`${certificate.registrationId}.pdf`}
                      >
                        <Download className="h-4 w-4" /> Download Certificate
                      </a>
                    </div>
                  </React.Fragment>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
