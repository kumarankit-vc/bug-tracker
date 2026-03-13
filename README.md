# Bug Tracker

A lightweight, web-based bug tracking system designed for QA teams at Vantage Circle. Built with vanilla JavaScript and Google Sheets backend for simplicity and ease of use.

## Overview

This bug tracker allows QA testers to submit bugs through a clean web interface, with all data stored in Google Sheets. Team leads can access a password-protected dashboard to view, filter, and export bug reports.

### Key Features

- **Batch Bug Submission** - Submit multiple bugs in one session
- **Admin Dashboard** - Password-protected view for team leads
- **Real-time Statistics** - Track open bugs, critical issues, and resolution rates
- **Advanced Filtering** - Filter by sprint, tester, product, severity, and status
- **CSV Export** - Download bug data for offline analysis
- **Color-coded Severity** - Visual indicators for Critical, High, Medium, Low
- **Developer Assignment** - Assign bugs to specific developers
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **No external dependencies** - Pure client-side JavaScript

## Setup

### Prerequisites

1. A Google account
2. Access to Google Sheets and Google Apps Script
3. Basic understanding of web deployment

### Step 1: Create Google Sheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Note the Sheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/`**`1SZNcbevA00xKFU5usbAtSCwlyowqRpxm8tiwCVM1BEY`**`/edit`

### Step 2: Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Copy the entire contents of `google-apps-script.js` into the script editor
4. Replace the `SHEET_ID` constant on line 7 with your actual Sheet ID:
   ```javascript
   const SHEET_ID = "YOUR_SHEET_ID_HERE";
   ```
5. Click "Deploy" → "New Deployment"
6. Choose type: "Web app"
7. Set "Who has access" to "Anyone"
8. Click "Deploy" and authorize the script
9. Copy the deployed Web App URL (looks like: `https://script.google.com/macros/s/.../exec`)

### Step 3: Configure Frontend

Open `config.js` and update:

```javascript
window.BUG_TRACKER_CONFIG = {
  scriptUrl: "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE",
  dashboardPassword: "YOUR_PASSWORD_HERE"  // Change from default!
};
```

**Important**: Change the `dashboardPassword` to something secure!

### Step 4: Update HTML Files

**In `index.html` (line 231)**:
```javascript
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
```

**In `dashboard.html` (line 189)**:
```javascript
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
```

### Step 5: Deploy

Host the files on any static web server:
- GitHub Pages
- Netlify
- Vercel
- Your own web server

Or open `index.html` directly in a browser (note: some features may require a web server).

## Usage

### For QA Testers

1. Open `index.html` in a browser
2. Fill in session information:
   - Select your name from dropdown
   - Enter sprint number (e.g., "Sprint 14")
   - Select product (Vantage Reward, Vantage Fit, etc.)
3. Click "+ Add Bug" to add bugs
4. For each bug, fill in:
   - **Module** - Affected feature (e.g., Login, Dashboard)
   - **Platform** - Web, Android, iOS, Desktop, API
   - **Description** - Clear summary of the bug
   - **Expected Result** - What should have happened
   - **Actual Result** - What actually happened
   - **Severity** - Critical, High, Medium, or Low
   - **Proof Link** (optional) - URL to screenshot/video
   - **Assigned To** (optional) - Developer to fix the bug
5. Click "✓ Submit All Bugs" when ready
6. All bugs in the session are submitted at once

### For Team Leads (Dashboard)

1. Open `dashboard.html` in a browser
2. Enter the dashboard password (default: `Quality2026` - **change this!**)
3. View statistics:
   - Total bugs (all time)
   - Open bugs (need attention)
   - Critical/High priority bugs
   - Resolved bugs (fixed + verified)
4. Use filters to narrow down:
   - Search by keyword
   - Filter by sprint, tester, product, severity, or status
5. Click column headers to sort
6. Click "Export CSV" to download all data
7. Click "Refresh" to fetch latest bugs

## File Structure

