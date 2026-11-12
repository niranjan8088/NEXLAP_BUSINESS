import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive Business Reports & Tax Ledgers | NEXLAPTECH Admin",
  description: "Enterprise sales reports, service repair records, inventory asset valuation, GST tax ledgers, and enquiry performance analytics for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/reports",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

