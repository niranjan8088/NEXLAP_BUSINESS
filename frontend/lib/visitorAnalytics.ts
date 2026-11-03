const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export interface CustomerVisitRecord {
  id: string;
  timestamp: string; // ISO string
  date: string;      // YYYY-MM-DD
  month: string;     // YYYY-MM
  hour: number;      // 0-23
  dayOfWeek: string; // Monday, etc.
  path: string;
  title?: string;
  device: "desktop" | "mobile" | "tablet";
  visitorId: string;
  referrer?: string;
  ipAnonymized?: string;
  role: "customer" | "guest";
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  visits: number;
  uniqueVisitors: number;
}

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  visits: number;
  uniqueVisitors: number;
}

export interface HourlyDistributionPoint {
  hour: string;
  hourNum: number;
  visits: number;
  percentage: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
  desktopPct: number;
  mobilePct: number;
  tabletPct: number;
}

export interface TopPageItem {
  path: string;
  title: string;
  visits: number;
  percentage: number;
}

export interface CustomerVisitsAnalyticsData {
  todayVisits: number;
  yesterdayVisits: number;
  dailyGrowthPct: number;
  thisMonthVisits: number;
  lastMonthVisits: number;
  monthlyGrowthPct: number;
  totalVisits: number;
  uniqueVisitorsToday: number;
  uniqueVisitorsThisMonth: number;
  totalUniqueVisitors: number;
  avgDailyVisits: number;
  peakHourLabel: string;
  peakDayLabel: string;
  dailyTrends: DailyTrendPoint[];
  monthlyTrends: MonthlyTrendPoint[];
  hourlyDistribution: HourlyDistributionPoint[];
  deviceBreakdown: DeviceBreakdown;
  topPages: TopPageItem[];
  recentVisits: CustomerVisitRecord[];
  lastUpdated: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// In-memory reference for server runtime
const globalAny = globalThis as any;
if (!globalAny.__nexbyteCustomerVisits) {
  globalAny.__nexbyteCustomerVisits = null;
}

function anonymizeClientIp(ip?: string): string {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return "127.0.0.xxx";
  const clean = ip.replace(/^.*:/, ""); // handle IPv4-mapped IPv6
  if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length >= 3) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  return `${clean.slice(0, 8)}...xxx`;
}

function getStoredVisits(): CustomerVisitRecord[] {
  // If in-memory cache is present
  if (Array.isArray(globalAny.__nexbyteCustomerVisits)) {
    return globalAny.__nexbyteCustomerVisits;
  }

  // Server-side disk database sync
  if (typeof window === "undefined") {
    try {
      const p = eval("require")("path");
      const f = eval("require")("fs");
      const targetDir = f.existsSync(p.join(process.cwd(), "nexbyte", "frontend"))
        ? p.join(process.cwd(), "nexbyte", "frontend", "data")
        : p.join(process.cwd(), "data");
      const dbPath = p.join(targetDir, "mock_db.json");

      if (f.existsSync(dbPath)) {
        const raw = f.readFileSync(dbPath, "utf8");
        const json = JSON.parse(raw);
        if (Array.isArray(json.customer_visits)) {
          globalAny.__nexbyteCustomerVisits = json.customer_visits;
          return json.customer_visits;
        }
      }
    } catch (e) {}
  }

  globalAny.__nexbyteCustomerVisits = [];
  return [];
}

function saveStoredVisits(visits: CustomerVisitRecord[]) {
  globalAny.__nexbyteCustomerVisits = visits;

  if (typeof window === "undefined") {
    try {
      const p = eval("require")("path");
      const f = eval("require")("fs");
      const targetDir = f.existsSync(p.join(process.cwd(), "nexbyte", "frontend"))
        ? p.join(process.cwd(), "nexbyte", "frontend", "data")
        : p.join(process.cwd(), "data");
      if (!f.existsSync(targetDir)) {
        f.mkdirSync(targetDir, { recursive: true });
      }
      const dbPath = p.join(targetDir, "mock_db.json");
      let existingDb: any = {};
      if (f.existsSync(dbPath)) {
        try {
          existingDb = JSON.parse(f.readFileSync(dbPath, "utf8"));
        } catch (e) {}
      }
      existingDb.customer_visits = visits.slice(-10000); // keep recent 10,000 real records
      f.writeFileSync(dbPath, JSON.stringify(existingDb, null, 2), "utf8");
    } catch (e) {}
  }
}

