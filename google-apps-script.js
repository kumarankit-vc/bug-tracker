// ═══════════════════════════════════════════════════════════════════════════
//  BUG TRACKER — Google Apps Script
//  Paste into: script.google.com → New Project
//  Deploy → New Deployment → Web App → Anyone → Deploy
//
//  SYNC MECHANISM
//  ──────────────
//  syncMaster() reads every tester sheet and pushes all rows into the
//  Master Bug Sheet — adding new rows and updating changed ones.
//  A time-based trigger runs this automatically every 5 minutes.
//
//  ONE-TIME ADMIN SETUP (run these from the Apps Script editor):
//    1. Run  setupTimeTrigger() — auto-syncs master every 5 minutes
//    2. Run  syncMaster()       — immediately sync everything right now
//    3. Run  setupValidation()  — adds Status dropdown to all tester sheets
// ═══════════════════════════════════════════════════════════════════════════

const SHEET_ID       = "1SZNcbevA00xKFU5usbAtSCwlyowqRpxm8tiwCVM1BEY";
const MASTER_TAB     = "Master Bug Sheet";
const VALID_STATUSES = ["Open", "In Progress", "Fixed", "Verified", "Closed", "Reopened"];
const GAS_CACHE_KEY  = "all_bugs_json";
const GAS_CACHE_TTL  = 60; // seconds — matches the 1-min sync interval

// ── POST: receive bug(s) from form ───────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const bugs  = body.batch ? body.batch : [body];
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const ids   = bugs.map(bug => appendBug(ss, bug));
    return json({ status: "ok", count: ids.length, ids });
  } catch(err) {
    return json({ status: "error", message: err.message });
  }
}

// ── GET: fetch all bugs for dashboard ────────────────────────────────────────
// Checks CacheService first — avoids re-reading the sheet on every request.
// Cache is invalidated by syncMaster() and appendBug() after any write.
function doGet(e) {
  try {
    const cache  = CacheService.getScriptCache();
    const cached = cache.get(GAS_CACHE_KEY);
    if (cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
    const result = JSON.stringify({ status: "ok", data: getAllBugs() });
    try { cache.put(GAS_CACHE_KEY, result, GAS_CACHE_TTL); } catch(e) {}  // ignore if >100KB
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return json({ status: "error", message: err.message });
  }
}

// ── Append a single bug to master + tester sheet (called by doPost) ──────────
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

  master.appendRow([...baseRow, data.tester || "", ts]);
  formatRow(master, master.getLastRow(), data.severity, 14);

  const tSheet = getOrCreate(ss, data.tester || "Unknown");
  ensureHeaders(tSheet, false);
  tSheet.appendRow([...baseRow, ts]);
  formatRow(tSheet, tSheet.getLastRow(), data.severity, 13);

  invalidateCache();
  return bugId;
}

