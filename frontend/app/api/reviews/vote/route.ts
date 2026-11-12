import { NextRequest, NextResponse } from "next/server";
import { getFingerprint, checkRateLimit } from "@/lib/security";
import { supabaseAdmin as dbAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";
  const fingerprint = getFingerprint(ip, userAgent);

  // Rate limit: max 30 votes per minute per IP
  if (!checkRateLimit(ip, 30, 60000)) {
    return NextResponse.json({ error: "Too many votes. Please wait." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { review_id, vote_type } = body;

  if (!review_id) {
    return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
  }
  if (!["like", "helpful"].includes(vote_type)) {
    return NextResponse.json({ error: "Vote type must be 'like' or 'helpful'." }, { status: 400 });
  }

  // If Supabase URL is not configured, update local dbHelper
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { dbHelper } = await import("@/lib/dbHelper");
      const list = await dbHelper.reviews.list();
      const rev = list.find((r: any) => String(r.id) === String(review_id));
      if (!rev) {
        return NextResponse.json({ error: "Review not found." }, { status: 404 });
      }
      const field = vote_type === "like" ? "likes_count" : "helpful_count";
      const newCount = (Number(rev[field]) || 0) + 1;
      await dbHelper.reviews.update(review_id, { [field]: newCount });
      return NextResponse.json({ success: true, count: newCount });
    } catch {
      return NextResponse.json({ success: true, count: 1 });
    }
  }

  try {
    // 1. Insert vote record (unique constraint will catch double voting)
    const { error: insertError } = await dbAdmin
      .from("review_votes")
      .insert({
        review_id,
        voter_fingerprint: fingerprint,
        vote_type,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique violation code
        return NextResponse.json({ error: "You have already voted on this review." }, { status: 409 });
      }
      throw insertError;
    }

    // 2. Fetch and increment review vote count
    const { data: review, error: selectError } = await dbAdmin
      .from("reviews")
      .select("likes_count, helpful_count")
      .eq("id", review_id)
      .single();

    if (selectError) throw selectError;

    const currentCount = review
      ? vote_type === "like"
        ? (review.likes_count || 0)
        : (review.helpful_count || 0)
      : 0;
    const newCount = currentCount + 1;
    const field = vote_type === "like" ? "likes_count" : "helpful_count";

    const { error: updateError } = await dbAdmin
      .from("reviews")
      .update({ [field]: newCount })
      .eq("id", review_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      count: newCount,
    });
  } catch (error: any) {
    console.error("Voting error:", error);
    return NextResponse.json({ error: error.message || "Failed to register vote." }, { status: 500 });
  }
}
