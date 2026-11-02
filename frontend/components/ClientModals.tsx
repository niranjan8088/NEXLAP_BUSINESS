"use client";

import { useEffect, useState } from "react";
import BookServiceReviewModal from "@/components/BookServiceReviewModal";
import UnifiedBookingModal from "@/components/UnifiedBookingModal";
import EnrollmentModal from "@/components/EnrollmentModal";
import CartDrawer from "@/components/CartDrawer";

export default function ClientModals() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <BookServiceReviewModal />
      <UnifiedBookingModal />
      <EnrollmentModal />
      <CartDrawer />
    </>
  );
}
