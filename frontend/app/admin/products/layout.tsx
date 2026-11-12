import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Product Catalog & Inventory | NEXLAPTECH",
  description: "Enterprise product catalog management, multi-variant inventory, bulk supplies, and pricing controls for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/products",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

