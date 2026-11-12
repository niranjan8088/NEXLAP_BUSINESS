import type { Metadata } from "next";
import { cookies } from "next/headers";
import MarketplaceHome from "@/components/MarketplaceHome";
import { dbHelper } from "@/lib/dbHelper";
import { getSafeImageSrc } from "@/lib/utils";
import type { Product } from "@/lib/data";

export const metadata: Metadata = {
  title: "NEXLAPTECH | Laptops, Components & Accessories",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  const resellerSession = cookieStore.get("nexbyte_reseller_session")?.value;
  const userSession = cookieStore.get("nexbyte_customer_session")?.value;

  let initialProducts: Product[] = [];
  let initialSettings: any = null;

  try {
    const [allProducts, fullSettings] = await Promise.all([
      dbHelper.products.list().catch(() => []),
      dbHelper.storeSettings.get().catch(() => null),
    ]);

    const available = (allProducts || []).filter(
      (product: any) => product.status !== "hide" && product.status !== "deleted" && product.status !== "pending"
    );
    initialProducts = available.sort((left: any, right: any) => Number(right.featured) - Number(left.featured));
    initialSettings = fullSettings;
  } catch {
    // Graceful fallback to client fetching
  }

  const lcpHeroImage = initialProducts[0]?.image ? getSafeImageSrc(initialProducts[0].image) : null;

  return (
    <>
      {lcpHeroImage && (
        <link
          rel="preload"
          as="image"
          href={lcpHeroImage}
          type="image/webp"
          // @ts-ignore React 19 / Next 15 fetchPriority attribute
          fetchPriority="high"
        />
      )}
      <MarketplaceHome
        hasAdminSession={Boolean(adminSession)}
        hasResellerSession={Boolean(resellerSession)}
        hasUserSession={Boolean(userSession)}
        initialProducts={initialProducts}
        initialSettings={initialSettings}
      />
    </>
  );
}