// ── CORE SYNC: rebuild master from all tester sheets ─────────────────────────
// Scans every tester sheet row by row.
// - If Bug ID not in master → appends it
// - If Bug ID already in master → updates all fields from tester sheet
// Safe to run multiple times (idempotent).
function syncMaster() {
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  const master = getOrCreate(ss, MASTER_TAB);
  ensureHeaders(master, true);

  // Build a lookup: bugId → 1-based row number in master
  const masterData  = master.getDataRange().getValues();
  const masterIndex = {};
  const bugIdCol    = masterData[0].indexOf("Bug ID"); // 0-indexed
  for (let i = 1; i < masterData.length; i++) {
    const id = String(masterData[i][bugIdCol]).trim();
    if (id) masterIndex[id] = i + 1; // store as 1-based
  }

  let added = 0, updated = 0, deleted = 0;
  const testerBugIds = new Set(); // all Bug IDs that exist across tester sheets

  ss.getSheets().forEach(sheet => {
    const name = sheet.getName();
    if (name === MASTER_TAB) return;
    if (sheet.getLastRow() < 2) return;

    const numCols = Math.max(sheet.getLastColumn(), 13);
    const rows    = sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).getValues();

    rows.forEach(tRow => {
      const bugId = String(tRow[0]).trim();
      if (!bugId) return;

      testerBugIds.add(bugId);

      // Tester sheet cols (0-indexed): 0=Bug ID … 10=Status, 11=Assigned To, 12=Submitted At
      // Master sheet cols (1-indexed): 1=Bug ID … 11=Status, 12=Assigned To, 13=Tester, 14=Submitted At
      const masterRow = [
        tRow[0]  || "",                          // Bug ID
        tRow[1]  || "",                          // Sprint
        tRow[2]  || "",                          // Module
        tRow[3]  || "",                          // Product
        tRow[4]  || "",                          // Platform
        tRow[5]  || "",                          // Description
        tRow[6]  || "",                          // Expected
        tRow[7]  || "",                          // Actual
        tRow[8]  || "",                          // Severity
        tRow[9]  || "",                          // Proof Link
        tRow[10] || "Open",                      // Status
        tRow[11] || "",                          // Assigned To
        name,                                    // Tester (= sheet name)
        tRow[12] || new Date().toISOString(),    // Submitted At
      ];

      if (masterIndex[bugId]) {
        // Update existing row in place
        master.getRange(masterIndex[bugId], 1, 1, 14).setValues([masterRow]);
        formatRow(master, masterIndex[bugId], String(tRow[8]), 14);
        updated++;
      } else {
        // Append new row
        master.appendRow(masterRow);
        const newRow = master.getLastRow();
        formatRow(master, newRow, String(tRow[8]), 14);
        masterIndex[bugId] = newRow;
        added++;
      }
    });
  });

  // Delete rows from master whose Bug ID no longer exists in any tester sheet.
  // Scan bottom-to-top so row deletions don't shift indices.
  const freshMaster = master.getDataRange().getValues();
  for (let i = freshMaster.length - 1; i >= 1; i--) {
    const id = String(freshMaster[i][bugIdCol]).trim();
    if (id && !testerBugIds.has(id)) {
      master.deleteRow(i + 1); // +1 because getValues is 0-indexed, sheet rows are 1-indexed
      deleted++;
      Logger.log("Deleted from master: " + id);
    }
  }

  invalidateCache();
  Logger.log("syncMaster done — added: " + added + ", updated: " + updated + ", deleted: " + deleted + " [" + new Date().toISOString() + "]");
}

// ── Set up a time-based trigger: syncMaster runs every 5 minutes ─────────────
// Run this once from the Apps Script editor. No need to run again.
function setupTimeTrigger() {
  // Remove any existing syncMaster time triggers to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "syncMaster")
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("syncMaster")
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log("✅ Time trigger installed: syncMaster will run every 1 minute.");
}

// ── Add Status dropdown validation to a single sheet ─────────────────────────
function addStatusValidation(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(VALID_STATUSES, true)
    .setAllowInvalid(false)
    .setHelpText("Choose a status: " + VALID_STATUSES.join(", "))
    .build();
  sheet.getRange(2, 11, lastRow + 498, 1).setDataValidation(rule);
}

// ── Apply Status dropdown to ALL existing tester sheets (run once) ────────────
function setupValidation() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ss.getSheets().forEach(sheet => {
    if (sheet.getName() !== MASTER_TAB) addStatusValidation(sheet);
  });
  Logger.log("✅ Status validation applied to all tester sheets.");
}

// ── Invalidate the GAS response cache ────────────────────────────────────────
function invalidateCache() {
  CacheService.getScriptCache().remove(GAS_CACHE_KEY);
}

// ── Read all bugs from master sheet ──────────────────────────────────────────
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
  "Submitted At":           "submittedAt",
  "Priority":               "priority"
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
        // Convert Date objects (returned by Sheets for date-formatted cells) to ISO strings
        // so the dashboard can sort them correctly.
        obj[key] = row[i] instanceof Date ? row[i].toISOString() : String(row[i] || "");
      });
      return obj;
    })
    .filter(b => b.bugId);
}

// ── Generate unique sequential Bug ID ────────────────────────────────────────
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

// ── Ensure header row exists ──────────────────────────────────────────────────
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
    [100,100,160,140,100,300,240,240,100,220,120,180,160,180,80]
      .forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  } else {
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