```
bug-tracker/
├── index.html              # Bug submission form (QA testers)
├── dashboard.html          # Admin dashboard (Team leads)
├── google-apps-script.js   # Backend code for Google Apps Script
├── config.js              # Configuration (URLs, passwords)
└── README.md              # This file
```

## Architecture

### Data Flow

```
[QA Tester] → index.html → POST request → Google Apps Script
                                              ↓
                                          Google Sheet
                                              ↓
[Team Lead] ← dashboard.html ← GET request ← Google Apps Script
```

### Google Sheets Structure

The system creates two types of sheets:

1. **Master Bug Sheet** - Contains all bugs from all testers
2. **Individual Tester Sheets** - One sheet per tester, named by their name

### Bug ID Format

Bugs are assigned IDs in format: `{PREFIX}-{NUMBER}`
- PREFIX: First 3 letters of tester's name (uppercase)
- NUMBER: 4-digit sequential number
- Example: `KUM-0001` for Kumar Ankit

### Severity Colors

| Severity | Background Color | Badge Color |
|----------|------------------|-------------|
| Critical | Light Red | Red |
| High | Light Orange | Orange |
| Medium | Light Yellow | Yellow |
| Low | Light Green | Green |
| Trivial | Light Gray | Gray |

## Team Members

### Testers
- Kumar Ankit
- Sharique Zarar Rahman
- Sanjay Singha
- Ankur Duarah
- Nipjyoti Saikia
- Ayushman Chaudhury
- Raktim Kakati
- Adin Ankur Saikia
- Kongkona Das
- Mushtaq Rejowan
- Meghna Dutta

### Developers
Various developers from the development team (see `DEVS` array in `index.html` for full list)

## Customization

### Adding Testers

In `index.html` (around line 234), update the `TESTERS` array:

```javascript
const TESTERS = [
  "Kumar Ankit",
  "New Tester Name",
  // ... add more
];
```

### Adding Developers

In `index.html` (around line 239), update the `DEVS` array:

```javascript
const DEVS = [
  "Abhishek Das",
  "New Developer Name",
  // ... add more
];
```

### Adding Products

In `index.html` (around line 192), add products to the dropdown:

```html
<select id="productSel">
  <option value="">— Select product —</option>
  <option>Vantage Reward</option>
  <option>Vantage Fit</option>
  <option>New Product</option>
</select>
```

### Changing Platforms

In `index.html` (around line 250), modify the `PLATS` array:

```javascript
const PLATS = ["Web","Android","iOS","Desktop","API","Other"];
```

### Modifying Severity Levels

In `index.html` (around line 251), update the `SEVS` array:

```javascript
const SEVS = ["Critical","High","Medium","Low"];
```

Note: Also update severity colors in CSS and `google-apps-script.js`.

## Security Considerations

1. **Change the default password** in `config.js` and `dashboard.html`
2. **Do not commit** `config.js` to public repositories if it contains sensitive URLs
3. **Google Apps Script URL** is publicly accessible - consider adding authentication
4. **No HTTPS enforcement** - deploy on a server with HTTPS for production

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (responsive design)

## Troubleshooting

### Bugs not submitting
- Verify `SCRIPT_URL` is correct in both HTML files and `config.js`
- Check Google Apps Script deployment is set to "Anyone"
- Check browser console for CORS errors

### Dashboard not loading data
- Verify the script URL is correct
- Check if Google Sheet is accessible
- Try refreshing the deployment in Google Apps Script

### "Script URL not set" error
- Make sure you've replaced placeholder URLs with actual deployed script URL

## Development

### Local Testing

Open `index.html` or `dashboard.html` directly in a browser. Note:
- Demo data will be shown if `SCRIPT_URL` is not configured
- Session storage is used for dashboard password
- Local storage caches tester/session info

### Demo Mode

If `SCRIPT_URL` is not set, both pages show demo data for testing:
- Demo bugs in dashboard
- All features work offline

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Internal tool for Vantage Circle QA team.

## Support

For issues or questions, contact the QA team lead or development team.

---

**Built with love for Vantage Circle QA Team**
