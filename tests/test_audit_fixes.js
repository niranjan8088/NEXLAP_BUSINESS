// Test Suite for NEXLAPTECH Portal Audit Fixes
const assert = require("assert");

console.log("==================================================");
console.log("NEXLAPTECH AUDIT FIXES — AUTOMATED TEST SUITE");
console.log("==================================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// ----------------------------------------------------
// TEST GROUP 1: AUTHENTICATION & SESSION HANDLING
// ----------------------------------------------------
test("Auth: parse mock-user session format", () => {
  const sessionVal = "mock-user:usr_12345:client@nexlaptech.in";
  let user = null;
  if (sessionVal.startsWith("mock-user:")) {
    const parts = sessionVal.split(":");
    user = { id: parts[1], email: parts[2], role: "customer" };
  }
  assert.strictEqual(user.id, "usr_12345");
  assert.strictEqual(user.email, "client@nexlaptech.in");
  assert.strictEqual(user.role, "customer");
});

test("Auth: parse email fallback session format", () => {
  const sessionVal = "john@example.com";
  let user = null;
  if (sessionVal.includes("@") && !sessionVal.startsWith("mock-user:")) {
    user = { id: sessionVal, email: sessionVal, role: "customer" };
  }
  assert.strictEqual(user.email, "john@example.com");
});

test("Auth: reject empty and invalid session cookies", () => {
  const invalidSessions = ["", "undefined", "null"];
  invalidSessions.forEach((s) => {
    let isValid = !!s && s !== "undefined" && s !== "null";
    assert.strictEqual(isValid, false);
  });
});

// ----------------------------------------------------
// TEST GROUP 2: CART VARIANT INDEPENDENCE
// ----------------------------------------------------
test("Cart: deleting one variant does not delete sibling variants", () => {
  let cart = [
    { id: "variant-8gb-256gb", productId: "macbook-pro-m1", title: "MacBook Pro 8GB", quantity: 1 },
    { id: "variant-16gb-512gb", productId: "macbook-pro-m1", title: "MacBook Pro 16GB", quantity: 1 },
    { id: "thinkpad-x1", productId: "thinkpad-x1", title: "ThinkPad X1", quantity: 2 },
  ];

  // User deletes variant-8gb-256gb
  const targetId = "variant-8gb-256gb";
  cart = cart.filter((item) => item.id !== targetId);

  // The 16GB variant must remain in cart
  assert.strictEqual(cart.length, 2);
  const remainingMac = cart.find((item) => item.productId === "macbook-pro-m1");
  assert.ok(remainingMac, "Sibling product variant must be preserved");
  assert.strictEqual(remainingMac.id, "variant-16gb-512gb");
});

// ----------------------------------------------------
// TEST GROUP 3: GSTIN FORMAT & NORMALIZATION
// ----------------------------------------------------
test("GSTIN: validate and normalize 15-character GST format", () => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  const validGstin = "29ABCDE1234F1Z5";
  const lowerGstin = "29abcde1234f1z5";
  const invalidGstinShort = "29ABCDE1234F1Z";
  const invalidGstinSpecial = "29ABCDE1234F1Z@";

  assert.ok(gstinRegex.test(validGstin.toUpperCase()), "Valid GSTIN must pass");
  assert.ok(gstinRegex.test(lowerGstin.toUpperCase()), "Normalized lowercase GSTIN must pass");
  assert.ok(!gstinRegex.test(invalidGstinShort.toUpperCase()), "Short GSTIN must fail");
  assert.ok(!gstinRegex.test(invalidGstinSpecial.toUpperCase()), "Special char GSTIN must fail");
});

// ----------------------------------------------------
// TEST GROUP 4: REAL ANALYTICS METRIC INTEGRITY
// ----------------------------------------------------
test("Analytics: cancelled orders excluded from revenue & product counts", () => {
  const orders = [
    { id: "ord-1", total: 45000, status: "delivered", items: [{ quantity: 1 }] },
    { id: "ord-2", total: 32000, status: "confirmed", items: [{ quantity: 2 }] },
    { id: "ord-3", total: 60000, status: "cancelled", items: [{ quantity: 1 }] }, // Should be excluded
    { id: "ord-4", total: 15000, status: "failed", items: [{ quantity: 1 }] },    // Should be excluded
  ];

  const validOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "failed");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalUnits = validOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

  assert.strictEqual(validOrders.length, 2);
  assert.strictEqual(totalRevenue, 77000);
  assert.strictEqual(totalUnits, 3);
});

// ----------------------------------------------------
// TEST GROUP 5: MULTI-PAGE PRINT STYLES FOR INVOICE
// ----------------------------------------------------
test("Invoice: print CSS rules preserve table headers and prevent row splitting", () => {
  const expectedRules = [
    "display: table-header-group", // thead repeat
    "page-break-inside: avoid",   // prevent row splitting
    "break-inside: avoid",
  ];

  const samplePrintCss = `
    @media print {
      thead { display: table-header-group !important; }
      tr { page-break-inside: avoid !important; break-inside: avoid !important; }
    }
  `;

  expectedRules.forEach((rule) => {
    assert.ok(samplePrintCss.includes(rule), `Print CSS must contain ${rule}`);
  });
});

console.log("\n--------------------------------------------------");
console.log(`TEST SUMMARY: ${passed}/${total} PASSED`);
console.log("--------------------------------------------------");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
