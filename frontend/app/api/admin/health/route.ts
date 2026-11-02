import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const adminUser = await requireRole(["admin"]);
    const startTime = Date.now();

    let dbType = "Fail-Safe Local Store";
    let isConnected = true;
    let queryLatencyMs = 0;
    let errorMessage: string | null = null;
    let totalProducts = 0;
    let totalBookings = 0;
    let totalOrders = 0;

    if (supabase) {
      try {
        const pingStart = Date.now();
        const { count, error } = await supabase.from("products").select("*", { count: "exact", head: true });
        queryLatencyMs = Date.now() - pingStart;

        if (error) {
          isConnected = false;
          errorMessage = error.message;
          dbType = "Supabase (Unreachable / Error)";
        } else {
          dbType = "Supabase PostgreSQL (Cloud)";
          totalProducts = count || 0;
        }
      } catch (err: any) {
        isConnected = false;
        errorMessage = err.message || "Connection timeout to Supabase";
        dbType = "Supabase (Connection Failed)";
      }
    } else {
      // Local Database check
      const pingStart = Date.now();
      const products = await dbHelper.products.list();
      queryLatencyMs = Date.now() - pingStart;
      totalProducts = products.length;
      dbType = "Local Fail-Safe Store (Active)";
    }

    try {
      const bookings = await dbHelper.bookings.list();
      totalBookings = bookings.length;
    } catch {}

    try {
      const orders = await dbHelper.orders.list();
      totalOrders = orders.length;
    } catch {}

    const settings = await dbHelper.storeSettings.get();
    const memory = process.memoryUsage();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        type: dbType,
        connected: isConnected,
        latencyMs: queryLatencyMs,
        error: errorMessage,
      },
      settingsSummary: {
        version: settings.version,
        lastUpdated: settings.updatedAt,
        updatedBy: settings.updatedBy,
        published: settings.storefront.published,
        themePolicy: settings.appearance.customerThemePolicy,
        forcedTheme: settings.appearance.forcedTheme,
        maintenanceMode: settings.generalStore.maintenanceMode,
      },
      counts: {
        products: totalProducts,
        bookings: totalBookings,
        orders: totalOrders,
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
        memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        environment: process.env.NODE_ENV || "development",
      },
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

