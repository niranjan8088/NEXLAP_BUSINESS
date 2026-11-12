import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT Services & Diagnostics Management | NEXLAPTECH Admin",
  description: "Enterprise IT services catalog, technician assignment pipeline, hardware diagnostic tracking, and AMC service bookings for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/services",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

