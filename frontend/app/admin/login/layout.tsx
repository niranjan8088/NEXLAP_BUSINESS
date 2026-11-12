import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Control Panel Login | NEXLAPTECH",
  description: "Secure gateway for NEXLAPTECH authorized administrative operations.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://nexlaptech.in/admin/login",
  },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

