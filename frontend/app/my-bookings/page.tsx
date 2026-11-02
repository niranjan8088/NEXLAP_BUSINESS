"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { dbHelper } from "@/lib/dbHelper";
import { business } from "@/lib/data";
import {
  Search,
  Calendar,
  MessageSquare,
  Clock,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  User,
  ArrowRight,
  ShieldAlert,
  MessageCircle,
  Send,
} from "lucide-react";

// Status configuration for customer tracking
const STATUS_STEPS = [
  { value: "new", label: "New Enquiry", color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
  { value: "contacted", label: "Contacted", color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  { value: "quoted", label: "Quotation Sent", color: "text-purple-400 bg-purple-500/10 border-purple-500/25" },
  { value: "waiting", label: "Awaiting Conf.", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" },
  { value: "confirmed", label: "Confirmed", color: "text-green-400 bg-green-500/10 border-green-500/25" },
  { value: "delivered", label: "Delivered", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
  { value: "completed", label: "Completed", color: "text-teal-400 bg-teal-500/10 border-teal-500/25" },
  { value: "cancelled", label: "Cancelled", color: "text-red-400 bg-red-500/10 border-red-500/25" },
];

export default function MyBookingsPage() {
  const [phone, setPhone] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searched, setSearched] = useState(false);

  // Chat integration states
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Realtime update listener
  useEffect(() => {
    if (!booking) return;
    const handleRealtime = async () => {
      try {
        const match = await dbHelper.bookings.getByPhoneAndId(phone, bookingId);
        if (match) {
          setBooking(match);
        }
      } catch (err) {}
    };
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, [booking, phone, bookingId]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !booking) return;
    setSendingChat(true);

    try {
      const now = new Date().toISOString();
      const newChat = {
        type: "chat",
        sender: "customer",
        message: chatMessage.trim(),
        timestamp: now
      };

      const updatedTimeline = [...(booking.timeline || []), newChat];
      const updated = await dbHelper.bookings.update(booking.id, {
        timeline: updatedTimeline
      });
      
      setBooking(updated);
      setChatMessage("");
      
      // Dispatch global realtime sync event
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err) {
      alert("Failed to send message.");
    } finally {
      setSendingChat(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !bookingId.trim()) {
      setErrorMsg("Please fill in both Phone Number and Booking ID.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setBooking(null);
    setSearched(true);

    try {
      const match = await dbHelper.bookings.getByPhoneAndId(phone, bookingId);
      if (!match) {
        setErrorMsg("No matching booking found. Please check your Reference ID and Phone Number.");
      } else {
        setBooking(match);
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred during search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (val: string) => {
    return STATUS_STEPS.find((s) => s.value === val) || STATUS_STEPS[0];
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-28 pb-16 overflow-hidden">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-glow-blue" />
              Customer Service Portal
            </span>
            <h1 className="heading-h1">
              Track My <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Bookings.</span>
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-readable-secondary leading-relaxed">
              Enter your phone number and reference ID (`NXB-2026-000123`) to view real-time status history, quotations, and technician messages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Lookup Form */}
            <div className="lg:col-span-4 futuristic-card p-6 rounded-2xl shadow-xl">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Search className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" /> Search Booking
              </h3>

              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="lookup-phone" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    id="lookup-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="lookup-id" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Booking Reference ID *</label>
                  <input
                    id="lookup-id"
                    type="text"
                    required
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. NXB-2026-000001"
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full futuristic-btn-primary flex items-center justify-center gap-2 text-xs font-bold py-3 mt-2 rounded-xl"
                >
                  {loading ? "Searching..." : "Track Booking"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right Display Area */}
            <div className="lg:col-span-8 space-y-6">
              {errorMsg && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400">Search Failed</h4>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {!searched && (
                <div className="text-center py-16 futuristic-card rounded-2xl">
                  <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-xs text-readable-secondary">Enter your credentials on the left to track progress.</p>
                </div>
              )}

              {searched && !booking && !errorMsg && !loading && (
                <div className="text-center py-16 futuristic-card rounded-2xl">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-xs text-readable-secondary">No active details. Please verify your reference ID format.</p>
                </div>
              )}

              {booking && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="futuristic-card p-6 rounded-2xl relative overflow-hidden shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4.5">
                      <div>
                        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{booking.bookingId}</span>
                        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">{booking.productName}</h2>
                      </div>
                      <div>
                        {(() => {
                          const cfg = getStatusConfig(booking.status);
                          return (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase border animate-pulse ${cfg.color}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                              {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 text-xs mt-4.5">
                      <div className="space-y-1.5">
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Client:</span> {booking.customerName}</p>
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Phone:</span> {booking.phone}</p>
                        {booking.email && <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Email:</span> {booking.email}</p>}
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Location:</span> {booking.city}, {booking.state}</p>
                      </div>
                      <div className="space-y-1.5 sm:border-l sm:border-slate-200 dark:sm:border-white/10 sm:pl-4.5">
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Est. Budget:</span> <span className="font-bold text-slate-900 dark:text-white">{booking.budget}</span></p>
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Quantity:</span> {booking.quantity}</p>
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Preference:</span> {booking.preferredContact}</p>
                        <p className="text-readable-secondary"><span className="font-semibold text-slate-900 dark:text-white">Assigned Tech:</span> {booking.assignedTo || "Awaiting assignment"}</p>
                      </div>
                    </div>

                    {booking.message && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white mb-1">Your Message/Requirements:</p>
                        <p className="text-readable-secondary leading-relaxed">{booking.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Reply History / Quotations */}
                  {booking.replyMessage && (
                    <div className="futuristic-card p-6 rounded-2xl shadow-xl">
                      <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" /> Official Reply from NexLapTech
                      </h3>
                      <div className="p-4.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white/95 whitespace-pre-line leading-relaxed">
                        {booking.replyMessage}
                      </div>
                      <p className="text-[10px] text-readable-secondary mt-3">
                        Replied by <strong className="text-slate-900 dark:text-white">{booking.replyBy || "Sales Desk"}</strong> on {new Date(booking.replyDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}

                  {/* Live Chat Discussion */}
                  <div className="futuristic-card p-6 rounded-2xl flex flex-col h-[380px] shadow-xl">
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" /> Live Support Discussion
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin p-1">
                      {(() => {
                        const chats = booking.timeline?.filter((t: any) => t.type === "chat") || [];
                        if (chats.length === 0) {
                          return (
                            <div className="text-center py-16 space-y-1">
                              <p className="text-xs text-readable-secondary">No message history yet.</p>
                              <p className="text-[10px] text-readable-muted">Type a message below to start two-way chat with NexLapTech technical support.</p>
                            </div>
                          );
                        }
                        return chats.map((msg: any, idx: number) => {
                          const isAdmin = msg.sender === "admin";
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col max-w-[80%] ${
                                isAdmin ? "mr-auto items-start" : "ml-auto items-end"
                              }`}
                            >
                              <div
                                className={`p-3.5 rounded-2xl text-xs leading-relaxed text-left ${
                                  isAdmin
                                    ? "bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-tl-none text-slate-900 dark:text-white/95"
                                    : "bg-cyan-600 rounded-tr-none text-white font-medium"
                                }`}
                              >
                                {msg.message}
                              </div>
                              <span className="text-[9px] text-readable-muted mt-1">
                                {isAdmin ? "NexLapTech Support" : "You"} •{" "}
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <form onSubmit={handleSendChat} className="mt-3 p-2 border-t border-slate-200 dark:border-white/5 flex gap-2 shrink-0">
                      <input
                        type="text"
                        required
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type a message to technical support..."
                        className="futuristic-input flex-1 rounded-xl px-3.5 py-2.5 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={sendingChat || !chatMessage.trim()}
                        className="futuristic-btn-accent disabled:opacity-50 h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                  {/* Milestones / Status History */}
                  <div className="futuristic-card p-6 rounded-2xl shadow-xl">
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" /> Status Timeline
                    </h3>
                    
                    <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10 pl-1.5">
                      {booking.timeline && booking.timeline.filter((step: any) => step.type !== "chat").map((step: any, idx: number) => (
                        <div key={idx} className="flex gap-4.5 items-start relative">
                          <div className="h-7.5 w-7.5 rounded-full bg-slate-100 dark:bg-[#0B0718] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 z-10 shadow">
                            <span className="h-2 w-2 rounded-full bg-cyan-500" />
                          </div>
                          <div className="flex-1 min-w-0 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                            <div className="flex justify-between items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white capitalize">{step.status}</h4>
                              <span className="text-[9px] text-readable-muted shrink-0">
                                {new Date(step.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {step.message && (
                              <p className="text-[10px] text-readable-secondary mt-1 leading-relaxed">{step.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="text-center p-6 futuristic-card rounded-2xl shadow-xl">
                    <p className="text-xs text-readable-secondary mb-4">Need immediate support or custom details? Contact our technician directly.</p>
                    <a
                      href={`tel:${business.phoneLinks[0]}`}
                      className="futuristic-btn-primary items-center gap-1.5 inline-flex text-xs rounded-xl py-2.5 px-5 font-bold"
                    >
                      <MessageCircle className="h-4 w-4" /> Call Support Desk
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
