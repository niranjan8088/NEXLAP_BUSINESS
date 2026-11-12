import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Content Management System (CMS) | NEXLAPTECH Admin",
  description: "Enterprise CMS portal to manage homepage copy, SEO metadata, promotional banners, corporate GSTIN identity, and contact channels for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/website-cms",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminWebsiteCMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

