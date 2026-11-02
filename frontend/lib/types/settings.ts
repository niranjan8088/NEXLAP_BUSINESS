/**
 * lib/types/settings.ts
 * Enterprise-grade settings type definitions for NexLapTech.
 * Enforces strict typing for appearance, storefront, customer dashboard layout,
 * product display, background effects, promotional flyers, animations,
 * header/footer navigation, delivery & warranty, customer preferences, notifications,
 * security, general store configuration, and multi-version publishing workflow.
 */

export type ThemeMode = "light" | "dark" | "system";
export type CustomerThemePolicy = "personal" | "forced";
export type FontScale = "sm" | "base" | "lg";
export type InterfaceDensity = "compact" | "comfortable" | "spacious";
export type CardRadius = "none" | "md" | "xl" | "2xl" | "3xl";
export type ButtonStyle = "rounded" | "pill" | "sharp";
export type BackgroundEffect = "none" | "subtle_mesh" | "grid_dots" | "gradient_glow";
export type HeadingFont = "batman" | "space_grotesk" | "plus_jakarta" | "outfit" | "system";
export type BodyFont = "plus_jakarta" | "inter" | "outfit" | "system";

// Category A: Appearance & Themes
export interface AppearanceSettings {
  themeMode: ThemeMode;
  primaryColor: string; // e.g. "#1E5BFF"
  accentColor: string;  // e.g. "#19C3F0"
  customerThemePolicy: CustomerThemePolicy; // 'personal' lets customers choose, 'forced' enforces admin theme
  forcedTheme: "day" | "night";
  fontScale: FontScale;
  interfaceDensity: InterfaceDensity;
  cardRadius: CardRadius;
  buttonStyle: ButtonStyle;
  animationsEnabled: boolean;
  backgroundEffect: BackgroundEffect;
  headingFont?: HeadingFont;
  bodyFont?: BodyFont;
}

// Category B: Storefront & Homepage
export interface StorefrontSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  text: string;
  linkText?: string;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;
  dismissible: boolean;
}

export interface PromoBannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  linkUrl: string;
  imageUrl?: string;
  active: boolean;
}

export interface StorefrontSettings {
  sections: Record<string, StorefrontSectionConfig>;
  announcementBar: AnnouncementBarConfig;
  featuredProducts: {
    maxCount: number;
    categoryFilter?: string;
    title: string;
    subtitle: string;
  };
  heroContent?: {
    headline: string;
    subheadline: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    badgeText: string;
  };
  promoBanners: PromoBannerItem[];
  published: boolean;
  publishedAt?: string;
}

// Category C: Customer Dashboard Layout (Admin Controlled)
export interface CustomerKpiCardConfig {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  icon: string;
  color: string;
}

export interface CustomerQuickActionConfig {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  enabled: boolean;
  order: number;
  badge?: string;
  badgeColor?: string;
}

export interface CustomerDashboardLayoutConfig {
  headline: string;
  subheadline: string;
  showKpiCards: boolean;
  kpiCards: Record<string, CustomerKpiCardConfig>;
  showQuickActions: boolean;
  quickActions: Record<string, CustomerQuickActionConfig>;
  showRecentActivity: boolean;
  showFeaturedHardware: boolean;
  showSupportCard: boolean;
}

// Category D: Product Display
export interface ProductDisplaySettings {
  showStockStatus: boolean;
  showSku: boolean;
  showRatings: boolean;
  showWarrantyBadge: boolean;
  showReplacementBadge: boolean;
  showQuickAddToCart: boolean;
  galleryThumbnailPosition: "bottom" | "left";
  zoomLightboxEnabled: boolean;
  pincodeCheckerEnabled: boolean;
}

// Category E: Website Backgrounds & Visual Effects
export type BackgroundPreset =
  | "solid"
  | "subtle_gradient"
  | "holographic_grid"
  | "tech_dots"
  | "floating_particles"
  | "cyber_lines"
  | "ambient_glow"
  | "custom_media";

export interface BackgroundEffectsSettings {
  preset: BackgroundPreset;
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  opacity: number; // 0.1 to 1.0
  blur: number;    // 0 to 40
  animationSpeed: "slow" | "normal" | "fast" | "static";
  mediaUrl: string;
  mediaType: "image" | "video" | "gif" | "none";
  reducedMotionFallback: "solid" | "subtle_gradient";
}

// Category F: Flyers, Banners & Promotions
export interface PromotionalFlyerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  destinationUrl: string;
  placement: "homepage_hero" | "product_grid" | "customer_dashboard" | "seasonal_modal";
  active: boolean;
  device: "all" | "desktop" | "mobile";
  startDate?: string;
  endDate?: string;
}

export interface FlyersPromotionsSettings {
  flyers: PromotionalFlyerItem[];
  enableHeroFlyerCarousel: boolean;
  enableDashboardPromotions: boolean;
}

// Category G: Animation Controls
export type AnimationPreset = "subtle" | "standard" | "enhanced" | "none";

export interface AnimationsSettings {
  preset: AnimationPreset;
  sectionReveal: boolean;
  cardHoverPhysics: boolean;
  buttonInteractions: boolean;
  backgroundMotion: boolean;
  counterSpeed: "normal" | "fast";
  carouselTransition: "slide" | "fade" | "scale";
  respectReducedMotion: boolean;
}

