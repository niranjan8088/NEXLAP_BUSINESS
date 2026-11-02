import { createClient } from "@supabase/supabase-js";
import { products as initialProducts, services as initialServices } from "./data";
import { broadcastServerEvent } from "./realtimeServer";
import { DEFAULT_FILTER_DEFINITIONS } from "./filterEngine";
import { DEFAULT_STORE_SETTINGS, DEFAULT_CUSTOMER_PREFERENCES } from "./data/defaultSettings";
import type { StoreSettings, CustomerPreferences, SettingsAuditLogEntry } from "./types/settings";

function deepMergeSettings<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: any = { ...target };
  if (!source || typeof source !== "object") return result;

  for (const key of Object.keys(source)) {
    const val = (source as any)[key];
    if (val === undefined) continue;

    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMergeSettings(target[key], val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

// In-Memory Query Cache with TTL and Mutation Invalidation
const queryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 25000; // 25 seconds TTL for instant admin transitions

export function getCachedQuery<T>(key: string): T | null {
  const item = queryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    queryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCachedQuery<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): T {
  queryCache.set(key, { data, expiry: Date.now() + ttlMs });
  return data;
}

export function invalidateQueryCache(tablePrefix?: string) {
  if (!tablePrefix) {
    queryCache.clear();
    return;
  }
  const cleanPrefix = tablePrefix.toLowerCase().replace(/_/g, "");
  for (const key of queryCache.keys()) {
    const cleanKey = key.toLowerCase().replace(/_/g, "");
    if (cleanKey.includes(cleanPrefix) || cleanPrefix.includes(cleanKey.split(":")[0])) {
      queryCache.delete(key);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("nexbyte-data-changed", (e: any) => {
    if (e.detail?.table) invalidateQueryCache(e.detail.table);
  });
  // Auto-sync client localStorage mock data (such as products) to the server
  try {
    const savedProducts = localStorage.getItem("nexbyte_products");
    if (savedProducts) {
      const parsed = JSON.parse(savedProducts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fetch("/api/system/sync-mock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "products", data: parsed }),
        }).catch(() => {});
      }
    }
  } catch {}
}

function notifyDataChange(table: string, action: string, data?: any) {
  invalidateQueryCache(table);
  if (typeof window !== "undefined") {
    // 1. Dispatch locally so the immediate tab updates instantly
    window.dispatchEvent(
      new CustomEvent("nexbyte-data-changed", {
        detail: { table, action, data },
      })
    );
    // 2. Push to server to broadcast to other tabs via SSE
    fetch("/api/trigger-realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, action, data }),
    }).catch((err) => console.error("Realtime Trigger Error:", err));
  } else {
    // Broadcast via Server-Sent Events if running natively on the server
    try {
      broadcastServerEvent(table, action, data);
    } catch (e) {
      console.error("SSE Broadcast Error:", e);
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Real Supabase Client
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function normalizeProductRow(row: Record<string, any>) {
  const { original_price, cost_price, images, ...product } = row;
  return {
    ...product,
    images: Array.isArray(images) ? images.map((image, index) => typeof image === "string"
      ? { id: `image-${index + 1}`, url: image, is_primary: index === 0, sort_order: index + 1 }
      : image
    ) : images,
    compareAtPrice: product.compareAtPrice ?? original_price ?? undefined,
    costPrice: product.costPrice ?? cost_price ?? undefined,
  };
}

function toProductDatabaseFields(fields: Record<string, any>) {
  const payload = { ...fields };
  if ("compareAtPrice" in payload) {
    payload.original_price = payload.compareAtPrice;
    delete payload.compareAtPrice;
  }
  if ("costPrice" in payload) {
    payload.cost_price = payload.costPrice;
    delete payload.costPrice;
  }
  if (Array.isArray(payload.images)) {
    payload.images = payload.images.map((image: any) => typeof image === "string" ? image : image?.url).filter(Boolean);
  }
  return payload;
}

// Mock Local Memory for Server-side compilation fallback
const globalRef = globalThis as any;
if (!globalRef.__nexbyteMockDb) {
  globalRef.__nexbyteMockDb = {
    systemSettings: {
      global_theme_policy: "personal", // 'personal' | 'forced'
      forced_theme: "day",
    },
    storeSettings: JSON.parse(JSON.stringify(DEFAULT_STORE_SETTINGS)),
    customerPreferencesMap: {},
    settingsAuditLog: [
      {
        id: "audit-init",
        timestamp: new Date().toISOString(),
        adminEmail: "admin@nexbyte.com",
        adminName: "System Init",
        category: "System",
        action: "INIT",
        details: "Store settings initialized with enterprise defaults.",
        changedFields: ["all"],
      },
    ],
    users: [
      { id: "cust-1", email: "customer@nexbyte.com", full_name: "Ramesh Kumar", phone: "9876543210", role: "customer" },
      { id: "admin-1", email: "admin@nexbyte.com", full_name: "Admin Officer", phone: "8088979706", role: "admin" }
    ],
    products: initialProducts.map((p) => ({
      ...p,
      stock: p.stock ?? 12,
      discount: 10,
      warranty: "1 Year NexLapTech Warranty",
      condition: p.category.includes("used") || p.category.includes("second") ? "premium_used" : "new",
      status: "show",
      featured: p.id === "p1" || p.id === "p2",
      latest: p.id === "p3" || p.id === "p4",
      created_at: new Date().toISOString()
    })),
    services: initialServices.map((s, idx) => ({
      ...s,
      price: [1200, 1500, 800, 600, 500, 1800, 3500, 1000, 2500, 6500, 8500, 4500, 950, 1200, 1500][idx % 15],
      duration: "2-4 Hours",
      status: "enabled",
      created_at: new Date().toISOString()
    })),
    bookings: [
      {
        id: "b-1",
        customer_id: "cust-1",
        customer_name: "Ramesh Kumar",
        phone: "9876543210",
        email: "customer@nexbyte.com",
        service_name: "Laptop Keyboard & Trackpad Repair",
        status: "new",
        technician: "",
        booking_date: "2026-07-20",
        booking_time: "10:30 AM",
        notes: "Need it fixed urgently. Keyboard space bar not responding.",
        created_at: new Date().toISOString()
      },
      {
        id: "b-2",
        customer_id: "cust-1",
        customer_name: "Ramesh Kumar",
        phone: "9876543210",
        email: "customer@nexbyte.com",
        service_name: "Windows OS Optimization & Driver Setup",
        status: "completed",
        technician: "Niranjan M.",
        booking_date: "2026-07-15",
        booking_time: "02:00 PM",
        notes: "Clean install of Windows 11 Pro.",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    reviews: [
      {
        id: "rev-1",
        customer_name: "Anil Murthy",
        phone: "9845321045",
        email: "anil.m@gmail.com",
        city: "Tumkur",
        service_used: "Laptop Repair",
        product_purchased: "",
        overall_experience: "Excellent repair service. Repaired my Lenovo laptop hinge within 3 hours.",
        rating: 5,
        review_message: "Fast turn-around, reasonable price, clean work. Highly recommended branch in Tumkur.",
        recommend: true,
        image_urls: [],
        status: "approved",
        verified: true,
        featured: false,
        source: "public_form",
        likes_count: 5,
        helpful_count: 3,
        admin_reply: null,
        admin_reply_at: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    internships: [
      {
        id: "int-1",
        student_name: "Vikram R.",
        email: "vikram.r@sit.edu",
        phone: "8976543210",
        college: "SIT Tumkur",
        domain: "Embedded & IoT Systems",
        resume_url: "#",
        status: "pending",
        created_at: new Date().toISOString()
      }
    ],
    training: [
      {
        id: "tr-1",
        course_title: "Desktop Repair Training",
        student_name: "Priya Gowda",
        email: "priya@gmail.com",
        phone: "9008765432",
        batch: "July Batch A",
        trainer: "Niranjan M.",
        attendance_status: "present",
        certificate_url: "",
        created_at: new Date().toISOString()
      }
    ],
    notifications: [
      { id: "n-1", title: "New Service Booking", message: "Ramesh Kumar booked Laptop Keyboard Repair", status: "unread", type: "booking", created_at: new Date().toISOString() },
      { id: "n-2", title: "New Internship Application", message: "Vikram R. applied for Embedded & IoT Systems", status: "unread", type: "internship", created_at: new Date().toISOString() }
    ],
    contacts: [
      {
        id: "ct-1",
        name: "Suresh Patel",
        email: "suresh.p@gmail.com",
        phone: "9876501234",
        subject: "Bulk laptop supply enquiry",
        message: "We need 25 laptops for our school lab. Please share bulk pricing.",
        status: "unread",
        admin_reply: null,
        admin_reply_at: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    laptop_enquiries: [
      {
        id: "lp-1",
        customer_name: "Meena Sharma",
        phone: "9988776655",
        email: "meena.s@yahoo.com",
        budget: "30000-40000",
        laptop_type: "Business Laptop",
        message: "Looking for a lightweight business laptop for daily office use with good battery life.",
        status: "new",
        admin_notes: "",
        created_at: new Date().toISOString()
      }
    ],
    gallery: [
      { id: "gal-1", title: "Store Front", url: "/images/poster-products.png", category: "store", visible: true, created_at: new Date().toISOString() }
    ],
    cms_content: {
      hero: {
        headline: "Premium IT Solutions — NexLapTech",
        subheadline: "Laptops, Gaming PCs, Servers, Accessories, Repairs & Academy Training.",
        cta: "Explore Products",
        secondary_cta: "Book a Service",
      },
      seo: {
        title: "NexLapTech — Hardware, Repairs & IT Training",
        description: "NexLapTech offers premium laptops, gaming PCs, servers, bulk hardware supply, CCTV installation, software support, and IT academy training.",
        keywords: "laptop repair, gaming PC, computer service, bulk supply, IT training, CCTV installation, NexLapTech",
        og_image: "/images/poster-products.png",
      },
      footer: {
        tagline: "Your trusted partner for premium IT solutions.",
        address: "Bengaluru, Karnataka",
        copyright: "© 2026 NexLapTech. All rights reserved.",
      },
      contact_info: {
        phone1: "+91 8088979706",
        phone2: "+91 9876543210",
        email: "info@nexbytetechnologies.com",
        whatsapp: "918088979706",
      },
      updated_at: new Date().toISOString(),
    },
    certificates: [
      {
        id: "c-1",
        registrationId: "NBT-TR-2026-001",
        certificateId: "NBT-TR-2026-001",
        studentName: "Niranjan M",
        photoUrl: "/assets/nexlaptech-logo.png",
        courseTitle: "Full Stack Web Development",
        trainingType: "Advanced Web Technologies",
        internshipType: "N/A",
        projectTitle: "NextJS Glassmorphic CRM Portal",
        completionDate: "2026-07-15",
        status: "verified",
        phoneNumber: "9876543210",
        email: "niranjan@gmail.com",
        created_at: new Date().toISOString()
      }
    ],
    enrollments: [
      {
        id: "e-1",
        enrollmentId: "NBT-2026-10021",
        fullName: "Harish Kumar",
        phone: "9876543211",
        email: "harish@gmail.com",
        college: "RV College of Engineering",
        branch: "Computer Science",
        semester: "6th Semester",
        city: "Bengaluru",
        courseTitle: "Python Django & React",
        preferredBatch: "Morning Weekday",
        message: "Looking forward to starting classes next week.",
        type: "training",
        status: "pending",
        created_at: new Date().toISOString()
      }
    ],
    customers: [
      {
        id: "cust-1",
        customerId: "CUST-001",
        name: "Ramesh Kumar",
        phone: "9876543210",
        email: "customer@nexbyte.com",
        address: "Padmanabhanagar, Bengaluru",
        city: "Bengaluru",
        totalBookings: 2,
        reviewsCount: 1,
        certificatesCount: 0,
        productsPurchased: "1x Dell Latitude 7490",
        servicesTaken: "Laptop Keyboard & Trackpad Repair",
        created_at: new Date().toISOString()
      }
    ],
    media: [
      {
        id: "m-1",
        title: "Logo Horizontal",
        url: "/assets/nexlaptech-logo.png",
        fileType: "image/png",
        created_at: new Date().toISOString()
      }
    ],
    inventory: [],
    activity_logs: [],
    certificate_sequences: {},
    protection_plans: [
      {
        id: "care-device-1y",
        title: "Extended 1-Year Device Care",
        description: "Covers hardware breakdown, accidental spills, and doorstep technician service.",
        price: 499,
        duration: "Year",
        accent: "purple",
        is_active: true,
        sort_order: 1,
      },
      {
        id: "care-damage-1y",
        title: "Full Display & Damage Protection",
        description: "Free screen replacement and zero-cost parts warranty for 12 months.",
        price: 299,
        duration: "Year",
        accent: "blue",
        is_active: true,
        sort_order: 2,
      },
    ],
    offers: [
      {
        id: "off-1",
        offerName: "Welcome Referral Offer",
        offerCode: "NEX10",
        description: "Get 10% off on your order up to ₹2,000.",
        discountType: "percentage",
        discountValue: 10,
        eligibleProducts: ["all"],
        minimumPurchase: 1000,
        maximumDiscount: 2000,
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        usageLimit: 100,
        perCustomerLimit: 1,
        usageCount: 12,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usedBy: ["customer@nexbyte.com"]
      },
      {
        id: "off-2",
        offerName: "Festive SSD Upgrade Special",
        offerCode: "SSD500",
        description: "Flat ₹500 discount on high speed NVMe & SATA SSD storage drives.",
        discountType: "fixed",
        discountValue: 500,
        eligibleProducts: ["p1", "p2", "p3"],
        minimumPurchase: 3000,
        maximumDiscount: 500,
        startDate: "2026-06-01",
        expiryDate: "2026-11-30",
        usageLimit: 50,
        perCustomerLimit: 2,
        usageCount: 5,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usedBy: []
      },
      {
        id: "off-3",
        offerName: "Mega Electronics Clearance",
        offerCode: "MEGA20",
        description: "20% off on select refurbished items.",
        discountType: "percentage",
        discountValue: 20,
        eligibleProducts: ["all"],
        minimumPurchase: 5000,
        maximumDiscount: 3000,
        startDate: "2026-01-01",
        expiryDate: "2026-03-31",
        usageLimit: 20,
        perCustomerLimit: 1,
        usageCount: 20,
        status: "INACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usedBy: []
      }
    ],
    invoices: [
      {
        id: "inv-1",
        invoiceNumber: "NEX-2026-0001",
        customerId: "cust-1",
        customerName: "Ramesh Kumar",
        mobile: "9876543210",
        email: "customer@nexbyte.com",
        address: "Padmanabhanagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560070",
        items: [
          {
            id: "inv-item-1",
            name: "Dell Latitude 7490 Business Laptop",
            description: "Intel i7 8th Gen, 16GB RAM, 512GB NVMe SSD",
            quantity: 1,
            unitPrice: 35000,
            discount: 2000,
            unitPricePaise: 3500000,
            discountPaise: 200000,
            lineGrossPaise: 3500000,
            lineDiscountPaise: 200000,
            lineTotalPaise: 3300000,
            lineTotal: 33000
          }
        ],
        subtotalPaise: 3300000,
        subtotal: 33000,
        globalDiscountPaise: 0,
        globalDiscount: 0,
        taxableAmountPaise: 3300000,
        taxableAmount: 33000,
        gstEnabled: true,
        gstin: "29ABCDE1234F1Z5",
        cgstPaise: 297000,
        cgst: 2970,
        sgstPaise: 297000,
        sgst: 2970,
        gstTotalPaise: 594000,
        gstTotal: 5940,
        grandTotalPaise: 3894000,
        grandTotal: 38940,
        paymentMethod: "upi",
        paymentStatus: "paid",
        amountPaidPaise: 3894000,
        amountPaid: 38940,
        balanceDuePaise: 0,
        balanceDue: 0,
        invoiceDate: "2026-07-21",
        invoiceTime: "11:30 AM",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "Admin Officer",
        shareToken: "tok-nex-2026-0001-sec",
        status: "active"
      },
      {
        id: "inv-2",
        invoiceNumber: "NEX-2026-0002",
        customerId: null,
        customerName: "Suresh Patel",
        mobile: "9876501234",
        email: "suresh.p@gmail.com",
        address: "Jayanagar 4th Block",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560011",
        items: [
          {
            id: "inv-item-2",
            name: "Laptop Keyboard & Trackpad Repair",
            description: "Hardware service",
            quantity: 1,
            unitPrice: 1500,
            discount: 0,
            unitPricePaise: 150000,
            discountPaise: 0,
            lineGrossPaise: 150000,
            lineDiscountPaise: 0,
            lineTotalPaise: 150000,
            lineTotal: 1500
          },
          {
            id: "inv-item-3",
            name: "16GB DDR4 RAM Upgrade",
            description: "Kingston 3200MHz DDR4 SODIMM",
            quantity: 2,
            unitPrice: 2500,
            discount: 200,
            unitPricePaise: 250000,
            discountPaise: 20000,
            lineGrossPaise: 500000,
            lineDiscountPaise: 20000,
            lineTotalPaise: 480000,
            lineTotal: 4800
          }
        ],
        subtotalPaise: 630000,
        subtotal: 6300,
        globalDiscountPaise: 30000,
        globalDiscount: 300,
        taxableAmountPaise: 600000,
        taxableAmount: 6000,
        gstEnabled: false,
        gstin: "",
        cgstPaise: 0,
        cgst: 0,
        sgstPaise: 0,
        sgst: 0,
        gstTotalPaise: 0,
        gstTotal: 0,
        grandTotalPaise: 600000,
        grandTotal: 6000,
        paymentMethod: "cash",
        paymentStatus: "partially_paid",
        amountPaidPaise: 200000,
        amountPaid: 2000,
        balanceDuePaise: 400000,
        balanceDue: 4000,
        invoiceDate: "2026-07-22",
        invoiceTime: "03:15 PM",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "Admin Officer",
        shareToken: "tok-nxt-2026-00002-sec",
        status: "active"
      }
    ],
    resellers: [
      {
        id: "res-1",
        business_name: "TechZone Reseller",
        owner_name: "Kiran B.",
        email: "reseller@nexbyte.com",
        phone: "9876501234",
        address: "15, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        business_type: "individual",
        gstin: "",
        description: "Refurbished laptops and gaming peripherals.",
        status: "active",
        role: "reseller",
        created_at: new Date().toISOString()
      }
    ],
    orders: [],
    cart_items: [],
    conversations: [],
    messages: [],
    filterDefinitions: DEFAULT_FILTER_DEFINITIONS,
  };
}

if (!Array.isArray(globalRef.__nexbyteMockDb.protection_plans)) {
  globalRef.__nexbyteMockDb.protection_plans = [
    {
      id: "care-device-1y",
      title: "Extended 1-Year Device Care",
      description: "Covers hardware breakdown, accidental spills, and doorstep technician service.",
      price: 499,
      duration: "Year",
      accent: "purple",
      is_active: true,
      sort_order: 1,
    },
    {
      id: "care-damage-1y",
      title: "Full Display & Damage Protection",
      description: "Free screen replacement and zero-cost parts warranty for 12 months.",
      price: 299,
      duration: "Year",
      accent: "blue",
      is_active: true,
      sort_order: 2,
    },
  ];
}

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (
    value == null ||
    value === "" ||
    value === "undefined" ||
    value === "null"
  ) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed != null ? (parsed as T) : fallback;
  } catch (error) {
    console.error("Invalid stored JSON in localStorage:", error);
    return fallback;
  }
}

function getPersistentDbPath(): string | null {
  if (typeof window !== "undefined") return null;
  try {
    const p = eval("require")("path");
    const f = eval("require")("fs");
    let targetDir = f.existsSync(p.join(process.cwd(), "nexbyte", "frontend"))
      ? p.join(process.cwd(), "nexbyte", "frontend", "data")
      : p.join(process.cwd(), "data");
    if (!f.existsSync(targetDir)) {
      try {
        f.mkdirSync(targetDir, { recursive: true });
      } catch {}
    }
    return p.join(targetDir, "mock_db.json");
  } catch {
    return null;
  }
}

function loadPersistedDb(): Record<string, any> | null {
  const filePath = getPersistentDbPath();
  if (!filePath) return null;
  try {
    const f = eval("require")("fs");
    if (f.existsSync(filePath)) {
      const content = f.readFileSync(filePath, "utf8");
      return JSON.parse(content);
    }
  } catch {}
  return null;
}

function savePersistedDb(db: Record<string, any>) {
  const filePath = getPersistentDbPath();
  if (!filePath) return;
  try {
    const f = eval("require")("fs");
    f.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf8");
  } catch {}
}

const ensureDiskDbLoaded = () => {
  if (typeof window === "undefined" && !globalRef.__nexbyteDbDiskLoaded) {
    globalRef.__nexbyteDbDiskLoaded = true;
    const fromDisk = loadPersistedDb();
    if (fromDisk && typeof fromDisk === "object") {
      globalRef.__nexbyteMockDb = { ...globalRef.__nexbyteMockDb, ...fromDisk };
    }
  }
};

const getMockData = (key: string): any[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(`nexbyte_${key}`);
    const defaultData = globalRef.__nexbyteMockDb?.[key] || [];
    if (saved) {
      const parsed = safeParse<any[]>(saved, null as any);
      if (Array.isArray(parsed)) return parsed;
    }
    localStorage.setItem(`nexbyte_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  // Server-side: ensure persistent disk db is synced
  ensureDiskDbLoaded();
  return globalRef.__nexbyteMockDb?.[key] || [];
};

const saveMockData = (key: string, data: any[] | Record<string, any>) => {
  if (!globalRef.__nexbyteMockDb) {
    globalRef.__nexbyteMockDb = {};
  }
  ensureDiskDbLoaded();
  globalRef.__nexbyteMockDb[key] = data;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`nexbyte_${key}`, JSON.stringify(data));
    } catch {}
    // Background sync to server disk persistent store so server APIs (like /api/public/products/[id]) have it
    try {
      fetch("/api/system/sync-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, data }),
      }).catch(() => {});
    } catch {}
  } else {
    savePersistedDb(globalRef.__nexbyteMockDb);
  }
};

const getMockObject = (key: string): Record<string, any> => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(`nexbyte_${key}`);
    const defaultObj = globalRef.__nexbyteMockDb?.[key] || {};
    if (saved) {
      const parsed = safeParse<Record<string, any>>(saved, null as any);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    }
    localStorage.setItem(`nexbyte_${key}`, JSON.stringify(defaultObj));
    return defaultObj;
  }
  // Server-side: ensure persistent disk db is synced
  ensureDiskDbLoaded();
  return globalRef.__nexbyteMockDb?.[key] || {};
};

// Central Database Abstraction Helper
export const dbHelper = {
  // --- ACTIVITY LOGS SECTION ---
  activityLogs: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("activity_logs");
    },
    async create(log: any) {
      const payload = {
        id: `act-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...log,
      };
      if (supabase) {
        const { data } = await supabase.from("activity_logs").insert([payload]).select().single();
        notifyDataChange("activity_logs", "insert", data);
        return data;
      }
      const list = getMockData("activity_logs");
      saveMockData("activity_logs", [payload, ...list]);
      notifyDataChange("activity_logs", "insert", payload);
      return payload;
    }
  },

  // --- USERS SECTION ---
  users: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("users").select("*");
        return data || [];
      }
      return getMockData("users");
    },
    async getByEmail(email: string) {
      if (supabase) {
        const { data } = await supabase.from("users").select("*").eq("email", email).single();
        return data || null;
      }
      const list = getMockData("users");
      return list.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async create(user: any) {
      if (supabase) {
        const { data } = await supabase.from("users").insert([user]).select().single();
        return data;
      }
      const list = getMockData("users");
      const newUser = { id: `cust-${Date.now()}`, role: "customer", ...user };
      saveMockData("users", [...list, newUser]);
      notifyDataChange("users", "insert", newUser);
      return newUser;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data } = await supabase.from("users").update(updates).eq("id", id).select().single();
        return data;
      }
      const list = getMockData("users");
      const updated = list.map((u) => (u.id === id ? { ...u, ...updates } : u));
      saveMockData("users", updated);
      notifyDataChange("users", "update", updated.find((u) => u.id === id));
      return updated.find((u) => u.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("users").delete().eq("id", id);
        return true;
      }
      const list = getMockData("users");
      saveMockData("users", list.filter((u) => u.id !== id));
      notifyDataChange("users", "delete", { id });
      return true;
    }
  },

  // --- BOOKINGS SECTION ---
  bookings: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("bookings").select("*").order("createdAt", { ascending: false });
        return data || [];
      }
      return getMockData("bookings");
    },
    async getByCustomer(customerId: string) {
      if (supabase) {
        const { data } = await supabase.from("bookings").select("*").eq("customer_id", customerId).order("createdAt", { ascending: false });
        return data || [];
      }
      const list = getMockData("bookings");
      return list.filter((b) => b.customer_id === customerId);
    },
    async getByPhoneAndId(phone: string, bookingId: string) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (supabase) {
        // Fetch all and filter client side to handle phone formatting variations
        const { data } = await supabase.from("bookings").select("*");
        if (!data) return null;
        return data.find((b: any) => {
          const bp = (b.phone || "").replace(/\D/g, "");
          return bp.includes(cleanPhone) && b.bookingId?.toLowerCase() === bookingId.trim().toLowerCase();
        }) || null;
      }
      const list = getMockData("bookings");
      return list.find((b) => {
        const bp = (b.phone || "").replace(/\D/g, "");
        return bp.includes(cleanPhone) && b.bookingId?.toLowerCase() === bookingId.trim().toLowerCase();
      }) || null;
    },
    async create(booking: any) {
      // 1. Duplicate Booking Protection (same phone and interested product within 15 minutes)
      const list = await this.list();
      const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
      const cleanNewPhone = (booking.phone || "").replace(/\D/g, "");
      
      const isDuplicate = list.some((b) => {
        const bp = (b.phone || "").replace(/\D/g, "");
        const bookingTime = new Date(b.createdAt || b.created_at || 0).getTime();
        return (
          bp === cleanNewPhone &&
          b.productId === booking.productId &&
          bookingTime > fifteenMinsAgo
        );
      });

      if (isDuplicate) {
        throw new Error("Duplicate booking: You have already submitted an enquiry for this item recently. Please check My Bookings or wait a few minutes.");
      }

      // 2. Generate Booking ID (Reference ID sequential NB-2026-XXXXXX)
      const count = list.length + 1;
      const refId = booking.bookingId || `NB-2026-${String(count).padStart(6, "0")}`;

      const now = new Date().toISOString();
      const newBooking = {
        id: booking.id || `b-${Date.now()}`,
        bookingId: refId,
        customerName: booking.customerName || booking.customer_name || "Customer",
        phone: booking.phone || "",
        email: booking.email || "",
        address: booking.address || "",
        city: booking.city || "Bengaluru",
        state: booking.state || "Karnataka",
        pincode: booking.pincode || "560001",
        productId: booking.productId || "",
        productName: booking.productName || booking.service_name || "Hardware Booking",
        productCategory: booking.productCategory || "other",
        configuration: booking.configuration || booking.config || "Standard",
        budget: booking.budget || "N/A",
        message: booking.message || booking.remarks || "",
        bookingType: booking.bookingType || "product",
        status: booking.status || "new",
        assignedTo: booking.assignedTo || "",
        technician: booking.assignedTo || booking.technician || "",
        notes: booking.notes || "",
        replyMessage: booking.replyMessage || null,
        replyDate: booking.replyDate || null,
        replyBy: booking.replyBy || null,
        quantity: Number(booking.quantity || 1),
        preferredContact: booking.preferredContact || "WhatsApp",
        preferredDate: booking.preferredDate || now.split("T")[0],
        preferredTime: booking.preferredTime || "10:30 AM",
        device: "Web Client",
        browser: "Chrome / Web",
        ip: booking.ip || "Client IP",
        createdAt: now,
        updatedAt: now,
        timeline: booking.timeline || [
          { status: "submitted", timestamp: now, message: "Booking request submitted by customer", by: "Customer" }
        ],
        // Compatibility Mappings
        customer_name: booking.customerName || booking.customer_name || "Customer",
        service_name: booking.productName || booking.service_name || "Hardware Booking",
        created_at: now,
        booking_date: booking.preferredDate || now.split("T")[0],
        booking_time: booking.preferredTime || "10:30 AM"
      };

      if (supabase) {
        const { data, error } = await supabase.from("bookings").insert([newBooking]).select().single();
        if (error) throw error;
        
        await dbHelper.customers.autoCreateOrUpdate(newBooking.phone, {
          name: newBooking.customerName,
          email: newBooking.email,
          city: newBooking.city,
          actionType: "booking",
          actionItem: newBooking.productName,
        });
        
        await dbHelper.notifications.create({
          title: "🆕 New Product Booking",
          message: `${newBooking.customerName} booked ${newBooking.productName} (${newBooking.bookingId})`,
          type: "booking",
          meta: { booking_id: newBooking.id, bookingId: newBooking.bookingId }
        });

        await dbHelper.activityLogs.create({
          user_name: newBooking.customerName,
          role: "customer",
          action: "Customer Booked Product/Service",
          details: `Booking ID: ${newBooking.bookingId} | Item: ${newBooking.productName}`,
          ip: "Client IP"
        });

        notifyDataChange("bookings", "insert", data);
        return data;
      }

      const updatedList = [newBooking, ...list];
      saveMockData("bookings", updatedList);

      await dbHelper.customers.autoCreateOrUpdate(newBooking.phone, {
        name: newBooking.customerName,
        email: newBooking.email,
        city: newBooking.city,
        actionType: "booking",
        actionItem: newBooking.productName,
      });

      // Add corresponding notification & activity log
      await dbHelper.notifications.create({
        title: "🆕 New Product Booking",
        message: `${newBooking.customerName} booked ${newBooking.productName} (${newBooking.bookingId})`,
        type: "booking",
        meta: { booking_id: newBooking.id, bookingId: newBooking.bookingId }
      });

      await dbHelper.activityLogs.create({
        user_name: newBooking.customerName,
        role: "customer",
        action: "Customer Booked Product/Service",
        details: `Booking ID: ${newBooking.bookingId} | Item: ${newBooking.productName}`,
        ip: "Client IP"
      });

      notifyDataChange("bookings", "insert", newBooking);
      return newBooking;
    },
    async update(id: string, updates: any) {
      const list = await this.list();
      const existing = list.find((b) => b.id === id);
      if (!existing) throw new Error("Booking not found");

      const now = new Date().toISOString();
      const updatedTimeline = updates.timeline ? [...updates.timeline] : [...(existing.timeline || [])];
      
      // If status has changed, append to timeline
      if (updates.status && updates.status !== existing.status) {
        updatedTimeline.push({
          status: updates.status,
          timestamp: now,
          message: `Status updated to ${updates.status.toUpperCase()}`,
          by: updates.updatedBy || "Admin"
        });
      }

      // If reply is saved
      if (updates.replyMessage && updates.replyMessage !== existing.replyMessage) {
        updatedTimeline.push({
          status: existing.status,
          timestamp: now,
          message: `Admin reply: "${(updates.replyMessage || "").substring(0, 35)}..."`,
          by: updates.replyBy || "Admin"
        });
      }

      const merged = {
        ...existing,
        ...updates,
        updatedAt: now,
        timeline: updatedTimeline,
        // Compatibility mappings
        customer_name: updates.customerName || updates.customer_name || existing.customerName,
        service_name: updates.productName || updates.service_name || existing.productName,
        technician: updates.assignedTo || updates.technician || existing.assignedTo || existing.technician
      };

      // Create customer notification & activity log
      if (updates.status && updates.status !== existing.status) {
        await dbHelper.activityLogs.create({
          user_name: updates.updatedBy || "Admin Officer",
          role: "admin",
          action: "Admin Updated Booking",
          details: `Booking ${existing.bookingId || id} status changed to ${updates.status}`,
          ip: "Client IP"
        });

        await dbHelper.notifications.create({
          title: "📌 Booking Status Update",
          message: `Your booking (${existing.bookingId || id}) status is now: ${updates.status.toUpperCase()}`,
          type: "booking_update",
          customer_email: existing.email
        });
      }

      if (supabase) {
        const { data, error } = await supabase.from("bookings").update(merged).eq("id", id).select().single();
        if (error) throw error;
        notifyDataChange("bookings", "update", data);
        return data;
      }

      const updatedList = list.map((b) => (b.id === id ? merged : b));
      saveMockData("bookings", updatedList);
      notifyDataChange("bookings", "update", merged);
      return merged;
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("bookings").delete().eq("id", id);
        return true;
      }
      const list = getMockData("bookings");
      saveMockData("bookings", list.filter((b) => b.id !== id));
      notifyDataChange("bookings", "delete", { id });
      return true;
    }
  },

  // --- PRODUCTS SECTION ---
  products: {
    async list() {
      const cached = getCachedQuery<any[]>("products:list");
      if (cached) return cached;
      if (supabase) {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (error) throw new Error(`Could not load products: ${error.message}`);
        const list = (data || []).map((row) => normalizeProductRow(row));
        return setCachedQuery("products:list", list);
      }
      return setCachedQuery("products:list", getMockData("products"));
    },
    async create(prod: any) {
      let savedData: any;

      // Normalize images & primary constraint
      const normalizedImages = (prod.images && Array.isArray(prod.images))
        ? prod.images.map((img: any, idx: number) => ({
            id: img.id || `img-${Date.now()}-${idx}`,
            url: img.url,
            storage_path: img.storage_path || img.url,
            is_primary: Boolean(img.is_primary),
            sort_order: idx + 1,
            alt_text: img.alt_text || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        : [];

      // Guarantee exactly 1 primary image if images exist
      if (normalizedImages.length > 0 && !normalizedImages.some((i: any) => i.is_primary)) {
        normalizedImages[0].is_primary = true;
      }
      const primaryUrl = normalizedImages.find((i: any) => i.is_primary)?.url || prod.image || "/images/poster-products.png";

      const payload = {
        status: "show",
        stock: prod.stock ?? 10,
        discount: prod.discount ?? 0,
        condition: prod.condition || "new",
        featured: prod.featured || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...prod,
        image: primaryUrl,
        images: normalizedImages,
      };

      if (supabase) {
        const { data, error } = await supabase.from("products").insert([toProductDatabaseFields(payload)]).select().single();
        if (error) throw new Error(`Could not create product: ${error.message}`);
        if (!data) throw new Error("Could not create product: the database returned no product.");
        savedData = normalizeProductRow(data);
      } else {
        const list = getMockData("products");
        savedData = { id: `p-${Date.now()}`, ...payload };
        saveMockData("products", [savedData, ...list]);
      }
      
      // Activity Log & Stock Alert Logic
      await dbHelper.activityLogs.create({
        user_name: "Admin Officer",
        role: "admin",
        action: "Product Created",
        details: `Created product "${savedData.title}" (Price: ₹${savedData.price}, Stock: ${savedData.stock}, Images: ${normalizedImages.length})`,
        ip: "Client IP"
      });

      if (savedData && savedData.stock !== undefined) {
        if (savedData.stock === 0) {
          await dbHelper.notifications.create({
            title: "Out of Stock Alert",
            message: `${savedData.title} is now out of stock!`,
            type: "inventory"
          });
        } else if (savedData.stock <= 5) {
          await dbHelper.notifications.create({
            title: "Low Stock Alert",
            message: `${savedData.title} is running low (Only ${savedData.stock} left).`,
            type: "inventory"
          });
        }
      }

      notifyDataChange("products", "insert", savedData);
      return savedData;
    },
    async update(id: string, updates: any) {
      let savedData: any;
      let existingProd: any = null;

      if (supabase) {
        const { data: current, error } = await supabase.from("products").select("*").eq("id", id).single();
        if (error) throw new Error(`Could not load product "${id}" for update: ${error.message}`);
        existingProd = current;
      } else {
        const list = getMockData("products");
        existingProd = list.find((p) => p.id === id);
      }

      // Check for removed images to cleanup storage objects
      if (existingProd && existingProd.images && Array.isArray(existingProd.images) && updates.images && Array.isArray(updates.images)) {
        const newUrls = new Set(updates.images.map((i: any) => i.url));
        const removedImages = existingProd.images.filter((i: any) => i.url && !newUrls.has(i.url));

        // Delete removed storage objects
        for (const rem of removedImages) {
          if (rem.url && !rem.url.startsWith("data:") && !rem.url.startsWith("/images/")) {
            try {
              if (typeof window !== "undefined") {
                fetch(`/api/upload?filePath=${encodeURIComponent(rem.url)}`, { method: "DELETE" }).catch(() => {});
              }
            } catch {}
          }
        }
      }

      // Normalize updated images
      let normalizedImages = updates.images;
      if (updates.images && Array.isArray(updates.images)) {
        let hasPrimary = false;
        normalizedImages = updates.images.map((img: any, idx: number) => {
          const isPri = Boolean(img.is_primary);
          if (isPri && !hasPrimary) {
            hasPrimary = true;
            return { ...img, is_primary: true, sort_order: idx + 1, updated_at: new Date().toISOString() };
          }
          return { ...img, is_primary: false, sort_order: idx + 1, updated_at: new Date().toISOString() };
        });
        if (!hasPrimary && normalizedImages.length > 0) {
          normalizedImages[0].is_primary = true;
        }
        updates.images = normalizedImages;
        updates.image = normalizedImages.find((i: any) => i.is_primary)?.url || normalizedImages[0]?.url || updates.image || "/images/poster-products.png";
      }

      updates.updated_at = new Date().toISOString();

      if (supabase) {
        const { data, error } = await supabase.from("products").update(toProductDatabaseFields(updates)).eq("id", id).select().single();
        if (error) throw new Error(`Could not update product "${id}": ${error.message}`);
        if (!data) throw new Error(`Could not update product "${id}": the database returned no product.`);
        savedData = normalizeProductRow(data);
      } else {
        const list = getMockData("products");
        const updated = list.map((p) => (p.id === id ? { ...p, ...updates } : p));
        saveMockData("products", updated);
        savedData = updated.find((p) => p.id === id);
      }

      // Log activity
      await dbHelper.activityLogs.create({
        user_name: "Admin Officer",
        role: "admin",
        action: "Product Updated",
        details: `Updated product "${savedData?.title || id}" specifications/price/stock`,
        ip: "Client IP"
      });

      // Stock Alert Logic
      if (savedData && updates.stock !== undefined) {
        if (savedData.stock === 0) {
          await dbHelper.notifications.create({
            title: "Out of Stock Alert",
            message: `${savedData.title} is now out of stock!`,
            type: "inventory"
          });
        } else if (savedData.stock <= 5) {
          await dbHelper.notifications.create({
            title: "Low Stock Alert",
            message: `${savedData.title} is running low (Only ${savedData.stock} left).`,
            type: "inventory"
          });
        }
      }

      notifyDataChange("products", "update", savedData);
      return savedData;
    },
    async delete(id: string) {
      // Soft delete: move to trash / status deleted
      const updated = await this.update(id, { status: "deleted" });
      await dbHelper.activityLogs.create({
        user_name: "Admin Officer",
        role: "admin",
        action: "Product Trashed",
        details: `Moved product ${id} to Trash`,
        ip: "Client IP"
      });
      notifyDataChange("products", "delete", { id, status: "deleted" });
      return updated;
    },
    async permanentDelete(id: string) {
      let existing: any = null;
      if (supabase) {
        const { data } = await supabase.from("products").select("*").eq("id", id).single();
        existing = data;
      } else {
        const list = getMockData("products");
        existing = list.find((p) => p.id === id);
      }

      // Delete storage objects associated with product
      if (existing && existing.images && Array.isArray(existing.images)) {
        for (const img of existing.images) {
          if (img.url && !img.url.startsWith("data:") && !img.url.startsWith("/images/")) {
            try {
              if (typeof window !== "undefined") {
                fetch(`/api/upload?filePath=${encodeURIComponent(img.url)}`, { method: "DELETE" }).catch(() => {});
              }
            } catch {}
          }
        }
      }

      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
      } else {
        const list = getMockData("products");
        saveMockData("products", list.filter((p) => p.id !== id));
      }

      await dbHelper.activityLogs.create({
        user_name: "Admin Officer",
        role: "admin",
        action: "Product Permanently Deleted",
        details: `Permanently deleted product ${id} and associated storage objects`,
        ip: "Client IP"
      });

      notifyDataChange("products", "delete", { id });
      return true;
    },
    async restore(id: string) {
      // Restore from trash: status show
      const updated = await this.update(id, { status: "show" });
      await dbHelper.activityLogs.create({
        user_name: "Admin Officer",
        role: "admin",
        action: "Product Restored",
        details: `Restored product ${id} from Trash`,
        ip: "Client IP"
      });
      notifyDataChange("products", "update", updated);
      return updated;
    }
  },

  // --- SERVICES SECTION ---
  services: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("services");
    },
    async create(srv: any) {
      if (supabase) {
        const { data } = await supabase.from("services").insert([srv]).select().single();
        return data;
      }
      const list = getMockData("services");
      const newSrv = { id: `s-${Date.now()}`, created_at: new Date().toISOString(), ...srv };
      saveMockData("services", [newSrv, ...list]);
      notifyDataChange("services", "insert", newSrv);
      return newSrv;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data } = await supabase.from("services").update(updates).eq("id", id).select().single();
        return data;
      }
      const list = getMockData("services");
      const updated = list.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveMockData("services", updated);
      notifyDataChange("services", "update", updated.find((s) => s.id === id));
      return updated.find((s) => s.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("services").delete().eq("id", id);
        return true;
      }
      const list = getMockData("services");
      saveMockData("services", list.filter((s) => s.id !== id));
      notifyDataChange("services", "delete", { id });
      return true;
    }
  },

  // --- INTERNSHIPS SECTION ---
  internships: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("internships").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("internships");
    },
    async create(internship: any) {
      let savedData: any;
      const list = await this.list();
      const refNumber = String(list.length + 1).padStart(6, '0');
      const application_id = internship.application_id || `INT-2026-${refNumber}`;

      const payload = {
        application_id,
        status: internship.status || "pending",
        mentor: internship.mentor || "",
        batch: internship.batch || "",
        progress: internship.progress || 0,
        tasks: internship.tasks || [
          { id: "t1", title: "Technology Setup & Environment", status: "pending" },
          { id: "t2", title: "IEEE Abstract Review & Synopsis", status: "pending" },
          { id: "t3", title: "Core Architecture & Coding", status: "pending" },
          { id: "t4", title: "API Integration & Testing", status: "pending" },
          { id: "t5", title: "Final Documentation & Viva Prep", status: "pending" },
        ],
        admin_notes: internship.admin_notes || "",
        customer_reply: internship.customer_reply || "",
        rejection_reason: internship.rejection_reason || "",
        info_request_text: internship.info_request_text || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...internship,
      };

      if (supabase) {
        const { data, error } = await supabase.from("internships").insert([payload]).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        savedData = { id: `int-${Date.now()}`, ...payload };
        saveMockData("internships", [savedData, ...list]);
      }

      await dbHelper.customers.autoCreateOrUpdate(internship.phone, {
        name: internship.full_name || internship.student_name,
        email: internship.email,
        actionType: "internship",
        actionItem: internship.domain,
      });

      await dbHelper.notifications.create({
        title: "New Internship Application 🎓",
        message: `${internship.full_name || internship.student_name} applied for ${internship.domain} (${internship.college || "College"})`,
        type: "internship",
        audience: "admin"
      });

      notifyDataChange("internships", "insert", savedData);
      return savedData;
    },
    async update(id: string, updates: any) {
      let existing: any = null;
      if (supabase) {
        const { data } = await supabase.from("internships").select("*").eq("id", id).single();
        existing = data;
      } else {
        const list = getMockData("internships");
        existing = list.find((i) => i.id === id);
      }

      const payload = {
        updated_at: new Date().toISOString(),
        ...updates
      };

      // Auto-generate Enrollment ID on Approval if not already present
      if ((payload.status === "approved" || payload.status === "enrolled") && (!existing?.enrollment_id && !payload.enrollment_id)) {
        const list = await this.list();
        const enrRef = String(list.length + 1).padStart(6, '0');
        payload.enrollment_id = `ENR-2026-${enrRef}`;
      }

      // Auto-generate Certificate on Completion if not already present
      if (payload.status === "completed" && (!existing?.certificate_id && !payload.certificate_id)) {
        // DO NOT use enrollment_id, application_id, or random IDs as the certificate Registration ID.
        // Let dbHelper.certificates.create() call getNextRegistrationId() server-side.
        let issuedCert: any = null;
        try {
          issuedCert = await dbHelper.certificates.create({
            // registrationId intentionally omitted — server allocates NBT-TR-YYYY-NNN
            studentName: existing?.full_name || existing?.student_name || "Student",
            courseTitle: existing?.domain || "Internship Program",
            trainingType: existing?.domain || "Internship Program",
            internshipType: existing?.internship_type || "Hybrid",
            projectTitle: existing?.project_title || existing?.domain || "Engineering Internship",
            completionDate: existing?.end_date || new Date().toISOString().split("T")[0],
            issueDate: new Date().toISOString().split("T")[0],
            college: existing?.college || "",
            phoneNumber: existing?.phone || "",
            email: existing?.email || "",
            // Store internship references internally for audit — NOT as the public registration ID
            internship_application_id: existing?.application_id || "",
            internship_enrollment_id: existing?.enrollment_id || "",
          });
          // Write the proper NBT-TR-YYYY-NNN back as certificate_id on the internship record
          payload.certificate_id = issuedCert?.registrationId || "";
        } catch (e) {
          console.warn("Certificate auto-creation warning:", e);
        }
      }

      let savedData: any;
      if (supabase) {
        const { data } = await supabase.from("internships").update(payload).eq("id", id).select().single();
        savedData = data;
      } else {
        const list = getMockData("internships");
        const updated = list.map((i) => (i.id === id ? { ...i, ...payload } : i));
        saveMockData("internships", updated);
        savedData = updated.find((i) => i.id === id);
      }

      notifyDataChange("internships", "update", savedData);
      return savedData;
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("internships").delete().eq("id", id);
      } else {
        const list = getMockData("internships");
        saveMockData("internships", list.filter((i) => i.id !== id));
      }
      notifyDataChange("internships", "delete", { id });
      return true;
    }
  },

  // --- TRAINING SECTION ---
  training: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("training").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("training");
    },
    async create(train: any) {
      if (supabase) {
        const { data, error } = await supabase.from("training").insert([train]).select().single();
        if (error) throw error;
        await dbHelper.notifications.create({
          title: "New Training Enrollment",
          message: `${train.student_name} registered for Course: ${train.course_title}`,
          type: "training"
        });
        return data;
      }
      const list = getMockData("training");
      const newTrain = { id: `tr-${Date.now()}`, attendance_status: "present", created_at: new Date().toISOString(), ...train };
      saveMockData("training", [newTrain, ...list]);

      await dbHelper.notifications.create({
        title: "New Training Enrollment",
        message: `${train.student_name} registered for Course: ${train.course_title}`,
        type: "training"
      });

      notifyDataChange("training", "insert", newTrain);
      return newTrain;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data } = await supabase.from("training").update(updates).eq("id", id).select().single();
        return data;
      }
      const list = getMockData("training");
      const updated = list.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveMockData("training", updated);
      notifyDataChange("training", "update", updated.find((t) => t.id === id));
      return updated.find((t) => t.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("training").delete().eq("id", id);
        return true;
      }
      const list = getMockData("training");
      saveMockData("training", list.filter((t) => t.id !== id));
      notifyDataChange("training", "delete", { id });
      return true;
    }
  },

  // --- NOTIFICATIONS SECTION ---
  notifications: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("notifications");
    },
    async create(notify: any) {
      if (supabase) {
        const { data } = await supabase.from("notifications").insert([notify]).select().single();
        return data;
      }
      const list = getMockData("notifications");
      const newNotify = { id: `n-${Date.now()}`, status: "unread", created_at: new Date().toISOString(), ...notify };
      saveMockData("notifications", [newNotify, ...list]);
      notifyDataChange("notifications", "insert", newNotify);
      return newNotify;
    },
    async markAllRead() {
      if (supabase) {
        await supabase.from("notifications").update({ status: "read" }).eq("status", "unread");
        return true;
      }
      const list = getMockData("notifications");
      const updated = list.map((n) => ({ ...n, status: "read" }));
      saveMockData("notifications", updated);
      notifyDataChange("notifications", "update", {});
      return true;
    },
    async markRead(id: string) {
      if (supabase) {
        await supabase.from("notifications").update({ status: "read" }).eq("id", id);
        return true;
      }
      const list = getMockData("notifications");
      const updated = list.map((n) => (n.id === id ? { ...n, status: "read" } : n));
      saveMockData("notifications", updated);
      return true;
    }
  },

  // --- CONTACTS SECTION ---
  contacts: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("contacts");
    },
    async create(contact: any) {
      let savedData;
      if (supabase) {
        const { data, error } = await supabase.from("contacts").insert([contact]).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const list = getMockData("contacts");
        savedData = { id: `ct-${Date.now()}`, status: "unread", admin_reply: null, admin_reply_at: null, created_at: new Date().toISOString(), ...contact };
        saveMockData("contacts", [savedData, ...list]);
      }

      await dbHelper.customers.autoCreateOrUpdate(contact.phone || "0000000000", {
        name: contact.name,
        email: contact.email,
        actionType: "enquiry",
        actionItem: contact.subject || "General Contact",
      });

      await dbHelper.notifications.create({
        title: "New Contact Enquiry",
        message: `${contact.name} sent a message: "${(contact.subject || contact.message || "").substring(0, 50)}..."`,
        type: "contact"
      });

      notifyDataChange("contacts", "insert", savedData);
      return savedData;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data } = await supabase.from("contacts").update(updates).eq("id", id).select().single();
        return data;
      }
      const list = getMockData("contacts");
      const updated = list.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveMockData("contacts", updated);
      notifyDataChange("contacts", "update", updated.find((c) => c.id === id));
      return updated.find((c) => c.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("contacts").delete().eq("id", id);
        return true;
      }
      const list = getMockData("contacts");
      saveMockData("contacts", list.filter((c) => c.id !== id));
      notifyDataChange("contacts", "delete", { id });
      return true;
    },
    async reply(id: string, replyMessage: string) {
      const updates = {
        admin_reply: replyMessage,
        admin_reply_at: new Date().toISOString(),
        status: "replied"
      };
      return this.update(id, updates);
    }
  },

  // --- LAPTOP ENQUIRIES SECTION ---
  laptopEnquiries: {
    async list() {
      const cached = getCachedQuery<any[]>("laptop_enquiries:list");
      if (cached) return cached;
      if (supabase) {
        const { data } = await supabase.from("laptop_enquiries").select("*").order("created_at", { ascending: false });
        return setCachedQuery("laptop_enquiries:list", data || []);
      }
      return setCachedQuery("laptop_enquiries:list", getMockData("laptop_enquiries"));
    },
    async create(enquiry: any) {
      let savedData: any;
      const list = await this.list();
      const refNumber = String(list.length + 1).padStart(6, '0');
      const reference_id = enquiry.reference_id || `LE-2026-${refNumber}`;

      const payload = {
        reference_id,
        category: enquiry.category || "laptop_purchase",
        product_name: enquiry.product_name || enquiry.laptop_type || "Hardware Enquiry",
        status: enquiry.status || "new",
        admin_notes: enquiry.admin_notes || "",
        customer_reply: enquiry.customer_reply || "",
        messages: Array.isArray(enquiry.messages) && enquiry.messages.length > 0 ? enquiry.messages : [
          {
            id: `msg-${Date.now()}-1`,
            sender: "customer",
            sender_name: enquiry.customer_name || "Customer",
            text: enquiry.message || enquiry.requirements || "Requirement details submitted.",
            timestamp: new Date().toISOString(),
            is_internal: false,
          }
        ],
        recommended_products: enquiry.recommended_products || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...enquiry,
      };

      if (supabase) {
        try {
          const { data, error } = await supabase.from("laptop_enquiries").insert([payload]).select().single();
          if (error) throw error;
          savedData = data;
        } catch (supErr: any) {
          console.warn("Retrying Supabase insert without extended fields:", supErr?.message);
          const corePayload = {
            reference_id: payload.reference_id,
            customer_name: payload.customer_name,
            phone: payload.phone,
            email: payload.email,
            laptop_type: payload.laptop_type || payload.product_name || payload.category,
            budget: payload.budget,
            requirements: payload.requirements || payload.message,
            status: payload.status,
            admin_notes: payload.admin_notes,
            customer_reply: payload.customer_reply,
            created_at: payload.created_at,
          };
          const { data, error } = await supabase.from("laptop_enquiries").insert([corePayload]).select().single();
          if (error) throw error;
          savedData = { ...payload, ...data };
        }
      } else {
        savedData = { id: `lp-${Date.now()}`, ...payload };
        saveMockData("laptop_enquiries", [savedData, ...list]);
      }

      await dbHelper.customers.autoCreateOrUpdate(enquiry.phone, {
        name: enquiry.customer_name,
        actionType: "enquiry",
        actionItem: enquiry.laptop_type || enquiry.product_name || enquiry.category,
      });

      await dbHelper.notifications.create({
        title: "New Customer Enquiry 📩",
        message: `${enquiry.customer_name} submitted an enquiry for ${enquiry.product_name || enquiry.laptop_type || enquiry.category} (Budget: ${enquiry.budget || "Unspecified"})`,
        type: "laptop_enquiry",
        audience: "admin"
      });

      invalidateQueryCache("laptop_enquiries");
      notifyDataChange("laptop_enquiries", "insert", savedData);
      return savedData;
    },
    async update(id: string, updates: any) {
      const payload = {
        updated_at: new Date().toISOString(),
        ...updates
      };
      invalidateQueryCache("laptop_enquiries");
      if (supabase) {
        try {
          const { data, error } = await supabase.from("laptop_enquiries").update(payload).eq("id", id).select().single();
          if (error) throw error;
          notifyDataChange("laptop_enquiries", "update", data);
          return data;
        } catch (supErr: any) {
          const coreUpdates: any = { updated_at: payload.updated_at };
          if ("status" in payload) coreUpdates.status = payload.status;
          if ("admin_notes" in payload) coreUpdates.admin_notes = payload.admin_notes;
          if ("customer_reply" in payload) coreUpdates.customer_reply = payload.customer_reply;
          const { data } = await supabase.from("laptop_enquiries").update(coreUpdates).eq("id", id).select().single();
          notifyDataChange("laptop_enquiries", "update", data || payload);
          return data || payload;
        }
      }
      const list = getMockData("laptop_enquiries");
      const updated = list.map((e) => (e.id === id ? { ...e, ...payload } : e));
      saveMockData("laptop_enquiries", updated);
      const target = updated.find((e) => e.id === id);
      notifyDataChange("laptop_enquiries", "update", target);
      return target;
    },
    async addMessage(id: string, message: { sender: "admin" | "customer"; sender_name?: string; text: string; is_internal?: boolean }) {
      const list = await this.list();
      const enquiry = list.find((e: any) => e.id === id || e.reference_id === id);
      if (!enquiry) throw new Error("Enquiry not found.");
      const currentMessages = Array.isArray(enquiry.messages) ? enquiry.messages : [];
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: message.sender,
        sender_name: message.sender_name || (message.sender === "admin" ? "NexLapTech Support" : enquiry.customer_name),
        text: message.text,
        timestamp: new Date().toISOString(),
        is_internal: Boolean(message.is_internal),
      };
      const updatedMessages = [...currentMessages, newMsg];
      const patch: any = {
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      };
      if (message.sender === "admin") {
        if (!message.is_internal) {
          patch.customer_reply = message.text;
          patch.status = enquiry.status === "new" ? "replied" : enquiry.status;
        } else {
          patch.admin_notes = enquiry.admin_notes ? `${enquiry.admin_notes}\n[${new Date().toLocaleDateString()}] ${message.text}` : message.text;
        }
      }
      return this.update(enquiry.id, patch);
    },
    async delete(id: string) {
      invalidateQueryCache("laptop_enquiries");
      if (supabase) {
        await supabase.from("laptop_enquiries").delete().eq("id", id);
      } else {
        const list = getMockData("laptop_enquiries");
        saveMockData("laptop_enquiries", list.filter((e) => e.id !== id));
      }
      notifyDataChange("laptop_enquiries", "delete", { id });
      return true;
    }
  },

  // --- REVIEWS EXTENDED ---
  reviews: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("reviews");
    },
    async create(review: any) {
      let savedData;
      const reviewId = review.id || `rev-${Date.now()}`;
      const payload = {
        id: reviewId,
        status: "pending",
        verified: false,
        featured: false,
        likes_count: 0,
        helpful_count: 0,
        admin_reply: null,
        admin_reply_at: null,
        created_at: new Date().toISOString(),
        ...review,
      };

      if (supabase) {
        const { data, error } = await supabase.from("reviews").insert([payload]).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const list = getMockData("reviews");
        savedData = payload;
        saveMockData("reviews", [savedData, ...list]);
      }

      // 1. Create Admin Notification
      await dbHelper.notifications.create({
        title: "⭐ New Customer Review",
        message: `${savedData.customer_name || "Customer"} left a ${savedData.rating}★ review for ${savedData.service_used || savedData.product_purchased || "NexLapTech Services"}`,
        type: "review",
        meta: { review_id: savedData.id }
      });

      // 2. Log Activity
      await dbHelper.activityLogs.create({
        user_name: savedData.customer_name || "Customer",
        role: "customer",
        action: "Customer Submitted Review",
        details: `Rating: ${savedData.rating}★ | Message: "${(savedData.review_message || "").substring(0, 40)}..."`,
        ip: "Client IP"
      });

      // 3. Emit Realtime Notification Event
      notifyDataChange("reviews", "insert", savedData);
      return savedData;
    },
    async update(id: string, updates: any) {
      let savedData: any;
      if (supabase) {
        const { data, error } = await supabase.from("reviews").update(updates).eq("id", id).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const list = getMockData("reviews");
        const existing = list.find((r) => r.id === id) || {};
        savedData = { ...existing, ...updates };
        const updatedList = list.map((r) => (r.id === id ? savedData : r));
        saveMockData("reviews", updatedList);
      }

      // Log activity and create customer notifications based on update type
      if (updates.status === "approved") {
        await dbHelper.activityLogs.create({
          user_name: "Admin Officer",
          role: "admin",
          action: "Admin Approved Review",
          details: `Approved review ${id} by ${savedData.customer_name}`,
          ip: "Client IP"
        });
        await dbHelper.notifications.create({
          title: "✅ Review Approved!",
          message: "Your review has been approved and is now publicly visible on NexLapTech.",
          type: "review_update",
          customer_email: savedData.email
        });
      } else if (updates.status === "rejected") {
        await dbHelper.activityLogs.create({
          user_name: "Admin Officer",
          role: "admin",
          action: "Admin Rejected Review",
          details: `Rejected review ${id}. Reason: ${updates.rejection_reason || "None specified"}`,
          ip: "Client IP"
        });
        await dbHelper.notifications.create({
          title: "❌ Review Update",
          message: `Your review was rejected. Reason: ${updates.rejection_reason || "Does not meet guidelines."}`,
          type: "review_update",
          customer_email: savedData.email
        });
      } else if (updates.status === "need_modification") {
        await dbHelper.activityLogs.create({
          user_name: "Admin Officer",
          role: "admin",
          action: "Admin Requested Modification",
          details: `Requested modification on review ${id}. Note: ${updates.modification_reason || "Please update details"}`,
          ip: "Client IP"
        });
        await dbHelper.notifications.create({
          title: "📝 Action Required: Update Your Review",
          message: `Please update your review. Reason: ${updates.modification_reason || "Please clarify your experience."}`,
          type: "review_update",
          customer_email: savedData.email
        });
      } else if (updates.admin_reply !== undefined) {
        await dbHelper.activityLogs.create({
          user_name: "Admin Officer",
          role: "admin",
          action: "Admin Replied to Review",
          details: `Replied to review ${id}: "${(updates.admin_reply || "").substring(0, 30)}..."`,
          ip: "Client IP"
        });
        if (updates.admin_reply) {
          await dbHelper.notifications.create({
            title: "💬 Admin Replied to Your Review",
            message: `NexLapTech Team replied: "${updates.admin_reply}"`,
            type: "review_reply",
            customer_email: savedData.email
          });
        }
      } else if (updates.featured !== undefined) {
        await dbHelper.activityLogs.create({
          user_name: "Admin Officer",
          role: "admin",
          action: updates.featured ? "Admin Featured Review" : "Admin Unfeatured Review",
          details: `Set review ${id} featured = ${updates.featured}`,
          ip: "Client IP"
        });
      }

      notifyDataChange("reviews", "update", savedData);
      return savedData;
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("reviews").delete().eq("id", id);
        return true;
      }
      const list = getMockData("reviews");
      saveMockData("reviews", list.filter((r) => r.id !== id));
      notifyDataChange("reviews", "delete", { id });
      return true;
    }
  },

  // --- GALLERY SECTION ---
  gallery: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("gallery");
    },
    async create(item: any) {
      if (supabase) {
        const { data } = await supabase.from("gallery").insert([item]).select().single();
        return data;
      }
      const list = getMockData("gallery");
      const newItem = { id: `gal-${Date.now()}`, visible: true, created_at: new Date().toISOString(), ...item };
      saveMockData("gallery", [newItem, ...list]);
      notifyDataChange("gallery", "insert", newItem);
      return newItem;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data } = await supabase.from("gallery").update(updates).eq("id", id).select().single();
        return data;
      }
      const list = getMockData("gallery");
      const updated = list.map((g) => (g.id === id ? { ...g, ...updates } : g));
      saveMockData("gallery", updated);
      return updated.find((g) => g.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("gallery").delete().eq("id", id);
        return true;
      }
      const list = getMockData("gallery");
      saveMockData("gallery", list.filter((g) => g.id !== id));
      notifyDataChange("gallery", "delete", { id });
      return true;
    }
  },

  // --- CMS CONTENT SECTION ---
  cmsContent: {
    async get(section?: string) {
      if (supabase) {
        if (section) {
          const { data } = await supabase.from("cms_content").select("*").eq("section", section).single();
          return data?.content || {};
        }
        const { data } = await supabase.from("cms_content").select("*");
        if (!data) return {};
        return data.reduce((acc: any, row: any) => ({ ...acc, [row.section]: row.content }), {});
      }
      const cms = getMockObject("cms_content");
      if (section) return cms[section] || {};
      return cms;
    },
    async update(section: string, content: any) {
      if (supabase) {
        await supabase.from("cms_content").upsert({ section, content, updated_at: new Date().toISOString() });
        return true;
      }
      const cms = getMockObject("cms_content");
      cms[section] = content;
      cms.updated_at = new Date().toISOString();
      saveMockData("cms_content", cms);
      notifyDataChange("cms_content", "update", { section, content });
      return true;
    }
  },

  // --- CERTIFICATES SECTION ---
  certificates: {
    async list() {
      let rawList: any[] = [];
      if (supabase) {
        const { data } = await supabase.from("certificates").select("*").order("created_at", { ascending: false });
        rawList = data || [];
      } else {
        rawList = getMockData("certificates");
      }

      // Migrate/clean legacy certificate records that used enrollment or random IDs as registrationId
      let needsSave = false;
      let migrateCounter = 0;
      const year = new Date().getFullYear();

      // Pre-compute highest existing NBT-TR number so migration assigns unique IDs after it
      let maxExistingNum = 0;
      rawList.forEach((c: any) => {
        const match = (c.registrationId || "").match(/NBT-TR-(\d{4})-(\d+)/i);
        if (match && parseInt(match[1]) === year) {
          const n = parseInt(match[2], 10);
          if (!isNaN(n) && n > maxExistingNum) maxExistingNum = n;
        }
      });

      const sanitized = rawList.map((c: any) => {
        const isLegacy =
          !c.registrationId ||
          c.registrationId.startsWith("ENR-") ||
          c.registrationId.startsWith("CERT-") ||
          c.registrationId.startsWith("NXB-INT-") ||
          !c.registrationId.startsWith("NBT-TR-");

        if (isLegacy) {
          migrateCounter++;
          const newNum = maxExistingNum + migrateCounter;
          const newRegId = `NBT-TR-${year}-${String(newNum).padStart(3, "0")}`;
          c.legacyId = c.registrationId || c.certificateId || c.id;
          c.registrationId = newRegId;
          c.certificateId = newRegId;
          needsSave = true;
        }
        return c;
      });

      // Update the mock sequence counter after migration so next allocation continues correctly
      if (needsSave && !supabase) {
        const totalMaxNum = maxExistingNum + migrateCounter;
        const mockSeq = getMockObject("certificate_sequences") || {};
        if ((mockSeq[year] || 0) < totalMaxNum) {
          mockSeq[year] = totalMaxNum;
          saveMockData("certificate_sequences", mockSeq);
        }
        saveMockData("certificates", sanitized);
      }

      return sanitized;
    },
    async getByRegId(regId: string) {
      const list = await this.list();
      const query = (regId || "").trim().toLowerCase();
      return list.find((c: any) => c.registrationId?.toLowerCase() === query || c.certificateId?.toLowerCase() === query) || null;
    },
    async peekNextRegistrationId(issueYear?: number): Promise<string> {
      const year = issueYear || new Date().getFullYear();
      let maxExisting = 0;

      const list = await this.list();
      list.forEach((c: any) => {
        const match = (c.registrationId || "").match(/NBT-TR-(\d{4})-(\d+)/i);
        if (match && parseInt(match[1]) === year) {
          const num = parseInt(match[2], 10);
          if (!isNaN(num) && num > maxExisting) maxExisting = num;
        }
      });

      let storedLast = 0;
      if (supabase) {
        try {
          const { data } = await supabase.from("certificate_sequences").select("last_number").eq("year", year).single();
          if (data) storedLast = data.last_number || 0;
        } catch {}
      } else {
        const mockSeq = getMockObject("certificate_sequences") || {};
        storedLast = mockSeq[year] || 0;
      }

      const nextNum = Math.max(storedLast, maxExisting) + 1;
      const numStr = String(nextNum).padStart(3, "0");
      return `NBT-TR-${year}-${numStr}`;
    },
    async getNextRegistrationId(issueYear?: number): Promise<string> {
      const year = issueYear || new Date().getFullYear();
      let maxExisting = 0;

      // We call getMockData directly here (not this.list()) to avoid triggering
      // migration recursion and to get raw persisted data.
      let rawList: any[] = [];
      if (supabase) {
        try {
          const { data } = await supabase.from("certificates").select("registration_id").order("created_at", { ascending: false });
          rawList = data || [];
        } catch {}
      } else {
        rawList = getMockData("certificates");
      }

      rawList.forEach((c: any) => {
        const match = (c.registrationId || c.registration_id || "").match(/NBT-TR-(\d{4})-(\d+)/i);
        if (match && parseInt(match[1]) === year) {
          const num = parseInt(match[2], 10);
          if (!isNaN(num) && num > maxExisting) maxExisting = num;
        }
      });

      let storedLast = 0;
      if (supabase) {
        try {
          const { data } = await supabase.from("certificate_sequences").select("last_number").eq("year", year).single();
          if (data) storedLast = typeof data.last_number === "number" ? data.last_number : 0;
        } catch {}
      } else {
        // Safe: getMockObject always returns {} on missing/invalid keys
        const mockSeq = getMockObject("certificate_sequences");
        storedLast = typeof mockSeq[year] === "number" ? mockSeq[year] : 0;
      }

      const nextNum = Math.max(storedLast, maxExisting) + 1;

      // Persist the allocated counter BEFORE returning so concurrent calls
      // on the same process see the updated value (best-effort for mock mode;
      // use a real DB sequence / advisory lock for true concurrency safety).
      if (supabase) {
        try {
          await supabase.from("certificate_sequences").upsert({ year, last_number: nextNum, updated_at: new Date().toISOString() });
        } catch {}
      } else {
        const mockSeq = getMockObject("certificate_sequences");
        mockSeq[year] = nextNum;
        saveMockData("certificate_sequences", mockSeq);
      }

      const numStr = String(nextNum).padStart(3, "0");
      return `NBT-TR-${year}-${numStr}`;
    },
    async create(cert: any) {
      let registrationId = cert.registrationId;
      if (!registrationId || !registrationId.startsWith("NBT-TR-")) {
        let issueYear = new Date().getFullYear();
        if (cert.completionDate || cert.issueDate) {
          const dt = new Date(cert.completionDate || cert.issueDate);
          if (!isNaN(dt.getFullYear())) issueYear = dt.getFullYear();
        }
        registrationId = await this.getNextRegistrationId(issueYear);
      }

      const _siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nexlaptech.in";
      const qrData = `${_siteUrl}/verify?regid=${encodeURIComponent(registrationId)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

      const newCert = {
        id: cert.id || `c-${Date.now()}`,
        registrationId,
        certificateId: registrationId, // mirrored for model safety
        status: cert.status || "verified",
        qrCodeUrl: qrUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...cert,
      };

      if (supabase) {
        const { data, error } = await supabase.from("certificates").insert([newCert]).select().single();
        if (error) throw error;
        if (newCert.phoneNumber) {
          await dbHelper.customers.autoCreateOrUpdate(newCert.phoneNumber, {
            name: newCert.studentName,
            email: newCert.email,
            actionType: "certificate",
            actionItem: newCert.courseTitle || newCert.projectTitle,
          });
        }
        notifyDataChange("certificates", "insert", data);
        return data;
      }

      const list = getMockData("certificates");
      saveMockData("certificates", [newCert, ...list]);
      if (newCert.phoneNumber) {
        await dbHelper.customers.autoCreateOrUpdate(newCert.phoneNumber, {
          name: newCert.studentName,
          email: newCert.email,
          actionType: "certificate",
          actionItem: newCert.courseTitle || newCert.projectTitle,
        });
      }
      notifyDataChange("certificates", "insert", newCert);
      return newCert;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data, error } = await supabase.from("certificates").update(updates).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const list = getMockData("certificates");
      const updated = list.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveMockData("certificates", updated);
      notifyDataChange("certificates", "update", updated.find((c) => c.id === id));
      return updated.find((c) => c.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("certificates").delete().eq("id", id);
        return true;
      }
      const list = getMockData("certificates");
      saveMockData("certificates", list.filter((c) => c.id !== id));
      notifyDataChange("certificates", "delete", { id });
      return true;
    }
  },

  // --- ENROLLMENTS SECTION ---
  enrollments: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("enrollments").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("enrollments");
    },
    async create(enrollment: any) {
      const enrollId = `NBT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newEnroll = {
        id: `e-${Date.now()}`,
        enrollmentId: enrollId,
        status: "pending",
        created_at: new Date().toISOString(),
        ...enrollment,
      };

      if (supabase) {
        const { data, error } = await supabase.from("enrollments").insert([newEnroll]).select().single();
        if (error) throw error;
        // Auto update customer profile
        await dbHelper.customers.autoCreateOrUpdate(newEnroll.phone, {
          name: newEnroll.fullName,
          email: newEnroll.email,
          city: newEnroll.city,
          actionType: newEnroll.type || "enrollment",
          actionItem: newEnroll.courseTitle || newEnroll.projectType || "Enrollment",
        });

        // Add admin notification
        await dbHelper.notifications.create({
          title: newEnroll.type === "internship" ? "New Internship Application 🎓" : "New Training Enrollment 📚",
          message: `${newEnroll.fullName} registered for ${newEnroll.courseTitle || newEnroll.projectType}`,
          type: newEnroll.type || "training",
        });

        console.log("Insert Success", data);
        notifyDataChange("enrollments", "insert", data);
        return data;
      }

      const list = getMockData("enrollments");
      saveMockData("enrollments", [newEnroll, ...list]);
      console.log("Insert Success", newEnroll);
      notifyDataChange("enrollments", "insert", newEnroll);

      // Auto update customer profile
      await dbHelper.customers.autoCreateOrUpdate(newEnroll.phone, {
        name: newEnroll.fullName,
        email: newEnroll.email,
        city: newEnroll.city,
        actionType: newEnroll.type || "enrollment",
        actionItem: newEnroll.courseTitle || newEnroll.projectType || "Enrollment",
      });

      // Add admin notification
      await dbHelper.notifications.create({
        title: newEnroll.type === "internship" ? "New Internship Application 🎓" : "New Training Enrollment 📚",
        message: `${newEnroll.fullName} registered for ${newEnroll.courseTitle || newEnroll.projectType}`,
        type: newEnroll.type || "training",
      });

      return newEnroll;
    },
    async updateStatus(id: string, status: string) {
      if (supabase) {
        const { data, error } = await supabase.from("enrollments").update({ status }).eq("id", id).select().single();
        if (error) throw error;
        console.log("Update Success", data);
        notifyDataChange("enrollments", "update", data);
        return data;
      }
      const list = getMockData("enrollments");
      const updated = list.map((e) => (e.id === id ? { ...e, status } : e));
      saveMockData("enrollments", updated);
      notifyDataChange("enrollments", "update", updated.find((e) => e.id === id));
      return updated.find((e) => e.id === id);
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("enrollments").delete().eq("id", id);
        return true;
      }
      const list = getMockData("enrollments");
      saveMockData("enrollments", list.filter((e) => e.id !== id));
      notifyDataChange("enrollments", "delete", { id });
      return true;
    }
  },

  // --- CUSTOMERS DATABASE SECTION ---
  customers: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("customers");
    },
    async getByPhone(phone: string) {
      const list = await this.list();
      return list.find((c) => c.phone === phone) || null;
    },
    async create(cust: any) {
      const custId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCust = {
        id: `cust-${Date.now()}`,
        customerId: custId,
        totalBookings: 0,
        reviewsCount: 0,
        certificatesCount: 0,
        productsPurchased: "",
        servicesTaken: "",
        created_at: new Date().toISOString(),
        ...cust,
      };
      if (supabase) {
        const { data, error } = await supabase.from("customers").insert([newCust]).select().single();
        if (error) throw error;
        return data;
      }
      const list = getMockData("customers");
      saveMockData("customers", [newCust, ...list]);
      notifyDataChange("customers", "insert", newCust);
      return newCust;
    },
    async update(id: string, updates: any) {
      if (supabase) {
        const { data, error } = await supabase.from("customers").update(updates).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const list = getMockData("customers");
      const updated = list.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveMockData("customers", updated);
      notifyDataChange("customers", "update", updated.find((c) => c.id === id));
      return updated.find((c) => c.id === id);
    },
    async autoCreateOrUpdate(phone: string, details: { name: string; email?: string; city?: string; address?: string; actionType: string; actionItem: string }) {
      const existing = await this.getByPhone(phone);
      if (existing) {
        const updates: any = {};
        if (details.actionType === "booking") {
          updates.totalBookings = (existing.totalBookings || 0) + 1;
          updates.servicesTaken = existing.servicesTaken 
            ? `${existing.servicesTaken}, ${details.actionItem}` 
            : details.actionItem;
        } else if (details.actionType === "enquiry") {
          updates.productsPurchased = existing.productsPurchased 
            ? `${existing.productsPurchased}, ${details.actionItem}` 
            : details.actionItem;
        } else if (details.actionType === "review") {
          updates.reviewsCount = (existing.reviewsCount || 0) + 1;
        } else if (details.actionType === "certificate") {
          updates.certificatesCount = (existing.certificatesCount || 0) + 1;
        } else if (details.actionType === "training" || details.actionType === "internship") {
          updates.servicesTaken = existing.servicesTaken 
            ? `${existing.servicesTaken}, ${details.actionItem}` 
            : details.actionItem;
        }
        if (details.email && !existing.email) updates.email = details.email;
        if (details.city && !existing.city) updates.city = details.city;
        return this.update(existing.id, updates);
      } else {
        const newCust: any = {
          name: details.name,
          phone,
          email: details.email || "",
          city: details.city || "Bengaluru",
          address: details.address || "",
          totalBookings: details.actionType === "booking" ? 1 : 0,
          reviewsCount: details.actionType === "review" ? 1 : 0,
          certificatesCount: details.actionType === "certificate" ? 1 : 0,
          productsPurchased: details.actionType === "enquiry" ? details.actionItem : "",
          servicesTaken: (details.actionType === "booking" || details.actionType === "training" || details.actionType === "internship") ? details.actionItem : "",
        };
        return this.create(newCust);
      }
    }
  },

  // --- MEDIA LIBRARY SECTION ---
  media: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("media").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("media");
    },
    async create(mediaItem: any) {
      const newMedia = {
        id: `med-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...mediaItem,
      };
      if (supabase) {
        const { data, error } = await supabase.from("media").insert([newMedia]).select().single();
        if (error) throw error;
        return data;
      }
      const list = getMockData("media");
      saveMockData("media", [newMedia, ...list]);
      notifyDataChange("media", "insert", newMedia);
      return newMedia;
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("media").delete().eq("id", id);
        return true;
      }
      const list = getMockData("media");
      saveMockData("media", list.filter((m) => m.id !== id));
      notifyDataChange("media", "delete", { id });
      return true;
    }
  },

  // --- RESELLERS SECTION ---
  resellers: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("resellers").select("*").order("created_at", { ascending: false });
        return data || [];
      }
      return getMockData("resellers");
    },
    async getByEmail(email: string) {
      if (supabase) {
        const { data } = await supabase.from("resellers").select("*").eq("email", email.toLowerCase()).single();
        return data || null;
      }
      const list = getMockData("resellers");
      return list.find((r: any) => r.email?.toLowerCase() === email.toLowerCase()) || null;
    },
    async getById(id: string) {
      if (supabase) {
        const { data } = await supabase.from("resellers").select("*").eq("id", id).single();
        return data || null;
      }
      const list = getMockData("resellers");
      return list.find((r: any) => r.id === id) || null;
    },
    async create(reseller: any) {
      const newReseller = {
        id: `res-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...reseller,
      };
      if (supabase) {
        const { data, error } = await supabase.from("resellers").insert([newReseller]).select().single();
        if (error) throw error;
        notifyDataChange("resellers", "insert", data);
        return data;
      }
      const list = getMockData("resellers");
      saveMockData("resellers", [newReseller, ...list]);
      notifyDataChange("resellers", "insert", newReseller);
      return newReseller;
    },
    async update(id: string, updates: any) {
      const payload = { ...updates, updated_at: new Date().toISOString() };
      if (supabase) {
        const { data } = await supabase.from("resellers").update(payload).eq("id", id).select().single();
        notifyDataChange("resellers", "update", data);
        return data;
      }
      const list = getMockData("resellers");
      const updated = list.map((r: any) => r.id === id ? { ...r, ...payload } : r);
      saveMockData("resellers", updated);
      const found = updated.find((r: any) => r.id === id);
      notifyDataChange("resellers", "update", found);
      return found;
    },
    async delete(id: string) {
      if (supabase) {
        await supabase.from("resellers").delete().eq("id", id);
        return true;
      }
      const list = getMockData("resellers");
      saveMockData("resellers", list.filter((r: any) => r.id !== id));
      notifyDataChange("resellers", "delete", { id });
      return true;
    }
  },

  // --- RESELLER LISTINGS & INVENTORY ---
  resellerListings: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("reseller_listings").select("*").order("created_at", { ascending: false });
        if (data) return data;
      }
      return getMockData("reseller_listings") || [];
    },

    async getByReseller(resellerId: string) {
      const list = await this.list();
      return list.filter((l: any) => l.reseller_id === resellerId || l.resellerId === resellerId);
    },

    async getByProduct(productId: string) {
      const list = await this.list();
      const sellers = await dbHelper.resellers.list();

      return list.filter((l: any) => {
        const matchesProduct = (l.product_id === productId || l.productId === productId);
        const isActive = (l.status === "active" || l.status === "approved");
        const seller = sellers.find((s: any) => s.id === l.reseller_id || s.id === l.resellerId);
        const sellerApproved = seller ? (seller.status === "approved" || seller.status === "active") : true;
        return matchesProduct && isActive && sellerApproved;
      });
    },

    async getById(id: string) {
      const list = await this.list();
      return list.find((l: any) => l.id === id) || null;
    },

    async create(listing: any) {
      const seller = await dbHelper.resellers.getById(listing.reseller_id || listing.resellerId);
      if (seller && (seller.status === "pending" || seller.status === "rejected" || seller.status === "suspended")) {
        throw new Error(`Seller account status is '${seller.status}'. Only approved resellers can list products.`);
      }

      const payload = {
        id: `lst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        reseller_id: listing.reseller_id || listing.resellerId,
        resellerId: listing.reseller_id || listing.resellerId,
        product_id: listing.product_id || listing.productId,
        productId: listing.product_id || listing.productId,
        seller_sku: listing.seller_sku || listing.sellerSku || `SKU-SEL-${Date.now()}`,
        selling_price: Number(listing.selling_price ?? listing.sellingPrice) || 0,
        sellingPrice: Number(listing.selling_price ?? listing.sellingPrice) || 0,
        stock_quantity: Math.max(0, Number(listing.stock_quantity ?? listing.stockQuantity) || 0),
        stockQuantity: Math.max(0, Number(listing.stock_quantity ?? listing.stockQuantity) || 0),
        status: listing.status || "active",
        delivery_method: listing.delivery_method || listing.deliveryMethod || "Standard 3-5 Days",
        warranty: listing.warranty || "1 Year Seller Warranty",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (supabase) {
        const { data, error } = await supabase.from("reseller_listings").insert([payload]).select().single();
        if (data && !error) {
          notifyDataChange("reseller_listings", "insert", data);
          return data;
        }
      }

      const list = getMockData("reseller_listings") || [];
      const updated = [payload, ...list];
      saveMockData("reseller_listings", updated);
      notifyDataChange("reseller_listings", "insert", payload);
      return payload;
    },

    async update(id: string, updates: any) {
      const existing = await this.getById(id);
      if (!existing) throw new Error("Listing not found.");

      const payload = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (supabase) {
        const { data } = await supabase.from("reseller_listings").update(payload).eq("id", id).select().single();
        if (data) {
          notifyDataChange("reseller_listings", "update", data);
          return data;
        }
      }

      const list = getMockData("reseller_listings") || [];
      const updated = list.map((l: any) => l.id === id ? { ...l, ...payload } : l);
      saveMockData("reseller_listings", updated);
      const found = updated.find((l: any) => l.id === id);
      notifyDataChange("reseller_listings", "update", found);
      return found;
    },

    async adjustStock(id: string, qtyDelta: number, reason: string = "manual_adjustment") {
      const listing = await this.getById(id);
      if (!listing) throw new Error("Listing not found for stock adjustment.");

      const currentStock = Number(listing.stock_quantity ?? listing.stockQuantity) || 0;
      const newStock = currentStock + qtyDelta;

      if (newStock < 0) {
        throw new Error(`Insufficient stock. Current stock is ${currentStock}, requested reduction is ${Math.abs(qtyDelta)}.`);
      }

      const updated = await this.update(id, {
        stock_quantity: newStock,
        stockQuantity: newStock
      });

      // Record transaction
      await dbHelper.inventoryTransactions.record({
        reseller_id: listing.reseller_id || listing.resellerId,
        listing_id: id,
        type: qtyDelta > 0 ? "restock" : "deduction",
        quantity: Math.abs(qtyDelta),
        reason
      });

      return updated;
    }
  },

  // --- COMMISSION ENGINE ---
  commissionEngine: {
    calculate(productId: string, category: string, resellerId: string, sellingPrice: number, qty: number = 1) {
      const lineSubtotal = sellingPrice * qty;
      let commissionRate = 0.05; // Default 5% global commission

      const catLower = (category || "").toLowerCase();
      if (catLower.includes("laptop")) {
        commissionRate = 0.04; // 4% for laptops
      } else if (catLower.includes("storage") || catLower.includes("ssd") || catLower.includes("ram")) {
        commissionRate = 0.03; // 3% for components
      }

      const platformCommission = Math.round(lineSubtotal * commissionRate);
      const sellerEarning = lineSubtotal - platformCommission;

      return {
        commissionRate,
        commissionPercent: commissionRate * 100,
        lineSubtotal,
        platformCommission,
        sellerEarning
      };
    }
  },

  // --- PAYOUTS SECTION ---
  resellerPayouts: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("reseller_payouts").select("*").order("created_at", { ascending: false });
        if (data) return data;
      }
      return getMockData("reseller_payouts") || [];
    },

    async getByReseller(resellerId: string) {
      const list = await this.list();
      return list.filter((p: any) => p.reseller_id === resellerId || p.resellerId === resellerId);
    },

    async create(payout: any) {
      const payload = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        reseller_id: payout.reseller_id || payout.resellerId,
        amount: Number(payout.amount) || 0,
        commission_amount: Number(payout.commission_amount || payout.commissionAmount) || 0,
        status: payout.status || "Pending",
        period_start: payout.period_start || new Date().toISOString().split("T")[0],
        period_end: payout.period_end || new Date().toISOString().split("T")[0],
        payment_reference: payout.payment_reference || payout.paymentReference || "",
        created_at: new Date().toISOString()
      };

      if (supabase) {
        const { data } = await supabase.from("reseller_payouts").insert([payload]).select().single();
        if (data) return data;
      }

      const list = getMockData("reseller_payouts") || [];
      const updated = [payload, ...list];
      saveMockData("reseller_payouts", updated);
      return payload;
    },

    async updateStatus(id: string, status: string, paymentReference?: string) {
      const payload: any = { status, updated_at: new Date().toISOString() };
      if (status === "Paid") {
        payload.paid_at = new Date().toISOString();
        if (paymentReference) payload.payment_reference = paymentReference;
      }

      if (supabase) {
        const { data } = await supabase.from("reseller_payouts").update(payload).eq("id", id).select().single();
        if (data) return data;
      }

      const list = getMockData("reseller_payouts") || [];
      const updated = list.map((p: any) => p.id === id ? { ...p, ...payload } : p);
      saveMockData("reseller_payouts", updated);
      return updated.find((p: any) => p.id === id);
    }
  },

  // --- INVENTORY TRANSACTIONS ---
  inventoryTransactions: {
    async record(tx: any) {
      const payload = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        reseller_id: tx.reseller_id || tx.resellerId,
        listing_id: tx.listing_id || tx.listingId,
        type: tx.type || "adjustment",
        quantity: Number(tx.quantity) || 0,
        reason: tx.reason || "Inventory update",
        created_at: new Date().toISOString()
      };

      if (supabase) {
        await supabase.from("inventory_transactions").insert([payload]);
      }

      const list = getMockData("inventory_transactions") || [];
      saveMockData("inventory_transactions", [payload, ...list]);
      return payload;
    },

    async listByReseller(resellerId: string) {
      const list = getMockData("inventory_transactions") || [];
      return list.filter((t: any) => t.reseller_id === resellerId || t.resellerId === resellerId);
    }
  },


  // --- ORDERS SECTION ---
  orders: {
    async getNextOrderId(): Promise<string> {
      const year = new Date().getFullYear();
      const list = await this.list();
      let max = 0;
      list.forEach((o: any) => {
        const match = (o.order_id || "").match(/NB-ORD-\d{4}-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > max) max = n;
        }
      });
      return `NB-ORD-${year}-${String(max + 1).padStart(6, "0")}`;
    },
    async list() {
      const cached = getCachedQuery<any[]>("orders:list");
      if (cached) return cached;
      if (supabase) {
        const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        return setCachedQuery("orders:list", data || []);
      }
      return setCachedQuery("orders:list", getMockData("orders"));
    },
    async listByUser(userId: string) {
      const list = await this.list();
      return list.filter((o: any) => o.user_id === userId);
    },
    async listBySeller(sellerId: string) {
      const list = await this.list();
      return list.filter((o: any) => o.seller_id === sellerId);
    },
    async getById(id: string) {
      if (supabase) {
        const { data } = await supabase.from("orders").select("*").eq("id", id).single();
        return data || null;
      }
      const list = getMockData("orders");
      return list.find((o: any) => o.id === id || o.order_id === id) || null;
    },
    async create(order: any) {
      const orderId = await this.getNextOrderId();
      const newOrder = {
        id: `ord-${Date.now()}`,
        order_id: orderId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...order,
      };
      if (supabase) {
        const { data, error } = await supabase.from("orders").insert([newOrder]).select().single();
        if (error) throw error;
        notifyDataChange("orders", "insert", data);
        return data;
      }
      const list = getMockData("orders");
      saveMockData("orders", [newOrder, ...list]);
      notifyDataChange("orders", "insert", newOrder);
      return newOrder;
    },
    async update(id: string, updates: any) {
      const payload = { ...updates, updated_at: new Date().toISOString() };
      if (supabase) {
        const { data } = await supabase.from("orders").update(payload).eq("id", id).select().single();
        notifyDataChange("orders", "update", data);
        return data;
      }
      const list = getMockData("orders");
      const updated = list.map((o: any) => o.id === id ? { ...o, ...payload } : o);
      saveMockData("orders", updated);
      const found = updated.find((o: any) => o.id === id);
      notifyDataChange("orders", "update", found);
      return found;
    }
  },

  // --- CART SECTION ---
  cart: {
    async getByUser(userId: string) {
      if (supabase) {
        const { data } = await supabase.from("cart_items").select("*").eq("user_id", userId);
        return data || [];
      }
      const list = getMockData("cart_items");
      return list.filter((c: any) => c.user_id === userId);
    },
    async addItem(userId: string, item: any) {
      if (supabase) {
        // Upsert: if same product exists, increase qty
        const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", userId).eq("product_id", item.product_id).single();
        if (existing) {
          const { data } = await supabase.from("cart_items").update({ quantity: existing.quantity + (item.quantity || 1) }).eq("id", existing.id).select().single();
          return data;
        }
        const { data } = await supabase.from("cart_items").insert([{ user_id: userId, ...item, created_at: new Date().toISOString() }]).select().single();
        return data;
      }
      const list = getMockData("cart_items");
      const existing = list.find((c: any) => c.user_id === userId && c.product_id === item.product_id);
      if (existing) {
        const updated = list.map((c: any) => c.id === existing.id ? { ...c, quantity: c.quantity + (item.quantity || 1) } : c);
        saveMockData("cart_items", updated);
        return updated.find((c: any) => c.id === existing.id);
      }
      const newItem = { id: `ci-${Date.now()}`, user_id: userId, quantity: 1, created_at: new Date().toISOString(), ...item };
      saveMockData("cart_items", [...list, newItem]);
      return newItem;
    },
    async updateQty(itemId: string, quantity: number) {
      if (quantity < 1) return this.removeItem(itemId);
      if (supabase) {
        const { data } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId).select().single();
        return data;
      }
      const list = getMockData("cart_items");
      const updated = list.map((c: any) => c.id === itemId ? { ...c, quantity } : c);
      saveMockData("cart_items", updated);
      return updated.find((c: any) => c.id === itemId);
    },
    async removeItem(itemId: string) {
      if (supabase) {
        await supabase.from("cart_items").delete().eq("id", itemId);
        return true;
      }
      const list = getMockData("cart_items");
      saveMockData("cart_items", list.filter((c: any) => c.id !== itemId));
      return true;
    },
    async clearCart(userId: string) {
      if (supabase) {
        await supabase.from("cart_items").delete().eq("user_id", userId);
        return true;
      }
      const list = getMockData("cart_items");
      saveMockData("cart_items", list.filter((c: any) => c.user_id !== userId));
      return true;
    }
  },

  // --- PROFILES SECTION ---
  profiles: {
    async getById(id: string) {
      if (!id) return null;
      const cleanId = String(id).trim();
      const lower = cleanId.toLowerCase();

      // 1. Supabase Postgres if configured
      if (supabase) {
        try {
          const { data, error } = await supabase.from("profiles").select("*").or(`id.eq.${cleanId},email.ilike.${lower}`).single();
          if (data && !error) return data;
          const { data: userData, error: userError } = await supabase.from("users").select("*").or(`id.eq.${cleanId},email.ilike.${lower}`).single();
          if (userData && !userError) return userData;
        } catch (e) {}
      }

      // 2. Persistent Local Storage
      const profiles = getMockData("profiles");
      const users = getMockData("users");

      const foundInProfiles = profiles.find(
        (p: any) => p && (String(p.id) === cleanId || p.email?.toLowerCase() === lower)
      );
      if (foundInProfiles) return foundInProfiles;

      const foundInUsers = users.find(
        (u: any) => u && (String(u.id) === cleanId || u.email?.toLowerCase() === lower)
      );
      if (foundInUsers) return foundInUsers;

      return null;
    },

    async update(id: string, updates: any) {
      if (!id) throw new Error("Customer ID is required.");
      const cleanId = String(id).trim();
      const lower = cleanId.toLowerCase();
      const now = new Date().toISOString();
      const payload = { ...updates, updated_at: now };

      // 1. Supabase Postgres if configured
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .upsert({ id: cleanId, ...payload })
            .select()
            .single();
          if (data && !error) {
            notifyDataChange("profiles", "update", data);
            return data;
          }
        } catch (e) {}
      }

      // 2. Persistent Local Storage
      const profiles = getMockData("profiles");
      const users = getMockData("users");

      let updatedRecord: any = null;

      // Update or create in profiles
      const profIdx = profiles.findIndex(
        (p: any) => p && (String(p.id) === cleanId || p.email?.toLowerCase() === lower)
      );
      if (profIdx >= 0) {
        profiles[profIdx] = { ...profiles[profIdx], ...payload };
        updatedRecord = profiles[profIdx];
      } else {
        const newProf = {
          id: cleanId,
          email: updates.email || (cleanId.includes("@") ? cleanId : `${cleanId}@customer.nexbyte.com`),
          role: "user",
          created_at: now,
          ...payload,
        };
        profiles.push(newProf);
        updatedRecord = newProf;
      }
      saveMockData("profiles", profiles);

      // Also sync to users table to prevent discrepancy
      const userIdx = users.findIndex(
        (u: any) => u && (String(u.id) === cleanId || u.email?.toLowerCase() === lower)
      );
      if (userIdx >= 0) {
        users[userIdx] = { ...users[userIdx], ...payload };
      } else {
        users.push(updatedRecord);
      }
      saveMockData("users", users);

      notifyDataChange("profiles", "update", updatedRecord);
      return updatedRecord;
    }
  },

  // --- FAVORITES SECTION ---
  favorites: {
    async getByUser(userId: string) {
      if (supabase) {
        const { data } = await supabase.from("favorites").select("*").eq("user_id", userId);
        return data || [];
      }
      const list = getMockData("favorites");
      return list.filter((f: any) => f.user_id === userId);
    },
    async toggle(userId: string, productId: string) {
      const existing = await this.getByUser(userId);
      const isFav = existing.some((f: any) => f.product_id === productId);
      if (supabase) {
        if (isFav) {
          await supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId);
          return { favorited: false };
        } else {
          const { data } = await supabase.from("favorites").insert([{ user_id: userId, product_id: productId, created_at: new Date().toISOString() }]).select().single();
          return { favorited: true, data };
        }
      }
      const list = getMockData("favorites");
      if (isFav) {
        const updated = list.filter((f: any) => !(f.user_id === userId && f.product_id === productId));
        saveMockData("favorites", updated);
        return { favorited: false };
      } else {
        const newFav = { id: `fav-${Date.now()}`, user_id: userId, product_id: productId, created_at: new Date().toISOString() };
        saveMockData("favorites", [...list, newFav]);
        return { favorited: true, data: newFav };
      }
    }
  },

  // --- MESSAGES SECTION ---
  messages: {
    async getByUser(userId: string) {
      if (supabase) {
        const { data } = await supabase.from("messages").select("*").or(`user_id.eq.${userId},customer_email.eq.${userId}`).order("created_at", { ascending: true });
        return data || [];
      }
      const list = getMockData("messages");
      return list.filter((m: any) => m.user_id === userId || m.customer_email === userId);
    },
    async send(message: any) {
      const payload = {
        id: `msg-${Date.now()}`,
        status: "unread",
        created_at: new Date().toISOString(),
        ...message
      };
      let savedData: any = payload;
      if (supabase) {
        const { data } = await supabase.from("messages").insert([payload]).select().single();
        notifyDataChange("messages", "insert", data);
        savedData = data || payload;
      } else {
        const list = getMockData("messages");
        saveMockData("messages", [...list, payload]);
        notifyDataChange("messages", "insert", payload);
      }

      // Fire admin notification with deep link reference to this conversation
      try {
        const senderName = message.sender_name || message.customer_name || message.customer_email || "Customer";
        const preview = (message.message || "").substring(0, 80);
        await dbHelper.notifications.create({
          title: "💬 New Customer Message",
          message: `${senderName}: ${preview}`,
          type: "message",
          recipient_role: "admin",
          reference_type: "message",
          reference_id: savedData?.id || payload.id,
          meta: {
            message_id: savedData?.id || payload.id,
            sender: senderName,
            user_id: message.user_id,
          }
        });
      } catch (notifErr) {
        console.error("Failed to create message notification:", notifErr);
      }

      return savedData;
    },
    async reply(id: string, replyText: string, replyBy: string = "NexLapTech Support") {
      const payload = {
        admin_reply: replyText,
        reply: replyText,
        status: "read",
        replied_at: new Date().toISOString(),
        replied_by: replyBy,
      };
      if (supabase) {
        const { data } = await supabase.from("messages").update(payload).eq("id", id).select().single();
        notifyDataChange("messages", "update", data);
        return data;
      }
      const list = getMockData("messages");
      const updated = list.map((m: any) => m.id === id ? { ...m, ...payload } : m);
      saveMockData("messages", updated);
      const found = updated.find((m: any) => m.id === id);
      notifyDataChange("messages", "update", found);
      return found;
    }
  },

  // --- INVOICES SECTION ---
  invoices: {
    async list() {
      if (supabase) {
        const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) return data;
      }
      const list = getMockData("invoices");
      return (list || []).sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
    },

    async getById(id: string) {
      if (supabase) {
        const { data } = await supabase.from("invoices").select("*").or(`id.eq.${id},invoice_number.eq.${id}`).single();
        if (data) return data;
      }
      const list = getMockData("invoices");
      return list.find((inv: any) => inv.id === id || inv.invoiceNumber === id || inv.invoice_number === id) || null;
    },

    async getByShareToken(token: string) {
      if (supabase) {
        const { data } = await supabase.from("invoices").select("*").eq("share_token", token).single();
        if (data) return data;
      }
      const list = getMockData("invoices");
      return list.find((inv: any) => inv.shareToken === token || inv.share_token === token) || null;
    },

    async getNextSequenceInfo(targetYear?: number) {
      const year = targetYear || new Date().getFullYear();
      const prefix = `NEX-${year}-`;
      let maxSequence = 0;

      // 1. Get max sequence from existing DB records
      if (supabase) {
        const { data } = await supabase
          .from("invoices")
          .select("invoice_number, invoice_sequence, invoice_year")
          .eq("invoice_year", year);

        if (data && data.length > 0) {
          data.forEach((inv: any) => {
            if (inv.invoice_sequence && typeof inv.invoice_sequence === "number") {
              if (inv.invoice_sequence > maxSequence) maxSequence = inv.invoice_sequence;
            } else if (inv.invoice_number && inv.invoice_number.startsWith(prefix)) {
              const parts = inv.invoice_number.split("-");
              const num = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(num) && num > maxSequence) maxSequence = num;
            }
          });
        }
      }

      // Always check mock data / local sequence storage to ensure max sequence across deletes
      const list = getMockData("invoices") || [];
      list.forEach((inv: any) => {
        const invYear = inv.invoice_year || inv.invoiceYear;
        const invSeq = inv.invoice_sequence || inv.invoiceSequence;
        const numStr = inv.invoiceNumber || inv.invoice_number || "";

        if (invYear === year && typeof invSeq === "number" && invSeq > maxSequence) {
          maxSequence = invSeq;
        } else if (numStr.startsWith(prefix)) {
          const parts = numStr.split("-");
          const num = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(num) && num > maxSequence) maxSequence = num;
        }
      });

      // Check persistent sequence tracker object (preserves sequence after deletion)
      const seqTrackerMap = getMockData("invoice_sequences") || {};
      const highestAssigned = seqTrackerMap[year] || 0;
      if (highestAssigned > maxSequence) {
        maxSequence = highestAssigned;
      }

      const nextSequence = maxSequence + 1;
      const formattedCounter = String(nextSequence).padStart(4, "0");
      const invoiceNumber = `${prefix}${formattedCounter}`;

      return {
        year,
        sequence: nextSequence,
        invoiceNumber,
      };
    },

    async generateNextNumber(targetYear?: number) {
      const info = await this.getNextSequenceInfo(targetYear);
      return info.invoiceNumber;
    },

    async create(invoiceData: any) {
      const {
        paymentReference,
        paymentBank,
        bankTransferType,
        cardType,
        ...invoiceFields
      } = invoiceData;
      const year = new Date().getFullYear();
      const seqInfo = await this.getNextSequenceInfo(year);
      const invoiceNumber = seqInfo.invoiceNumber;
      const invoiceSequence = seqInfo.sequence;

      // Update persistent max sequence tracker for this year
      const seqTrackerMap = getMockData("invoice_sequences") || {};
      seqTrackerMap[year] = Math.max(seqTrackerMap[year] || 0, invoiceSequence);
      saveMockData("invoice_sequences", seqTrackerMap);

      const now = new Date();
      const invoiceDate = now.toISOString().split("T")[0];
      const invoiceTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

      const payload = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceDate,
        invoice_date: invoiceDate,
        invoiceTime,
        invoice_time: invoiceTime,
        createdAt: now.toISOString(),
        created_at: now.toISOString(),
        updatedAt: now.toISOString(),
        updated_at: now.toISOString(),
        shareToken: `tok-${invoiceNumber.toLowerCase()}-${Date.now().toString(36)}`,
        share_token: `tok-${invoiceNumber.toLowerCase()}-${Date.now().toString(36)}`,
        status: "active",
        ...invoiceFields,
        payment_reference: paymentReference || "",
        payment_bank: paymentBank || "",
        bank_transfer_type: bankTransferType || "",
        card_type: cardType || "",
        // Enforce immutable invoice number & sequence
        invoiceNumber,
        invoice_number: invoiceNumber,
        invoiceYear: year,
        invoice_year: year,
        invoiceSequence: invoiceSequence,
        invoice_sequence: invoiceSequence,
      };

      if (supabase) {
        const { data, error } = await supabase.from("invoices").insert([payload]).select().single();
        if (data && !error) {
          notifyDataChange("invoices", "insert", data);
          return data;
        }
      }

      const list = getMockData("invoices") || [];
      const updated = [payload, ...list];
      saveMockData("invoices", updated);
      notifyDataChange("invoices", "insert", payload);
      return payload;
    },

    async update(id: string, updates: any) {
      const payload = { ...updates, updatedAt: new Date().toISOString(), updated_at: new Date().toISOString() };
      if (supabase) {
        const { data } = await supabase.from("invoices").update(payload).eq("id", id).select().single();
        if (data) {
          notifyDataChange("invoices", "update", data);
          return data;
        }
      }
      const list = getMockData("invoices");
      const updated = list.map((inv: any) => (inv.id === id || inv.invoiceNumber === id ? { ...inv, ...payload } : inv));
      saveMockData("invoices", updated);
      notifyDataChange("invoices", "update", updated.find((inv: any) => inv.id === id || inv.invoiceNumber === id));
      return updated.find((inv: any) => inv.id === id || inv.invoiceNumber === id);
    },

    async cancel(id: string) {
      return this.update(id, { status: "cancelled" });
    }
  },

  // --- OFFERS SECTION ---
  offers: {
    async list() {
      if (supabase) {
        const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      }
      const list = getMockData("offers");
      return (list || []).sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
    },

    async getById(id: string) {
      if (supabase) {
        const { data, error } = await supabase.from("offers").select("*").or(`id.eq.${id},offer_code.eq.${id}`).single();
        if (error && error.code !== "PGRST116") throw error;
        return data || null;
      }
      const list = getMockData("offers");
      return list.find((o: any) => o.id === id || (o.offerCode || o.offer_code || "").toUpperCase() === id.toUpperCase()) || null;
    },

    async getByCode(code: string) {
      const cleanCode = (code || "").trim().toUpperCase();
      if (!cleanCode) return null;
      if (supabase) {
        const { data, error } = await supabase.from("offers").select("*").eq("offer_code", cleanCode).single();
        if (error && error.code !== "PGRST116") throw error;
        return data || null;
      }
      const list = getMockData("offers");
      return list.find((o: any) => (o.offerCode || o.offer_code || "").toUpperCase() === cleanCode) || null;
    },

    async create(offerData: any) {
      const cleanCode = (offerData.offerCode || offerData.offer_code || "").trim().toUpperCase();
      
      const existing = await this.getByCode(cleanCode);
      if (existing) {
        throw new Error(`Offer Code "${cleanCode}" already exists.`);
      }

      const now = new Date().toISOString();
      const payload = {
        id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        offerName: (offerData.offerName || offerData.offer_name || "").trim(),
        offerCode: cleanCode,
        offer_code: cleanCode,
        description: (offerData.description || "").trim(),
        discountType: offerData.discountType || "percentage",
        discount_type: offerData.discountType || "percentage",
        discountValue: Number(offerData.discountValue ?? offerData.discount_value) || 0,
        discount_value: Number(offerData.discountValue ?? offerData.discount_value) || 0,
        eligibleProducts: Array.isArray(offerData.eligibleProducts) ? offerData.eligibleProducts : ["all"],
        eligible_products: Array.isArray(offerData.eligibleProducts) ? offerData.eligibleProducts : ["all"],
        minimumPurchase: Number(offerData.minimumPurchase ?? offerData.minimum_purchase) || 0,
        minimum_purchase: Number(offerData.minimumPurchase ?? offerData.minimum_purchase) || 0,
        maximumDiscount: Number(offerData.maximumDiscount ?? offerData.maximum_discount) || 0,
        maximum_discount: Number(offerData.maximumDiscount ?? offerData.maximum_discount) || 0,
        startDate: offerData.startDate || offerData.start_date || now.split("T")[0],
        start_date: offerData.startDate || offerData.start_date || now.split("T")[0],
        expiryDate: offerData.expiryDate || offerData.expiry_date || "2026-12-31",
        expiry_date: offerData.expiryDate || offerData.expiry_date || "2026-12-31",
        usageLimit: Number(offerData.usageLimit ?? offerData.usage_limit) || 100,
        usage_limit: Number(offerData.usageLimit ?? offerData.usage_limit) || 100,
        perCustomerLimit: Number(offerData.perCustomerLimit ?? offerData.per_customer_limit) || 1,
        per_customer_limit: Number(offerData.perCustomerLimit ?? offerData.per_customer_limit) || 1,
        usageCount: 0,
        usage_count: 0,
        status: offerData.status || "ACTIVE",
        createdAt: now,
        created_at: now,
        updatedAt: now,
        updated_at: now,
        usedBy: [],
        used_by: []
      };

      if (supabase) {
        const databasePayload = {
          id: payload.id,
          offer_name: payload.offerName,
          offer_code: payload.offerCode,
          description: payload.description,
          discount_type: payload.discountType,
          discount_value: payload.discountValue,
          eligible_products: payload.eligibleProducts,
          minimum_purchase: payload.minimumPurchase,
          maximum_discount: payload.maximumDiscount,
          start_date: payload.startDate,
          expiry_date: payload.expiryDate,
          usage_limit: payload.usageLimit,
          per_customer_limit: payload.perCustomerLimit,
          usage_count: payload.usageCount,
          status: payload.status,
          created_at: payload.createdAt,
          updated_at: payload.updatedAt,
          used_by: payload.usedBy,
        };
        const { data, error } = await supabase.from("offers").insert([databasePayload]).select().single();
        if (error) throw error;
        if (!data) throw new Error("Offer creation did not return a saved record.");
        notifyDataChange("offers", "insert", data);
        return data;
      }

      const list = getMockData("offers");
      const updated = [payload, ...list];
      saveMockData("offers", updated);
      notifyDataChange("offers", "insert", payload);
      return payload;
    },

    async update(id: string, updates: any) {
      const existing = await this.getById(id);
      if (!existing) throw new Error("Offer not found.");

      const usage = Number(existing.usageCount ?? existing.usage_count) || 0;
      
      let cleanCode = existing.offerCode || existing.offer_code;
      if (updates.offerCode || updates.offer_code) {
        const newCode = (updates.offerCode || updates.offer_code).trim().toUpperCase();
        if (newCode !== cleanCode) {
          if (usage > 0) {
            throw new Error("Offer Code cannot be modified after it has been redeemed.");
          }
          cleanCode = newCode;
        }
      }

      const fields: Array<[string, string]> = [
        ["offerName", "offer_name"],
        ["description", "description"],
        ["discountType", "discount_type"],
        ["discountValue", "discount_value"],
        ["eligibleProducts", "eligible_products"],
        ["minimumPurchase", "minimum_purchase"],
        ["maximumDiscount", "maximum_discount"],
        ["startDate", "start_date"],
        ["expiryDate", "expiry_date"],
        ["usageLimit", "usage_limit"],
        ["perCustomerLimit", "per_customer_limit"],
        ["usageCount", "usage_count"],
        ["usedBy", "used_by"],
        ["status", "status"],
        ["archived", "archived"],
      ];
      const databasePayload: Record<string, any> = { offer_code: cleanCode, updated_at: new Date().toISOString() };
      for (const [camelCase, snakeCase] of fields) {
        if (camelCase in updates || snakeCase in updates) {
          databasePayload[snakeCase] = updates[camelCase] ?? updates[snakeCase];
        }
      }
      const mockPayload = {
        ...updates,
        offerCode: cleanCode,
        offer_code: cleanCode,
        updatedAt: databasePayload.updated_at,
        updated_at: databasePayload.updated_at,
      };

      if (supabase) {
        const { data, error } = await supabase.from("offers").update(databasePayload).eq("id", existing.id).select().single();
        if (error) throw error;
        if (!data) throw new Error("Offer update did not return a saved record.");
        notifyDataChange("offers", "update", data);
        return data;
      }

      const list = getMockData("offers");
      const updated = list.map((o: any) => (o.id === existing.id ? { ...o, ...mockPayload } : o));
      saveMockData("offers", updated);
      notifyDataChange("offers", "update", updated.find((o: any) => o.id === existing.id));
      return updated.find((o: any) => o.id === existing.id);
    },

    async toggleStatus(id: string) {
      const existing = await this.getById(id);
      if (!existing) throw new Error("Offer not found.");
      const currentStatus = existing.status || "ACTIVE";
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return this.update(id, { status: newStatus });
    },

    async deleteOrArchive(id: string) {
      const existing = await this.getById(id);
      if (!existing) throw new Error("Offer not found.");

      const usage = Number(existing.usageCount ?? existing.usage_count) || 0;
      
      if (usage > 0) {
        return this.update(id, { status: "INACTIVE", archived: true });
      }

      if (supabase) {
        const { error } = await supabase.from("offers").delete().eq("id", existing.id);
        if (error) throw error;
      }
      const list = getMockData("offers");
      const updated = list.filter((o: any) => o.id !== existing.id);
      saveMockData("offers", updated);
      notifyDataChange("offers", "delete", { id: existing.id });
      return { deleted: true, archived: false };
    },

    async validateForCustomer(code: string, cartItems: any[], customerEmail?: string, subtotalAmount?: number) {
      const cleanCode = (code || "").trim().toUpperCase();
      if (!cleanCode) {
        return { valid: false, message: "Offer code is required." };
      }

      const offer = await this.getByCode(cleanCode);
      if (!offer) {
        return { valid: false, message: "Invalid or expired referral code." };
      }

      if ((offer.status || "").toUpperCase() !== "ACTIVE") {
        return { valid: false, message: "Invalid or expired referral code." };
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const startDate = offer.startDate || offer.start_date || "2000-01-01";
      const expiryDate = offer.expiryDate || offer.expiry_date || "2099-12-31";

      if (todayStr < startDate || todayStr > expiryDate) {
        return { valid: false, message: "Invalid or expired referral code." };
      }

      const usageCount = Number(offer.usageCount ?? offer.usage_count) || 0;
      const usageLimit = Number(offer.usageLimit ?? offer.usage_limit) || 100;
      if (usageCount >= usageLimit) {
        return { valid: false, message: "Referral code usage limit has been reached." };
      }

      if (customerEmail && customerEmail.trim()) {
        const usedBy: string[] = offer.usedBy || offer.used_by || [];
        const userUsageCount = usedBy.filter((e) => e.toLowerCase() === customerEmail.trim().toLowerCase()).length;
        const perCustomerLimit = Number(offer.perCustomerLimit ?? offer.per_customer_limit) || 1;
        if (userUsageCount >= perCustomerLimit) {
          return { valid: false, message: "You have already reached the redemption limit for this code." };
        }
      }

      const minPurchase = Number(offer.minimumPurchase ?? offer.minimum_purchase) || 0;
      const calcSubtotal = subtotalAmount ?? cartItems.reduce((sum, item) => sum + (Number(item.price || item.unitPrice) * (Number(item.quantity) || 1)), 0);
      if (calcSubtotal < minPurchase) {
        return { valid: false, message: `Minimum purchase of ₹${minPurchase.toLocaleString("en-IN")} required for code ${cleanCode}.` };
      }

      const eligibleProducts: string[] = offer.eligibleProducts || offer.eligible_products || ["all"];
      if (!eligibleProducts.includes("all")) {
        const cartProdIds = cartItems.map((item) => item.id || item.productId || item.product_id);
        const hasEligibleProduct = cartProdIds.some((id) => eligibleProducts.includes(id));
        if (!hasEligibleProduct) {
          return { valid: false, message: `Offer ${cleanCode} is not applicable to the items in your cart.` };
        }
      }

      const discType = offer.discountType || offer.discount_type || "percentage";
      const discValue = Number(offer.discountValue ?? offer.discount_value) || 0;
      const maxDiscount = Number(offer.maximumDiscount ?? offer.maximum_discount) || 0;

      let discountAmount = 0;
      if (discType === "percentage") {
        discountAmount = (calcSubtotal * discValue) / 100;
      } else {
        discountAmount = discValue;
      }

      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }

      discountAmount = Math.min(discountAmount, calcSubtotal);

      return {
        valid: true,
        offer: {
          id: offer.id,
          code: offer.offerCode || offer.offer_code,
          name: offer.offerName || offer.offer_name,
          discountType: discType,
          discountValue: discValue,
          maximumDiscount: maxDiscount,
          discountAmount,
          description: offer.description
        },
        discountAmount
      };
    },

    async incrementUsage(id: string, customerEmail?: string) {
      const offer = await this.getById(id);
      if (!offer) return false;

      const currentUsage = Number(offer.usageCount ?? offer.usage_count) || 0;
      const usageLimit = Number(offer.usageLimit ?? offer.usage_limit) || 100;

      if (currentUsage >= usageLimit) {
        throw new Error("Offer usage limit reached.");
      }

      const usedBy: string[] = [...(offer.usedBy || offer.used_by || [])];
      const normalizedEmail = customerEmail?.trim().toLowerCase();
      if (normalizedEmail) usedBy.push(normalizedEmail);
      const updates = {
        usageCount: currentUsage + 1,
        usage_count: currentUsage + 1,
        usedBy,
        used_by: usedBy
      };

      return this.update(offer.id, updates);
    }
  },

  protectionPlans: {
    normalize(plan: any) {
      return {
        id: plan.id,
        title: plan.title || "",
        description: plan.description || "",
        price: Number(plan.price) || 0,
        duration: plan.duration || "Year",
        accent: plan.accent || "purple",
        isActive: plan.is_active ?? plan.isActive ?? true,
        sortOrder: Number(plan.sort_order ?? plan.sortOrder) || 0,
      };
    },

    async list() {
      if (supabase) {
        const { data, error } = await supabase
          .from("product_protection_plans")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return (data || []).map((plan) => this.normalize(plan));
      }
      return getMockData("protection_plans")
        .map((plan: any) => this.normalize(plan))
        .sort((left, right) => left.sortOrder - right.sortOrder);
    },

    async create(planData: any) {
      const now = new Date().toISOString();
      const plan = {
        id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: planData.title.trim(),
        description: planData.description.trim(),
        price: Number(planData.price),
        duration: planData.duration.trim(),
        accent: planData.accent,
        is_active: planData.isActive !== false,
        sort_order: Number(planData.sortOrder) || 0,
        created_at: now,
        updated_at: now,
      };
      if (supabase) {
        const { data, error } = await supabase.from("product_protection_plans").insert([plan]).select().single();
        if (error) throw error;
        if (!data) throw new Error("Protection plan creation did not return a saved record.");
        notifyDataChange("product_protection_plans", "insert", data);
        return this.normalize(data);
      }
      const updated = [...getMockData("protection_plans"), plan];
      saveMockData("protection_plans", updated);
      notifyDataChange("product_protection_plans", "insert", plan);
      return this.normalize(plan);
    },

    async update(id: string, updates: any) {
      const payload = {
        title: updates.title.trim(),
        description: updates.description.trim(),
        price: Number(updates.price),
        duration: updates.duration.trim(),
        accent: updates.accent,
        is_active: updates.isActive !== false,
        sort_order: Number(updates.sortOrder) || 0,
        updated_at: new Date().toISOString(),
      };
      if (supabase) {
        const { data, error } = await supabase.from("product_protection_plans").update(payload).eq("id", id).select().single();
        if (error) throw error;
        if (!data) throw new Error("Protection plan not found.");
        notifyDataChange("product_protection_plans", "update", data);
        return this.normalize(data);
      }
      const plans = getMockData("protection_plans");
      const updated = plans.map((plan: any) => plan.id === id ? { ...plan, ...payload } : plan);
      if (!updated.some((plan: any) => plan.id === id)) throw new Error("Protection plan not found.");
      saveMockData("protection_plans", updated);
      const saved = updated.find((plan: any) => plan.id === id);
      notifyDataChange("product_protection_plans", "update", saved);
      return this.normalize(saved);
    },

    async delete(id: string) {
      if (supabase) {
        const { error } = await supabase.from("product_protection_plans").delete().eq("id", id);
        if (error) throw error;
      } else {
        const plans = getMockData("protection_plans");
        saveMockData("protection_plans", plans.filter((plan: any) => plan.id !== id));
      }
      notifyDataChange("product_protection_plans", "delete", { id });
      return true;
    },
  },

  storeSettings: {
    async get(): Promise<StoreSettings> {
      if (supabase) {
        try {
          const { data, error } = await supabase.from("store_settings").select("*").eq("id", "global").single();
          if (data && !error && data.settings) {
            return deepMergeSettings(DEFAULT_STORE_SETTINGS, data.settings);
          }
        } catch (e) {}
      }
      const mock = getMockObject("store_settings");
      if (mock && typeof mock === "object" && Object.keys(mock).length > 0 && mock.appearance) {
        return deepMergeSettings(DEFAULT_STORE_SETTINGS, mock);
      }
      if (globalRef.__nexbyteMockDb?.storeSettings) {
        return deepMergeSettings(DEFAULT_STORE_SETTINGS, globalRef.__nexbyteMockDb.storeSettings);
      }
      return JSON.parse(JSON.stringify(DEFAULT_STORE_SETTINGS));
    },

    async update(partial: Partial<StoreSettings>, adminUser?: { email: string; name: string }): Promise<StoreSettings> {
      const current = await this.get();
      const updated: StoreSettings = deepMergeSettings(current, partial);
      updated.version = (current.version || 1) + 1;
      updated.updatedAt = new Date().toISOString();
      if (adminUser) {
        updated.updatedBy = {
          email: adminUser.email || "admin@nexbyte.com",
          name: adminUser.name || "Admin Officer",
        };
      }

      if (supabase) {
        try {
          await supabase.from("store_settings").upsert({
            id: "global",
            settings: updated,
            updated_at: updated.updatedAt,
          });
          await supabase.from("system_settings").upsert({
            id: "global",
            global_theme_policy: updated.appearance.customerThemePolicy,
            forced_theme: updated.appearance.forcedTheme === "night" ? "night" : "day",
            updated_at: updated.updatedAt,
          });
        } catch (e) {}
      }

      saveMockData("store_settings", updated);
      if (globalRef.__nexbyteMockDb) {
        globalRef.__nexbyteMockDb.storeSettings = updated;
        if (!globalRef.__nexbyteMockDb.systemSettings) {
          globalRef.__nexbyteMockDb.systemSettings = {};
        }
        globalRef.__nexbyteMockDb.systemSettings.global_theme_policy = updated.appearance.customerThemePolicy;
        globalRef.__nexbyteMockDb.systemSettings.forced_theme = updated.appearance.forcedTheme;
      }

      const changedCategories = Object.keys(partial).filter(
        (k) => !["id", "version", "updatedAt", "updatedBy"].includes(k)
      );
      await this.addAuditLog({
        adminEmail: adminUser?.email || "admin@nexbyte.com",
        adminName: adminUser?.name || "Admin Officer",
        category: changedCategories.join(", ") || "General Store Settings",
        action: "UPDATE",
        details: `Saved settings version ${updated.version} (${changedCategories.join(", ") || "Configuration updated"})`,
        changedFields: changedCategories,
      });

      notifyDataChange("store_settings", "UPDATE", updated);
      notifyDataChange("system_settings", "UPDATE", {
        policy: updated.appearance.customerThemePolicy,
        forcedTheme: updated.appearance.forcedTheme,
      });

      return updated;
    },

    async reset(adminUser?: { email: string; name: string }): Promise<StoreSettings> {
      const fresh: StoreSettings = JSON.parse(JSON.stringify(DEFAULT_STORE_SETTINGS));
      fresh.updatedAt = new Date().toISOString();
      if (adminUser) {
        fresh.updatedBy = { email: adminUser.email, name: adminUser.name };
      }
      return await this.update(fresh, adminUser);
    },

    async publish(adminUser?: { email: string; name: string }, summary: string = "Published configuration to live website"): Promise<{ success: boolean; version: number; settings: StoreSettings }> {
      const current = await this.get();
      const newVersion = (current.version || 1) + 1;
      const now = new Date().toISOString();
      const admin = {
        email: adminUser?.email || "admin@nexbyte.com",
        name: adminUser?.name || "Admin Officer",
      };

      const snapshot = {
        version: newVersion,
        publishedAt: now,
        publishedBy: admin,
        summary,
        snapshot: JSON.parse(JSON.stringify(current)),
      };

      const updatedHistory = [snapshot, ...(current.versionHistory || [])].slice(0, 25);

      const publishedSettings: StoreSettings = {
        ...current,
        version: newVersion,
        updatedAt: now,
        updatedBy: admin,
        publishWorkflow: {
          status: "published",
          publishedVersion: newVersion,
          draftVersion: newVersion,
          lastPublishedAt: now,
          lastPublishedBy: admin,
        },
        versionHistory: updatedHistory,
      };

      const result = await this.update(publishedSettings, adminUser);

      await this.addAuditLog({
        adminEmail: admin.email,
        adminName: admin.name,
        category: "Publish Workflow",
        action: "PUBLISH",
        details: `Published store settings version ${newVersion}. Summary: ${summary}`,
        changedFields: ["publishWorkflow", "versionHistory"],
      });

      return { success: true, version: newVersion, settings: result };
    },

    async rollback(targetVersion: number, adminUser?: { email: string; name: string }): Promise<StoreSettings> {
      const current = await this.get();
      const history = current.versionHistory || [];
      const match = history.find((h: any) => h.version === targetVersion);
      if (!match || !match.snapshot) {
        throw new Error(`Cannot rollback to version ${targetVersion}: snapshot not found.`);
      }

      const restored: StoreSettings = deepMergeSettings(DEFAULT_STORE_SETTINGS, match.snapshot);
      restored.version = (current.version || 1) + 1;
      restored.updatedAt = new Date().toISOString();
      restored.publishWorkflow = {
        status: "published",
        publishedVersion: restored.version,
        draftVersion: restored.version,
        lastPublishedAt: restored.updatedAt,
        lastPublishedBy: {
          email: adminUser?.email || "admin@nexbyte.com",
          name: adminUser?.name || "Admin Officer",
        },
      };

      const rollbackSnapshot = {
        version: restored.version,
        publishedAt: restored.updatedAt,
        publishedBy: restored.publishWorkflow.lastPublishedBy!,
        summary: `Rollback to version ${targetVersion}`,
        snapshot: JSON.parse(JSON.stringify(restored)),
      };
      restored.versionHistory = [rollbackSnapshot, ...history].slice(0, 25);

      const result = await this.update(restored, adminUser);

      await this.addAuditLog({
        adminEmail: adminUser?.email || "admin@nexbyte.com",
        adminName: adminUser?.name || "Admin Officer",
        category: "Publish Workflow",
        action: "ROLLBACK",
        details: `Restored store configuration from version ${targetVersion} to active version ${restored.version}`,
        changedFields: ["versionHistory", "publishWorkflow"],
      });

      return result;
    },

    async getVersions(): Promise<any[]> {
      const current = await this.get();
      return current.versionHistory || [];
    },

    async getAuditLog(limit: number = 30): Promise<SettingsAuditLogEntry[]> {
      if (supabase) {
        try {
          const { data } = await supabase
            .from("settings_audit_log")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(limit);
          if (data && data.length > 0) return data;
        } catch (e) {}
      }
      const list: SettingsAuditLogEntry[] =
        getMockData("settings_audit_log") || globalRef.__nexbyteMockDb?.settingsAuditLog || [];
      return list.slice(0, limit);
    },

    async addAuditLog(entry: Omit<SettingsAuditLogEntry, "id" | "timestamp">): Promise<SettingsAuditLogEntry> {
      const newEntry: SettingsAuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      };
      if (supabase) {
        try {
          await supabase.from("settings_audit_log").insert([newEntry]);
        } catch (e) {}
      }
      const list: SettingsAuditLogEntry[] =
        getMockData("settings_audit_log") || globalRef.__nexbyteMockDb?.settingsAuditLog || [];
      list.unshift(newEntry);
      saveMockData("settings_audit_log", list.slice(0, 100));
      if (globalRef.__nexbyteMockDb) {
        globalRef.__nexbyteMockDb.settingsAuditLog = list.slice(0, 100);
      }
      return newEntry;
    },
  },

  customerPreferences: {
    async get(customerId: string): Promise<CustomerPreferences> {
      if (!customerId) {
        return { ...DEFAULT_CUSTOMER_PREFERENCES, customerId: "guest" };
      }
      if (supabase) {
        try {
          const { data } = await supabase
            .from("customer_preferences")
            .select("*")
            .eq("customer_id", customerId)
            .single();
          if (data && data.preferences) {
            return {
              ...DEFAULT_CUSTOMER_PREFERENCES,
              ...data.preferences,
              customerId,
            };
          }
        } catch (e) {}
      }
      const map = getMockObject("customer_preferences_map");
      if (map && map[customerId]) {
        return {
          ...DEFAULT_CUSTOMER_PREFERENCES,
          ...map[customerId],
          customerId,
        };
      }
      return {
        ...DEFAULT_CUSTOMER_PREFERENCES,
        customerId,
      };
    },

    async update(customerId: string, prefs: Partial<CustomerPreferences>): Promise<CustomerPreferences> {
      const current = await this.get(customerId);
      const updated: CustomerPreferences = {
        ...current,
        ...prefs,
        customerId,
        updatedAt: new Date().toISOString(),
      };
      if (supabase) {
        try {
          await supabase.from("customer_preferences").upsert({
            customer_id: customerId,
            preferences: updated,
            updated_at: updated.updatedAt,
          });
        } catch (e) {}
      }
      const map = getMockObject("customer_preferences_map");
      map[customerId] = updated;
      saveMockData("customer_preferences_map", map);
      if (globalRef.__nexbyteMockDb) {
        if (!globalRef.__nexbyteMockDb.customerPreferencesMap) {
          globalRef.__nexbyteMockDb.customerPreferencesMap = {};
        }
        globalRef.__nexbyteMockDb.customerPreferencesMap[customerId] = updated;
      }
      notifyDataChange("customer_preferences", "UPDATE", { customerId, preferences: updated });
      return updated;
    },
  },

  systemSettings: {
    async get() {
      const storeSet = await dbHelper.storeSettings.get();
      return {
        policy: storeSet.appearance.customerThemePolicy || "personal",
        forcedTheme: storeSet.appearance.forcedTheme === "night" ? "night" : "day",
        ...storeSet,
      };
    },

    async update(policy: string, forcedTheme?: string) {
      const current = await dbHelper.storeSettings.get();
      const updated = await dbHelper.storeSettings.update({
        appearance: {
          ...current.appearance,
          customerThemePolicy: policy === "forced" ? "forced" : "personal",
          forcedTheme: forcedTheme === "night" ? "night" : "day",
        },
      });
      return {
        policy: updated.appearance.customerThemePolicy,
        forcedTheme: updated.appearance.forcedTheme,
      };
    },
  },

  // --- FILTER DEFINITIONS SECTION ---
  filterDefinitions: {
    async list(categoryId: string = "all") {
      if (supabase) {
        try {
          const { data } = await supabase
            .from("filter_definitions")
            .select("*")
            .eq("enabled", true)
            .order("sort_order", { ascending: true });
          if (data && data.length > 0) return data;
        } catch (e) {}
      }
      const list = getMockData("filterDefinitions") || DEFAULT_FILTER_DEFINITIONS;
      return list;
    },
    async save(definitions: any[]) {
      if (supabase) {
        try {
          await supabase.from("filter_definitions").upsert(definitions);
        } catch (e) {}
      }
      saveMockData("filterDefinitions", definitions);
      notifyDataChange("filter_definitions", "UPDATE", definitions);
      return definitions;
    },
  },

  // --- CUSTOMER VISITS & TRAFFIC ANALYTICS SECTION ---
  customerVisits: {
    async record(payload: any) {
      const { visitorAnalytics } = await import("@/lib/visitorAnalytics");
      return await visitorAnalytics.recordVisit(payload);
    },
    async getAnalytics() {
      const { visitorAnalytics } = await import("@/lib/visitorAnalytics");
      return await visitorAnalytics.getAnalytics();
    },
    async reset() {
      const { visitorAnalytics } = await import("@/lib/visitorAnalytics");
      return await visitorAnalytics.resetVisits();
    },
  },
};

export const db = dbHelper;
