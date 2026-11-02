/**
 * Test Suite: Customization, Batman Forever Typography, and Publishing Workflow
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const frontendDir = path.resolve(__dirname, "../frontend");
if (!require.extensions[".ts"]) {
  const ts = require("../frontend/node_modules/typescript");
  require.extensions[".ts"] = function (module, filename) {
    const src = fs.readFileSync(filename, "utf8");
    const transpiled = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    module._compile(transpiled.outputText, filename);
  };
}
const globalsCssPath = path.join(frontendDir, "app/globals.css");
const layoutPath = path.join(frontendDir, "app/layout.tsx");
const tailwindConfigPath = path.join(frontendDir, "tailwind.config.ts");
const fontPath = path.join(frontendDir, "public/fonts/batman/batmfa__.ttf");

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${desc}: ${err.message}`);
  }
}

console.log("===============================================================================");
console.log("NEXLAPTECH CUSTOMIZATION, FONT SYSTEM & PUBLISHING WORKFLOW TEST SUITE");
console.log("===============================================================================\n");

// 1. Font Asset Verification
it("Font Asset: batmfa__.ttf exists and has valid TrueType header", () => {
  assert(fs.existsSync(fontPath), "batmfa__.ttf must exist in public/fonts/batman/");
  const buf = fs.readFileSync(fontPath);
  assert(buf.length > 50000, "Font file must be non-empty");
  const magic = buf.readUInt32BE(0);
  assert.strictEqual(magic, 0x00010000, "Font must have TrueType 0x00010000 magic header");
});

// 2. Layout font variable isolation
it("Layout Isolation: Next.js Plus_Jakarta_Sans does not hijack --font-display", () => {
  const layout = fs.readFileSync(layoutPath, "utf8");
  assert(!layout.includes('variable: "--font-display"'), "layout.tsx must not bind Plus_Jakarta_Sans to --font-display");
  assert(layout.includes('variable: "--font-heading-fallback"'), "layout.tsx must use --font-heading-fallback");
});

// 3. Globals CSS font-face and weight coverage
it("Typography System: globals.css registers BatmanForeverAlternate with full weight range (100-900, normal, bold)", () => {
  const css = fs.readFileSync(globalsCssPath, "utf8");
  assert(css.includes("BatmanForeverAlternate"), "globals.css must register BatmanForeverAlternate");
  assert(css.includes("/fonts/batman/batmfa__.ttf"), "globals.css must point to /fonts/batman/batmfa__.ttf");
  assert(css.includes("font-weight: 100 900;"), "globals.css must cover weight range 100 900");
  assert(css.includes("font-weight: bold;"), "globals.css must cover bold weight");
});

// 4. Heading font priority and !important enforcement
it("Typography System: h1, h2, h3, .heading-h1, .heading-h2, .heading-h3 and .font-display enforce Batman font", () => {
  const css = fs.readFileSync(globalsCssPath, "utf8");
  assert(css.includes("BatmanForeverAlternate', 'Batman Forever', sans-serif !important;"), "Must enforce BatmanForeverAlternate !important on headings");
  assert(css.includes(".heading-h1"), "Must style .heading-h1");
  assert(css.includes(".heading-h2"), "Must style .heading-h2");
  assert(css.includes(".heading-h3"), "Must style .heading-h3");
  assert(css.includes(".font-display"), "Must style .font-display");
});

// 5. Tailwind config font families
it("Tailwind Config: includes BatmanForeverAlternate in display and batman font families", () => {
  const tailwind = fs.readFileSync(tailwindConfigPath, "utf8");
  assert(tailwind.includes('"BatmanForeverAlternate"'), "tailwind.config.ts must declare BatmanForeverAlternate in fontFamily");
  assert(tailwind.includes("display:"), "Must configure fontFamily.display");
  assert(tailwind.includes("batman:"), "Must configure fontFamily.batman");
});

// 6. Readable body text preservation
it("Legibility Preservation: body, inputs, buttons, and textarea retain clean sans-serif body font", () => {
  const css = fs.readFileSync(globalsCssPath, "utf8");
  assert(css.includes("body,\nbutton,\ninput,\nselect,\ntextarea {\n  font-family: var(--font-body);"), "Form controls and body must keep var(--font-body)");
});

// 7. Customer Dashboard dynamic layout defaults
it("Customer Dashboard Config: default settings supply KPI cards and quick actions", () => {
  const defaults = require(path.join(frontendDir, "lib/data/defaultSettings")).DEFAULT_STORE_SETTINGS;
  assert(defaults.customerDashboard, "DEFAULT_STORE_SETTINGS must have customerDashboard");
  const kpiCount = Array.isArray(defaults.customerDashboard.kpiCards)
    ? defaults.customerDashboard.kpiCards.length
    : Object.keys(defaults.customerDashboard.kpiCards).length;
  assert(kpiCount >= 4, "Must configure at least 4 default KPI cards");
  assert.strictEqual(defaults.customerDashboard.showRecentActivity, true, "showRecentActivity default true");
  assert.strictEqual(defaults.customerDashboard.showFeaturedHardware, true, "showFeaturedHardware default true");
});

// 8. Visual effects presets coverage
it("Background Effects: provides presets with valid opacity and blur constraints", () => {
  const defaults = require(path.join(frontendDir, "lib/data/defaultSettings")).DEFAULT_STORE_SETTINGS;
  assert(defaults.backgroundEffects, "Must have backgroundEffects settings");
  assert(defaults.backgroundEffects.opacity >= 0 && defaults.backgroundEffects.opacity <= 1, "Opacity must be within 0..1");
  assert(defaults.backgroundEffects.blur >= 0 && defaults.backgroundEffects.blur <= 40, "Blur must be within 0..40");
});

console.log("\n==================================================");
console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
console.log("==================================================");
if (passed !== total) process.exit(1);
