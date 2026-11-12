import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive Business Analytics & BI Dashboard | NEXLAPTECH Admin",
  description: "Real-time revenue intelligence, order volume, service fulfillment metrics, customer growth, and hardware sales analytics for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/analytics",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

