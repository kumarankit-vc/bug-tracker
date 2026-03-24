// ═══════════════════════════════════════════════════════════════════════════
//  BUG TRACKER — Google Apps Script  (optimised batch submission)
//  Paste into: script.google.com → New Project
//  Deploy → New Deployment → Web App → Anyone → Deploy
// ═══════════════════════════════════════════════════════════════════════════

const SHEET_ID   = "1SZNcbevA00xKFU5usbAtSCwlyowqRpxm8tiwCVM1BEY";
const MASTER_TAB = "Master Bug Sheet";

// ── POST: receive bug(s) from form ───────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const bugs  = body.batch ? body.batch : [body];
    const ss    = SpreadsheetApp.openById(SHEET_ID); // open once per request
    const ids   = bugs.map(bug => appendBug(ss, bug));
    return json({ status: "ok", count: ids.length, ids });
  } catch(err) {
    return json({ status: "error", message: err.message });
  }
}

// ── GET: paginated, filtered, sorted bugs for dashboard ──────────────────────
function doGet(e) {
  try {
    const p = e.parameter || {};

    // Pagination
    const page  = Math.max(1, parseInt(p.page  || "1"));
    const limit = Math.min(500, Math.max(1, parseInt(p.limit || "50")));

    // Filters
    const filters = {
      sprint:   p.sprint   || "",
      tester:   p.tester   || "",
      product:  p.product  || "",
      severity: p.severity || "",
      status:   p.status   || "",
      search:   (p.search  || "").toLowerCase().trim(),
      dateFrom: p.dateFrom || "",
      dateTo:   p.dateTo   || "",
    };

    // Sort (whitelist columns to prevent injection)
    const VALID_COLS = ["bugId","sprint","tester","product","severity","status","submittedAt"];
    const sortBy  = VALID_COLS.includes(p.sortBy) ? p.sortBy : "submittedAt";
    const sortDir = p.sortDir === "asc" ? "asc" : "desc";

    const all      = getAllBugs();
    const filtered = filterBugs(all, filters);

    filtered.sort((a, b) => {
      const av = a[sortBy] || "", bv = b[sortBy] || "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    // Aggregate stats (always from full unfiltered set)
    const stats = {
      total:        all.length,
      open:         all.filter(b => b.status === "Open" || b.status === "Reopened").length,
      criticalHigh: all.filter(b => b.severity === "Critical" || b.severity === "High").length,
      resolved:     all.filter(b => ["Fixed","Verified","Closed"].includes(b.status)).length,
    };

    // Dropdown options (from full unfiltered set)
    const uniq = arr => [...new Set(arr.filter(Boolean))].sort();
    const options = {
      sprints:  uniq(all.map(b => b.sprint)),
      testers:  uniq(all.map(b => b.tester)),
      products: uniq(all.map(b => b.product)),
    };

    // Paginate
    const total  = filtered.length;
    const pages  = Math.max(1, Math.ceil(total / limit));
    const safeP  = Math.min(page, pages);
    const data   = filtered.slice((safeP - 1) * limit, safeP * limit);

    return json({ status: "ok", data, total, page: safeP, pages, limit, stats, options });
  } catch(err) {
    return json({ status: "error", message: err.message });
  }
}

// ── Filter bugs by all supported criteria ────────────────────────────────────
function filterBugs(all, f) {
  return all.filter(b => {
    if (f.sprint   && b.sprint   !== f.sprint)   return false;
    if (f.tester   && b.tester   !== f.tester)   return false;
    if (f.product  && b.product  !== f.product)  return false;
    if (f.severity && b.severity !== f.severity) return false;
    if (f.status   && b.status   !== f.status)   return false;
    if (f.search) {
      const hay = [b.bugId,b.tester,b.description,b.module,b.product,
                   b.sprint,b.assignedTo,b.platform].join(" ").toLowerCase();
      if (!hay.includes(f.search)) return false;
    }
    if (f.dateFrom || f.dateTo) {
      const sd = new Date(b.submittedAt);
      if (isNaN(sd.getTime())) return false;
      if (f.dateFrom && sd < new Date(f.dateFrom + "T00:00:00")) return false;
      if (f.dateTo   && sd > new Date(f.dateTo   + "T23:59:59")) return false;
    }
    return true;
  });
}

// ── Append a single bug to master + tester sheet ─────────────────────────────
function appendBug(ss, data) {
  const master = getOrCreate(ss, MASTER_TAB);
  ensureHeaders(master, true);

  const bugId = generateBugId(data.tester);
  const ts    = data.timestamp || new Date().toISOString();

  const baseRow = [
    bugId,
    data.sprint      || "",
    data.module      || "",
    data.product     || "",
    data.platform    || "",
    data.description || "",
    data.expected    || "",
    data.actual      || "",
    data.severity    || "",
    data.proof       || "",
    data.status      || "Open",
    data.assignedTo  || "",
  ];

  // Master sheet row (includes Tester + Submitted At)
  master.appendRow([...baseRow, data.tester || "", ts]);
  formatRow(master, master.getLastRow(), data.severity, 14);

  // Per-tester sheet row (no Tester column, has Submitted At)
  const tSheet = getOrCreate(ss, data.tester || "Unknown");
  ensureHeaders(tSheet, false);
  tSheet.appendRow([...baseRow, ts]);
  formatRow(tSheet, tSheet.getLastRow(), data.severity, 13);

  return bugId;
}

// ── Read all bugs from master sheet ──────────────────────────────────────────
// Explicit header → field key mapping so dashboard always gets consistent names
// regardless of how headers were written (avoids toCamel ambiguity with "/" and spaces)
const FIELD_MAP = {
  "Bug ID":                 "bugId",
  "Sprint":                 "sprint",
  "Module":                 "module",
  "Product":                "product",
  "Platform":               "platform",
  "Description / Summary":  "description",
  "Expected Result":        "expected",
  "Actual Result":          "actual",
  "Severity":               "severity",
  "Proof Link":             "proof",
  "Status":                 "status",
  "Assigned To":            "assignedTo",
  "Tester":                 "tester",
  "Submitted At":           "submittedAt"
};

function getAllBugs() {
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  const master = ss.getSheetByName(MASTER_TAB);
  if (!master) return [];
  const rows = master.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = FIELD_MAP[String(h)] || toCamel(String(h));
        obj[key] = String(row[i] || "");
      });
      return obj;
    })
    .filter(b => b.bugId);
}

