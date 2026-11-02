"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { business } from "@/lib/data";
import { MessageSquare, Laptop, User, Phone, CircleDollarSign, Send, CheckCircle2 } from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function BookLaptopPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [laptopType, setLaptopType] = useState("gaming");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const typeLabels: Record<string, string> = {
      gaming: "Gaming PC / Laptop",
      business: "Business Laptop",
      student: "Student / Coding Laptop",
      professional: "Workstation / Creator Laptop",
      used: "Premium Second-Hand Laptop",
      new: "Brand New Custom laptop",
    };

    const selectedTypeLabel = typeLabels[laptopType] || laptopType;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await safeJsonFetch('/api/laptop-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          phone,
          laptop_type: selectedTypeLabel,
          message: message || "None",
          budget: budget || "N/A",
          status: "new",
        }),
      });

      if (!res.ok || !res.data?.success) throw new Error(res.error || "Failed to submit.");

      setBookingId(res.data.id || "REQ-" + Math.floor(Math.random() * 90000));
      setSuccess(true);

      // Reset fields
      setName("");
      setPhone("");
      setBudget("");
      setLaptopType("gaming");
      setMessage("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-28 pb-16 overflow-hidden">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-glow-blue" />
              Tailored Hardware Finder
            </span>
            <h1 className="heading-h1">
              Book a <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Laptop.</span>
            </h1>
            <p className="mt-3 text-sm text-readable-secondary leading-relaxed">
              Tell us your requirements and budget, and our technician team will share the best available used or new options directly with you.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="futuristic-card p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
              {success ? (
                <div className="text-center py-8 space-y-5">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Enquiry Submitted Successfully!</h3>
                    <p className="text-xs text-readable-secondary mt-1 leading-relaxed">
                      Your laptop enquiry has been logged. Reference ID:
                    </p>
                    <div className="mt-3 inline-block rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {bookingId}
                    </div>
                  </div>
                  <p className="text-[11px] text-readable-secondary">We will contact you shortly with the best options.</p>
                  <button onClick={() => setSuccess(false)} className="futuristic-btn-primary py-2.5 px-6 text-xs rounded-xl font-bold">
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {errorMsg && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-600 dark:text-red-400 font-semibold">
                    {errorMsg}
                  </div>
                )}
                
                {/* Name */}
                <div className="space-y-1">
                  <label htmlFor="enq-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Name *
                  </label>
                  <input
                    id="enq-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label htmlFor="enq-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Phone Number *
                  </label>
                  <input
                    id="enq-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 8088979706"
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Budget */}
                  <div className="space-y-1">
                    <label htmlFor="enq-budget" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CircleDollarSign className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Budget (optional)
                    </label>
                    <input
                      id="enq-budget"
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. Rs. 35,000"
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  {/* Laptop Type */}
                  <div className="space-y-1">
                    <label htmlFor="enq-type" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Laptop Type
                    </label>
                    <select
                      id="enq-type"
                      value={laptopType}
                      onChange={(e) => setLaptopType(e.target.value)}
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0B0718]"
                    >
                      <option value="gaming" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">Gaming Laptop</option>
                      <option value="business" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">Business Laptop</option>
                      <option value="student" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">Student / Coding</option>
                      <option value="professional" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">Workstation / Creator</option>
                      <option value="used" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">Premium Second-Hand</option>
                      <option value="new" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">Brand New Custom</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label htmlFor="enq-msg" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Describe Your Requirements</label>
                  <textarea
                    id="enq-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Looking for a Lenovo ThinkPad with i5, 16GB RAM for programming, or high graphics RTX laptop under Rs. 60k..."
                    rows={4}
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="futuristic-btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Laptop Enquiry"}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
