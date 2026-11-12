import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Directory & CRM | NEXLAPTECH Admin",
  description: "Enterprise CRM directory, customer order history, IT service logs, WhatsApp communication pipeline, and account profile management for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/customers",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminCustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

