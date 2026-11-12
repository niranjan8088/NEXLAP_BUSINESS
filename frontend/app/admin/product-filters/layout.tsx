import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dynamic Product Filters & Specifications | NEXLAPTECH Admin",
  description: "Enterprise catalog filter engine management: category-aware specifications, dynamic option registry, multi-select attributes, and live customer sidebar preview for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/product-filters",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminProductFiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

