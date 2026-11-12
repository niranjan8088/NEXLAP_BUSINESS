import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

// Compute AI Recommendation Match Score and Rationale against actual inventory
function computeProductMatch(enquiry: any, product: any) {
  let score = 0;
  const reasons: string[] = [];
  const specs = product.specs || {};

  // 1. Budget Comparison
  const budgetStr = enquiry.budget || "";
  const budgetNum = parseInt(budgetStr.replace(/[^\d]/g, "").slice(0, 6), 10) || 0;
  const prodPrice = Number(product.price || 0);

  if (budgetNum > 0) {
    if (prodPrice <= budgetNum) {
      score += 35;
      reasons.push(`Priced at ₹${prodPrice.toLocaleString("en-IN")}, under maximum budget of ₹${budgetNum.toLocaleString("en-IN")}`);
    } else if (prodPrice <= budgetNum * 1.15) {
      score += 20;
      reasons.push(`Priced at ₹${prodPrice.toLocaleString("en-IN")}, slightly above budget but provides higher performance`);
    } else {
      reasons.push(`Price ₹${prodPrice.toLocaleString("en-IN")} exceeds preferred budget`);
    }
  } else {
    score += 20;
  }

  // 2. Brand Match
  const brandPref = (enquiry.brand_preference || "").toLowerCase();
  const prodBrand = (product.brand || product.title || "").toLowerCase();
  if (brandPref && brandPref !== "any brand" && brandPref !== "no preference") {
    if (prodBrand.includes(brandPref)) {
      score += 20;
      reasons.push(`Matches requested brand: ${enquiry.brand_preference}`);
    }
  } else {
    score += 10;
  }

  // 3. Processor Match
  const cpuPref = (enquiry.processor_preference || "").toLowerCase();
  const prodCpu = (specs.Processor || specs["Processor Brand"] || product.title || "").toLowerCase();
  if (cpuPref && cpuPref !== "no preference") {
    if (prodCpu.includes(cpuPref) || (cpuPref.includes("i5") && prodCpu.includes("i5")) || (cpuPref.includes("i7") && prodCpu.includes("i7")) || (cpuPref.includes("ryzen") && prodCpu.includes("ryzen"))) {
      score += 20;
      reasons.push(`Equipped with requested ${specs.Processor || cpuPref} processor`);
    }
  } else {
    score += 10;
  }

  // 4. RAM & Storage
  const ramPref = (enquiry.ram_preference || "").toLowerCase();
  const prodRam = (specs["RAM Capacity"] || product.title || "").toLowerCase();
  if (ramPref && ramPref !== "no preference") {
    if (prodRam.includes(ramPref) || (ramPref.includes("16") && prodRam.includes("16"))) {
      score += 15;
      reasons.push(`Includes ${specs["RAM Capacity"] || "16GB"} RAM meeting preferred specs`);
    }
  } else {
    score += 5;
  }

  // 5. Stock & Availability
  const stock = Number(product.in_stock ?? product.stock ?? 1);
  if (stock > 0) {
    score += 10;
    reasons.push(`In Stock (${stock} unit${stock > 1 ? "s" : ""} available immediately)`);
  } else {
    score -= 30;
    reasons.push("Currently out of stock (requires backorder)");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
    isInStock: stock > 0,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required." }, { status: 400 });
    }

    const [allEnquiries, allProducts] = await Promise.all([
      dbHelper.laptopEnquiries.list(),
      dbHelper.products.list(),
    ]);

    const enquiry = allEnquiries.find(
      (e: any) => e.id === id || e.reference_id?.toLowerCase() === id.toLowerCase()
    );

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    // Run inventory matching engine against real products
    const inventoryMatches = (allProducts || [])
      .map((p: any) => {
        const matchResult = computeProductMatch(enquiry, p);
        return {
          id: p.id,
          title: p.title,
          price: p.price,
          image: p.image,
          category: p.category,
          brand: p.brand,
          specs: p.specs,
          stock: p.in_stock ?? p.stock ?? 0,
          matchScore: matchResult.score,
          matchReasons: matchResult.reasons,
          isInStock: matchResult.isInStock,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8); // Top 8 inventory recommendations

    const responseData = {
      ...enquiry,
      inventoryMatches,
    };

    const res = NextResponse.json({ success: true, enquiry: responseData });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Enquiry Detail Error:", err);
    return NextResponse.json({ error: "Failed to fetch enquiry detail." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const allEnquiries = await dbHelper.laptopEnquiries.list();
    const existing = allEnquiries.find((e: any) => e.id === id || e.reference_id === id);

    if (!existing) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    // Update enquiry fields
    const updated = await dbHelper.laptopEnquiries.update(existing.id, {
      ...body,
      updated_at: new Date().toISOString(),
    });

    // Notify customer if status moved to quotation_sent or replied
    if (body.status && body.status !== existing.status) {
      if (existing.user_id || existing.customer_id) {
        await dispatchPipelineEvent({
          eventType: "LAPTOP_ENQUIRY_UPDATED",
          title: "💻 Enquiry Status Updated",
          message: `Your enquiry (${existing.reference_id || existing.id}) status is now: ${body.status}.`,
          recipientUserId: existing.user_id || existing.customer_id,
          referenceType: "laptop_enquiry",
          referenceId: existing.reference_id || existing.id,
          metadata: { enquiryId: existing.id, status: body.status },
        });
      }
    }

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (err: any) {
    console.error("PUT Enquiry Error:", err);
    return NextResponse.json({ error: "Failed to update enquiry." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required." }, { status: 400 });
    }

    await dbHelper.laptopEnquiries.delete(id);
    return NextResponse.json({ success: true, message: "Enquiry deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Enquiry Error:", err);
    return NextResponse.json({ error: "Failed to delete enquiry." }, { status: 500 });
  }
}

