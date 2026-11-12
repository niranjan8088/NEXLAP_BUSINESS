import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | NEXLAPTECH",
  description: "Sign in to NEXLAPTECH Customer Account, Reseller Portal, or Quantum Command Admin Console.",
  alternates: {
    canonical: "https://nexlaptech.in/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

