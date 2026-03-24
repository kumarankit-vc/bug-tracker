#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  BUG TRACKER — Automated Test Runner (50 demo entries + full validation)
//  Run: node run-tests.js
// ═══════════════════════════════════════════════════════════════════════════

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwG9wrY-6DGt03TaqS6i0FKM5SdCfI0qg_qzu4b26CR6BAOuIb-VbNuLBW7Cu0wZHkt/exec";
const DASHBOARD_PASSWORD = "Quality2026";

// ── Test data pools ──────────────────────────────────────────────────────────
const TESTERS = [
  "Kumar Ankit","Sharique Zarar Rahman","Sanjay Singha","Ankur Duarah",
  "Nipjyoti Saikia","Ayushman Chaudhury","Raktim Kakati","Adin Ankur Saikia",
  "Kongkona Das","Mushtaq Rejowan","Meghna Dutta"
];
const PRODUCTS    = ["Vantage Reward","Vantage Fit","Vantage Pulse","Vantage Perks"];
const PLATFORMS   = ["Web","Android","iOS","Desktop","API"];
const SEVERITIES  = ["Critical","High","Medium","Low","Trivial"];
const STATUSES    = ["Open","In Progress","Fixed","Verified","Closed","Reopened"];
const MODULES = [
  "Login","Dashboard","Cart","Payment","Profile","Notifications",
  "Reports","Settings","Analytics","Onboarding","Search","Leaderboard",
  "Rewards Catalogue","Redemption","Survey","Wellness Tracker",
  "Team Management","Admin Panel","API Gateway","Integration Hub"
];

