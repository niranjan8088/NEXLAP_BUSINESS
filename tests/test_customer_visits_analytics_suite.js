/**
 * Test Suite: Customer Daily & Monthly Visits Count & Analytics
 *
 * Verifies:
 * 1. GET /api/analytics/visits returns accurate daily, monthly, and all-time traffic counts
 * 2. Trends datasets: 30-day daily trends & 12-month monthly trends
 * 3. 24-hour diurnal customer visiting distribution (hourly counts 0..23)
 * 4. Device breakdown (Mobile, Desktop, Tablet)
 * 5. POST /api/analytics/track logs customer visits & ignores admin routes
 * 6. Live test simulation increments daily count in real time
 * 7. Admin Settings integration & chart component contracts
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

function makeRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, "http://localhost:3000");
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        ...headers,
      },
    };

    if (body) {
      const data = typeof body === "string" ? body : JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          json = raw;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on("error", (err) => reject(err));
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSuite() {
  console.log("================================================================================");
  console.log("RUNNING SUITE: Customer Visits Count, Daily/Monthly Telemetry & Charts");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = "") {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc} ${details ? "- " + details : ""}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Analytics Endpoint Contract
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Visitor Analytics Endpoint ---");
  const getRes = await makeRequest("GET", "/api/analytics/visits");
  assert("GET /api/analytics/visits returns 200 OK", getRes.status === 200);
  assert("Response contains success flag", getRes.data?.success === true);
  assert("Analytics payload is present", typeof getRes.data?.analytics === "object");

  const a = getRes.data?.analytics || {};
  assert("Today customer visits is a valid number", typeof a.todayVisits === "number" && a.todayVisits >= 0);
  assert("This month customer visits is a positive count", typeof a.thisMonthVisits === "number" && a.thisMonthVisits > 0);
  assert("All-time total visits exceeds or equals this month visits", a.totalVisits >= a.thisMonthVisits);
  assert("Unique visitors today is a valid count", typeof a.uniqueVisitorsToday === "number" && a.uniqueVisitorsToday >= 0);
  assert("Unique visitors this month is a valid count", typeof a.uniqueVisitorsThisMonth === "number" && a.uniqueVisitorsThisMonth > 0);
  assert("Average daily run-rate is reported", typeof a.avgDailyVisits === "number" && a.avgDailyVisits > 0);

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Graph Datasets & Trends
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Graph & Chart Datasets ---");
  assert("Daily trends dataset provides 30 days of data", Array.isArray(a.dailyTrends) && a.dailyTrends.length === 30);
  assert("Daily points include date, label, visits and unique count",
    a.dailyTrends[0] &&
    typeof a.dailyTrends[0].date === "string" &&
    typeof a.dailyTrends[0].visits === "number" &&
    typeof a.dailyTrends[0].uniqueVisitors === "number"
  );

  assert("Monthly trends dataset provides 12 months of data", Array.isArray(a.monthlyTrends) && a.monthlyTrends.length === 12);
  assert("Monthly points include month, label, visits and unique count",
    a.monthlyTrends[0] &&
    typeof a.monthlyTrends[0].month === "string" &&
    typeof a.monthlyTrends[0].visits === "number" &&
    typeof a.monthlyTrends[0].uniqueVisitors === "number"
  );

  assert("Hourly distribution covers 24 hours of day (0..23)",
    Array.isArray(a.hourlyDistribution) && a.hourlyDistribution.length === 24
  );
  assert("Peak hour label is calculated", typeof a.peakHourLabel === "string" && a.peakHourLabel.length > 0);

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Device & Page Breakdown
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Device Breakdown & Top Pages ---");
  assert("Device breakdown tracks Mobile, Desktop and Tablet",
    typeof a.deviceBreakdown?.mobile === "number" &&
    typeof a.deviceBreakdown?.desktop === "number" &&
    typeof a.deviceBreakdown?.tablet === "number"
  );
  const totalDevPct = (a.deviceBreakdown?.mobilePct || 0) + (a.deviceBreakdown?.desktopPct || 0) + (a.deviceBreakdown?.tabletPct || 0);
  assert("Device percentages sum to approximately 100%", totalDevPct >= 98 && totalDevPct <= 102);

  assert("Top visited pages list is populated", Array.isArray(a.topPages) && a.topPages.length > 0);
  assert("Top page item contains path, title, visits, and percentage",
    a.topPages[0] &&
    typeof a.topPages[0].path === "string" &&
    typeof a.topPages[0].visits === "number" &&
    typeof a.topPages[0].percentage === "number"
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Visitor Tracking Pipeline
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Visitor Tracking API Pipeline ---");
  // 4a. Track legitimate customer visit
  const testVisitorId = `vis-test-${Date.now()}`;
  const trackCustomerRes = await makeRequest("POST", "/api/analytics/track", {}, {
    path: "/customer/shop",
    title: "All Verified Products",
    referrer: "https://google.com",
    device: "mobile",
    visitorId: testVisitorId,
  });
  assert("POST /api/analytics/track records customer visit with 200 OK", trackCustomerRes.status === 200);
  assert("Returns generated visitId and timestamp", !!trackCustomerRes.data?.visitId && !!trackCustomerRes.data?.timestamp);

  // 4b. Ignore admin routes so admin page navigation does not pollute customer statistics
  const trackAdminRes = await makeRequest("POST", "/api/analytics/track", {}, {
    path: "/admin/settings",
    title: "Admin Settings",
    device: "desktop",
    visitorId: "admin-tester",
  });
  assert("Admin routes are ignored from customer counts", trackAdminRes.data?.ignored === true);

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Live Simulation & Dynamic Update
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Live Simulation & Real-time Graph Update ---");
  const beforeCount = a.todayVisits;
  const simRes = await makeRequest("POST", "/api/analytics/visits", {}, { action: "simulate" });
  assert("POST /api/analytics/visits with simulate action returns 200 OK", simRes.status === 200);
  assert("Today customer visits increments in real time", simRes.data?.analytics?.todayVisits >= beforeCount + 1);

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Admin Settings Page Integration Contract
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Admin Settings Page Integration Contract ---");
  const settingsPagePath = path.join(process.cwd(), "nexbyte", "frontend", "app", "admin", "settings", "page.tsx");
  const settingsContent = fs.readFileSync(settingsPagePath, "utf8");

  assert('Admin settings imports CustomerVisitsAnalyticsSection',
    settingsContent.includes("CustomerVisitsAnalyticsSection")
  );
  assert('CATEGORIES includes customerVisitsAnalytics with "Customer Traffic & Visits"',
    settingsContent.includes('"customerVisitsAnalytics"') &&
    settingsContent.includes("Customer Traffic & Visits")
  );
  assert('Admin settings renders CustomerVisitsAnalyticsSection when active',
    settingsContent.includes('activeCategory === "customerVisitsAnalytics"') &&
    settingsContent.includes("<CustomerVisitsAnalyticsSection")
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: CustomerVisitsAnalyticsSection Component Contract
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Component & Chart Features Contract ---");
  const compPath = path.join(process.cwd(), "nexbyte", "frontend", "components", "admin", "CustomerVisitsAnalyticsSection.tsx");
  const compContent = fs.readFileSync(compPath, "utf8");

  assert("Component has interactive SVG Area / Curve chart", compContent.includes("<svg") && compContent.includes("linearGradient"));
  assert("Component supports switching between Area and Bar chart", compContent.includes('chartType === "area"') && compContent.includes('chartType === "bar"'));
  assert("Component supports 7d, 14d, 30d, and monthly timeframes",
    compContent.includes('"7d"') && compContent.includes('"14d"') && compContent.includes('"30d"') && compContent.includes('"monthly"')
  );
  assert("Component includes CSV Export functionality", compContent.includes("handleExportCsv") && compContent.includes(".csv"));
  assert("Component includes Simulate Customer Visit live test trigger", compContent.includes("handleSimulateVisit"));
  assert("Component displays 24-hour diurnal customer visiting distribution", compContent.includes("hourlyDistribution"));
  assert("Component displays Device & Platform Breakdown", compContent.includes("deviceBreakdown"));

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

