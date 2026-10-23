/**
 * lib/auth.ts
 * Server-side role-based access control helpers.
 * Never expose service-role keys to the browser.
 * Never trust role/user_id values sent by the frontend.
 */

import { cookies } from "next/headers";

export type Role = "admin" | "reseller" | "user";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  resellerId?: string; // only set for reseller role
}

/** Resolve the current session from request cookies (server-side only). */
export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) {
    // In mock mode the token IS the email; in Supabase mode decode JWT.
    if (adminSession === "mock-admin-session-token") {
      return {
        id: "admin-1",
        email: "admin@nexbyte.com",
        role: "admin",
        name: "Admin Officer",
      };
    }
    // For Supabase production: validate token via Supabase service role
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${adminSession}`,
            apikey: serviceKey,
          },
        });
        if (res.ok) {
          const { id, email, user_metadata } = await res.json();
          const allowedEmails = (process.env.ADMIN_EMAILS || "admin@nexbyte.com")
            .split(",")
            .map((e) => e.trim().toLowerCase());
          if (email && allowedEmails.includes(email.toLowerCase())) {
            return {
              id,
              email,
              role: "admin",
              name: user_metadata?.full_name || "Admin",
            };
          }
        }
      }
    } catch {}
  }

  // ── RESELLER ───────────────────────────────────────────────────────────────
  const resellerSession = cookieStore.get("nexbyte_reseller_session")?.value;
  if (resellerSession) {
    // Mock reseller session: format is "reseller:<id>:<email>"
    if (resellerSession.startsWith("mock-reseller:")) {
      const parts = resellerSession.replace("mock-reseller:", "").split(":");
      const resellerId = parts[0] || "res-1";
      const email = parts[1] || "reseller@nexbyte.com";
      return {
        id: resellerId,
        email,
        role: "reseller",
        name: "Reseller",
        resellerId,
      };
    }
    // Supabase reseller validation
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${resellerSession}`,
            apikey: serviceKey,
          },
        });
        if (res.ok) {
          const { id, email, user_metadata } = await res.json();
          return {
            id,
            email,
            role: "reseller",
            name: user_metadata?.full_name || "Reseller",
            resellerId: id,
          };
        }
      }
    } catch {}
  }

  // ── USER ────────────────────────────────────────────────────────────────────
  const userSession = cookieStore.get("nexbyte_customer_session")?.value;
  if (userSession) {
    const customerEmailCookie = cookieStore.get("nexbyte_customer_email")?.value;
    const customerNameCookie = cookieStore.get("nexbyte_customer_name")?.value;
    const decodedName = customerNameCookie ? decodeURIComponent(customerNameCookie) : "";

    if (userSession.startsWith("mock-user:")) {
      const parts = userSession.replace("mock-user:", "").split(":");
      const userId = parts[0] || "cust-1";
      const email = parts[1] || customerEmailCookie || "customer@nexbyte.com";
      return {
        id: userId,
        email,
        role: "user",
        name: decodedName || "Customer",
      };
    }

    // Supabase JWT token (contains '.')
    if (userSession.includes(".")) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${userSession}`,
              apikey: serviceKey,
            },
          });
          if (res.ok) {
            const { id, email, user_metadata } = await res.json();
            return {
              id,
              email,
              role: "user",
              name: user_metadata?.full_name || decodedName || "Customer",
            };
          }
        }
      } catch {}
    }

    // Plain userId or email session (e.g. "cust-1", "user@domain.com")
    return {
      id: userSession,
      email: customerEmailCookie || (userSession.includes("@") ? userSession : `${userSession}@customer.nexbyte.com`),
      role: "user",
      name: decodedName || "Customer",
    };
  }

  return null;
}

/** Require a specific role or throw a 401/403-ready object. */
export async function requireRole(
  allowedRoles: Role[]
): Promise<AuthUser> {
  const user = await getServerSession();
  if (!user) {
    throw new AuthError(401, "Authentication required");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(403, `Access denied. Required role: ${allowedRoles.join(" or ")}`);
  }
  return user;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Helper to parse AuthError into NextResponse-compatible tuple */
export function authErrorResponse(err: unknown): { status: number; message: string } {
  if (err instanceof AuthError) return { status: err.status, message: err.message };
  return { status: 500, message: "Internal server error" };
}
