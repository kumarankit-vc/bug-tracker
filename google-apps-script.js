// ═══════════════════════════════════════════════════════════════════════════
//  BUG TRACKER — Google Apps Script  (optimised batch submission)
//  Paste into: script.google.com → New Project
//  Deploy → New Deployment → Web App → Anyone → Deploy
//
//  STATUS UPDATE WORKFLOW
//  ─────────────────────
//  Testers open their named sheet in Google Sheets and change the value
//  in the "Status" column (column 11) using the dropdown.  The
//  onEditTrigger() function automatically mirrors that change into the
//  Master Bug Sheet so the dashboard reflects it on the next refresh.
//
//  ONE-TIME ADMIN SETUP (run these from the Apps Script editor):
//    1. Run  setupTrigger()    — installs the installable onEdit trigger
//    2. Run  setupValidation() — adds the Status dropdown to every
//                                existing tester sheet
// ═══════════════════════════════════════════════════════════════════════════

const SHEET_ID      = "1SZNcbevA00xKFU5usbAtSCwlyowqRpxm8tiwCVM1BEY";
const MASTER_TAB    = "Master Bug Sheet";
const VALID_STATUSES = ["Open", "In Progress", "Fixed", "Verified", "Closed", "Reopened"];

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

// ── onEdit installable trigger: tester sheet Status → Master ─────────────────
// Fires whenever any cell is edited in the spreadsheet.
// Watches column 11 (Status) in every tester sheet and mirrors the new value
// into the matching row of the Master Bug Sheet.
function onEditTrigger(e) {
  const range     = e.range;
  const sheet     = range.getSheet();
  const sheetName = sheet.getName();

  // Ignore edits made directly in the master sheet
  if (sheetName === MASTER_TAB) return;

  const row = range.getRow();
  const col = range.getColumn();

  // Only react to the Status column (col 11); skip header row
  if (row < 2 || col !== 11) return;

  const bugId = sheet.getRange(row, 1).getValue();
  if (!bugId) return;

  const newStatus = String(range.getValue()).trim();
  if (!VALID_STATUSES.includes(newStatus)) return;

  // Mirror into Master Bug Sheet
  const ss     = e.source;
  const master = ss.getSheetByName(MASTER_TAB);
  if (!master) return;

  const data      = master.getDataRange().getValues();
  const headers   = data[0];
  const bugIdCol  = headers.indexOf("Bug ID");  // 0-indexed
  const statusCol = headers.indexOf("Status");  // 0-indexed
  if (bugIdCol < 0 || statusCol < 0) return;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][bugIdCol]) === String(bugId)) {
      master.getRange(i + 1, statusCol + 1).setValue(newStatus);
      Logger.log("Updated " + bugId + " → " + newStatus);
      break;
    }
  }
}

// ── Install the installable onEdit trigger (run once from Script Editor) ──────
// Simple onEdit triggers cannot use SpreadsheetApp.openById(), so an
// installable trigger is required.  Run this function once as the admin.
function setupTrigger() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  // Remove duplicates before creating
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "onEditTrigger")
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("onEditTrigger")
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  Logger.log("✅ onEditTrigger installed.");
}

// ── Add Status dropdown validation to a single sheet ─────────────────────────
function addStatusValidation(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(VALID_STATUSES, true)
    .setAllowInvalid(false)
    .setHelpText("Choose a status: " + VALID_STATUSES.join(", "))
    .build();
  // Apply to col 11, rows 2 → lastRow (+ 500 buffer for future rows)
  sheet.getRange(2, 11, lastRow + 498, 1).setDataValidation(rule);
}

// ── Apply Status dropdown to ALL existing tester sheets (run once by admin) ───
function setupValidation() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ss.getSheets().forEach(sheet => {
    if (sheet.getName() !== MASTER_TAB) addStatusValidation(sheet);
  });
  Logger.log("✅ Status validation applied to all tester sheets.");
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
  } else {
    // New tester sheet: pre-apply Status dropdown to rows 2–1000
    addStatusValidation(sheet);
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
