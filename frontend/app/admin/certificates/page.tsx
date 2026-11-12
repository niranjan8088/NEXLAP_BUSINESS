"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit3, ShieldAlert, Award, FileText, CheckCircle2, RefreshCw, GraduationCap, X } from "lucide-react";
// Removed dbHelper import in favor of REST API

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [internshipsList, setInternshipsList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form Fields for Issue/Edit
  const [showModal, setShowModal] = useState(false);
  const [showInternshipSelector, setShowInternshipSelector] = useState(false);
  const [internshipSearch, setInternshipSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string | null>(null);

  const [regId, setRegId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("/assets/nexlaptech-logo.webp");
  const [courseTitle, setCourseTitle] = useState("");
  const [trainingType, setTrainingType] = useState("");
  const [internshipType, setInternshipType] = useState("Hybrid");
  const [projectTitle, setProjectTitle] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [certRes, internRes] = await Promise.all([
        fetch("/api/certificates", { cache: "no-store" }),
        fetch("/api/internships", { cache: "no-store" }),
      ]);
      const certData = certRes.ok ? await certRes.json() : [];
      const internJson = internRes.ok ? await internRes.json() : {};
      const internData = Array.isArray(internJson) ? internJson : (internJson.applications || []);
      
      setCerts(Array.isArray(certData) ? certData : []);
      setInternshipsList(internData);
    } catch {
      alert("Failed to load certificates records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("nexbyte-realtime", handler);
    return () => window.removeEventListener("nexbyte-realtime", handler);
  }, []);

  // One-time startup: sanitize any corrupted nexbyte_* localStorage entries
  // that contain "undefined", "null", or empty strings (causes JSON.parse crash)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const keysToCheck = ["nexbyte_certificate_sequences", "nexbyte_certificates"];
    keysToCheck.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (
        raw === null ||
        raw === "" ||
        raw === "undefined" ||
        raw === "null"
      ) {
        localStorage.removeItem(k);
      }
    });
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setSelectedInternshipId(null);
    setRegId("[AUTO-GENERATED ON ISSUE]");
    setStudentName("");
    setCourseTitle("Full Stack Web Development");
    setTrainingType("Advanced Web Technologies");
    setInternshipType("Hybrid");
    setProjectTitle("");
    setCompletionDate(new Date().toISOString().split("T")[0]);
    setPhoneNumber("");
    setEmail("");
    setCollege("");
    setShowModal(true);
  };

  const handleSelectInternship = (intern: any) => {
    setEditId(null);
    setSelectedInternshipId(intern.id);
    setRegId("[AUTO-GENERATED ON ISSUE]");
    setStudentName(intern.full_name || intern.student_name || "");
    setEmail(intern.email || "");
    setPhoneNumber(intern.phone || "");
    setCourseTitle(intern.course || "BE / B.Tech");
    setTrainingType(intern.domain || "Full Stack Development");
    setInternshipType(intern.internship_type || "Hybrid");
    setProjectTitle(intern.project_title || intern.domain || "Engineering Project");
    setCompletionDate(intern.end_date || new Date().toISOString().split("T")[0]);
    setCollege(intern.college || "");
    
    setShowInternshipSelector(false);
    setShowModal(true);
  };

  const openEditModal = (cert: any) => {
    setEditId(cert.id);
    setRegId(cert.registrationId || "");
    setStudentName(cert.studentName || "");
    setCourseTitle(cert.courseTitle || "");
    setTrainingType(cert.trainingType || "");
    setInternshipType(cert.internshipType || "");
    setProjectTitle(cert.projectTitle || "");
    setCompletionDate(cert.completionDate || "");
    setPhoneNumber(cert.phoneNumber || "");
    setEmail(cert.email || "");
    setCollege(cert.college || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      registrationId: regId.includes("AUTO") ? undefined : regId,
      studentName,
      photoUrl,
      courseTitle,
      trainingType,
      internshipType,
      projectTitle,
      completionDate,
      phoneNumber,
      email,
      college,
      application_id: selectedInternshipId ? internshipsList.find((i) => i.id === selectedInternshipId)?.application_id : undefined,
      enrollment_id: selectedInternshipId ? internshipsList.find((i) => i.id === selectedInternshipId)?.enrollment_id : undefined,
    };

    try {
      if (editId) {
        const res = await fetch("/api/certificates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Creation failed");
        const data = await res.json();

        if (selectedInternshipId && data.registrationId) {
          await fetch("/api/internships", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedInternshipId,
              certificate_id: data.registrationId,
              status: "completed",
              progress: 100,
            }),
          });
        }
      }
      setShowModal(false);
      load();
    } catch {
      alert("Failed to save certificate.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate record? Consumed Registration ID will NOT be reused.")) return;
    try {
      const res = await fetch(`/api/certificates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch {
      alert("Failed to delete certificate.");
    }
  };

  const handleStatusChange = async (cert: any, newStatus: string) => {
    try {
      const res = await fetch("/api/certificates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cert.id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      load();
    } catch {
      alert("Failed to update status.");
    }
  };

  const filtered = certs.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.studentName?.toLowerCase().includes(s) ||
      c.registrationId?.toLowerCase().includes(s) ||
      c.phoneNumber?.includes(s) ||
      c.email?.toLowerCase().includes(s)
    );
  });

  const filteredInternships = internshipsList.filter((i) => {
    const q = internshipSearch.toLowerCase();
    return (
      (i.full_name || i.student_name || "").toLowerCase().includes(q) ||
      (i.application_id || "").toLowerCase().includes(q) ||
      (i.enrollment_id || "").toLowerCase().includes(q) ||
      (i.phone || "").includes(q) ||
      (i.college || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-cyan-400" /> Certificate Management Portal
          </h1>
          <p className="text-xs text-nex-mist mt-0.5">Issue, verify, download, or revoke systems accreditation certificates by Registration ID.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowInternshipSelector(true)}
            className="btn-primary !py-2 !px-4 text-xs bg-gradient-to-r from-cyan-600 to-green-600 border-none shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5"
          >
            <GraduationCap className="h-4 w-4" /> Create Certificate from Internship
          </button>
          <button onClick={openAddModal} className="btn-secondary !py-2 !px-4 text-xs">
            <Plus className="h-4 w-4" /> Issue Certificate
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-3 glass-card p-4 border-cyan-500/10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, Registration ID, email, phone..."
            className="w-full rounded-xl bg-white/[0.03] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-nex-mist mt-2">Loading certificate records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-card border-white/5">
          <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-xs text-nex-mist">No certificates match your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cert) => (
            <div key={cert.id} className="glass-card p-5 border-cyan-500/10 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{cert.studentName}</h3>
                    <span className="text-[10px] text-nex-mist block mt-0.5">{cert.courseTitle} • {cert.college || "NEXLAPTECH Academy"}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                    cert.status === "verified" 
                      ? "bg-green-500/10 border-green-500/30 text-green-400" 
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    {cert.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-nex-mist">
                  <p><strong className="text-white">Registration ID:</strong> <span className="font-mono text-cyan-400 font-bold">{cert.registrationId}</span></p>
                  <p><strong className="text-white">Domain &amp; Project:</strong> {cert.trainingType || cert.courseTitle} ({cert.projectTitle || "N/A"})</p>
                  <p><strong className="text-white">Completion Date:</strong> {cert.completionDate}</p>
                  <p><strong className="text-white">Contact:</strong> {cert.phoneNumber} | {cert.email}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 border-t border-white/5 pt-4 flex flex-wrap gap-2 justify-end">
                <button onClick={() => openEditModal(cert)} className="btn-secondary !py-1.5 !px-3 text-[10px] hover:border-cyan-500/50">
                  <Edit3 className="h-3 w-3" /> Edit
                </button>

                {cert.status === "verified" ? (
                  <button onClick={() => handleStatusChange(cert, "revoked")} className="btn-secondary !py-1.5 !px-3 text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40">
                    <ShieldAlert className="h-3 w-3" /> Revoke
                  </button>
                ) : (
                  <button onClick={() => handleStatusChange(cert, "verified")} className="btn-secondary !py-1.5 !px-3 text-[10px] border-green-500/20 text-green-400 hover:bg-green-500/10 hover:border-green-500/40">
                    <CheckCircle2 className="h-3 w-3" /> Verify
                  </button>
                )}

                <button onClick={() => handleDelete(cert.id)} className="btn-secondary !py-1.5 !px-3 text-[10px] text-red-400 border-red-500/20 hover:bg-red-500/10">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>

                <a href={`/verify?regid=${cert.registrationId}`} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 !px-3 text-[10px] border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                  Print QR / Verify
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Internship Selector Modal */}
      {showInternshipSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowInternshipSelector(false)} />

          <div className="glass-panel relative w-full max-w-2xl overflow-y-auto max-h-[85vh] rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue sm:p-8 z-10 space-y-4">
            <button
              onClick={() => setShowInternshipSelector(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Create Certificate from Internship Record</h3>
                <p className="text-xs text-nex-mist mt-0.5">Select a student application to auto-fill details and issue a sequential Registration ID.</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search Application ID, Student Name, Phone, College..."
                value={internshipSearch}
                onChange={(e) => setInternshipSearch(e.target.value)}
                className="w-full rounded-xl bg-nex-black border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filteredInternships.length === 0 ? (
                <div className="text-center py-10 text-xs text-nex-mist">No internship applications found matching search query.</div>
              ) : (
                filteredInternships.map((intern) => (
                  <div
                    key={intern.id}
                    onClick={() => handleSelectInternship(intern)}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/10 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{intern.full_name || intern.student_name}</span>
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {intern.application_id || intern.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-nex-mist mt-1">
                        Domain: <strong className="text-white">{intern.domain}</strong> • College: {intern.college} ({intern.branch})
                      </div>
                    </div>

                    <button className="btn-primary !py-1.5 !px-3 text-[10px] bg-cyan-600 border-none shrink-0 font-bold">
                      Select &amp; Auto-Fill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Issue / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl glass-panel bg-nex-ink border border-cyan-500/20 p-6 rounded-2xl shadow-glow-blue max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold text-white mb-1">
              {editId ? "Edit Systems Certificate" : "Issue New Systems Certificate"}
            </h3>
            <p className="text-xs text-nex-mist mb-4">Official Accreditation issued under unique, immutable Registration ID.</p>
            
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 uppercase font-bold">Registration ID [AUTO-GENERATED &amp; IMMUTABLE]</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={regId}
                  className="w-full rounded-xl bg-white/[0.05] border border-cyan-500/30 px-3.5 py-2.5 text-cyan-300 font-mono font-bold text-xs shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase font-bold">Student Full Name *</label>
                <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-white font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">College / Institution</label>
                  <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">Course / Degree *</label>
                  <input type="text" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">Training / Internship Domain</label>
                  <input type="text" value={trainingType} onChange={(e) => setTrainingType(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-white font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">Internship Type</label>
                  <input type="text" value={internshipType} onChange={(e) => setInternshipType(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase font-bold">Project Title</label>
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-white" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">Completion Date *</label>
                  <input type="date" required value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-2 py-2 text-white text-[11px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">Phone</label>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-2 py-2 text-white text-[11px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 uppercase font-bold">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-2 py-2 text-white text-[11px]" />
                </div>
              </div>

              <div className="flex gap-2 pt-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
                <button type="submit" className="btn-primary !py-2 !px-6 text-xs bg-cyan-600 hover:bg-cyan-500 border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold">
                  {editId ? "Save Changes" : "Issue Official Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
