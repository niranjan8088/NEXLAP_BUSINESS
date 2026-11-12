import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hardware Inventory & Stock Alerts | NEXLAPTECH Admin",
  description: "Enterprise stock control, warehouse inventory valuation, low-stock alerts, SKU management, and audit tracking for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/inventory",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminInventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

