// ═══════════════════════════════════════════════════════════════════════════
//  BUG TRACKER — Google Apps Script  (supports batch submissions)
//  Paste into: script.google.com → New Project
//  Deploy → New Deployment → Web App → Anyone → Deploy
// ═══════════════════════════════════════════════════════════════════════════

const SHEET_ID  = "1SZNcbevA00xKFU5usbAtSCwlyowqRpxm8tiwCVM1BEY";  // ← replace with your Sheet ID
const MASTER_TAB = "Master Bug Sheet";

// ── POST: receive bug(s) from form ───────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // Support both single bug and batch array
    const bugs = body.batch ? body.batch : [body];

    const results = bugs.map((bug, i) => appendBug(bug, i));

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", count: results.length, ids: results }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET: fetch all bugs for dashboard ────────────────────────────────────────
function doGet(e) {
  try {
    const bugs = getAllBugs();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", data: bugs }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Append a single bug ──────────────────────────────────────────────────────
function appendBug(data, batchOffset) {
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  const master = getOrCreate(ss, MASTER_TAB);
  ensureMasterHeaders(master);

  const bugId = generateBugId(master, data.tester);
  const ts    = data.timestamp || new Date().toISOString();

  master.appendRow([
    bugId,
    data.sprint       || "",
    data.module       || "",
    data.product      || "",
    data.platform     || "",
    data.description  || "",
    data.expected     || "",
    data.actual       || "",
    data.severity     || "",
    data.proof        || "",
    data.status       || "Open",
    data.assignedTo   || "",
    data.tester       || "",
    ts
  ]);

  // Also write to tester's own sheet
  const tSheet = getOrCreate(ss, data.tester || "Unknown");
  ensureTesterHeaders(tSheet);
  tSheet.appendRow([
    bugId,
    data.sprint       || "",
    data.module       || "",
    data.product      || "",
    data.platform     || "",
    data.description  || "",
    data.expected     || "",
    data.actual       || "",
    data.severity     || "",
    data.proof        || "",
    data.status       || "Open",
    data.assignedTo   || "",
    ts
  ]);

  // Colour row by severity
  formatRow(master, master.getLastRow(), data.severity);

  return bugId;
}

// ── Get all bugs ─────────────────────────────────────────────────────────────
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
      headers.forEach((h, i) => obj[toCamel(String(h))] = String(row[i]||""));
      return obj;
    })
    .filter(b => b.bugId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateBugId(sheet, testerName) {
  const prefix = (testerName || "BUG").replace(/\s+/g,"").substring(0,3).toUpperCase();
  const num    = String(Math.max(1, sheet.getLastRow())).padStart(4,"0");
  return `${prefix}-${num}`;
}

function getOrCreate(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureMasterHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Bug ID","Sprint","Module","Product","Platform",
      "Description / Summary","Expected Result","Actual Result",
      "Severity","Proof Link","Status","Assigned To","Tester","Submitted At"
    ]);
    styleHeader(sheet, 1, 14);
    sheet.setFrozenRows(1);
    [100,100,160,140,100,300,240,240,100,220,120,180,160,180]
      .forEach((w,i) => sheet.setColumnWidth(i+1, w));
  }
}

function ensureTesterHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Bug ID","Sprint","Module","Product","Platform",
      "Description / Summary","Expected Result","Actual Result",
      "Severity","Proof Link","Status","Assigned To","Submitted At"
    ]);
    styleHeader(sheet, 1, 13);
    sheet.setFrozenRows(1);
  }
}

function styleHeader(sheet, row, cols) {
  sheet.getRange(row,1,1,cols)
    .setBackground("#1F3864").setFontColor("#FFFFFF")
    .setFontWeight("bold").setFontSize(10);
}

function formatRow(sheet, row, severity) {
  const colors = {Critical:"#FDECEA",High:"#FEF3E2",Medium:"#FEFCE8",Low:"#ECFDF5",Trivial:"#F9FAFB"};
  sheet.getRange(row,1,1,14).setBackground(colors[severity]||"#FFFFFF");
}

function toCamel(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g,"").trim()
    .replace(/\s+(.)/g,(_,c)=>c.toUpperCase());
}
