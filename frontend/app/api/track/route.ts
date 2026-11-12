import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchVal = searchParams.get("search");

    if (!searchVal) {
      return NextResponse.json(
        { success: false, message: "Search parameter is required.", error: "Missing search parameter.", code: "VALIDATION_ERROR" },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const cleanSearch = searchVal.trim().toLowerCase();

    // 1. Fetch lists
    const bookings = await dbHelper.bookings.list();
    const enrollments = await dbHelper.enrollments.list();
    const laptopEnquiries = await dbHelper.laptopEnquiries.list();

    // 2. Filter matches
    const matchedBookings = bookings.filter(
      (b: any) =>
        b.bookingId?.toLowerCase() === cleanSearch ||
        b.id?.toLowerCase() === cleanSearch ||
        (b.phone || "").replace(/\D/g, "").includes(cleanSearch.replace(/\D/g, ""))
    );

    const matchedEnrollments = enrollments.filter(
      (e: any) =>
        e.enrollmentId?.toLowerCase() === cleanSearch ||
        e.id?.toLowerCase() === cleanSearch ||
        (e.phone || "").replace(/\D/g, "").includes(cleanSearch.replace(/\D/g, ""))
    );

    const matchedLaptopEnquiries = laptopEnquiries
      .filter(
        (l: any) =>
          l.reference_id?.toLowerCase() === cleanSearch ||
          l.id?.toLowerCase() === cleanSearch ||
          (l.phone || "").replace(/\D/g, "").includes(cleanSearch.replace(/\D/g, ""))
      )
      .map((l: any) => {
        // SECURITY AUDIT HARDENING: Strip internal admin_notes before returning to customer tracking
        const { admin_notes, ...safeData } = l;
        return safeData;
      });

    const internships = await dbHelper.internships.list();
    const matchedInternships = internships
      .filter(
        (i: any) =>
          i.application_id?.toLowerCase() === cleanSearch ||
          i.enrollment_id?.toLowerCase() === cleanSearch ||
          i.certificate_id?.toLowerCase() === cleanSearch ||
          i.id?.toLowerCase() === cleanSearch ||
          (i.phone || "").replace(/\D/g, "").includes(cleanSearch.replace(/\D/g, ""))
      )
      .map((i: any) => {
        // SECURITY AUDIT HARDENING: Strip internal admin_notes before returning to customer tracking
        const { admin_notes, ...safeData } = i;
        return safeData;
      });

    const orders = await dbHelper.orders.list();
    const cleanDigits = cleanSearch.replace(/\D/g, "");
    const stripHash = cleanSearch.replace(/^#/, "");

    const matchedOrders = orders.filter((o: any) => {
      const orderId = (o.order_id || o.order_number || o.id || "").toLowerCase();
      const trk = (o.tracking_number || o.tracking_id || "").toLowerCase();
      const phoneDigits = (o.phone || "").replace(/\D/g, "");
      const email = (o.email || "").toLowerCase();

      return (
        orderId === cleanSearch ||
        orderId === stripHash ||
        (stripHash.length >= 4 && (orderId.includes(stripHash) || stripHash.includes(orderId))) ||
        trk === cleanSearch ||
        trk === stripHash ||
        (stripHash.length >= 4 && trk.includes(stripHash)) ||
        (cleanDigits.length >= 6 && phoneDigits.includes(cleanDigits)) ||
        (cleanSearch.includes("@") && email === cleanSearch)
      );
    });

    // Fallback: direct order lookup if not in cached list
    if (matchedOrders.length === 0 && stripHash) {
      try {
        const directOrder = await dbHelper.orders.getById(stripHash);
        if (directOrder) {
          matchedOrders.push(directOrder);
        }
      } catch {}
    }

    return NextResponse.json(
      {
        success: true,
        results: {
          orders: matchedOrders,
          bookings: matchedBookings,
          enrollments: matchedEnrollments,
          laptopEnquiries: matchedLaptopEnquiries,
          internships: matchedInternships,
        },
      },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to search track requests.", error: error.message, code: "SERVER_ERROR" },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
