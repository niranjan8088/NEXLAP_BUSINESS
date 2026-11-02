import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";

export async function GET() {
  try {
    const fullSettings = await dbHelper.storeSettings.get();

    // Whitelist customer-facing safe properties only
    const publicSettings = {
      appearance: {
        themeMode: fullSettings.appearance.themeMode,
        primaryColor: fullSettings.appearance.primaryColor,
        accentColor: fullSettings.appearance.accentColor,
        customerThemePolicy: fullSettings.appearance.customerThemePolicy,
        forcedTheme: fullSettings.appearance.forcedTheme,
        fontScale: fullSettings.appearance.fontScale,
        interfaceDensity: fullSettings.appearance.interfaceDensity,
        cardRadius: fullSettings.appearance.cardRadius,
        buttonStyle: fullSettings.appearance.buttonStyle,
        animationsEnabled: fullSettings.appearance.animationsEnabled,
        backgroundEffect: fullSettings.appearance.backgroundEffect,
        headingFont: fullSettings.appearance.headingFont || "batman",
        bodyFont: fullSettings.appearance.bodyFont || "plus_jakarta",
      },
      storefront: {
        sections: fullSettings.storefront.sections,
        announcementBar: fullSettings.storefront.announcementBar,
        featuredProducts: fullSettings.storefront.featuredProducts,
        heroContent: fullSettings.storefront.heroContent,
        promoBanners: (fullSettings.storefront.promoBanners || []).filter((b) => b.active),
        published: fullSettings.storefront.published,
      },
      customerDashboard: fullSettings.customerDashboard,
      productDisplay: fullSettings.productDisplay,
      backgroundEffects: fullSettings.backgroundEffects,
      flyersPromotions: {
        flyers: (fullSettings.flyersPromotions?.flyers || []).filter((f) => f.active),
        enableHeroFlyerCarousel: fullSettings.flyersPromotions?.enableHeroFlyerCarousel ?? true,
        enableDashboardPromotions: fullSettings.flyersPromotions?.enableDashboardPromotions ?? true,
      },
      animations: fullSettings.animations,
      navigationHeaderFooter: fullSettings.navigationHeaderFooter,
      deliveryWarranty: {
        defaultPickupPincode: fullSettings.deliveryWarranty.defaultPickupPincode,
        handlingTimeDays: fullSettings.deliveryWarranty.handlingTimeDays,
        deliveryEstimateMinDays: fullSettings.deliveryWarranty.deliveryEstimateMinDays,
        deliveryEstimateMaxDays: fullSettings.deliveryWarranty.deliveryEstimateMaxDays,
        expressDeliveryKarnataka: fullSettings.deliveryWarranty.expressDeliveryKarnataka,
        replacementPolicyDays: fullSettings.deliveryWarranty.replacementPolicyDays,
        replacementPolicyTitle: fullSettings.deliveryWarranty.replacementPolicyTitle,
        replacementPolicyDescription: fullSettings.deliveryWarranty.replacementPolicyDescription,
        defaultWarrantyDays: fullSettings.deliveryWarranty.defaultWarrantyDays,
        defaultWarrantyTitle: fullSettings.deliveryWarranty.defaultWarrantyTitle,
        defaultWarrantyDescription: fullSettings.deliveryWarranty.defaultWarrantyDescription,
        categoryOverrides: fullSettings.deliveryWarranty.categoryOverrides,
        serviceabilityRules: fullSettings.deliveryWarranty.serviceabilityRules,
      },
      generalStore: {
        storeName: fullSettings.generalStore.storeName,
        storeTagline: fullSettings.generalStore.storeTagline,
        supportEmail: fullSettings.generalStore.supportEmail,
        supportPhone: fullSettings.generalStore.supportPhone,
        currency: fullSettings.generalStore.currency,
        currencySymbol: fullSettings.generalStore.currencySymbol,
        socialLinks: fullSettings.generalStore.socialLinks,
        maintenanceMode: fullSettings.generalStore.maintenanceMode,
        maintenanceMessage: fullSettings.generalStore.maintenanceMessage,
      },
      version: fullSettings.version,
      updatedAt: fullSettings.updatedAt,
    };

    return NextResponse.json(publicSettings, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to load public store configuration." },
      { status: 500 }
    );
  }
}
