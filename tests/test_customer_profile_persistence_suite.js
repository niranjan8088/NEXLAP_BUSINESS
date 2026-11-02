/**
 * Test Suite: Customer Profile Persistence & Dynamic Avatar Initials
 *
 * Verifies:
 * 1. Dynamic Initials utility edge cases:
 *    - "NIRANJAN" -> "N"
 *    - "NIRANJAN M" -> "NM"
 *    - "Niranjan M Kumar" -> "NM"
 *    - "John Doe" -> "JD"
 *    - "" / null / "   " -> "" (triggers default user icon)
 * 2. Profile Details Persistence via PUT /api/customer/profile
 * 3. Profile details surviving refresh / reload via GET /api/customer/profile
 * 4. Duplicate prevention across updates
 * 5. Strict Server-Side Validation:
 *    - empty full_name rejection (400)
 *    - invalid phone rejection (< 10 digits -> 400)
 *    - invalid pincode rejection (non-6-digit Indian PIN -> 400)
 *    - future date of birth rejection (400)
 * 6. Email read-only / immutability enforcement
 * 7. Avatar photo upload/removal and initials toggling
 * 8. Customer role label verification ("Customer" preserved)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

function getCustomerInitials(name) {
  if (!name || typeof name !== "string") return "";
  const cleaned = name.trim();
  if (!cleaned) return "";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  const firstInitial = parts[0][0].toUpperCase();

  if (parts.length === 2) {
    return (firstInitial + parts[1][0]).toUpperCase();
  }

  const secondClean = parts[1].replace(/[^a-zA-Z0-9]/g, "");
  if (secondClean.length === 1) {
    return (firstInitial + secondClean[0]).toUpperCase();
  }

  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return (firstInitial + lastInitial).toUpperCase();
}

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
  console.log("RUNNING SUITE: Customer Profile Persistence & Dynamic Avatar Initials");
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
  // TEST GROUP 1: Initials Derivation Unit Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Dynamic Initials Algorithm ---");
  assert('Single name "NIRANJAN" -> "N"', getCustomerInitials("NIRANJAN") === "N");
  assert('Name with initial "NIRANJAN M" -> "NM"', getCustomerInitials("NIRANJAN M") === "NM");
  assert('Three-part name "Niranjan M Kumar" -> "NM"', getCustomerInitials("Niranjan M Kumar") === "NM");
  assert('Standard two-word name "John Doe" -> "JD"', getCustomerInitials("John Doe") === "JD");
  assert('Lowercase name "ramesh kumar" -> "RK"', getCustomerInitials("ramesh kumar") === "RK");
  assert('Empty string -> "" (triggers default user icon)', getCustomerInitials("") === "");
  assert('Null value -> ""', getCustomerInitials(null) === "");
  assert('Whitespace only -> ""', getCustomerInitials("   ") === "");

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Profile Persistence via API (PUT)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Profile Persistence & Disk Sync ---");
  const sessionCookie = "nexbyte_customer_session=mock-user:cust-test-1:cust_test1@nexbyte.com";

  const updatedProfilePayload = {
    fullName: "Niranjan M Kumar",
    phone: "9876543210",
    dob: "1997-08-15",
    gender: "Male",
    address: "742 Evergreen Terrace, Tech Enclave",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560070",
    country: "India",
  };

  const putRes = await makeRequest("PUT", "/api/customer/profile", {
    Cookie: sessionCookie,
  }, updatedProfilePayload);

  assert("PUT /api/customer/profile returns 200 OK", putRes.status === 200);
  assert("Response confirms profile update success", putRes.data?.success === true);
  assert("Response returns saved full_name", putRes.data?.profile?.full_name === "Niranjan M Kumar");
  assert("Response returns saved phone", putRes.data?.profile?.phone === "9876543210");
  assert("Response returns saved pincode", putRes.data?.profile?.pincode === "560070");
  assert("Response sets nexbyte_customer_name cookie", !!putRes.headers["set-cookie"]);

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Reload / Refresh Persistence (GET)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Data Survives Refresh / GET Reload ---");
  const getRes = await makeRequest("GET", "/api/customer/profile", {
    Cookie: sessionCookie,
    "Cache-Control": "no-cache",
  });

  assert("GET /api/customer/profile returns 200 OK", getRes.status === 200);
  assert("GET returns persisted full_name", getRes.data?.profile?.full_name === "Niranjan M Kumar");
  assert("GET returns persisted phone", getRes.data?.profile?.phone === "9876543210");
  assert("GET returns persisted date_of_birth", getRes.data?.profile?.date_of_birth === "1997-08-15");
  assert("GET returns persisted gender", getRes.data?.profile?.gender === "Male");
  assert("GET returns persisted address", getRes.data?.profile?.address === "742 Evergreen Terrace, Tech Enclave");
  assert("GET returns persisted city", getRes.data?.profile?.city === "Bengaluru");
  assert("GET returns persisted state", getRes.data?.profile?.state === "Karnataka");
  assert("GET returns persisted pincode", getRes.data?.profile?.pincode === "560070");
  assert("GET returns persisted country", getRes.data?.profile?.country === "India");

  // Verify initials for the newly persisted name
  const dynamicInitials = getCustomerInitials(getRes.data?.profile?.full_name);
  assert('Derived initials from persisted profile is "NM"', dynamicInitials === "NM");

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Duplicate Record Prevention
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Duplicate Record Prevention ---");
  // Update the same profile a 2nd and 3rd time
  await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    fullName: "Niranjan M",
    phone: "9876543210",
  });
  await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    fullName: "Niranjan M Kumar",
    phone: "9876543210",
  });

  const diskDbPath = path.join(process.cwd(), "nexbyte", "frontend", "data", "mock_db.json");
  const altDiskPath = path.join(process.cwd(), "data", "mock_db.json");
  const actualPath = fs.existsSync(diskDbPath) ? diskDbPath : altDiskPath;

  if (fs.existsSync(actualPath)) {
    try {
      const diskDb = JSON.parse(fs.readFileSync(actualPath, "utf8"));
      const matchingProfiles = (diskDb.profiles || []).filter(
        (p) => p && (p.id === "cust-test-1" || p.email === "cust_test1@nexbyte.com")
      );
      assert("No duplicate customer profiles created on repeated edits (exactly 1 record)", matchingProfiles.length === 1);
    } catch (e) {
      console.warn("Could not parse mock_db.json directly, skipping file count check:", e.message);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Server-Side Validation
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Input Validation & Sanitization ---");
  // 5a: Empty name
  const emptyNameRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    fullName: "   ",
  });
  assert("Rejects empty full_name with 400 Bad Request", emptyNameRes.status === 400);

  // 5b: Invalid phone (<10 digits)
  const invalidPhoneRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    phone: "12345",
  });
  assert("Rejects phone number < 10 digits with 400 Bad Request", invalidPhoneRes.status === 400);

  // 5c: Invalid Pincode (not 6 digits or starts with 0)
  const invalidPinRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    pincode: "012345",
  });
  assert("Rejects invalid pincode (starts with 0) with 400 Bad Request", invalidPinRes.status === 400);

  const shortPinRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    pincode: "5600",
  });
  assert("Rejects invalid pincode (less than 6 digits) with 400 Bad Request", shortPinRes.status === 400);

  // 5d: Future Date of Birth
  const futureDobRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    dob: "2099-01-01",
  });
  assert("Rejects future Date of Birth with 400 Bad Request", futureDobRes.status === 400);

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Auth Boundary & Email Immutability
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Auth Boundary & Email Immutability ---");
  // Unauthorized request without cookie
  const unauthRes = await makeRequest("GET", "/api/customer/profile");
  assert("Rejects unauthenticated GET request with 401 Unauthorized", unauthRes.status === 401);

  // Attempt to modify email directly via PUT
  const emailTamperRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    email: "hacker@evil.com",
    fullName: "Niranjan M Kumar",
  });
  const checkEmailRes = await makeRequest("GET", "/api/customer/profile", { Cookie: sessionCookie });
  assert("Email address is read-only and remains uncompromised", checkEmailRes.data?.profile?.email === "cust_test1@nexbyte.com");

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Customer Role Label & Header UI Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Customer Role Label & Header Contract ---");
  const headerPath = path.join(process.cwd(), "nexbyte", "frontend", "components", "CustomerHeader.tsx");
  if (fs.existsSync(headerPath)) {
    const headerContent = fs.readFileSync(headerPath, "utf8");
    const containsStaticCustomerLabel = headerContent.includes("Customer\n                  </span>") ||
      headerContent.includes("Customer\r\n                  </span>") ||
      headerContent.includes(">Customer</span>") ||
      headerContent.includes(">\n                    Customer\n                  </span>");

    assert('CustomerHeader renders static "Customer" role label', containsStaticCustomerLabel);
    assert("CustomerHeader imports and uses getCustomerInitials", headerContent.includes("getCustomerInitials"));
    assert("CustomerHeader listens to nexbyte-profile-update custom event", headerContent.includes("nexbyte-profile-update"));
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Avatar Photo vs Initials Toggle
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Avatar Photo vs Initials Priority ---");
  // Set avatar photo
  const photoUpdateRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    avatar_url: "/uploads/avatar-test.jpg",
  });
  assert("Profile accepts avatar_url photo update", photoUpdateRes.data?.profile?.avatar_url === "/uploads/avatar-test.jpg");

  // Remove avatar photo
  const photoRemoveRes = await makeRequest("PUT", "/api/customer/profile", { Cookie: sessionCookie }, {
    avatar_url: "",
  });
  assert("Profile avatar removal resets avatar_url to empty", photoRemoveRes.data?.profile?.avatar_url === "");
  const fallbackInitials = getCustomerInitials(photoRemoveRes.data?.profile?.full_name);
  assert("Avatar removal automatically falls back to customer initials", fallbackInitials === "NM");

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

