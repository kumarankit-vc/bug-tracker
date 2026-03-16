# Bug Tracker Testing Guide

This guide explains how to test the complete bug tracking flow.

## Prerequisites

1. The Google Apps Script must be deployed and accessible
2. The Google Sheet ID in `google-apps-script.js` must be correct
3. The script must have proper permissions to access the Google Sheet

## Testing Methods

### Method 1: Automated Test Page (Recommended)

1. Open `test-flow.html` in your browser
2. Click "Run All Tests" to automatically:
   - Test the connection to Google Apps Script
   - Submit a test bug
   - Fetch all bugs to verify data was saved
3. Check the results in each section
4. Open `dashboard.html` (password: `Quality2026`) to see the submitted bugs

### Method 2: Manual Testing

#### Test Bug Submission (index.html)

1. Open `index.html` in your browser
2. Fill in the session info:
   - Select your name from the dropdown
   - Enter a sprint (e.g., "Sprint 15")
   - Select a product (e.g., "Vantage Reward")
3. Click "+ Add Bug" to add one or more bugs
4. Fill in bug details:
   - Module (e.g., "Login")
   - Platform (e.g., "Web")
   - Description
   - Expected Result
   - Actual Result
   - Severity (select one)
   - Proof Link (optional)
   - Status (default: Open)
   - Assign To Developer (optional)
5. Click "✓ Submit All Bugs"
6. Wait for success message

#### Test Dashboard Viewing (dashboard.html)

1. Open `dashboard.html` in your browser
2. Enter password: `Quality2026`
3. Verify that:
   - All submitted bugs appear in the table
   - Filters work (Sprint, Tester, Product, Severity, Status)
   - Search works
   - Sorting works (click column headers)
   - Export CSV button works
   - Refresh button reloads data

### Method 3: Console Testing

You can also test directly in the browser console:

```javascript
// Test fetching bugs
fetch('https://script.google.com/macros/s/AKfycbwG9wrY-6DGt03TaqS6i0FKM5SdCfI0qg_qzu4b26CR6BAOuIb-VbNuLBW7Cu0wZHkt/exec?action=get')
  .then(r => r.json())
  .then(data => console.log('Bugs:', data));

// Test submitting a bug (run in console with no-cors limitation)
fetch('https://script.google.com/macros/s/AKfycbwG9wrY-6DGt03TaqS6i0FKM5SdCfI0qg_qzu4b26CR6BAOuIb-VbNuLBW7Cu0wZHkt/exec', {
  method: 'POST',
  mode: 'no-cors',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    batch: [{
      tester: "Console Test",
      sprint: "Test Sprint",
      product: "Test Product",
      module: "Test Module",
      platform: "Web",
      description: "Test from console",
      expected: "Should work",
      actual: "Works",
      severity: "Low",
      status: "Open"
    }]
  })
});
```

## Common Issues

### Issue: "Script URL not set" error
**Solution:** Verify the `SCRIPT_URL` in both `index.html` and `dashboard.html` matches the deployed Google Apps Script URL.

### Issue: CORS errors
**Solution:** This is normal for Google Apps Script. The script uses `mode: 'no-cors'` for POST requests, which prevents reading the response but allows submission.

### Issue: Dashboard shows no bugs
**Solutions:**
- Check if the Google Apps Script is deployed
- Verify the Sheet ID in `google-apps-script.js`
- Ensure the script has edit permissions on the Google Sheet
- Try the "Refresh" button in the dashboard

### Issue: Password not working
**Solution:** The default password is `Quality2026`. You can change it in `dashboard.html` (line 190).

## Data Flow

```
[Bug Report Form (index.html)]
         ↓ POST
[Google Apps Script]
         ↓
[Google Sheets (Master Sheet)]
         ↓
[Individual Tester Sheets]
         ↓ GET
[Admin Dashboard (dashboard.html)]
```

## Google Sheet Structure

The script creates two types of sheets:

1. **Master Bug Sheet** - Contains all bugs with columns:
   - Bug ID, Sprint, Module, Product, Platform
   - Description, Expected Result, Actual Result
   - Severity, Proof Link, Status, Assigned To
   - Tester, Submitted At

2. **Tester Sheets** - One sheet per tester with the same columns

## Next Steps

After successful testing:

1. Update tester names in `index.html` (TESTERS array around line 234)
2. Update developer names in `index.html` (DEVS array around line 239)
3. Change the dashboard password in `dashboard.html` (line 190)
4. Deploy the HTML files to your web server or use GitHub Pages

## Support

If you encounter issues:

1. Check the browser console for errors (F12 → Console)
2. Verify Google Apps Script deployment settings
3. Test the Google Apps Script URL directly in your browser
4. Check Google Apps Script logs in the script editor