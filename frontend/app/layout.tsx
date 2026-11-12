import type { Metadata, Viewport } from "next";
import "./globals.css";
import { business } from "@/lib/data";
import FloatingButtons from "@/components/FloatingButtons";
import NotificationProvider from "@/components/NotificationProvider";
import ClientModals from "@/components/ClientModals";
import AppExperience from "@/components/AppExperience";
import VisitorTracker from "@/components/VisitorTracker";

import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import localFont from "next/font/local";

const batmanForever = localFont({
  src: [
    {
      path: "../public/fonts/batman/batmfa__.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-batman",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading-fallback",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nexlaptech.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NEXLAPTECH | Laptops, Components & Accessories",
    template: "%s | NEXLAPTECH",
  },
  description: business.description,
  keywords: [
    "NEXLAPTECH",
    "computer store Bengaluru",
    "laptop repair Bengaluru",
    "gaming desktops",
    "business laptops",
    "CCTV installation Bengaluru",
    "custom PC assembly",
    "bulk laptop supply",
    "IT services Padmanabhanagar",
    "second hand laptops Bengaluru",
  ],
  authors: [{ name: "NEXLAPTECH" }],
  creator: "NEXLAPTECH",
  applicationName: "NEXLAPTECH",
  formatDetection: { telephone: true, email: true, address: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "NEXLAPTECH",
    title: "NEXLAPTECH | Laptops, Components & Accessories",
    description: business.description,
    images: [
      {
        url: "/assets/nexlaptech-social-share.png",
        width: 1200,
        height: 630,
        alt: "NEXLAPTECH Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXLAPTECH | Laptops, Components & Accessories",
    description: business.description,
    images: ["/assets/nexlaptech-social-share.png"],
  },
  icons: {
    icon: [
      { url: "/nexlaptech-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/nexlaptech-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/nexlaptech-favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/nexlaptech-android-192.png", sizes: "192x192", type: "image/png" },
      { url: "/nexlaptech-android-512.png", sizes: "512x512", type: "image/png" },
      { url: "/nexlaptech-favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
    ],
    shortcut: "/nexlaptech-favicon.ico",
    apple: "/nexlaptech-apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#1E5BFF",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ElectronicsStore",
  name: business.name,
  image: `${SITE_URL}/assets/nexlaptech-logo.webp`,
  "@id": SITE_URL,
  url: SITE_URL,
  telephone: business.phones[0],
  email: business.email,
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Padmanabhanagar",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560070",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 12.9086,
    longitude: 77.5442,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:30",
      closes: "20:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "10:00",
      closes: "17:00",
    },
  ],
  sameAs: [business.instagram, business.whatsappChannel],
  areaServed: [
    { "@type": "City", name: "Bengaluru" },
    { "@type": "City", name: "Tumkur" },
    { "@type": "City", name: "Hiriyur" },
  ],
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} ${batmanForever.variable}`} data-theme="day" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root { --loader-bg: #0B1F4D; --brand-blue: #1E5BFF; --brand-cyan: #19C3F0; --loader-duration: 1.6s; }
          #nexlap-entry-loader { position: fixed; inset: 0; z-index: 2147483000; display: none; align-items: center; justify-content: center; overflow: hidden; padding: 20px 16px; background: radial-gradient(ellipse at 50% 36%, rgba(30,107,255,.2), transparent 58%), var(--loader-bg); color: #fff; }
          html.nexlap-entry-active #nexlap-entry-loader { display: flex; }
          html.nexlap-entry-active, html.nexlap-entry-active body { overflow: hidden; }
          .nexlap-loader-content { display: flex; width: min(880px,100%); flex-direction: column; align-items: center; gap: clamp(12px,2.4vh,22px); }
          .nexlap-logo-wrap { display: flex; width: 124px; height: 124px; align-items: center; justify-content: center; border-radius: 50%; filter: drop-shadow(0 0 22px rgba(25,211,255,.24)); }
          .nexlap-hardware { display: grid; width: min(760px,100%); grid-template-columns: repeat(5,minmax(0,1fr)); gap: 10px 8px; }
          .nexlap-progress-row { display: flex; width: min(360px,88vw); align-items: center; gap: 10px; }
          .nexlap-progress-track { height: 4px; flex: 1; overflow: hidden; border-radius: 99px; background: rgba(255,255,255,.18); }
          .nexlap-progress-value { width: 100%; height: 100%; transform: scaleX(0); transform-origin: left center; background: linear-gradient(90deg,var(--brand-cyan),var(--brand-blue)); }
          @media (min-width: 640px) { .nexlap-logo-wrap { width: 160px; height: 160px; } .nexlap-hardware { grid-template-columns: repeat(10,minmax(0,1fr)); } }
          @media (prefers-reduced-motion: reduce) { html.nexlap-entry-active #nexlap-entry-loader { background: var(--loader-bg); } html.nexlap-entry-active .nexlap-hardware { display: none; } }
          .nexlap-logo-wrap > span, .nexlap-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
        ` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (!sessionStorage.getItem('nexlap-entry-seen')) {
                    document.documentElement.classList.add('nexlap-entry-active');
                    window.setTimeout(function() {
                      var root = document.documentElement;
                      if (root.classList.contains('nexlap-entry-active')) {
                        root.classList.remove('nexlap-entry-active');
                        try { sessionStorage.setItem('nexlap-entry-seen', '1'); } catch (e) {}
                      }
                    }, 450);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('nexbyte_theme') || localStorage.getItem('nexbyte-theme') || localStorage.getItem('theme');
                  var isDark = saved === 'night' || saved === 'dark';
                  var root = document.documentElement;
                  if (isDark) {
                    root.setAttribute('data-theme', 'night');
                    root.classList.add('dark', 'night');
                    root.classList.remove('light', 'day');
                  } else {
                    root.setAttribute('data-theme', 'day');
                    root.classList.add('light', 'day');
                    root.classList.remove('dark', 'night');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let r of registrations) r.unregister();
                });
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                  });
                }
                navigator.serviceWorker.register('/sw.js');
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <VisitorTracker />
          <NotificationProvider>
            <AppExperience>{children}</AppExperience>
            <FloatingButtons />
            <ClientModals />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
