import { dbHelper } from "@/lib/dbHelper";
import AdminReviewsContainer from "@/components/AdminReviewsContainer";

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