// Category H: Header, Footer & Navigation
export interface NavigationLinkItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
  isExternal?: boolean;
}

export interface FooterColumnItem {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface NavigationHeaderFooterSettings {
  headerStyle: "standard" | "floating_glass" | "minimal_split";
  stickyHeader: boolean;
  showTopAnnouncement: boolean;
  navLinks: NavigationLinkItem[];
  footerColumns: FooterColumnItem[];
  footerCopyright: string;
  showTrustBadges: boolean;
  showPaymentIcons: boolean;
}

// Category I: Delivery, Replacement & Warranty
export interface CategoryWarrantyOverride {
  category: string;
  warrantyDays: number;
  warrantyText: string;
  replacementDays: number;
}

export interface DeliveryWarrantySettings {
  defaultPickupPincode: string; // default "572102"
  handlingTimeDays: number;     // e.g. 1-2 business days
  deliveryEstimateMinDays: number; // default 3
  deliveryEstimateMaxDays: number; // default 10
  expressDeliveryKarnataka: {
    enabled: boolean;
    minDays: number;
    maxDays: number;
  };
  replacementPolicyDays: number;   // default 7
  replacementPolicyTitle: string;  // "7-Day Replacement Guarantee"
  replacementPolicyDescription: string;
  defaultWarrantyDays: number;     // default 90
  defaultWarrantyTitle: string;    // "90-Day Standard Warranty"
  defaultWarrantyDescription: string;
  categoryOverrides: CategoryWarrantyOverride[];
  serviceabilityRules: {
    standardIndiaServiceable: boolean;
    expressPincodePrefixes: string[]; // ["572", "560", "561", "562"]
  };
}

// Category J: Customer Panel Preferences Defaults (Admin perspective)
export interface CustomerPreferencesDefaults {
  allowCustomerThemeChoice: boolean;
  defaultDensity: InterfaceDensity;
  defaultFontScale: FontScale;
  emailNotificationsEnabled: boolean;
  smsAlertsEnabled: boolean;
}

// Category K: Orders & Notifications
export interface OrdersNotificationsSettings {
  notifyCustomerOrderPlaced: boolean;
  notifyCustomerOrderDispatched: boolean;
  notifyCustomerDeliveryOut: boolean;
  notifyCustomerServiceAssigned: boolean;
  notifyAdminNewOrder: boolean;
  notifyAdminNewEnquiry: boolean;
  notifyAdminLowStock: boolean;
  lowStockThreshold: number;
  adminAlertEmail: string;
  customerSmsEnabled: boolean;
  customerEmailEnabled: boolean;
}

// Category L: Security & Access
export interface SecurityAccessSettings {
  autoLogoutMinutes: number;
  passwordMinLength: number;
  enableAuditLogging: boolean;
  allowCustomerRegistration: boolean;
}

// Category M: General Store Settings
export interface GeneralStoreSettings {
  storeName: string;
  storeTagline: string;
  supportEmail: string;
  supportPhone: string;
  businessLegalName: string;
  gstin: string;
  registeredAddress: string;
  currency: string;
  currencySymbol: string;
  seoTitle: string;
  seoDescription: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
    twitter?: string;
  };
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

// Publishing Workflow & Version History
export interface SettingsVersionSnapshot {
  version: number;
  publishedAt: string;
  publishedBy: {
    email: string;
    name: string;
  };
  summary: string;
  snapshot: any;
}

export interface PublishWorkflowSettings {
  status: "draft" | "published";
  publishedVersion: number;
  draftVersion: number;
  lastPublishedAt?: string;
  lastPublishedBy?: {
    email: string;
    name: string;
  };
}

// Audit Log Entry
export interface SettingsAuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminName: string;
  category: string;
  action: string;
  details: string;
  changedFields?: string[];
}

// Complete Store Settings Document
export interface StoreSettings {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy: {
    email: string;
    name: string;
  };
  appearance: AppearanceSettings;
  storefront: StorefrontSettings;
  customerDashboard: CustomerDashboardLayoutConfig;
  productDisplay: ProductDisplaySettings;
  backgroundEffects: BackgroundEffectsSettings;
  flyersPromotions: FlyersPromotionsSettings;
  animations: AnimationsSettings;
  navigationHeaderFooter: NavigationHeaderFooterSettings;
  deliveryWarranty: DeliveryWarrantySettings;
  customerPreferencesDefaults: CustomerPreferencesDefaults;
  ordersNotifications: OrdersNotificationsSettings;
  securityAccess: SecurityAccessSettings;
  generalStore: GeneralStoreSettings;
  publishWorkflow: PublishWorkflowSettings;
  versionHistory: SettingsVersionSnapshot[];
}

// Authenticated Customer's Scoped Preferences
export interface CustomerPreferences {
  customerId: string;
  theme: "day" | "night" | "system";
  interfaceDensity: InterfaceDensity;
  fontScale: FontScale;
  emailOrderUpdates: boolean;
  smsTechnicianAlerts: boolean;
  marketingEmails: boolean;
  marketingSms: boolean;
  preferredPickupPincode: string;
  updatedAt: string;
}