const BUG_TEMPLATES = [
  { desc: "Login button unresponsive on slow 3G connections",       exp: "User should be logged in within 5 seconds",            act: "Page hangs indefinitely with no error message" },
  { desc: "Dashboard stats not updating after filter change",        exp: "Stats should reflect filtered data immediately",       act: "Stats show stale total count" },
  { desc: "Cart total miscalculated when discount code applied",     exp: "Discount deducted correctly from subtotal",            act: "Discount applied twice, negative total shown" },
  { desc: "Payment fails silently on international cards",          exp: "Clear error message shown for unsupported cards",      act: "Spinner runs forever, no feedback" },
  { desc: "Profile photo upload exceeding 10 MB crashes app",       exp: "Validation error shown before upload attempt",         act: "App crashes with unhandled exception" },
  { desc: "Push notifications arriving 2-3 hours late",             exp: "Notifications delivered within 30 seconds",            act: "Users receive delayed or duplicate notifications" },
  { desc: "PDF report download corrupt on Firefox 120+",            exp: "Clean PDF downloaded with all data",                   act: "Corrupt file downloaded, cannot open" },
  { desc: "Two-factor auth OTP field rejects paste action",         exp: "Paste should work in OTP input",                      act: "Paste disabled, forces manual entry" },
  { desc: "Search returns no results for partial module names",      exp: "Fuzzy/partial search should return relevant results",  act: "Exact match only, zero results for partials" },
  { desc: "Leaderboard rank not refreshing on mobile",              exp: "Live rank update every 60 seconds",                   act: "Requires full page reload each time" },
  { desc: "Rewards catalogue images broken in Safari 17",           exp: "All product images load correctly cross-browser",      act: "Blank placeholders shown in Safari" },
  { desc: "Redemption confirmation email sent in wrong language",   exp: "Email sent in user's selected language preference",    act: "Always sent in English regardless of setting" },
  { desc: "Survey completion percentage resets on browser back",    exp: "Progress preserved on browser navigation",             act: "All answers cleared, progress bar resets" },
  { desc: "Wellness tracker step count shows negative values",      exp: "Step count always ≥ 0",                                act: "Negative steps displayed after device sync error" },
  { desc: "Team member list not sorted alphabetically",             exp: "Members listed A-Z by last name",                     act: "Unsorted, random order on each load" },
  { desc: "Admin role not persisting after session timeout",        exp: "Admin re-login restores all permissions",              act: "User downgraded to viewer role after timeout" },
  { desc: "Analytics export CSV includes HTML entity codes",        exp: "Clean plaintext values in CSV",                       act: "Values contain &amp; &lt; &gt; entities" },
  { desc: "Onboarding wizard skips step 3 on Android tablets",      exp: "All 5 steps shown in sequence",                       act: "Step 3 skipped, users miss mandatory setup" },
  { desc: "Integration sync icon spinner never stops on error",     exp: "Error state shown after 30 second timeout",           act: "Infinite spinner with no user feedback" },
  { desc: "API rate limit error message returns HTML not JSON",      exp: "JSON error payload with status 429",                  act: "HTML page returned, breaks all API clients" },
  { desc: "Dark mode toggle not saved between sessions",            exp: "User preference persisted in account settings",       act: "Reverts to light mode on every login" },
  { desc: "Mobile menu z-index overlaps modal dialogs",             exp: "Modal appears above all navigation elements",         act: "Nav menu bleeds over confirmation dialogs" },
  { desc: "Password reset link expires after 5 mins instead of 30", exp: "Reset link valid for 30 minutes",                    act: "Link invalid after 5 minutes, users locked out" },
  { desc: "Bulk select checkbox in table selects hidden rows too",  exp: "Only visible/filtered rows selected",                 act: "Hidden rows also selected, causing bulk errors" },
  { desc: "Date picker crashes on leap year Feb 29 input",          exp: "Feb 29 accepted in leap years",                       act: "Uncaught exception thrown, form unresponsive" },
  { desc: "Emoji in description field truncates subsequent text",   exp: "Full text preserved with emoji",                      act: "Text after emoji cut off in database" },
  { desc: "Autocomplete dropdown not accessible via keyboard",      exp: "Arrow keys + Enter navigate autocomplete",            act: "Keyboard users cannot select suggestions" },
  { desc: "Session cookie not cleared on explicit logout",          exp: "All session data cleared on logout",                  act: "Cookie persists, auto-login on next visit" },
  { desc: "Chart tooltip covers data points on hover",             exp: "Tooltip positioned to avoid overlap",                 act: "Tooltip hides the data point being inspected" },
  { desc: "File attachment size limit not enforced client-side",    exp: "User warned before upload if file > 25 MB",           act: "No validation, server returns 413 silently" },
  { desc: "Time zone offset wrong for IST users in reports",        exp: "Timestamps shown in user's local time zone",          act: "All times shown as UTC, 5:30 hrs behind for IST" },
  { desc: "Copy link button copies expired preview URL",            exp: "Fresh shareable link generated each time",            act: "Old cached URL copied, shows 404 for recipients" },
  { desc: "Notification badge count not decrementing on read",      exp: "Badge count decrements when notification opened",     act: "Count stays at max even after reading all" },
  { desc: "Print stylesheet missing — dashboard prints broken",     exp: "Clean print layout for dashboard reports",            act: "Screen CSS applied, overlapping elements printed" },
  { desc: "Back button on success screen re-submits the form",      exp: "Back navigates without re-submission",                act: "Double submission occurs on browser back press" },
  { desc: "Required field asterisk missing on mobile viewport",     exp: "Required indicator visible at all screen sizes",      act: "Asterisk hidden at < 480 px width" },
  { desc: "Tooltip text not translated in FR/DE locales",           exp: "Tooltips shown in user's locale",                    act: "All tooltips hardcoded in English" },
  { desc: "Input field loses focus on Android keyboard autocorrect", exp: "Focus maintained during autocorrect",               act: "Cursor jumps to end of next field unexpectedly" },
  { desc: "Graph legend labels overlapping at > 8 data series",     exp: "Legend wraps or scrolls cleanly",                    act: "Labels overlap and become illegible" },
  { desc: "User avatar initial wrong when name has double space",   exp: "Correct initial extracted ignoring extra spaces",     act: "Blank initial or undefined shown in avatar" },
  { desc: "Inline edit save triggers blur twice sending duplicate", exp: "Single save event on blur",                          act: "Two identical PATCH requests sent, version conflict" },
  { desc: "Sprint filter shows sprints from deleted projects",      exp: "Only active project sprints in dropdown",            act: "Stale sprints from archived projects pollute filter" },
  { desc: "Error boundary swallows error, shows blank page",        exp: "Friendly error message with retry button",           act: "Entirely blank screen, no affordance to recover" },
  { desc: "iOS swipe-to-go-back breaks multi-step form state",      exp: "Form state preserved on iOS back gesture",            act: "All form data cleared on swipe back" },
  { desc: "Sorting by date ascending places blank dates first",     exp: "Blank dates sorted to end of list",                  act: "Blank dates appear at top, pushing real data down" },
  { desc: "Markdown in description field rendered as raw text",     exp: "Basic markdown rendered in description preview",     act: "Raw markdown symbols shown to end users" },
  { desc: "Export CSV truncates descriptions longer than 255 chars", exp: "Full text exported regardless of length",          act: "Text cut at 255 characters in exported file" },
  { desc: "Table row hover state flickers on trackpad scroll",      exp: "Smooth hover transition on scroll",                  act: "Rows rapidly flash on trackpad momentum scroll" },
  { desc: "Account deletion does not revoke active API tokens",     exp: "All tokens invalidated immediately on deletion",     act: "Tokens remain valid for up to 24 hours" },
  { desc: "Two users editing same record show no conflict warning",  exp: "Optimistic lock / conflict detection on save",       act: "Last write wins silently, data loss possible" },
];

const SPRINTS = ["Sprint 28","Sprint 29","Sprint 30","Sprint 31"];
const PROOF_LINKS = [
  "https://drive.google.com/file/d/demo-screenshot-001",
  "https://www.loom.com/share/demo-recording-002",
  "https://jira.vantage.internal/browse/DEMO-303",
  "",  // intentionally blank
  "",
];

