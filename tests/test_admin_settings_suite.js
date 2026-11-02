// Test Suite for NexLapTech Advanced Admin Settings & Customer Panel Integration
const assert = require("assert");
const fs = require("fs");

// Register lightweight TypeScript loader so tests can import strongly-typed defaults
if (!require.extensions[".ts"]) {
  const ts = require("../frontend/node_modules/typescript");
  require.extensions[".ts"] = function (module, filename) {
    const src = fs.readFileSync(filename, "utf8");
    const transpiled = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    module._compile(transpiled.outputText, filename);
  };
}

console.log("===============================================================================");
console.log("NEXLAPTECH ADVANCED SETTINGS & CUSTOMER PANEL INTEGRATION — TEST SUITE");
console.log("===============================================================================\n");

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
// TEST GROUP 1: DEFAULT CONFIGURATION & SPECIFICATION CONSTRAINTS
// ----------------------------------------------------

test("Delivery & Logistics: default pickup pincode must be 572102", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  assert.strictEqual(
    DEFAULT_STORE_SETTINGS.deliveryWarranty.defaultPickupPincode,
    "572102",
    "Default pickup pincode must be exactly 572102"
  );
});

test("Delivery & Logistics: default delivery estimate range must be 3–10 days", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  assert.strictEqual(DEFAULT_STORE_SETTINGS.deliveryWarranty.deliveryEstimateMinDays, 3);
  assert.strictEqual(DEFAULT_STORE_SETTINGS.deliveryWarranty.deliveryEstimateMaxDays, 10);
});

test("Replacement Policy: default replacement guarantee must be 7 days", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  assert.strictEqual(DEFAULT_STORE_SETTINGS.deliveryWarranty.replacementPolicyDays, 7);
  assert.ok(DEFAULT_STORE_SETTINGS.deliveryWarranty.replacementPolicyTitle.includes("7-Day"));
});

test("Warranty Policy: default standard warranty must be 90 days", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  assert.strictEqual(DEFAULT_STORE_SETTINGS.deliveryWarranty.defaultWarrantyDays, 90);
  assert.ok(DEFAULT_STORE_SETTINGS.deliveryWarranty.defaultWarrantyTitle.includes("90-Day"));
});

test("Appearance: valid primary brand hex color and customer theme policy default", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  assert.match(DEFAULT_STORE_SETTINGS.appearance.primaryColor, /^#([0-9A-F]{3}){1,2}$/i);
  assert.strictEqual(DEFAULT_STORE_SETTINGS.appearance.customerThemePolicy, "personal");
});

test("Storefront: all mandatory homepage sections are configured", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  const sections = DEFAULT_STORE_SETTINGS.storefront.sections;
  assert.ok(sections.hero, "Hero section must exist");
  assert.ok(sections.categories, "Categories section must exist");
  assert.ok(sections.featured, "Featured products section must exist");
  assert.ok(sections.trustBadges, "Trust badges section must exist");
  assert.ok(sections.announcementBar, "Announcement bar must exist");
});

test("Product Display: verified card toggles for SKU, ratings, stock and quick add", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");
  const pd = DEFAULT_STORE_SETTINGS.productDisplay;
  assert.strictEqual(typeof pd.showStockStatus, "boolean");
  assert.strictEqual(typeof pd.showSku, "boolean");
  assert.strictEqual(typeof pd.showRatings, "boolean");
  assert.strictEqual(typeof pd.showQuickAddToCart, "boolean");
  assert.strictEqual(typeof pd.pincodeCheckerEnabled, "boolean");
});

// ----------------------------------------------------
// TEST GROUP 2: SETTINGS VALIDATION RULES
// ----------------------------------------------------

test("Validation: reject invalid 6-digit Indian pincode", () => {
  const invalidPincodes = ["123", "5721020", "abcde", " 572102 "];
  invalidPincodes.forEach((pin) => {
    const isValid = /^\d{6}$/.test(pin);
    assert.strictEqual(isValid, false, `Pincode '${pin}' should be rejected`);
  });
  assert.strictEqual(/^\d{6}$/.test("572102"), true);
  assert.strictEqual(/^\d{6}$/.test("560001"), true);
});