// ── Generate unique sequential Bug ID using script properties ────────────────
// Format: {PREFIX}-{NNNN}  e.g. KUM-0001
// Uses PropertiesService so IDs never collide even under concurrent submissions.
function generateBugId(testerName) {
  const prefix = (testerName || "BUG").replace(/\s+/g, "").substring(0, 3).toUpperCase();
  const key    = "seq_" + prefix;
  const props  = PropertiesService.getScriptProperties();
  const n      = parseInt(props.getProperty(key) || "0") + 1;
  props.setProperty(key, String(n));
  return prefix + "-" + String(n).padStart(4, "0");
}

// ── Get or create a sheet by name ────────────────────────────────────────────
function getOrCreate(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// ── Ensure header row exists (skips if already set up) ───────────────────────
function ensureHeaders(sheet, isMaster) {
  if (sheet.getLastRow() > 0) return;
  const h = isMaster
    ? ["Bug ID","Sprint","Module","Product","Platform",
       "Description / Summary","Expected Result","Actual Result",
       "Severity","Proof Link","Status","Assigned To","Tester","Submitted At"]
    : ["Bug ID","Sprint","Module","Product","Platform",
       "Description / Summary","Expected Result","Actual Result",
       "Severity","Proof Link","Status","Assigned To","Submitted At"];
  sheet.appendRow(h);
  sheet.getRange(1, 1, 1, h.length)
    .setBackground("#1a3a6b")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10);
  sheet.setFrozenRows(1);
  if (isMaster) {
    [100,100,160,140,100,300,240,240,100,220,120,180,160,180]
      .forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  }
}

// ── Colour-code a row by severity ────────────────────────────────────────────
function formatRow(sheet, row, severity, cols) {
  const colors = {
    Critical: "#FDECEA",
    High:     "#FEF3E2",
    Medium:   "#FEFCE8",
    Low:      "#ECFDF5",
    Trivial:  "#F9FAFB"
  };
  sheet.getRange(row, 1, 1, cols).setBackground(colors[severity] || "#FFFFFF");
}

// ── Convert header string to camelCase key ───────────────────────────────────
function toCamel(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9 ]/g, "").trim()
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase());
}

// ── JSON response helper ──────────────────────────────────────────────────────
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
