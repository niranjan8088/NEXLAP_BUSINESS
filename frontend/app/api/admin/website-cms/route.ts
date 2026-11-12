import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

const DEFAULT_CMS_CONTENT: Record<string, any> = {
  business_info: {
    businessName: "NexLapTech — NexByte Technologies",
    gstin: "29ABCDE1234F1Z5",
    registeredAddress: "No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101",
    logoUrl: "/assets/nexlaptech-logo.webp",
    invoiceFooter: "Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems",
    phone1: "+91 8088979706",
    phone2: "+91 8904760125",
    email: "nexbytetechnologies@gmail.com",
  },
  hero: {
    headline: "Premium IT Solutions — NexLapTech",
    subheadline: "Laptops, Gaming PCs, Servers, Accessories, Repairs & Academy Training.",
    cta: "Explore Products",
    secondary_cta: "Book a Service",
  },
  seo: {
    title: "NexLapTech — Hardware, Repairs & IT Training",
    description: "NexLapTech offers premium laptops, gaming PCs, servers, bulk hardware supply, CCTV installation, software support, and IT academy training in Tamil Nadu & Karnataka.",
    keywords: "laptop repair, gaming PC, computer service, bulk supply, IT training, CCTV installation, NexLapTech",
    og_image: "/images/poster-products.webp",
  },
  banners: [
    {
      id: 1,
      title: "Festive Tech Mega Sale",
      subtitle: "Up to 40% discount on certified enterprise laptops and PC workstations.",
      cta: "Shop Now",
      enabled: true,
      link: "/products",
    },
    {
      id: 2,
      title: "Same-Day Doorstep Laptop Diagnostics",
      subtitle: "Book verified chip-level technicians across Tumkur and Bengaluru.",
      cta: "Schedule Repair",
      enabled: true,
      link: "/services",
    },
  ],
  products_section: {
    title: "Explore Products",
    subtitle: "Premium hardware selection for students, professionals, and gamers.",
  },
  services_section: {
    title: "Our IT Services",
    subtitle: "Motherboard repairs, software setups, network wiring, and CCTV integrations.",
  },
  training_section: {
    title: "NexLapTech Academy Training",
    subtitle: "Learn practical desktop and laptop repairing skills from certified engineers.",
  },
  internship_section: {
    title: "IEEE Project Internships",
    subtitle: "Submit candidate applications for engineering academic project slots.",
  },
  faq: [
    {
      q: "Do you offer doorstep pickup and drop for laptop repairs?",
      a: "Yes! NexLapTech offers convenient doorstep pickup and delivery across service areas with real-time tracking.",
    },
    {
      q: "Are the renewed and second-hand laptops covered by warranty?",
      a: "Every verified renewed laptop comes with comprehensive hardware testing and an official NexLapTech 6-month warranty.",
    },
    {
      q: "Can I get GST input credit on business hardware purchases?",
      a: "Absolutely. Provide your company GSTIN during checkout to receive official tax invoices eligible for 18% / 28% GST input credit.",
    },
  ],
  contact_info: {
    phone1: "+91 8088979706",
    phone2: "+91 8904760125",
    email: "nexbytetechnologies@gmail.com",
    address: "No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101",
  },
  social: {
    whatsapp: "https://wa.me/918088979706",
    instagram: "https://instagram.com/nexbyte_technologies",
    facebook: "https://facebook.com/nexbytetech",
    youtube: "https://youtube.com/@nexbytetech",
    googleForm: "https://forms.gle/nexbyte-feedback",
  },
};

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const data = await dbHelper.cmsContent.get();
    const mergedContent: Record<string, any> = { ...DEFAULT_CMS_CONTENT };

    if (data && typeof data === "object") {
      Object.keys(DEFAULT_CMS_CONTENT).forEach((section) => {
        if (data[section]) {
          mergedContent[section] = data[section];
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        content: mergedContent,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve CMS content." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { section, content, sections } = body;

    const sectionsToUpdate: Record<string, any> = {};

    if (section && content) {
      sectionsToUpdate[section] = content;
    } else if (sections && typeof sections === "object") {
      Object.assign(sectionsToUpdate, sections);
    } else {
      return NextResponse.json(
        { error: "Invalid payload: provide 'section' with 'content', or 'sections' object." },
        { status: 400 }
      );
    }

    // Validate GSTIN if business_info is being updated
    if (sectionsToUpdate.business_info?.gstin) {
      const gstinVal = sectionsToUpdate.business_info.gstin.trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstinVal && !gstinRegex.test(gstinVal)) {
        return NextResponse.json(
          { error: "Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 29ABCDE1234F1Z5)." },
          { status: 400 }
        );
      }
      sectionsToUpdate.business_info.gstin = gstinVal;
    }

    const updatedKeys = Object.keys(sectionsToUpdate);
    await Promise.all(
      updatedKeys.map((secKey) => dbHelper.cmsContent.update(secKey, sectionsToUpdate[secKey]))
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${updatedKeys.length} CMS section(s).`,
      updatedSections: updatedKeys,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update CMS content." },
      { status: 500 }
    );
  }
}

