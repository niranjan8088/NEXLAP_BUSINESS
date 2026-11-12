import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeText, getFingerprint, checkRateLimit } from "@/lib/security";
import { dbHelper } from "@/lib/dbHelper";

// GET /api/reviews - Fetch approved genuine customer reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ratingStr = searchParams.get("rating");
    const sort = searchParams.get("sort") || "newest";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    let allApprovedReviews: any[] = [];

    // 1. Fetch from Supabase if configured and available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("status", "approved");

        if (!error && Array.isArray(data)) {
          allApprovedReviews = data;
        }
      } catch (err) {
        console.warn("Supabase review fetch failed, falling back to dbHelper:", err);
      }
    }

    // 2. If Supabase returned nothing or wasn't configured, use local genuine records
    if (allApprovedReviews.length === 0) {
      try {
        const rawReviews: any[] = await dbHelper.reviews.list();
        allApprovedReviews = (rawReviews || []).filter((r: any) => r.status === "approved");
      } catch (err) {
        console.error("dbHelper review fetch error:", err);
        allApprovedReviews = [];
      }
    }

    // 3. Compute Authoritative Statistics from ALL Approved Genuine Reviews
    const totalCount = allApprovedReviews.length;
    const averageRating =
      totalCount > 0
        ? parseFloat(
            (
              allApprovedReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) /
              totalCount
            ).toFixed(1)
          )
        : 0;

    // 4. Filter by Rating if requested
    let filtered = [...allApprovedReviews];
    if (ratingStr) {
      const ratingVal = parseInt(ratingStr, 10);
      if (!isNaN(ratingVal)) {
        filtered = filtered.filter((r) => Math.round(Number(r.rating) || 0) === ratingVal);
      }
    }

    // 5. Sort Reviews
    if (sort === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
    } else if (sort === "highest_rated") {
      filtered.sort(
        (a, b) =>
          (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else {
      // Default: newest first
      filtered.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    // 6. Paginate and Project ONLY Public-Safe Fields (Strip customer private phone/email/IP)
    const paginated = filtered.slice(offset, offset + limit).map((r: any) => ({
      id: String(r.id),
      customer_name: r.customer_name || r.customerName || "Customer",
      city: r.city || "Karnataka",
      service_used: r.service_used || null,
      product_purchased: r.product_purchased || null,
      product_id: r.product_id || null,
      overall_experience: r.overall_experience || null,
      rating: Number(r.rating) || 0,
      review_message: r.review_message || r.review || "",
      recommend: r.recommend !== false,
      image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
      verified: r.verified === true,
      featured: r.featured === true,
      likes_count: Number(r.likes_count) || 0,
      helpful_count: Number(r.helpful_count) || 0,
      admin_reply: r.admin_reply || null,
      admin_reply_at: r.admin_reply_at || null,
      created_at: r.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      reviews: paginated,
      totalCount,
      filteredCount: filtered.length,
      averageRating,
    });
  } catch (error: any) {
    console.error("Failed to fetch public reviews:", error);
    return NextResponse.json({
      reviews: [],
      totalCount: 0,
      filteredCount: 0,
      averageRating: 0,
    });
  }
}

// POST /api/reviews - Submit a new customer review (Strict Validation & Duplicate Prevention)
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";
  const fingerprint = getFingerprint(ip, userAgent);

  // 1. Rate Limit Check (max 5 requests per minute per IP)
  if (!checkRateLimit(ip, 5, 60000)) {
    return NextResponse.json(
      { error: "Too many review submissions from your IP. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  // 2. Parse Body (supports multipart/form-data or json)
  let body: any = {};
  const imageFiles: File[] = [];

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      body.customer_name = formData.get("customer_name") as string;
      body.customer_id = formData.get("customer_id") as string;
      body.phone = formData.get("phone") as string;
      body.email = formData.get("email") as string;
      body.city = formData.get("city") as string;
      body.service_used = formData.get("service_used") as string;
      body.product_purchased = formData.get("product_purchased") as string;
      body.product_id = formData.get("product_id") as string;
      body.order_id = formData.get("order_id") as string;
      body.booking_id = formData.get("booking_id") as string;
      body.overall_experience = formData.get("overall_experience") as string;
      body.rating = parseInt(formData.get("rating") as string, 10);
      body.review_message = formData.get("review_message") as string;
      body.recommend = formData.get("recommend") === "true";
      body.honeypot = formData.get("honeypot") as string; // Bot honeypot

      for (let i = 0; i < 3; i++) {
        const file = formData.get(`image_${i}`) as File;
        if (file && file.size > 0) {
          imageFiles.push(file);
        }
      }
    } catch {
      return NextResponse.json({ error: "Failed to parse form submission data." }, { status: 400 });
    }
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Failed to parse JSON body." }, { status: 400 });
    }
  }

  // 3. Honeypot check (silently drop bot submissions)
  if (body.honeypot) {
    return NextResponse.json({
      success: true,
      message: "Your review has been submitted for moderation.",
    });
  }

  // 4. Strict Validation & XSS Sanitization
  const customer_name = sanitizeText(body.customer_name?.trim() || body.customerName?.trim() || "");
  const customer_id = sanitizeText(body.customer_id?.trim() || "");
  const phone = sanitizeText(body.phone?.trim() || "");
  const email = sanitizeText(body.email?.trim().toLowerCase() || "");
  const city = sanitizeText(body.city?.trim() || "");
  const service_used = sanitizeText(body.service_used?.trim() || body.service?.trim() || "");
  const product_purchased = sanitizeText(body.product_purchased?.trim() || "");
  const product_id = sanitizeText(body.product_id?.trim() || "");
  const order_id = sanitizeText(body.order_id?.trim() || "");
  const booking_id = sanitizeText(body.booking_id?.trim() || "");
  const overall_experience = sanitizeText(body.overall_experience?.trim() || "");
  const review_message = sanitizeText(body.review_message?.trim() || body.review?.trim() || "");
  const rawRating = Number(body.rating);
  const rating = Math.floor(rawRating);
  const recommend = body.recommend !== false;

  if (!customer_name || customer_name.length < 2) {
    return NextResponse.json(
      { error: "A valid customer name is required (minimum 2 characters)." },
      { status: 400 }
    );
  }
  if (!city || city.length < 2) {
    return NextResponse.json(
      { error: "City location is required (minimum 2 characters)." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Star rating must be an integer between 1 and 5." },
      { status: 400 }
    );
  }
  if (!review_message || review_message.length < 5) {
    return NextResponse.json(
      { error: "Review feedback message is required (minimum 5 characters)." },
      { status: 400 }
    );
  }
  if (review_message.length > 2000) {
    return NextResponse.json(
      { error: "Review message exceeds maximum allowed length of 2000 characters." },
      { status: 400 }
    );
  }

  try {
    // 5. Backend Duplicate Prevention Check
    const existingReviews: any[] = await dbHelper.reviews.list().catch(() => []);

    const now = Date.now();
    const tenMinutesMs = 10 * 60 * 1000;

    const isDuplicate = existingReviews.some((r: any) => {
      // Check A: Same customer submitting duplicate review for the same order, booking, or product
      const sameCustomer =
        (customer_id && r.customer_id === customer_id) ||
        (email && r.email && r.email.toLowerCase() === email) ||
        (phone && r.phone && r.phone === phone);

      if (sameCustomer) {
        if (order_id && r.order_id === order_id) return true;
        if (booking_id && r.booking_id === booking_id) return true;
        if (product_id && r.product_id === product_id) return true;
        if (
          product_purchased &&
          r.product_purchased &&
          r.product_purchased.toLowerCase() === product_purchased.toLowerCase()
        ) {
          return true;
        }
        if (
          service_used &&
          r.service_used &&
          r.service_used.toLowerCase() === service_used.toLowerCase()
        ) {
          return true;
        }
      }

      // Check B: Rapid spam / identical submission from same IP/fingerprint or customer within 10 mins
      const isRecent = now - new Date(r.created_at || 0).getTime() < tenMinutesMs;
      const sameSubmitter =
        (r.submitter_fingerprint && r.submitter_fingerprint === fingerprint) || sameCustomer;
      const sameContent =
        (r.review_message || "").trim().toLowerCase() === review_message.toLowerCase();

      if (isRecent && sameSubmitter && sameContent) {
        return true;
      }

      return false;
    });

    if (isDuplicate) {
      return NextResponse.json(
        {
          error:
            "A review for this purchase/service has already been submitted. Multiple submissions for the same item are not allowed.",
        },
        { status: 409 }
      );
    }

    // 6. Verify Purchase / Service Eligibility against real DB orders and bookings
    let isVerifiedPurchase = false;
    let verifiedSource = "public_form";

    try {
      const allOrders: any[] = await dbHelper.orders.list().catch(() => []);
      const allBookings: any[] = await dbHelper.bookings.list().catch(() => []);

      const matchingOrder = allOrders.find((ord: any) => {
        const matchesCustomer =
          (email && ord.customer_email && ord.customer_email.toLowerCase() === email) ||
          (phone && ord.customer_phone && ord.customer_phone === phone) ||
          (customer_id && ord.customer_id === customer_id);

        if (!matchesCustomer) return false;
        if (order_id && ord.id === order_id) return true;
        if (product_id && Array.isArray(ord.items)) {
          return ord.items.some((i: any) => i.id === product_id || i.product_id === product_id);
        }
        return true;
      });

      const matchingBooking = allBookings.find((b: any) => {
        const matchesCustomer =
          (email && b.email && b.email.toLowerCase() === email) ||
          (phone && b.phone && b.phone === phone);

        if (!matchesCustomer) return false;
        if (booking_id && b.id === booking_id) return true;
        return true;
      });

      if (matchingOrder) {
        isVerifiedPurchase = true;
        verifiedSource = "purchase";
      } else if (matchingBooking) {
        isVerifiedPurchase = true;
        verifiedSource = "service_booking";
      }
    } catch (verErr) {
      console.warn("Could not check purchase verification:", verErr);
    }

    // 7. Handle Image Uploads (if Supabase Storage available)
    const image_urls: string[] = [];
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && imageFiles.length > 0) {
      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `review-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabaseAdmin.storage
          .from("review-images")
          .upload(fileName, buffer, { contentType: file.type, upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("review-images")
            .getPublicUrl(fileName);
          image_urls.push(urlData.publicUrl);
        }
      }
    }

    // 8. Construct Review Record (Status strictly starts as "pending")
    const newReview = {
      customer_name,
      customer_id: customer_id || null,
      phone: phone || null,
      email: email || null,
      city,
      service_used: service_used || null,
      product_purchased: product_purchased || null,
      product_id: product_id || null,
      order_id: order_id || null,
      booking_id: booking_id || null,
      overall_experience: overall_experience || null,
      rating,
      review_message,
      recommend,
      image_urls,
      status: "pending", // Strictly pending until admin moderates
      verified: isVerifiedPurchase,
      featured: false,
      source: verifiedSource,
      submitter_fingerprint: fingerprint,
      likes_count: 0,
      helpful_count: 0,
      admin_reply: null,
      admin_reply_at: null,
      created_at: new Date().toISOString(),
    };

    const saved = await dbHelper.reviews.create(newReview);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your genuine review has been submitted for moderation.",
        review: {
          id: saved.id,
          status: saved.status,
          verified: saved.verified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting customer review:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}
