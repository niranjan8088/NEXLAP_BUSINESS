"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Mail, MapPin, Phone, Instagram } from "lucide-react";
import { business } from "@/lib/data";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative border-t border-slate-200 dark:border-white/10 bg-slate-900 dark:bg-[#070B1A] pt-14 pb-10 text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl px-6 sm:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <div className="h-12 w-48 rounded bg-white p-1.5 shadow-sm">
              <BrandLogo variant="horizontal" width={1200} height={300} sizes="192px" className="h-full w-full" />
            </div>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-cyan-400">
              {business.tagline}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Simple, fast computer sales, repair &amp; IT services for businesses and individuals.
            </p>
            <a
              href={business.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <Instagram className="h-4 w-4" />
              {business.instagramHandle}
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-100 dark:text-slate-200">
              Quick Links
            </h4>
            <ul className="mt-3.5 flex flex-col gap-2 text-xs text-slate-300">
              <li><Link href="/" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Shop Hardware</Link></li>
              <li><Link href="/services" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Services &amp; Repairs</Link></li>
              <li><Link href="/customer/requests" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">My Requests / Track</Link></li>
              <li><Link href="/offers" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Active Offers</Link></li>
            </ul>
          </div>

          {/* Customer Links */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-100 dark:text-slate-200">
              Customer Support
            </h4>
            <ul className="mt-3.5 flex flex-col gap-2 text-xs text-slate-300">
              <li><Link href="/contact" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Get Help &amp; Contact</Link></li>
              <li><Link href="/training" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Training Programs</Link></li>
              <li><Link href="/internship" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Internships</Link></li>
              <li><Link href="/reviews" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Customer Reviews</Link></li>
              <li><Link href="/verify" className="hover:text-indigo-400 dark:hover:text-cyan-400 transition-colors">Verify Certificate</Link></li>
            </ul>
          </div>

          {/* Contact & Service Areas */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-100 dark:text-slate-200">
              Contact &amp; Service Areas
            </h4>
            <ul className="mt-3.5 flex flex-col gap-2.5 text-xs text-slate-300">
              {business.phones.map((phone, i) => (
                <li key={phone}>
                  <a
                    href={`tel:${business.phoneLinks[i]}`}
                    className="inline-flex items-center gap-2 font-medium hover:text-cyan-400 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-cyan-400" /> {phone}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-2 font-medium hover:text-cyan-400 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-cyan-400" /> {business.email}
                </a>
              </li>
              <li className="pt-2 border-t border-white/10">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <div>
                    <span className="font-bold text-slate-100 block">Service Hubs:</span>
                    <span className="font-medium text-cyan-300">
                      Padmanabhanagar, Bengaluru | Tumkur (572102) | Hiriyur
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {year || 2026} NEXLAPTECH. Enterprise Hardware &amp; IT Solutions. All rights reserved.</p>
          <p className="font-medium">GSTIN: 29ABCDE1234F1Z5 • Tumkur Origin Hub: 572102</p>
        </div>
      </div>
    </footer>
  );
}
