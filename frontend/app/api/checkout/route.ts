import { NextRequest, NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getServerSession();
    if (!authUser || authUser.role !== "user") {
      return NextResponse.json(
        { success: false, error: "Sign in with a customer account to place an order.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      items,
      customer,
      shippingAddress,
      deliveryOption,
      gstDetails,
      paymentMethod,
      offerCode,
      protectionPlanId,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!customer?.email || !customer?.name || !customer?.phone) {
      return NextResponse.json({ error: "Customer name, email and phone are required." }, { status: 400 });
    }

    if (!shippingAddress?.addressLine1 || !shippingAddress?.city || !shippingAddress?.pincode) {
      return NextResponse.json({ error: "Complete shipping address is required." }, { status: 400 });
    }

    // 1. Fetch DB Products for authoritative price verification
    const dbProducts = await dbHelper.products.list();

    let serverSubtotal = 0;
    const reservedQuantities = new Map<string, number>();
    const verifiedItems = [];
    for (const [index, item] of items.entries()) {
      if (!item || typeof item !== "object") {
        return NextResponse.json({ error: `Cart item ${index + 1} is invalid.` }, { status: 400 });
      }

      const productId = String(item.productId || item.id || "");
      const prod = dbProducts.find((product: any) => product.id === productId);
      if (!prod) {
        return NextResponse.json({ error: `Product for cart item ${index + 1} is no longer available.` }, { status: 400 });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ error: `Quantity for "${prod.title}" must be a positive whole number.` }, { status: 400 });
      }

      const variants = Array.isArray(prod.variants) ? prod.variants : [];
      let variant: any = null;
      if (variants.length > 0) {
        if (!item.variantId) {
          return NextResponse.json({ error: `Choose a valid configuration for "${prod.title}" before ordering.` }, { status: 400 });
        }
        variant = variants.find((entry: any) => entry.id === item.variantId);
        if (!variant || variant.active === false) {
          return NextResponse.json({ error: `The selected configuration for "${prod.title}" is no longer available.` }, { status: 400 });
        }
      } else if (item.variantId) {
        return NextResponse.json({ error: `The selected configuration for "${prod.title}" is invalid.` }, { status: 400 });
      }

      const unitPrice = Number(variant ? variant.price : prod.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: `The price for "${prod.title}" is currently invalid.` }, { status: 400 });
      }

      const availableStock = variant?.stock ?? prod.stock;
      const stockKey = `${prod.id}:${variant?.id || ""}`;
      const requestedStock = (reservedQuantities.get(stockKey) || 0) + quantity;
      if (availableStock !== undefined && availableStock !== null && requestedStock > Number(availableStock)) {
        return NextResponse.json({
          error: `${variant?.name ? `${variant.name} of ` : ""}${prod.title} has only ${Number(availableStock)} in stock.`,
        }, { status: 400 });
      }
      reservedQuantities.set(stockKey, requestedStock);

      const lineTotal = unitPrice * quantity;
      serverSubtotal += lineTotal;
      verifiedItems.push({
        id: `item-${Date.now()}-${index}`,
        productId: prod.id,
        variantId: variant?.id || "",
        variantSku: variant?.sku || "",
        variant: variant?.name || "",
        title: `${prod.title}${variant?.name ? ` (${variant.name})` : ""}`,
        quantity,
        unitPrice,
        price: unitPrice,
        total: lineTotal,
        image: variant?.image || prod.image || "/images/poster-products.png",
      });
    }

    // 2. Validate Offer Discount Server-side
    let discountAmount = 0;
    let appliedOfferCode = "";
    let appliedOfferId = "";
    let offerValidationDetails: any = null;

    if (offerCode && String(offerCode).trim()) {
      const valResult = await dbHelper.offers.validateForCustomer(
        String(offerCode).trim(),
        verifiedItems,
        customer.email,
        serverSubtotal
      );

      if (!valResult.valid) {
        return NextResponse.json(
          { error: valResult.message || "This offer code is no longer valid. Remove it or choose another offer." },
          { status: 400 }
        );
      }
      discountAmount = Number(valResult.discountAmount) || 0;
      appliedOfferCode = String(valResult.offer?.code || offerCode).trim().toUpperCase();
      appliedOfferId = String(valResult.offer?.id || "");
      offerValidationDetails = valResult.offer;
    }

    // 3. Optional Protection Plan Verification
    let selectedPlanSnapshot: any = null;
    let protectionPlanPrice = 0;

    if (protectionPlanId && String(protectionPlanId).trim() && String(protectionPlanId).trim() !== "none") {
      const allPlans = await dbHelper.protectionPlans.list();
      const matchedPlan = allPlans.find((p: any) => p.id === String(protectionPlanId).trim() && p.isActive !== false);
      if (matchedPlan) {
        protectionPlanPrice = Number(matchedPlan.price) || 0;
        selectedPlanSnapshot = {
          id: matchedPlan.id,
          title: matchedPlan.title,
          price: protectionPlanPrice,
          duration: matchedPlan.duration || "1 Year",
          description: matchedPlan.description || "Hardware coverage plan",
        };
      }
    }

    // 4. Shipping Calculation
    let shippingFee = 0;
    if (deliveryOption === "express") {
      shippingFee = 199;
    } else if (serverSubtotal < 1000) {
      shippingFee = 99;
    }

    // 5. GST & Tax Calculation (18% inclusive/added breakdown)
    const netTaxable = Math.max(0, serverSubtotal - discountAmount);
    const gstRate = 0.18;
    const gstAmount = Math.round(netTaxable * gstRate);
    const cgstAmount = Math.round(gstAmount / 2);
    const sgstAmount = gstAmount - cgstAmount;
    const grandTotal = netTaxable + gstAmount + shippingFee + protectionPlanPrice;

    // 6. Auth User linking
    const userId = authUser.id;

    // 7. Generate Order record with complete Offer & Protection Plan snapshots
    const nextOrderId = await dbHelper.orders.getNextOrderId();
    const orderPayload = {
      order_id: nextOrderId,
      order_number: nextOrderId,
      user_id: userId,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      shipping_address: shippingAddress,
      delivery_option: deliveryOption || "standard",
      payment_method: paymentMethod || "COD",
      payment_status: paymentMethod === "COD" ? "Pending (COD)" : "Paid",
      status: "Confirmed",
      items: verifiedItems,
      subtotal_amount: serverSubtotal,
      discount_amount: discountAmount,
      applied_offer_id: appliedOfferId || null,
      applied_offer_code: appliedOfferCode || null,
      applied_offer_name: offerValidationDetails?.name || null,
      applied_offer_type: offerValidationDetails?.discountType || "percentage",
      applied_offer_value: offerValidationDetails?.discountValue || 0,
      applied_offer_discount: discountAmount,
      applied_offer_subtotal_basis: serverSubtotal,
      applied_offer_timestamp: appliedOfferId ? new Date().toISOString() : null,
      protection_plan: selectedPlanSnapshot,
      protection_plan_id: selectedPlanSnapshot?.id || null,
      protection_plan_price: protectionPlanPrice,
      gst_amount: gstAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      shipping_fee: shippingFee,
      total_amount: grandTotal,
      gst_details: gstDetails?.isGstInvoice ? gstDetails : null,
      courier: deliveryOption === "express" ? "NexLapTech Priority Express" : "NexLapTech Standard Logistics",
      tracking_number: `NEX-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
    };

    const savedOrder = await dbHelper.orders.create(orderPayload);

    // Auto-Register/Update Customer in Customers Directory
    try {
      await dbHelper.customers.autoCreateOrUpdate(customer.phone, {
        name: customer.name,
        email: customer.email,
        city: shippingAddress.city || "Bengaluru",
        address: `${shippingAddress.addressLine1 || ""}, ${shippingAddress.city || ""}`.trim(),
        actionType: "order",
        actionItem: verifiedItems.map((i: any) => i.title).join(", "),
      });
    } catch (custErr) {
      console.warn("Auto customer directory update notice:", custErr);
    }

    let offerUsageRecorded = true;
    if (appliedOfferId) {
      try {
        await dbHelper.offers.incrementUsage(appliedOfferId, customer.email);
      } catch (offerError) {
        offerUsageRecorded = false;
        console.error(`Order ${nextOrderId} was saved, but offer redemption tracking failed:`, offerError);
      }
    }

    // 7. Auto-Generate GST Invoice Record
    try {
      await dbHelper.invoices.create({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`,
        gstin: gstDetails?.gstin || "",
        companyName: gstDetails?.companyName || "",
        items: [
          ...verifiedItems.map((i: any) => ({
            description: `${i.title}${i.variant ? ` (${i.variant})` : ""}`,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total,
          })),
          ...(selectedPlanSnapshot ? [{
            description: `Optional Protection: ${selectedPlanSnapshot.title} (${selectedPlanSnapshot.duration})`,
            quantity: 1,
            unitPrice: protectionPlanPrice,
            total: protectionPlanPrice,
          }] : [])
        ],
        subtotal: serverSubtotal + protectionPlanPrice,
        discount: discountAmount,
        tax: gstAmount,
        cgst: cgstAmount,
        sgst: sgstAmount,
        total: grandTotal,
        paymentStatus: paymentMethod === "COD" ? "Unpaid" : "Paid",
        notes: `Auto-generated Tax Invoice for Order #${nextOrderId}${selectedPlanSnapshot ? ` [Includes ${selectedPlanSnapshot.title}]` : ""}`,
      });
    } catch (invErr) {
      console.error("Auto Invoice Creation Warning:", invErr);
    }

    // 8. Admin Realtime Notification
    try {
      await dbHelper.notifications.create({
        title: "🛒 New Hardware Order Placed!",
        message: `Order #${nextOrderId} by ${customer.name} (₹${grandTotal.toLocaleString("en-IN")})`,
        type: "order",
        recipient_role: "admin",
        reference_type: "order",
        reference_id: savedOrder.id || nextOrderId,
      });
    } catch (notifErr) {
      console.error("Order notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      order: savedOrder,
      message: "Order placed successfully!",
      warning: offerUsageRecorded ? undefined : "Your order is saved, but the offer usage counter could not be updated. Please contact support.",
    });
  } catch (err: any) {
    console.error("Checkout POST Error:", err);
    return NextResponse.json({ error: err.message || "Checkout failed." }, { status: 500 });
  }
}
