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

// ── GET: fetch all bugs for dashboard ────────────────────────────────────────
function doGet(e) {
  try {
    return json({ status: "ok", data: getAllBugs() });
  } catch(err) {
    return json({ status: "error", message: err.message });
  }
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
      headers.forEach((h, i) => obj[toCamel(String(h))] = String(row[i] || ""));
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
