"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { business } from "@/lib/data";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Download,
  Building,
  ChevronRight,
  MessageCircle,
  User,
  Send,
  CheckCircle2,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDownloadProfile = () => {
    // Generate a simple company profile blob and trigger download
    const docText = `NEXLAPTECH COMPANY PROFILE
=======================================
Premium Technology Platform, Computer Sales & Services

SERVICES OFFERED:
- Board-level Laptop & Desktop Repair
- Annual Maintenance Contracts (AMC)
- CCTV Security System Setup
- WiFi Networking & LAN Routing
- Data Recovery & Cloud Backups
- Website & Android App Development

ACADEMY PROGRAMS:
- 4-Week Practical Desktop Repair Training
- IEEE Mini & Major Project Internships

LOCATIONS:
1. Bengaluru Head Office:
   Padmanabhanagar, Bengaluru, Karnataka
2. Tumkur Branch:
   Upparahalli, Tumkur, 572101
3. Hiriyur Branch:
   Karnataka (Opening Soon)

CONTACT CHANNELS:
- Phones: 8088979706 / 8904760125
- Email: nexbytetechnologies@gmail.com
- WhatsApp: https://wa.me/918088979706
- WhatsApp Channel: https://whatsapp.com/channel/0029Vb5jdLWL7UVVMBX23s2d

Trusted · Reliable · Affordable`;

    const blob = new Blob([docText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "NexLapTech_Company_Profile.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await safeJsonFetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          subject: subject || "No Subject",
          message,
          status: "unread",
        }),
      });

      if (res.status === 401) {
        const next = `${window.location.pathname}${window.location.search}`;
        router.push(`/customer/signin?next=${encodeURIComponent(next)}`);
        return;
      }
      
      if (!res.ok || !res.data?.success) throw new Error(res.error || "Failed to send message.");
      
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
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
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-glow-blue" />
              Direct Support Channels
            </span>
            <h1 className="heading-h1">
              Contact &amp; <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">Support.</span>
            </h1>
            <p className="mt-4 text-base text-readable-secondary leading-relaxed">
              Reach out to our customer care team, visit one of our physical service centers, or download our company profile to learn about our B2B corporate capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
            {/* Left Column: Branch Details & Contact links */}
            <div className="lg:col-span-5 space-y-6">
              {/* Core contacts card */}
              <div className="futuristic-card p-6 rounded-2xl shadow-xl">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <Building className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" /> NexLapTech Support Desk
                </h3>
                
                <div className="space-y-4 text-xs">
                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Phone Lines</h4>
                      <p className="text-readable-secondary mt-1">
                        <a href="tel:+918088979706" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">8088979706</a> / <a href="tel:+918904760125" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">8904760125</a>
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Email Support</h4>
                      <p className="text-readable-secondary mt-1">
                        <a href={`mailto:${business.email}`} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{business.email}</a>
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Business Hours</h4>
                      <p className="text-readable-secondary mt-1">Mon - Sat: 9:30 AM - 8:30 PM<br />Sun: 10:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                  <button
                    onClick={handleDownloadProfile}
                    className="w-full futuristic-btn-primary flex items-center justify-center gap-2 text-xs py-3 rounded-xl font-bold"
                  >
                    <Download className="h-4 w-4" /> Download Company Profile
                  </button>
                </div>
              </div>

              {/* Branch Addresses */}
              <div className="futuristic-card p-6 rounded-2xl space-y-6 shadow-xl">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Our Service Centers</h3>

                {/* Bengaluru */}
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Bengaluru Branch (Head Office)
                  </h4>
                  <p className="text-readable-secondary leading-relaxed pl-5">
                    Padmanabhanagar, Bengaluru, Karnataka
                  </p>
                </div>

                {/* Tumkur */}
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Tumkur Branch
                  </h4>
                  <p className="text-readable-secondary leading-relaxed pl-5">
                    Upparahalli, Tumkur – 572101
                  </p>
                </div>

                {/* Hiriyur */}
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-white/40" /> Hiriyur Branch
                  </h4>
                  <p className="text-readable-secondary leading-relaxed pl-5 italic flex items-center gap-1">
                    Opening Soon in Hiriyur, Karnataka
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold">Soon</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form and Maps */}
            <div className="lg:col-span-7 space-y-6">
              {/* Premium Contact Form Card */}
              <div className="futuristic-card p-6 md:p-8 rounded-2xl shadow-xl">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" /> Send Us a Message
                </h3>

                {success ? (
                  <div className="text-center py-6 space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                    <div>
                      <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h4>
                      <p className="text-xs text-readable-secondary mt-1 leading-relaxed">
                        Thank you for reaching out. We have logged your request and our support desk will contact you shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    {errorMsg && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-600 dark:text-red-400">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label htmlFor="contact-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name *</label>
                        <input
                          id="contact-name"
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
                        <label htmlFor="contact-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div className="space-y-1">
                        <label htmlFor="contact-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. ramesh@gmail.com"
                          className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-1">
                        <label htmlFor="contact-subject" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                        <input
                          id="contact-subject"
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Corporate Service Contract"
                          className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <label htmlFor="contact-msg" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your Message *</label>
                      <textarea
                        id="contact-msg"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what you need help with..."
                        rows={4}
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full futuristic-btn-primary flex items-center justify-center gap-2 text-xs font-bold py-3.5 rounded-xl"
                      >
                        {loading ? "Sending Message..." : (
                          <>
                            <Send className="h-4 w-4" /> Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Bengaluru Map */}
              <div className="glass-card p-4 bg-nex-ink border border-white/5 rounded-2xl">
                <h4 className="font-display text-xs font-bold text-white mb-3">Google Map: Bengaluru Head Office</h4>
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.752327429188!2d77.5442111!3d12.9086333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3ffcdd1a04d5%3A0xc39f8263f9cfb82d!2sUttarahalli%20Main%20Rd%2C%20Uttarahalli%20Hobli%2C%20Bengaluru%2C%20Karnataka%20560070!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {/* Tumkur Map */}
              <div className="glass-card p-4 bg-nex-ink border border-white/5 rounded-2xl">
                <h4 className="font-display text-xs font-bold text-white mb-3">Google Map: Tumkur Branch</h4>
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3877.925761358999!2d77.1084222!3d13.3323111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb02c2e00000001%3A0x600c000000000000!2sUpparahalli%2C%20Tumakuru%2C%20Karnataka%20572101!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Channel CTA */}
          <div className="text-center glass-panel p-10 rounded-3xl border border-white/5 bg-nex-ink max-w-2xl mx-auto">
            <h3 className="font-display text-2xl font-bold text-white">Join Our WhatsApp Channel</h3>
            <p className="mt-3 text-xs text-nex-mist leading-relaxed">
              Scan our WhatsApp Channel QR code from the homepage or click below to join directly and get instant service news.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href={business.whatsappChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" /> Open WhatsApp Channel
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
