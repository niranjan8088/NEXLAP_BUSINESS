import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Billing & Tax Invoices | NEXLAPTECH",
  description: "Enterprise billing, GST invoices, and financial transaction settlements for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/billing",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

