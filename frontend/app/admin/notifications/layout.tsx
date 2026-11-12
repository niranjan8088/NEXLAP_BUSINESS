import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification Management & Alerts Center | NEXLAPTECH Admin",
  description: "Enterprise notification dispatch, customer communication logs, real-time alerts, and notification template manager for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/notifications",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminNotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

