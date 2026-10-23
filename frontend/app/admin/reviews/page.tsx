import type { Metadata } from "next";
import { dbHelper } from "@/lib/dbHelper";
import AdminReviewsContainer from "@/components/AdminReviewsContainer";

export const metadata: Metadata = {
  title: "Admin Reviews Feed | NEXLAPTECH Console",
  robots: "noindex, nofollow",
};


async function getAllReviews() {
  try {
    const reviews = await dbHelper.reviews.list();
    return reviews || [];
  } catch (error) {
    console.error("Failed to load admin reviews:", error);
    return [];
  }
}

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return <AdminReviewsContainer initialReviews={reviews} />;
}

