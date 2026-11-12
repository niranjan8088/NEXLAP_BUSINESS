import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Reviews Moderation & Satisfaction Feed | NEXLAPTECH Admin",
  description: "Enterprise review moderation console: manage verified customer ratings, approve feedback, handle revision requests, publish official technician replies, and monitor NPS scores.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/reviews",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

