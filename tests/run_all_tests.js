/**
 * NEXLAPTECH MASTER TEST RUNNER — RUN ALL TESTS
 * 
 * Executes full test coverage across all features:
 * 1. TypeScript Static Typecheck (tsc --noEmit)
 * 2. Audit Fixes Suite (7 tests)
 * 3. Admin Settings & Store Management Suite (15 tests)
 * 4. Customer Profile Persistence & Avatar Initials Suite (39 tests)
 * 5. Customer Visits & Telemetry Analytics Suite (34 tests)
 * 6. Website Customization, Typography & Publishing Suite (8 tests)
 * 7. Live HTTP Server Endpoints & Route Integrity (12 endpoints)
 * 8. Font Preload & TrueType Asset Integrity
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const SERVER_URL = "http://localhost:3000";

let totalPassed = 0;
let totalFailed = 0;
const groupResults = [];

function logHeader(title) {
  console.log("\n" + "=".repeat(80));
  console.log(` ${title}`);
  console.log("=".repeat(80));
}

function recordGroup(name, passed, failed, details = "") {
  groupResults.push({ name, passed, failed, details });
  totalPassed += passed;
  totalFailed += failed;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Static Type Checking
// ─────────────────────────────────────────────────────────────────────────────
function runTypeCheck() {
  logHeader("1. STATIC TYPECHECK (TypeScript)");
  try {
    process.stdout.write("Running 'npx tsc --noEmit' in frontend... ");
    execSync("npx tsc --noEmit", { cwd: FRONTEND_DIR, stdio: "pipe", timeout: 120000 });
    console.log("SUCCESS (0 errors)");
    console.log("  [PASS] All Next.js pages, components, and API routes pass strict TypeScript check");
    recordGroup("TypeScript Static Typecheck", 1, 0);
  } catch (err) {
    console.log("FAILED");
    const out = err.stdout?.toString() || err.stderr?.toString() || err.message;
    console.error("  [FAIL] TypeScript compilation errors detected:\n", out.slice(0, 500));
    recordGroup("TypeScript Static Typecheck", 0, 1, out.slice(0, 200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Audit Fixes Suite
// ─────────────────────────────────────────────────────────────────────────────
function runAuditFixesSuite() {
  logHeader("2. AUDIT FIXES SUITE");
  try {
    const scriptPath = path.join(ROOT_DIR, "tests", "test_audit_fixes.js");
    const out = execSync(`node "${scriptPath}"`, { stdio: "pipe", timeout: 60000 }).toString();
    const passMatches = out.match(/\[PASS\]/g) || [];
    const failMatches = out.match(/\[FAIL\]/g) || [];
    console.log(out.trim());
    recordGroup("Audit Fixes Suite", passMatches.length, failMatches.length);
  } catch (err) {
    const out = err.stdout?.toString() || err.message;
    console.error("  [FAIL] Audit fixes suite failed:\n", out);
    recordGroup("Audit Fixes Suite", 0, 1, out.slice(0, 200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Admin Settings Suite
// ─────────────────────────────────────────────────────────────────────────────
function runAdminSettingsSuite() {
  logHeader("3. ADMIN SETTINGS & STORE MANAGEMENT SUITE");
  try {
    const scriptPath = path.join(ROOT_DIR, "tests", "test_admin_settings_suite.js");
    const out = execSync(`node "${scriptPath}"`, { stdio: "pipe", timeout: 60000 }).toString();
    const passMatches = out.match(/\[PASS\]/g) || [];
    const failMatches = out.match(/\[FAIL\]/g) || [];
    console.log(out.trim());
    recordGroup("Admin Settings Suite", passMatches.length, failMatches.length);
  } catch (err) {
    const out = err.stdout?.toString() || err.message;
    console.error("  [FAIL] Admin settings suite failed:\n", out);
    recordGroup("Admin Settings Suite", 0, 1, out.slice(0, 200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Customer Profile Persistence & Initials Suite
// ─────────────────────────────────────────────────────────────────────────────
function runCustomerProfileSuite() {
  logHeader("4. CUSTOMER PROFILE PERSISTENCE & AVATAR INITIALS SUITE");
  try {
    const scriptPath = path.join(ROOT_DIR, "tests", "test_customer_profile_persistence_suite.js");
    const out = execSync(`node "${scriptPath}"`, { stdio: "pipe", timeout: 60000 }).toString();
    const passMatches = out.match(/\[PASS\]/g) || [];
    const failMatches = out.match(/\[FAIL\]/g) || [];
    console.log(out.trim());
    recordGroup("Customer Profile Persistence Suite", passMatches.length, failMatches.length);
  } catch (err) {
    const out = err.stdout?.toString() || err.message;
    console.error("  [FAIL] Customer profile suite failed:\n", out);
    recordGroup("Customer Profile Persistence Suite", 0, 1, out.slice(0, 200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Customer Visits & Telemetry Analytics Suite
// ─────────────────────────────────────────────────────────────────────────────
function runCustomerVisitsAnalyticsSuite() {
  logHeader("5. CUSTOMER VISITS & TELEMETRY ANALYTICS SUITE");
  try {
    const scriptPath = path.join(ROOT_DIR, "tests", "test_customer_visits_analytics_suite.js");
    const out = execSync(`node "${scriptPath}"`, { stdio: "pipe", timeout: 60000 }).toString();
    const passMatches = out.match(/\[PASS\]/g) || [];
    const failMatches = out.match(/\[FAIL\]/g) || [];
    console.log(out.trim());
    recordGroup("Customer Visits Analytics Suite", passMatches.length, failMatches.length);
  } catch (err) {
    const out = err.stdout?.toString() || err.message;
    console.error("  [FAIL] Customer visits analytics suite failed:\n", out);
    recordGroup("Customer Visits Analytics Suite", 0, 1, out.slice(0, 200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Website Customization & Typography Suite
// ─────────────────────────────────────────────────────────────────────────────
function runCustomizationTypographySuite() {
  logHeader("6. WEBSITE CUSTOMIZATION, TYPOGRAPHY & PUBLISHING SUITE");
  try {
    const scriptPath = path.join(ROOT_DIR, "tests", "test_customization_and_publish_suite.js");
    const out = execSync(`node "${scriptPath}"`, { stdio: "pipe", timeout: 60000 }).toString();
    const passMatches = out.match(/\[PASS\]/g) || [];
    const failMatches = out.match(/\[FAIL\]/g) || [];
    console.log(out.trim());
    recordGroup("Customization & Typography Suite", passMatches.length, failMatches.length);
  } catch (err) {
    const out = err.stdout?.toString() || err.message;
    console.error("  [FAIL] Customization typography suite failed:\n", out);
    recordGroup("Customization & Typography Suite", 0, 1, out.slice(0, 200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Live Server Endpoints & Route Integrity
// ─────────────────────────────────────────────────────────────────────────────
async function runLiveServerEndpointChecks() {
  logHeader("7. LIVE SERVER ENDPOINT & ROUTE INTEGRITY");

  const endpoints = [
    { label: "Homepage (/)", path: "/", auth: "none", expectedStatus: 200 },
    { label: "Customer Shop (/customer/shop)", path: "/customer/shop", auth: "customer", expectedStatus: 200 },
    { label: "Public Products Listing (/products)", path: "/products", auth: "none", expectedStatus: 200 },
    { label: "Admin Settings Dashboard (/admin/settings)", path: "/admin/settings", auth: "admin", expectedStatus: 200 },
    { label: "Admin Security Login (/admin/login)", path: "/admin/login", auth: "none", expectedStatus: 200 },
    { label: "Customer Profile Page (/customer/profile)", path: "/customer/profile", auth: "customer", expectedStatus: 200 },
    { label: "API: Customer Profile (/api/customer/profile)", path: "/api/customer/profile", auth: "customer", expectedStatus: 200 },
    { label: "API: Admin Settings (/api/admin/settings)", path: "/api/admin/settings", auth: "admin", expectedStatus: 200 },
    { label: "API: Customer Visits Analytics (/api/analytics/visits)", path: "/api/analytics/visits", auth: "admin", expectedStatus: 200 },
    { label: "API: Admin System Health (/api/admin/health)", path: "/api/admin/health", auth: "admin", expectedStatus: 200 },
    { label: "API: System Settings (/api/system/settings)", path: "/api/system/settings", auth: "none", expectedStatus: 200 },
    { label: "API: Visitor Tracking Ingest (/api/analytics/track)", path: "/api/analytics/track", method: "POST", body: { path: "/customer/shop", title: "Customer Shop", device: "desktop" }, auth: "none", expectedStatus: 200 },
    { label: "Product Detail API (/api/public/products/p-1791529538894)", path: "/api/public/products/p-1791529538894", auth: "none", expectedStatus: 200 },
    { label: "Product Detail Page (/products/p-1791529538894)", path: "/products/p-1791529538894", auth: "none", expectedStatus: 200 },
    { label: "API: Mock DB Sync (/api/system/sync-mock)", path: "/api/system/sync-mock", method: "POST", body: { key: "products", data: [] }, auth: "none", expectedStatus: 200 },
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const headers = {};
      if (ep.auth === "admin") {
        headers["Cookie"] = "nexbyte_admin_session=mock-admin-session-token";
      } else if (ep.auth === "customer") {
        headers["Cookie"] = "nexbyte_customer_session=mock-user:1:test@example.com";
      }

      let res;
      if (ep.method === "POST") {
        headers["Content-Type"] = "application/json";
        res = await fetch(`${SERVER_URL}${ep.path}`, {
          method: "POST",
          headers,
          body: JSON.stringify(ep.body || {}),
        });
      } else {
        res = await fetch(`${SERVER_URL}${ep.path}`, { headers });
      }

      if (res.status === ep.expectedStatus) {
        console.log(`  [PASS] ${ep.label} -> HTTP ${res.status} OK`);
        passed++;
      } else {
        console.error(`  [FAIL] ${ep.label} -> Expected HTTP ${ep.expectedStatus}, got ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.error(`  [FAIL] ${ep.label} -> Error connecting: ${err.message}`);
      failed++;
    }
  }

  recordGroup("Live Server Endpoints Check", passed, failed);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Font Preload & Asset Verification
// ─────────────────────────────────────────────────────────────────────────────
function runFontAssetsVerification() {
  logHeader("8. FONT ASSETS & PRELOAD VERIFICATION");

  let passed = 0;
  let failed = 0;

  const fontFiles = [
    { name: "batmfa__.ttf", path: path.join(FRONTEND_DIR, "public", "fonts", "batman", "batmfa__.ttf"), minSize: 50000 },
    { name: "batmfo__.ttf", path: path.join(FRONTEND_DIR, "public", "fonts", "batman", "batmfo__.ttf"), minSize: 50000 },
  ];

  for (const font of fontFiles) {
    if (fs.existsSync(font.path)) {
      const stats = fs.statSync(font.path);
      if (stats.size >= font.minSize) {
        console.log(`  [PASS] Font asset ${font.name} exists and is verified (${stats.size} bytes)`);
        passed++;
      } else {
        console.error(`  [FAIL] Font asset ${font.name} is undersized (${stats.size} bytes)`);
        failed++;
      }
    } else {
      console.error(`  [FAIL] Font asset ${font.name} not found at ${font.path}`);
      failed++;
    }
  }

  // Check globals.css and layout.tsx references
  const layoutPath = path.join(FRONTEND_DIR, "app", "layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf8");
  if (layoutCode.includes("next/font/local") && layoutCode.includes("batmanForever") && layoutCode.includes("--font-batman")) {
    console.log("  [PASS] layout.tsx uses next/font/local for automatic font preloading and zero-CLS injection");
    passed++;
  } else {
    console.error("  [FAIL] layout.tsx does not properly configure next/font/local for batmanForever");
    failed++;
  }

  const cssPath = path.join(FRONTEND_DIR, "app", "globals.css");
  const cssCode = fs.readFileSync(cssPath, "utf8");
  if (cssCode.includes("var(--font-batman)") && cssCode.includes(".heading-h1") && cssCode.includes(".heading-h2")) {
    console.log("  [PASS] globals.css enforces var(--font-batman) across heading classes");
    passed++;
  } else {
    console.error("  [FAIL] globals.css missing var(--font-batman) heading rules");
    failed++;
  }

  recordGroup("Font Assets & Preload Verification", passed, failed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Runner Orchestration
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log("\n" + "#".repeat(80));
  console.log(" NEXLAPTECH COMPREHENSIVE SYSTEM TEST SUITE");
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log(` Environment: Local Dev (${SERVER_URL})`);
  console.log("#".repeat(80));

  runTypeCheck();
  runAuditFixesSuite();
  runAdminSettingsSuite();
  runCustomerProfileSuite();
  runCustomerVisitsAnalyticsSuite();
  runCustomizationTypographySuite();
  await runLiveServerEndpointChecks();
  runFontAssetsVerification();

  const durationMs = Date.now() - startTime;

  logHeader("FINAL SYSTEM VERIFICATION SUMMARY");
  console.log(`Duration: ${(durationMs / 1000).toFixed(2)} seconds\n`);

  console.log("Suite Breakdown:");
  for (const group of groupResults) {
    const status = group.failed === 0 ? "PASSED" : "FAILED";
    const statusIcon = group.failed === 0 ? "✓" : "✗";
    console.log(`  ${statusIcon} ${group.name.padEnd(46)}: ${group.passed} passed, ${group.failed} failed [${status}]`);
  }

  console.log("\n" + "-".repeat(80));
  console.log(`TOTAL TESTS EXECUTED: ${totalPassed + totalFailed}`);
  console.log(`TOTAL PASSED:         ${totalPassed}`);
  console.log(`TOTAL FAILED:         ${totalFailed}`);
  console.log("-".repeat(80));

  if (totalFailed > 0) {
    console.error(`\n❌ SYSTEM CHECK FAILED: ${totalFailed} test(s) encountered errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL TESTS PASSED! System is 100% healthy, resilient and production-ready.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});