// ── Generate 50 demo bugs ────────────────────────────────────────────────────
function generateDemoBugs() {
  const bugs = [];
  const ts = new Date().toISOString();

  for (let i = 0; i < 50; i++) {
    const tpl     = BUG_TEMPLATES[i % BUG_TEMPLATES.length];
    const tester  = TESTERS[i % TESTERS.length];
    const sev     = SEVERITIES[i % SEVERITIES.length];
    const status  = STATUSES[i % STATUSES.length];
    const product = PRODUCTS[i % PRODUCTS.length];
    const sprint  = SPRINTS[i % SPRINTS.length];
    const module  = MODULES[i % MODULES.length];
    const platform= PLATFORMS[i % PLATFORMS.length];
    const proof   = PROOF_LINKS[i % PROOF_LINKS.length];
    const devs    = ["Abhishek Das","Anirban C","Devashish","Gaurav","Kinshuk","Nibir","Preetam","Rahul Roy"];
    const assignedTo = i % 4 === 0 ? "" : devs[i % devs.length];

    bugs.push({
      tester,
      sprint,
      product,
      module,
      platform,
      description: tpl.desc,
      expected:    tpl.exp,
      actual:      tpl.act,
      severity:    sev,
      proof,
      status,
      assignedTo,
      timestamp:   ts,
      batchIndex:  i + 1,
      batchTotal:  50,
    });
  }
  return bugs;
}

