import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laptop & Tech Enquiries Console | NEXLAPTECH Admin",
  description: "Enterprise lead and laptop enquiry management pipeline, inventory matching, quotations, and order conversion for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/laptop-enquiries",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLaptopEnquiriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