export const visitorAnalytics = {
  /**
   * Record an authentic real customer/visitor visit
   */
  async recordVisit(payload: {
    path: string;
    title?: string;
    referrer?: string;
    visitorId?: string;
    device?: "desktop" | "mobile" | "tablet";
    ip?: string;
    role?: "customer" | "guest";
  }): Promise<CustomerVisitRecord> {
    const visits = getStoredVisits();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const monthStr = dateStr.substring(0, 7);
    const hour = now.getHours();
    const dayOfWeek = DAYS_OF_WEEK[now.getDay()];

    const cleanPath = payload.path || "/";
    const visitorId = payload.visitorId || `vis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

    const record: CustomerVisitRecord = {
      id: `visit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      date: dateStr,
      month: monthStr,
      hour,
      dayOfWeek,
      path: cleanPath,
      title: payload.title || cleanPath,
      device: payload.device || "desktop",
      visitorId,
      referrer: payload.referrer || "",
      ipAnonymized: anonymizeClientIp(payload.ip),
      role: payload.role || "guest",
    };

    visits.push(record);
    saveStoredVisits(visits);

    // Optional Supabase insertion if configured
    if (hasSupabaseConfig) {
      try {
        const { supabase } = await import("@/lib/server/supabase");
        await supabase.from("customer_visits").insert([record]);
      } catch (e) {}
    }

    return record;
  },

  /**
   * Reset visitor analytics logs
   */
  async resetVisits(): Promise<void> {
    saveStoredVisits([]);
  },

  /**
   * Calculate full real analytics metrics, daily & monthly trends, and charts data
   */
  async getAnalytics(): Promise<CustomerVisitsAnalyticsData> {
    const visits = getStoredVisits();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const thisMonthStr = todayStr.substring(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonthDate.toISOString().split("T")[0].substring(0, 7);

    // 1. Basic real counts
    const todayRecords = visits.filter((v) => v.date === todayStr);
    const yesterdayRecords = visits.filter((v) => v.date === yesterdayStr);
    const thisMonthRecords = visits.filter((v) => v.month === thisMonthStr);
    const lastMonthRecords = visits.filter((v) => v.month === lastMonthStr);

    const todayVisits = todayRecords.length;
    const yesterdayVisits = yesterdayRecords.length;
    const dailyGrowthPct = yesterdayVisits > 0
      ? Number((((todayVisits - yesterdayVisits) / yesterdayVisits) * 100).toFixed(1))
      : 0;

    const thisMonthVisits = thisMonthRecords.length;
    const lastMonthVisits = lastMonthRecords.length;
    const monthlyGrowthPct = lastMonthVisits > 0
      ? Number((((thisMonthVisits - lastMonthVisits) / lastMonthVisits) * 100).toFixed(1))
      : 0;

    const uniqueVisitorsToday = new Set(todayRecords.map((v) => v.visitorId)).size;
    const uniqueVisitorsThisMonth = new Set(thisMonthRecords.map((v) => v.visitorId)).size;
    const totalUniqueVisitors = new Set(visits.map((v) => v.visitorId)).size;

    // 2. Daily Trends (last 30 days)
    const dailyTrends: DailyTrendPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split("T")[0];
      const dayRecords = visits.filter((v) => v.date === dStr);
      const uniqueCount = new Set(dayRecords.map((v) => v.visitorId)).size;

      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
      dailyTrends.push({
        date: dStr,
        label,
        visits: dayRecords.length,
        uniqueVisitors: uniqueCount,
      });
    }

    // 3. Monthly Trends (last 12 months)
    const monthlyTrends: MonthlyTrendPoint[] = [];
    for (let m = 11; m >= 0; m--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mStr = mDate.toISOString().split("T")[0].substring(0, 7);
      const mRecords = visits.filter((v) => v.month === mStr);
      const uniqueCount = new Set(mRecords.map((v) => v.visitorId)).size;

      const label = `${MONTH_NAMES[mDate.getMonth()]} ${mDate.getFullYear()}`;
      monthlyTrends.push({
        month: mStr,
        label,
        visits: mRecords.length,
        uniqueVisitors: uniqueCount,
      });
    }

    // 4. Hourly Distribution (0 to 23)
    const hourlyCounts = Array(24).fill(0);
    visits.forEach((v) => {
      if (typeof v.hour === "number" && v.hour >= 0 && v.hour < 24) {
        hourlyCounts[v.hour]++;
      }
    });

    const maxHourly = Math.max(...hourlyCounts, 1);
    const hourlyDistribution: HourlyDistributionPoint[] = hourlyCounts.map((count, hourNum) => ({
      hour: `${hourNum.toString().padStart(2, "0")}:00`,
      hourNum,
      visits: count,
      percentage: Number(((count / maxHourly) * 100).toFixed(1)),
    }));

    // Find peak hour
    let peakHourLabel = "Awaiting traffic";
    let peakCount = 0;
    hourlyCounts.forEach((cnt, idx) => {
      if (cnt > peakCount) {
        peakCount = cnt;
        peakHourLabel = `${idx.toString().padStart(2, "0")}:00 - ${(idx + 1).toString().padStart(2, "0")}:00`;
      }
    });

    // 5. Peak Day of Week
    const dayCounts: Record<string, number> = {};
    DAYS_OF_WEEK.forEach((d) => (dayCounts[d] = 0));
    visits.forEach((v) => {
      if (dayCounts[v.dayOfWeek] !== undefined) {
        dayCounts[v.dayOfWeek]++;
      }
    });
    let peakDayLabel = "Awaiting traffic";
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([day, cnt]) => {
      if (cnt > maxDayCount) {
        maxDayCount = cnt;
        peakDayLabel = day;
      }
    });

    // 6. Device Breakdown
    let desktop = 0;
    let mobile = 0;
    let tablet = 0;
    visits.forEach((v) => {
      if (v.device === "mobile") mobile++;
      else if (v.device === "tablet") tablet++;
      else desktop++;
    });

    const totalDev = desktop + mobile + tablet;
    const deviceBreakdown: DeviceBreakdown = {
      desktop,
      mobile,
      tablet,
      desktopPct: totalDev > 0 ? Math.round((desktop / totalDev) * 100) : 0,
      mobilePct: totalDev > 0 ? Math.round((mobile / totalDev) * 100) : 0,
      tabletPct: totalDev > 0 ? Math.round((tablet / totalDev) * 100) : 0,
    };

    // 7. Top Visited Pages
    const pageMap: Record<string, { title: string; count: number }> = {};
    visits.forEach((v) => {
      const p = v.path || "/";
      if (!pageMap[p]) {
        pageMap[p] = { title: v.title || p, count: 0 };
      }
      pageMap[p].count++;
    });

    const topPages: TopPageItem[] = Object.entries(pageMap)
      .map(([path, info]) => ({
        path,
        title: info.title,
        visits: info.count,
        percentage: visits.length > 0 ? Number(((info.count / visits.length) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 8);

    // 8. Recent Visits (latest 20)
    const recentVisits = [...visits].reverse().slice(0, 20);

    const activeDaysCount = dailyTrends.filter((d) => d.visits > 0).length || 1;
    const sumDailyVisits = dailyTrends.reduce((acc, curr) => acc + curr.visits, 0);
    const avgDailyVisits = Math.round(sumDailyVisits / activeDaysCount);

    return {
      todayVisits,
      yesterdayVisits,
      dailyGrowthPct,
      thisMonthVisits,
      lastMonthVisits,
      monthlyGrowthPct,
      totalVisits: visits.length,
      uniqueVisitorsToday,
      uniqueVisitorsThisMonth,
      totalUniqueVisitors,
      avgDailyVisits,
      peakHourLabel,
      peakDayLabel,
      dailyTrends,
      monthlyTrends,
      hourlyDistribution,
      deviceBreakdown,
      topPages,
      recentVisits,
      lastUpdated: now.toISOString(),
    };
  },
};