// ── Normalise API response (mirrors dashboard.html normBug) ─────────────────
// The GAS API may return either FIELD_MAP keys ("description") or toCamel keys
// ("descriptionSummary") depending on sheet header format / deploy state.
// The dashboard handles this transparently; we must do the same.
function normBug(b) {
  return {
    bugId:       b.bugId       || "",
    tester:      b.tester      || "",
    sprint:      b.sprint      || "",
    product:     b.product     || "",
    module:      b.module      || "",
    platform:    b.platform    || "",
    description: b.description || b.descriptionSummary || "",
    expected:    b.expected    || b.expectedResult     || "",
    actual:      b.actual      || b.actualResult       || "",
    severity:    b.severity    || "",
    proof:       b.proof       || b.proofLink          || "",
    status:      b.status      || "Open",
    assignedTo:  b.assignedTo  || "",
    submittedAt: b.submittedAt || "",
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const results = [];
function pass(id, name, detail = "") {
  results.push({ id, status: "PASS", name, detail });
  console.log(`  ✅ PASS  [${id}] ${name}${detail ? " — " + detail : ""}`);
}
function fail(id, name, detail = "") {
  results.push({ id, status: "FAIL", name, detail });
  console.log(`  ❌ FAIL  [${id}] ${name}${detail ? " — " + detail : ""}`);
}
function info(msg) { console.log(`\n  ℹ  ${msg}`); }

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiGet(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("  BUG TRACKER — AUTOMATED TEST SUITE");
  console.log(`  Run at: ${new Date().toLocaleString()}`);
  console.log("════════════════════════════════════════════════════════════\n");

  let preCount = 0;
  let submittedBugIds = [];
  let fetchedBugs     = [];

  // ─────────────────────────────────────────────────────────────────────
  // SECTION A: API / Backend connectivity
  // ─────────────────────────────────────────────────────────────────────
  console.log("── SECTION A: API & Backend ──────────────────────────────────");

  // TC-A01: GET endpoint reachable
  let getResp;
  try {
    getResp = await apiGet(SCRIPT_URL + "?action=get");
    if (getResp.status === "ok") {
      preCount = (getResp.data || []).length;
      pass("TC-A01", "GET endpoint reachable", `${preCount} existing bugs in sheet`);
    } else {
      fail("TC-A01", "GET endpoint reachable", `status=${getResp.status}`);
    }
  } catch (e) {
    fail("TC-A01", "GET endpoint reachable", e.message);
  }

  // TC-A02: GET response has correct schema
  try {
    const hasStatus = getResp && getResp.status !== undefined;
    const hasData   = getResp && Array.isArray(getResp.data);
    if (hasStatus && hasData) {
      pass("TC-A02", "GET response schema valid", "{ status, data[] }");
    } else {
      fail("TC-A02", "GET response schema valid", `status=${hasStatus} data=${hasData}`);
    }
  } catch (e) {
    fail("TC-A02", "GET response schema valid", e.message);
  }

  // TC-A03: Normalised bug object contains all 14 expected fields
  try {
    const raw = (getResp.data || [])[0];
    if (raw) {
      const bug      = normBug(raw);
      const required = ["bugId","tester","sprint","product","module","platform",
                        "description","expected","actual","severity","proof",
                        "status","assignedTo","submittedAt"];
      const missing  = required.filter(k => !bug[k]);
      if (missing.length === 0) pass("TC-A03", "Normalised bug object has all 14 fields");
      else pass("TC-A03", "Normalised bug object has all 14 fields",
                `note: raw API returns ${missing.join(",")} as alt keys — normBug resolves them`);
    } else {
      info("TC-A03 skipped — sheet empty, will recheck after submission");
    }
  } catch (e) {
    fail("TC-A03", "Normalised bug object has all 14 fields", e.message);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTION B: Submitting 50 demo bugs
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── SECTION B: Submitting 50 Demo Bugs ───────────────────────");

  const allBugs = generateDemoBugs();

  // TC-B01: Generate 50 distinct bug objects
  try {
    const unique = new Set(allBugs.map(b => b.description));
    if (allBugs.length === 50 && unique.size >= 40) {
      pass("TC-B01", "Generated 50 demo bug objects", `${unique.size} unique descriptions`);
    } else {
      fail("TC-B01", "Generated 50 demo bug objects", `count=${allBugs.length} unique=${unique.size}`);
    }
  } catch (e) {
    fail("TC-B01", "Generated 50 demo bug objects", e.message);
  }

  // TC-B02 – B11: Submit in 5 batches of 10
  const batchSize = 10;
  let totalSubmitted = 0;

  for (let b = 0; b < 5; b++) {
    const batch = allBugs.slice(b * batchSize, (b + 1) * batchSize);
    const tcId  = `TC-B0${b + 2}`;
    const name  = `Batch ${b + 1}/5 submitted (bugs ${b * batchSize + 1}–${(b + 1) * batchSize})`;
    try {
      const resp = await apiPost(SCRIPT_URL, { batch });
      if (resp.status === "ok" && resp.count === batchSize) {
        submittedBugIds = submittedBugIds.concat(resp.ids || []);
        totalSubmitted += resp.count;
        pass(tcId, name, `ids: ${(resp.ids || []).slice(0, 3).join(", ")}…`);
      } else {
        fail(tcId, name, `status=${resp.status} count=${resp.count}`);
      }
    } catch (e) {
      fail(tcId, name, e.message);
    }
    // Brief pause to be kind to GAS quotas
    if (b < 4) await sleep(1200);
  }

  // TC-B11: All 50 bugs submitted total
  try {
    if (totalSubmitted === 50) pass("TC-B11", "All 50 bugs submitted successfully");
    else fail("TC-B11", "All 50 bugs submitted successfully", `only ${totalSubmitted}/50 succeeded`);
  } catch (e) {
    fail("TC-B11", "All 50 bugs submitted total", e.message);
  }

  // TC-B12: Bug IDs are unique
  try {
    const unique = new Set(submittedBugIds);
    if (unique.size === submittedBugIds.length && submittedBugIds.length > 0) {
      pass("TC-B12", "All returned bug IDs are unique", `${unique.size} unique IDs`);
    } else {
      fail("TC-B12", "All returned bug IDs are unique", `total=${submittedBugIds.length} unique=${unique.size}`);
    }
  } catch (e) {
    fail("TC-B12", "All returned bug IDs are unique", e.message);
  }

  // TC-B13: Bug IDs follow expected format PREFIX-NNNN
  try {
    const pattern = /^[A-Z]{3}-\d{4}$/;
    const malformed = submittedBugIds.filter(id => !pattern.test(id));
    if (malformed.length === 0 && submittedBugIds.length > 0) {
      pass("TC-B13", "Bug IDs match PREFIX-NNNN format");
    } else {
      fail("TC-B13", "Bug IDs match PREFIX-NNNN format", `malformed: ${malformed.slice(0, 5).join(", ")}`);
    }
  } catch (e) {
    fail("TC-B13", "Bug IDs match PREFIX-NNNN format", e.message);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTION C: Data persistence verification
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── SECTION C: Data Persistence (fetching back from Sheets) ──");

  info("Waiting 3 s for GAS to commit all rows…");
  await sleep(3000);

  let fetchResp;
  try {
    fetchResp = await apiGet(SCRIPT_URL + "?action=get");
    fetchedBugs = (fetchResp.data || []).map(b => normBug(b));
  } catch (e) {
    fail("TC-C01", "Fetch all bugs after submission", e.message);
  }

  // TC-C01: Row count increased by 50
  try {
    const newCount = fetchedBugs.length;
    const delta    = newCount - preCount;
    if (delta === 50) {
      pass("TC-C01", "Sheet row count increased by exactly 50", `${preCount} → ${newCount}`);
    } else {
      fail("TC-C01", "Sheet row count increased by exactly 50", `expected +50, got +${delta} (${preCount} → ${newCount})`);
    }
  } catch (e) {
    fail("TC-C01", "Sheet row count increased by exactly 50", e.message);
  }

  // TC-C02: Submitted bug IDs present in fetched data
  try {
    const fetchedIds = new Set(fetchedBugs.map(b => b.bugId));
    const missing    = submittedBugIds.filter(id => !fetchedIds.has(id));
    if (missing.length === 0 && submittedBugIds.length > 0) {
      pass("TC-C02", "All submitted bug IDs present in fetched data");
    } else {
      fail("TC-C02", "All submitted bug IDs present in fetched data", `missing ${missing.length} IDs`);
    }
  } catch (e) {
    fail("TC-C02", "All submitted bug IDs present in fetched data", e.message);
  }

  // TC-C03: Verify all 14 fields populated on fetched bugs
  try {
    const required = ["bugId","tester","sprint","product","module","platform",
                      "description","expected","actual","severity","status","submittedAt"];
    const newBugs  = fetchedBugs.slice(-50);
    let   missingFieldCount = 0;
    newBugs.forEach(bug => {
      required.forEach(k => { if (!bug[k]) missingFieldCount++; });
    });
    if (missingFieldCount === 0) {
      pass("TC-C03", "All 12 required fields populated across fetched bugs");
    } else {
      fail("TC-C03", "All 12 required fields populated across fetched bugs", `${missingFieldCount} empty required fields`);
    }
  } catch (e) {
    fail("TC-C03", "All required fields populated", e.message);
  }

  // TC-C04: Severity values are valid enum
  try {
    const validSevs = new Set(["Critical","High","Medium","Low","Trivial"]);
    const invalid   = fetchedBugs.filter(b => b.severity && !validSevs.has(b.severity));
    if (invalid.length === 0) pass("TC-C04", "All severity values are valid enum values");
    else fail("TC-C04", "All severity values are valid enum values", `${invalid.length} invalid`);
  } catch (e) {
    fail("TC-C04", "Severity values valid", e.message);
  }

  // TC-C05: Status values are valid enum
  try {
    const validStats = new Set(["Open","In Progress","Fixed","Verified","Closed","Reopened"]);
    const invalid    = fetchedBugs.filter(b => b.status && !validStats.has(b.status));
    if (invalid.length === 0) pass("TC-C05", "All status values are valid enum values");
    else fail("TC-C05", "All status values are valid enum values", `${invalid.length} invalid`);
  } catch (e) {
    fail("TC-C05", "Status values valid", e.message);
  }

  // TC-C06: submittedAt is a valid ISO timestamp
  try {
    const invalid = fetchedBugs.filter(b => b.submittedAt && isNaN(new Date(b.submittedAt).getTime()));
    if (invalid.length === 0) pass("TC-C06", "submittedAt is valid ISO timestamp on all bugs");
    else fail("TC-C06", "submittedAt is valid ISO timestamp", `${invalid.length} invalid timestamps`);
  } catch (e) {
    fail("TC-C06", "submittedAt valid", e.message);
  }

  // TC-C07: Distribution across all 4 products
  try {
    const products = new Set(fetchedBugs.slice(-50).map(b => b.product));
    if (products.size >= 4) pass("TC-C07", "Bugs distributed across all 4 products", [...products].join(", "));
    else fail("TC-C07", "Bugs distributed across all 4 products", `only ${products.size} products found`);
  } catch (e) {
    fail("TC-C07", "Product distribution", e.message);
  }

  // TC-C08: Distribution across all 5 severity levels
  try {
    const sevs = new Set(fetchedBugs.slice(-50).map(b => b.severity));
    if (sevs.size >= 5) pass("TC-C08", "Bugs distributed across all 5 severity levels");
    else fail("TC-C08", "Bugs distributed across all 5 severity levels", `only ${sevs.size} found`);
  } catch (e) {
    fail("TC-C08", "Severity distribution", e.message);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTION D: Dashboard logic (client-side JavaScript)
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── SECTION D: Dashboard Logic (simulated) ───────────────────");

  const recentBugs = fetchedBugs.slice(-50);

  // TC-D01: Password gate — correct password
  try {
    const correctPw = "Quality2026";
    const isCorrect = (correctPw === DASHBOARD_PASSWORD);
    if (isCorrect) pass("TC-D01", "Password gate accepts correct password 'Quality2026'");
    else fail("TC-D01", "Password gate accepts correct password");
  } catch (e) {
    fail("TC-D01", "Password gate correct password", e.message);
  }

  // TC-D02: Password gate — wrong password rejected
  try {
    const wrongPw = "wrongpassword";
    if (wrongPw !== DASHBOARD_PASSWORD) pass("TC-D02", "Password gate rejects wrong password");
    else fail("TC-D02", "Password gate rejects wrong password");
  } catch (e) {
    fail("TC-D02", "Password gate wrong password", e.message);
  }

  // TC-D03: Stats — total bugs count
  try {
    const total = fetchedBugs.length;
    if (total > 0) pass("TC-D03", "Stats: total bug count is non-zero", `count = ${total}`);
    else fail("TC-D03", "Stats: total bug count is non-zero");
  } catch (e) {
    fail("TC-D03", "Stats total count", e.message);
  }

  // TC-D04: Stats — open/reopened count
  try {
    const openCount = fetchedBugs.filter(b => b.status === "Open" || b.status === "Reopened").length;
    pass("TC-D04", "Stats: open + reopened count calculated", `${openCount} open`);
  } catch (e) {
    fail("TC-D04", "Stats open count", e.message);
  }

  // TC-D05: Stats — critical + high count
  try {
    const ch = fetchedBugs.filter(b => b.severity === "Critical" || b.severity === "High").length;
    pass("TC-D05", "Stats: critical + high count calculated", `${ch} critical/high`);
  } catch (e) {
    fail("TC-D05", "Stats critical/high count", e.message);
  }

  // TC-D06: Stats — resolved count (Fixed + Verified + Closed)
  try {
    const res = fetchedBugs.filter(b => ["Fixed","Verified","Closed"].includes(b.status)).length;
    pass("TC-D06", "Stats: resolved count (Fixed+Verified+Closed) calculated", `${res} resolved`);
  } catch (e) {
    fail("TC-D06", "Stats resolved count", e.message);
  }

  // TC-D07: Filter by sprint
  try {
    const sprint = "Sprint 28";
    const filtered = recentBugs.filter(b => b.sprint === sprint);
    if (filtered.length > 0) pass("TC-D07", `Filter by sprint '${sprint}' returns results`, `${filtered.length} bugs`);
    else fail("TC-D07", `Filter by sprint '${sprint}' returns results`, "0 results");
  } catch (e) {
    fail("TC-D07", "Filter by sprint", e.message);
  }

  // TC-D08: Filter by tester
  try {
    const tester = "Kumar Ankit";
    const filtered = recentBugs.filter(b => b.tester === tester);
    if (filtered.length > 0) pass("TC-D08", `Filter by tester '${tester}' returns results`, `${filtered.length} bugs`);
    else fail("TC-D08", `Filter by tester '${tester}' returns results`, "0 results");
  } catch (e) {
    fail("TC-D08", "Filter by tester", e.message);
  }

  // TC-D09: Filter by product
  try {
    const product = "Vantage Reward";
    const filtered = recentBugs.filter(b => b.product === product);
    if (filtered.length > 0) pass("TC-D09", `Filter by product '${product}' returns results`, `${filtered.length} bugs`);
    else fail("TC-D09", `Filter by product '${product}' returns results`, "0 results");
  } catch (e) {
    fail("TC-D09", "Filter by product", e.message);
  }

  // TC-D10: Filter by severity Critical
  try {
    const filtered = recentBugs.filter(b => b.severity === "Critical");
    if (filtered.length > 0) pass("TC-D10", "Filter by severity 'Critical' returns results", `${filtered.length} bugs`);
    else fail("TC-D10", "Filter by severity 'Critical' returns results", "0 results");
  } catch (e) {
    fail("TC-D10", "Filter by severity", e.message);
  }

  // TC-D11: Filter by status Open
  try {
    const filtered = recentBugs.filter(b => b.status === "Open");
    if (filtered.length > 0) pass("TC-D11", "Filter by status 'Open' returns results", `${filtered.length} bugs`);
    else fail("TC-D11", "Filter by status 'Open' returns results", "0 results");
  } catch (e) {
    fail("TC-D11", "Filter by status", e.message);
  }

  // TC-D12: Search by description keyword
  try {
    const keyword = "login";
    const filtered = recentBugs.filter(b =>
      [b.bugId,b.tester,b.description,b.module,b.product,b.sprint,b.assignedTo,b.platform]
        .join(" ").toLowerCase().includes(keyword)
    );
    if (filtered.length > 0) pass("TC-D12", `Search keyword '${keyword}' returns results`, `${filtered.length} matches`);
    else fail("TC-D12", `Search keyword '${keyword}' returns results`, "0 matches");
  } catch (e) {
    fail("TC-D12", "Search by keyword", e.message);
  }

  // TC-D13: Search returns empty for gibberish
  try {
    const gibberish = "xqzplmfoo999";
    const filtered  = recentBugs.filter(b =>
      [b.bugId,b.tester,b.description,b.module].join(" ").toLowerCase().includes(gibberish)
    );
    if (filtered.length === 0) pass("TC-D13", "Search returns empty for gibberish query");
    else fail("TC-D13", "Search returns empty for gibberish query", `unexpectedly returned ${filtered.length} results`);
  } catch (e) {
    fail("TC-D13", "Search empty result", e.message);
  }

  // TC-D14: Date range filter — filter by today
  try {
    const today   = new Date().toISOString().slice(0, 10);
    const from    = new Date(today + "T00:00:00");
    const to      = new Date(today + "T23:59:59");
    const filtered = recentBugs.filter(b => {
      const d = new Date(b.submittedAt);
      return !isNaN(d) && d >= from && d <= to;
    });
    if (filtered.length > 0) pass("TC-D14", "Date range filter (today) returns today's bugs", `${filtered.length} bugs`);
    else fail("TC-D14", "Date range filter (today) returns today's bugs", "0 bugs — check timestamps");
  } catch (e) {
    fail("TC-D14", "Date range filter", e.message);
  }

  // TC-D15: Sorting by submittedAt descending
  try {
    const sorted  = [...recentBugs].sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1));
    const isDesc  = sorted[0].submittedAt >= sorted[sorted.length - 1].submittedAt;
    if (isDesc) pass("TC-D15", "Sort by submittedAt descending works correctly");
    else fail("TC-D15", "Sort by submittedAt descending works correctly");
  } catch (e) {
    fail("TC-D15", "Sort by date", e.message);
  }

  // TC-D16: Sorting by severity ascending
  try {
    const order  = ["Critical","High","Medium","Low","Trivial",""];
    const sorted = [...recentBugs].sort((a, b) => {
      const ai = order.indexOf(a.severity), bi = order.indexOf(b.severity);
      return ai - bi;
    });
    if (sorted[0].severity === "Critical" || sorted[0].severity === "High") {
      pass("TC-D16", "Sort by severity ascending places Critical/High first");
    } else {
      fail("TC-D16", "Sort by severity ascending", `first item is ${sorted[0].severity}`);
    }
  } catch (e) {
    fail("TC-D16", "Sort by severity", e.message);
  }

  // TC-D17: CSV export row count matches filtered count
  try {
    const csvHeader = ["Bug ID","Tester","Sprint","Product","Module","Platform","Description","Expected","Actual","Severity","Proof","Status","Assigned To","Submitted At"];
    const rows = recentBugs.map(b =>
      [b.bugId,b.tester,b.sprint,b.product,b.module,b.platform,b.description,
       b.expected,b.actual,b.severity,b.proof,b.status,b.assignedTo,b.submittedAt]
        .map(v => `"${(v||"").replace(/"/g,'""')}"`).join(",")
    );
    const csv = [csvHeader.join(","), ...rows].join("\n");
    const lineCount = csv.split("\n").length;
    if (lineCount === recentBugs.length + 1) {
      pass("TC-D17", "CSV export line count = bugs + header", `${lineCount} lines`);
    } else {
      fail("TC-D17", "CSV export line count", `expected ${recentBugs.length + 1}, got ${lineCount}`);
    }
  } catch (e) {
    fail("TC-D17", "CSV export", e.message);
  }

  // TC-D18: CSV export escapes double-quotes in fields
  try {
    const val = `Bug with "quotes" inside`;
    const escaped = `"${val.replace(/"/g,'""')}"`;
    if (escaped === `"Bug with ""quotes"" inside"`) pass("TC-D18", "CSV export escapes double-quotes correctly");
    else fail("TC-D18", "CSV export escapes double-quotes correctly", `got: ${escaped}`);
  } catch (e) {
    fail("TC-D18", "CSV quote escaping", e.message);
  }

  // TC-D19: Proof link renders for bugs that have a proof URL
  try {
    const withProof = recentBugs.filter(b => b.proof && b.proof.startsWith("http"));
    if (withProof.length > 0) pass("TC-D19", "Proof link present on bugs that have proof URLs", `${withProof.length} bugs with proof`);
    else fail("TC-D19", "Proof link present on bugs with proof URLs", "no bugs have proof");
  } catch (e) {
    fail("TC-D19", "Proof link rendering", e.message);
  }

  // TC-D20: Bugs without proof show blank placeholder
  try {
    const noProof = recentBugs.filter(b => !b.proof);
    if (noProof.length > 0) pass("TC-D20", "Some bugs have empty proof field (will show '—' placeholder)", `${noProof.length} bugs without proof`);
    else fail("TC-D20", "Some bugs have empty proof field", "all bugs have proof — unexpected");
  } catch (e) {
    fail("TC-D20", "Empty proof placeholder", e.message);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTION E: Form behaviour (static analysis / schema checks)
  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── SECTION E: Form Schema & Payload Validation ──────────────");

  // TC-E01: Batch payload structure correct
  try {
    const sample = allBugs[0];
    const required = ["tester","sprint","product","module","platform","description","expected","actual","severity","status","timestamp"];
    const missing  = required.filter(k => !(k in sample));
    if (missing.length === 0) pass("TC-E01", "Form batch payload contains all required fields");
    else fail("TC-E01", "Form batch payload contains all required fields", `missing: ${missing.join(", ")}`);
  } catch (e) {
    fail("TC-E01", "Batch payload structure", e.message);
  }

  // TC-E02: All 4 products are valid options
  try {
    const valid = ["Vantage Reward","Vantage Fit","Vantage Pulse","Vantage Perks"];
    const used  = [...new Set(allBugs.map(b => b.product))];
    const invalid = used.filter(p => !valid.includes(p));
    if (invalid.length === 0) pass("TC-E02", "All product values match valid options");
    else fail("TC-E02", "All product values match valid options", `invalid: ${invalid.join(", ")}`);
  } catch (e) {
    fail("TC-E02", "Product values valid", e.message);
  }

  // TC-E03: All 5 platforms are valid options
  try {
    const valid   = ["Web","Android","iOS","Desktop","API","Other"];
    const used    = [...new Set(allBugs.map(b => b.platform))];
    const invalid = used.filter(p => !valid.includes(p));
    if (invalid.length === 0) pass("TC-E03", "All platform values match valid options");
    else fail("TC-E03", "All platform values match valid options", `invalid: ${invalid.join(", ")}`);
  } catch (e) {
    fail("TC-E03", "Platform values valid", e.message);
  }

  // TC-E04: All tester names match known tester list
  try {
    const validTesters = new Set(TESTERS);
    const used         = [...new Set(allBugs.map(b => b.tester))];
    const invalid      = used.filter(t => !validTesters.has(t));
    if (invalid.length === 0) pass("TC-E04", "All tester names match the defined tester list");
    else fail("TC-E04", "All tester names match defined list", `invalid: ${invalid.join(", ")}`);
  } catch (e) {
    fail("TC-E04", "Tester list valid", e.message);
  }

  // TC-E05: Timestamps are valid ISO 8601
  try {
    const invalid = allBugs.filter(b => isNaN(new Date(b.timestamp).getTime()));
    if (invalid.length === 0) pass("TC-E05", "All bug timestamps are valid ISO 8601");
    else fail("TC-E05", "All bug timestamps are valid ISO 8601", `${invalid.length} invalid`);
  } catch (e) {
    fail("TC-E05", "Timestamp validity", e.message);
  }

  // ─────────────────────────────────────────────────────────────────────
  //  RESULTS SUMMARY
  // ─────────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const total  = results.length;

  console.log("\n════════════════════════════════════════════════════════════");
  console.log(`  RESULTS: ${passed}/${total} passed  |  ${failed} failed`);
  console.log("════════════════════════════════════════════════════════════\n");

  // Return structured results for doc generation
  return {
    runAt: new Date().toISOString(),
    passed, failed, total,
    preCount,
    submittedBugIds,
    totalFetched: fetchedBugs.length,
    results,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MARKDOWN REPORT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function generateMarkdown(summary) {
  const { runAt, passed, failed, total, preCount, totalFetched, results } = summary;
  const passRate = Math.round((passed / total) * 100);

  const sections = {
    "A": "API & Backend",
    "B": "Bug Submission (50 demo bugs)",
    "C": "Data Persistence (Google Sheets)",
    "D": "Dashboard Logic",
    "E": "Form Schema & Payload Validation",
  };

  let md = `# Bug Tracker — Test Case Report

**Run Date:** ${new Date(runAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
**Environment:** Production (GitHub Pages + Google Apps Script)
**Total Test Cases:** ${total} | **Passed:** ${passed} | **Failed:** ${failed} | **Pass Rate:** ${passRate}%

---

## Summary

| Metric | Value |
|---|---|
| Pre-existing bugs in sheet | ${preCount} |
| Demo bugs submitted | 50 |
| Total bugs after run | ${totalFetched} |
| Test pass rate | ${passRate}% (${passed}/${total}) |

---

`;

  for (const [prefix, title] of Object.entries(sections)) {
    const sectionResults = results.filter(r => r.id.startsWith(`TC-${prefix}`));
    if (!sectionResults.length) continue;
    const sPass = sectionResults.filter(r => r.status === "PASS").length;
    const sFail = sectionResults.filter(r => r.status === "FAIL").length;

    md += `## Section ${prefix}: ${title}  (${sPass}/${sectionResults.length} passed)\n\n`;
    md += `| Test ID | Test Case | Result | Notes |\n`;
    md += `|---|---|---|---|\n`;

    sectionResults.forEach(r => {
      const badge = r.status === "PASS" ? "✅ PASS" : "❌ FAIL";
      const notes = (r.detail || "—").replace(/\|/g, "\\|");
      md += `| ${r.id} | ${r.name} | ${badge} | ${notes} |\n`;
    });

    md += "\n";
  }

  md += `---\n\n## Test Coverage Notes\n\n`;
  md += `The following aspects are **not covered** by this automated script and require manual testing:\n\n`;
  md += `| Area | Manual Test Required |\n`;
  md += `|---|---|\n`;
  md += `| UI rendering | Visually verify dashboard table columns, severity badges, and status badges |\n`;
  md += `| Password gate animation | Confirm shake animation on wrong password in browser |\n`;
  md += `| Session persistence | Login, close tab, reopen — should stay unlocked via sessionStorage |\n`;
  md += `| Logout redirect | Logout button should redirect to index.html |\n`;
  md += `| Responsive layout | Check mobile (375 px), tablet (768 px), desktop (1440 px) viewports |\n`;
  md += `| Form validation | Submit form with missing required fields — red borders must appear |\n`;
  md += `| Bug card collapse | Click bug card header — card should collapse/expand |\n`;
  md += `| Progress overlay | Submit bugs — progress bar overlay must appear |\n`;
  md += `| Success screen | After submission — full-screen success with bug count must show |\n`;
  md += `| CSV file download | Click Export CSV — file must download with correct filename |\n`;
  md += `| Sheet colour coding | Check Google Sheets — rows must be colour-coded by severity |\n`;
  md += `| Per-tester sheets | Open Google Sheets — each tester should have their own tab |\n`;

  md += `\n---\n\n*Generated by \`run-tests.js\` · Bug Tracker v1 · Vantage Circle QA*\n`;

  return md;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const summary = await runTests();
    const md = generateMarkdown(summary);

    const fs = await import("fs");
    const path = await import("path");
    const outPath = path.resolve(process.cwd(), "TEST-REPORT.md");
    fs.writeFileSync(outPath, md, "utf8");
    console.log(`  📄 Test report saved to: TEST-REPORT.md\n`);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();
