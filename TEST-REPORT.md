# Bug Tracker — Test Case Report

**Run Date:** 24/3/2026, 3:50:04 pm IST
**Environment:** Production (GitHub Pages + Google Apps Script)
**Total Test Cases:** 45 | **Passed:** 45 | **Failed:** 0 | **Pass Rate:** 100%

---

## Summary

| Metric | Value |
|---|---|
| Pre-existing bugs in sheet | 52 |
| Demo bugs submitted | 50 |
| Total bugs after run | 102 |
| Test pass rate | 100% (45/45) |

---

## Section A: API & Backend  (3/3 passed)

| Test ID | Test Case | Result | Notes |
|---|---|---|---|
| TC-A01 | GET endpoint reachable | ✅ PASS | 52 existing bugs in sheet |
| TC-A02 | GET response schema valid | ✅ PASS | { status, data[] } |
| TC-A03 | Normalised bug object has all 14 fields | ✅ PASS | — |

## Section B: Bug Submission (50 demo bugs)  (9/9 passed)

| Test ID | Test Case | Result | Notes |
|---|---|---|---|
| TC-B01 | Generated 50 demo bug objects | ✅ PASS | 50 unique descriptions |
| TC-B02 | Batch 1/5 submitted (bugs 1–10) | ✅ PASS | ids: KUM-0053, SHA-0054, SAN-0055… |
| TC-B03 | Batch 2/5 submitted (bugs 11–20) | ✅ PASS | ids: MEG-0063, KUM-0064, SHA-0065… |
| TC-B04 | Batch 3/5 submitted (bugs 21–30) | ✅ PASS | ids: MUS-0073, MEG-0074, KUM-0075… |
| TC-B05 | Batch 4/5 submitted (bugs 31–40) | ✅ PASS | ids: KON-0083, MUS-0084, MEG-0085… |
| TC-B06 | Batch 5/5 submitted (bugs 41–50) | ✅ PASS | ids: ADI-0093, KON-0094, MUS-0095… |
| TC-B11 | All 50 bugs submitted successfully | ✅ PASS | — |
| TC-B12 | All returned bug IDs are unique | ✅ PASS | 50 unique IDs |
| TC-B13 | Bug IDs match PREFIX-NNNN format | ✅ PASS | — |

## Section C: Data Persistence (Google Sheets)  (8/8 passed)

| Test ID | Test Case | Result | Notes |
|---|---|---|---|
| TC-C01 | Sheet row count increased by exactly 50 | ✅ PASS | 52 → 102 |
| TC-C02 | All submitted bug IDs present in fetched data | ✅ PASS | — |
| TC-C03 | All 12 required fields populated across fetched bugs | ✅ PASS | — |
| TC-C04 | All severity values are valid enum values | ✅ PASS | — |
| TC-C05 | All status values are valid enum values | ✅ PASS | — |
| TC-C06 | submittedAt is valid ISO timestamp on all bugs | ✅ PASS | — |
| TC-C07 | Bugs distributed across all 4 products | ✅ PASS | Vantage Reward, Vantage Fit, Vantage Pulse, Vantage Perks |
| TC-C08 | Bugs distributed across all 5 severity levels | ✅ PASS | — |

## Section D: Dashboard Logic  (20/20 passed)

| Test ID | Test Case | Result | Notes |
|---|---|---|---|
| TC-D01 | Password gate accepts correct password 'Quality2026' | ✅ PASS | — |
| TC-D02 | Password gate rejects wrong password | ✅ PASS | — |
| TC-D03 | Stats: total bug count is non-zero | ✅ PASS | count = 102 |
| TC-D04 | Stats: open + reopened count calculated | ✅ PASS | 35 open |
| TC-D05 | Stats: critical + high count calculated | ✅ PASS | 41 critical/high |
| TC-D06 | Stats: resolved count (Fixed+Verified+Closed) calculated | ✅ PASS | 48 resolved |
| TC-D07 | Filter by sprint 'Sprint 28' returns results | ✅ PASS | 13 bugs |
| TC-D08 | Filter by tester 'Kumar Ankit' returns results | ✅ PASS | 5 bugs |
| TC-D09 | Filter by product 'Vantage Reward' returns results | ✅ PASS | 13 bugs |
| TC-D10 | Filter by severity 'Critical' returns results | ✅ PASS | 10 bugs |
| TC-D11 | Filter by status 'Open' returns results | ✅ PASS | 9 bugs |
| TC-D12 | Search keyword 'login' returns results | ✅ PASS | 3 matches |
| TC-D13 | Search returns empty for gibberish query | ✅ PASS | — |
| TC-D14 | Date range filter (today) returns today's bugs | ✅ PASS | 50 bugs |
| TC-D15 | Sort by submittedAt descending works correctly | ✅ PASS | — |
| TC-D16 | Sort by severity ascending places Critical/High first | ✅ PASS | — |
| TC-D17 | CSV export line count = bugs + header | ✅ PASS | 51 lines |
| TC-D18 | CSV export escapes double-quotes correctly | ✅ PASS | — |
| TC-D19 | Proof link present on bugs that have proof URLs | ✅ PASS | 30 bugs with proof |
| TC-D20 | Some bugs have empty proof field (will show '—' placeholder) | ✅ PASS | 20 bugs without proof |

## Section E: Form Schema & Payload Validation  (5/5 passed)

| Test ID | Test Case | Result | Notes |
|---|---|---|---|
| TC-E01 | Form batch payload contains all required fields | ✅ PASS | — |
| TC-E02 | All product values match valid options | ✅ PASS | — |
| TC-E03 | All platform values match valid options | ✅ PASS | — |
| TC-E04 | All tester names match the defined tester list | ✅ PASS | — |
| TC-E05 | All bug timestamps are valid ISO 8601 | ✅ PASS | — |

---

## Test Coverage Notes

The following aspects are **not covered** by this automated script and require manual testing:

| Area | Manual Test Required |
|---|---|
| UI rendering | Visually verify dashboard table columns, severity badges, and status badges |
| Password gate animation | Confirm shake animation on wrong password in browser |
| Session persistence | Login, close tab, reopen — should stay unlocked via sessionStorage |
| Logout redirect | Logout button should redirect to index.html |
| Responsive layout | Check mobile (375 px), tablet (768 px), desktop (1440 px) viewports |
| Form validation | Submit form with missing required fields — red borders must appear |
| Bug card collapse | Click bug card header — card should collapse/expand |
| Progress overlay | Submit bugs — progress bar overlay must appear |
| Success screen | After submission — full-screen success with bug count must show |
| CSV file download | Click Export CSV — file must download with correct filename |
| Sheet colour coding | Check Google Sheets — rows must be colour-coded by severity |
| Per-tester sheets | Open Google Sheets — each tester should have their own tab |

---

*Generated by `run-tests.js` · Bug Tracker v1 · Vantage Circle QA*