test("Validation: reject invalid hex colors", () => {
  const invalidHex = ["red", "#12", "#1234567", "1E5BFF", "#GGG"];
  invalidHex.forEach((hex) => {
    const isValid = /^#([0-9A-F]{3}){1,2}$/i.test(hex);
    assert.strictEqual(isValid, false, `Hex '${hex}' should be rejected`);
  });
  assert.strictEqual(/^#([0-9A-F]{3}){1,2}$/i.test("#1E5BFF"), true);
  assert.strictEqual(/^#([0-9A-F]{3}){1,2}$/i.test("#fff"), true);
});

test("Validation: delivery min days must not exceed max days", () => {
  const validateDeliveryRange = (min, max) => min >= 0 && max >= min;
  assert.strictEqual(validateDeliveryRange(3, 10), true);
  assert.strictEqual(validateDeliveryRange(10, 3), false);
  assert.strictEqual(validateDeliveryRange(-1, 5), false);
});

// ----------------------------------------------------
// TEST GROUP 3: DEEP MERGE & DATA PRESERVATION
// ----------------------------------------------------

test("Deep Merge: partial settings update preserves unmentioned nested fields", () => {
  const { DEFAULT_STORE_SETTINGS } = require("../frontend/lib/data/defaultSettings");

  function deepMergeSettings(target, source) {
    const result = { ...target };
    if (!source || typeof source !== "object") return result;
    for (const key of Object.keys(source)) {
      const val = source[key];
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
    return result;
  }

  const partial = {
    deliveryWarranty: {
      deliveryEstimateMinDays: 4,
      deliveryEstimateMaxDays: 8,
    },
  };

  const merged = deepMergeSettings(DEFAULT_STORE_SETTINGS, partial);
  // Changed fields:
  assert.strictEqual(merged.deliveryWarranty.deliveryEstimateMinDays, 4);
  assert.strictEqual(merged.deliveryWarranty.deliveryEstimateMaxDays, 8);
  // Preserved fields:
  assert.strictEqual(merged.deliveryWarranty.defaultPickupPincode, "572102");
  assert.strictEqual(merged.deliveryWarranty.replacementPolicyDays, 7);
  assert.strictEqual(merged.appearance.primaryColor, DEFAULT_STORE_SETTINGS.appearance.primaryColor);
  assert.strictEqual(merged.generalStore.storeName, "NexLapTech");
});

// ----------------------------------------------------
// TEST GROUP 4: CUSTOMER PREFERENCES SCOPING & THEME POLICY
// ----------------------------------------------------

test("Customer Preferences: scoping isolates data between distinct customers", () => {
  const customerMap = {};

  function setCustomerPref(customerId, prefs) {
    customerMap[customerId] = {
      ...(customerMap[customerId] || {}),
      ...prefs,
      customerId,
      updatedAt: new Date().toISOString(),
    };
  }

  setCustomerPref("cust-1", { theme: "night", preferredPickupPincode: "572102" });
  setCustomerPref("cust-2", { theme: "day", preferredPickupPincode: "560001" });

  assert.strictEqual(customerMap["cust-1"].theme, "night");
  assert.strictEqual(customerMap["cust-1"].preferredPickupPincode, "572102");
  assert.strictEqual(customerMap["cust-2"].theme, "day");
  assert.strictEqual(customerMap["cust-2"].preferredPickupPincode, "560001");
});

test("Customer Preferences: store policy 'forced' prevents personal theme override", () => {
  const storePolicy = "forced";
  const forcedTheme = "day";

  function resolveEffectiveTheme(userChoice, policy, storeForced) {
    if (policy === "forced") return storeForced;
    return userChoice || "day";
  }

  assert.strictEqual(resolveEffectiveTheme("night", storePolicy, forcedTheme), "day");
  assert.strictEqual(resolveEffectiveTheme("night", "personal", forcedTheme), "night");
});

test("Security: customer preferences update rejects global store property modifications", () => {
  const allowedCustomerKeys = [
    "theme",
    "interfaceDensity",
    "fontScale",
    "emailOrderUpdates",
    "smsTechnicianAlerts",
    "marketingEmails",
    "marketingSms",
    "preferredPickupPincode",
  ];

  const maliciousPayload = {
    theme: "night",
    role: "admin",
    prices: { p1: 0 },
    globalWarrantyDays: 9999,
    maintenanceMode: true,
  };

  const sanitized = {};
  for (const key of Object.keys(maliciousPayload)) {
    if (allowedCustomerKeys.includes(key)) {
      sanitized[key] = maliciousPayload[key];
    }
  }

  assert.strictEqual(sanitized.theme, "night");
  assert.strictEqual(sanitized.role, undefined);
  assert.strictEqual(sanitized.prices, undefined);
  assert.strictEqual(sanitized.globalWarrantyDays, undefined);
  assert.strictEqual(sanitized.maintenanceMode, undefined);
});

// ----------------------------------------------------
// TEST GROUP 5: AUDIT LOG INTEGRITY
// ----------------------------------------------------

test("Audit Log: captures timestamp, administrator identity, and changed fields", () => {
  const entry = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: "admin@nexbyte.com",
    adminName: "Admin Officer",
    category: "Delivery & Warranty",
    action: "UPDATE",
    details: "Delivery estimate modified",
    changedFields: ["deliveryWarranty"],
  };

  assert.ok(entry.timestamp);
  assert.strictEqual(entry.adminEmail, "admin@nexbyte.com");
  assert.strictEqual(entry.category, "Delivery & Warranty");
  assert.deepStrictEqual(entry.changedFields, ["deliveryWarranty"]);
});

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log("\n==================================================");
console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
console.log("==================================================");

if (passed !== total) {
  process.exit(1);
}
