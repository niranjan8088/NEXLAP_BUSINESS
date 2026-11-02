"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { services } from "@/lib/data";
import { Calendar, User, Phone, Mail, Clock, MessageSquare, CheckCircle, Star } from "lucide-react";
import StarRating from "@/components/ui/StarRating";

export default function BookServicePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceName, setServiceName] = useState(services[0]?.title || "Laptop Repair");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("10:30 AM");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState("");

  // Rating Feedback popup embedded inside success screen
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !date) return;
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          email,
          address,
          city,
          service_name: serviceName,
          requestType: "service",
          preferredDate: date,
          preferredTime: timeSlot,
          description: notes,
          state: "Karnataka",
        }),
      });

      if (res.status === 401) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/customer/signin?next=${encodeURIComponent(next)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit service booking.");
      }

      setCreatedBookingId(data.bookingId);
      setBookingSuccess(true);
    } catch (err) {
      console.error("Service booking submission failed.", err);
      alert(err instanceof Error ? err.message : "Failed to submit service booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;
    setSubmittingReview(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          email,
          city,
          serviceUsed: serviceName,
          overallExperience: comment,
          rating,
          reviewMessage: comment,
          recommend: rating >= 4,
          source: "post_service_popup"
        })
      });

      if (res.ok) {
        setReviewSuccess(true);
      } else {
        alert("Failed to save review. Thank you for your feedback anyway!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
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
              Instant IT Scheduling
            </span>
            <h1 className="heading-h1">
              Book a <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Service.</span>
            </h1>
            <p className="mt-3 text-sm text-readable-secondary leading-relaxed">
              Schedule diagnostics, operating system installations, networking setup, or motherboard-level repairs in Bengaluru &amp; Tumkur service centers.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {bookingSuccess ? (
              <div className="futuristic-card p-8 rounded-3xl text-center space-y-6 shadow-xl">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Booking Confirmed!</h3>
                  <p className="text-xs text-readable-secondary mt-1.5 leading-relaxed">
                    Your request has been saved in our database. Reference ID is:
                  </p>
                  <div className="mt-3.5 inline-block rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {createdBookingId}
                  </div>
                </div>

                {/* Rating Feedback embedded */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-6 text-left">
                  {reviewSuccess ? (
                    <div className="text-center py-4 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      Thank you! Your feedback review has been submitted for approval.
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400" /> Rate Our Booking Experience
                      </h4>
                      
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-readable-secondary">Your Rating:</span>
                        <StarRating rating={rating} onChange={setRating} size="md" />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="bk-city" className="text-[10px] text-readable-secondary uppercase font-semibold">Your Location City</label>
                        <input
                          id="bk-city"
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Tumkur"
                          className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="bk-feedback" className="text-[10px] text-readable-secondary uppercase font-semibold">Experience Comment</label>
                        <textarea
                          id="bk-feedback"
                          required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Tell us what you liked about booking or service options..."
                          rows={3}
                          className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="futuristic-btn-primary w-full text-center text-xs py-2.5 rounded-xl font-bold"
                      >
                        {submittingReview ? "Submitting review..." : "Submit Review & Exit"}
                      </button>
                    </form>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setName("");
                      setPhone("");
                      setEmail("");
                      setNotes("");
                    }}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold"
                  >
                    Schedule another service
                  </button>
                </div>
              </div>
            ) : (
              <div className="futuristic-card p-6 md:p-8 rounded-2xl shadow-xl">
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  {/* Name */}
                  <div className="space-y-1">
                    <label htmlFor="bk-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Name *
                    </label>
                    <input
                      id="bk-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Phone */}
                    <div className="space-y-1">
                      <label htmlFor="bk-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Phone *
                      </label>
                      <input
                        id="bk-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 8088979706"
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label htmlFor="bk-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Email (optional)
                      </label>
                      <input
                        id="bk-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. ramesh@gmail.com"
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* Service selection */}
                  <div className="space-y-1">
                    <label htmlFor="bk-srv" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service Category</label>
                    <select
                      id="bk-srv"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0B0718]"
                    >
                      {services.map((srv, idx) => {
                        const startPrices = [1200, 1500, 800, 600, 500, 1800, 3500, 1000, 2500, 6500, 8500, 4500, 950, 1200, 1500];
                        const price = startPrices[idx % startPrices.length];
                        return (
                          <option key={srv.id} value={srv.title} className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">
                            {srv.title} — from ₹{price.toLocaleString("en-IN")}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Address & City */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="bk-address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Service Location / Address
                      </label>
                      <input
                        id="bk-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 12th Cross, MG Road"
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="bk-city-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        City
                      </label>
                      <input
                        id="bk-city-input"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bengaluru or Tumkur"
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Booking Date */}
                    <div className="space-y-1">
                      <label htmlFor="bk-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Preferred Date *
                      </label>
                      <input
                        id="bk-date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>

                    {/* Time Slot */}
                    <div className="space-y-1">
                      <label htmlFor="bk-time" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Preferred Time Slot
                      </label>
                      <select
                        id="bk-time"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0B0718]"
                      >
                        <option value="09:30 AM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">09:30 AM</option>
                        <option value="10:30 AM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">10:30 AM</option>
                        <option value="11:30 AM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">11:30 AM</option>
                        <option value="01:30 PM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">01:30 PM</option>
                        <option value="02:30 PM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">02:30 PM</option>
                        <option value="03:30 PM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">03:30 PM</option>
                        <option value="04:30 PM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">04:30 PM</option>
                        <option value="05:30 PM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">05:30 PM</option>
                        <option value="06:30 PM" className="bg-white dark:bg-[#0B0718] text-slate-900 dark:text-white">06:30 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label htmlFor="bk-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fault Description / Special Instructions</label>
                    <textarea
                      id="bk-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Laptop keeps rebooting automatically, or need doorstep collection..."
                      rows={3}
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="futuristic-btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      {loading ? "Scheduling service..." : "Confirm Booking Instantly"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
