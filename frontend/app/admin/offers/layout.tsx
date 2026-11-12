import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Promotional Offers & Discounts | NEXLAPTECH",
  description: "Enterprise offer management, referral codes, and promotional flyer campaigns for NEXLAPTECH.",
  alternates: {
    canonical: "https://nexlaptech.in/admin/offers",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

