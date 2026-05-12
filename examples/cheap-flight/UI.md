# 🎨 AICP Web UI

Interactive web interface for the cheap flight search example.

## Features

✅ **Contract Discovery** — Displays the AICP manifest  
✅ **Search Form** — Query flights with constraints  
✅ **AOM Display** — Shows all planes (data, actions, policies, provenance, freshness, warnings)  
✅ **Risk Indicators** — Visual badges for low/medium/high risk  
✅ **Confirmation Dialogs** — Context-aware modals per action  
✅ **Status Messages** — Real-time feedback on all operations  
✅ **Mobile Responsive** — Works on desktop and tablet  

## Getting Started

1. **Start the server:**
```bash
cd examples/cheap-flight
make server
```

2. **Open in browser:**
```
http://localhost:3000
```

## Using the Interface

### 1. View Contract
Click "Show Full Contract" to see the complete AICP manifest.

### 2. Search Flights (LOW RISK)
- Enter origin/destination (e.g., MAD → TYO)
- Set date range
- Configure constraints (stops, baggage, max price)
- Click "Search Flights"

The interface displays:
- **Data Plane**: Actual flight results
- **Actions Plane**: Available next actions
- **Provenance**: Source, timestamp, URL
- **Freshness**: Validity window and volatility
- **Warnings**: Non-obvious risks

### 3. Set Price Watch (LOW RISK - No Confirmation)
Click "Enable Price Watch" to monitor the fare.

### 4. Hold Fare (MEDIUM RISK - Confirmation Required)
Click "Hold Fare (Requires Confirmation)".

A confirmation modal appears:
- Shows risk level (MEDIUM)
- Lists details (Hold ID, duration, charge: NONE)
- Explains this is reversible

### 5. Purchase Booking (HIGH RISK - Explicit Confirmation)
Click "Purchase (Requires Explicit Confirmation)".

A confirmation modal appears with:
- **Risk Level**: HIGH (prominent red badge)
- **Details**: Full booking information
- **Warnings**: Non-refundable segments
- **Duration**: 2-minute expiration
- **Idempotency**: Automatically generated key

## UI Sections

### Header
- Status indicator (Connecting / Ready / Error)
- Live updates on all operations

### Contract Panel
- Displays AICP manifest (summary or full)
- Toggle to show complete TOML/JSON

### Search Form
- Origin, destination, dates
- Constraints (stops, baggage, price)
- Disabled while searching

### Results Section (appears after search)
- **Flight Results**: Single result with details
- **Available Actions**: Buttons for next steps
- **Provenance**: Source and timestamp
- **Freshness**: Validity and volatility
- **Warnings**: Risk alerts if any

### Action Buttons
- **Watch** (green) — No confirmation needed
- **Hold** (yellow) — Medium risk confirmation
- **Purchase** (red) — High risk confirmation

### Confirmation Modal
- **Header**: Icon + action name
- **Risk Badge**: Colored badge (low/medium/high)
- **Details**: Itemized action information
- **Warning**: Extra caution for high-risk
- **Buttons**: Cancel / Confirm

### Status Messages
- Auto-dismiss after 5 seconds
- Color-coded (blue/green/red)
- Real-time feedback

## Design Principles

### Risk-Based Visual Hierarchy

| Risk | Color | Confirmation | Icon |
|------|-------|--------------|------|
| LOW | Green | ❌ None | ✓ |
| MEDIUM | Yellow | ⚠️ Warning | 🔒 |
| HIGH | Red | 🔴 Explicit | 💳 |

### AOM Plane Separation

The interface clearly separates:
- **Data**: What the server found (green box)
- **Actions**: What you can do next (blue box)
- **Policies**: Usage rules (sidebar)
- **Provenance**: Source info (purple box)
- **Freshness**: Validity window (orange box)
- **Warnings**: Risk alerts (red box)

### Progressive Disclosure

1. Form appears first
2. Results appear after search
3. Actions appear with results
4. High-risk buttons disabled until previous steps complete
5. Modals show context before execution

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses Tailwind CSS (CDN)
- No dependencies (vanilla JavaScript)

## Mobile Responsiveness

- Form fields stack on small screens
- Modal adapts to viewport
- Touch-friendly button sizing
- Readable on all screen sizes

## Customization

### Change Server URL
Edit the `API` constant in `public/index.html`:
```javascript
const API = 'http://localhost:3000';
```

### Change Colors
Modify Tailwind classes in `<style>`:
```css
.risk-low { @apply bg-green-50 border-green-200; }
.badge-low { @apply bg-green-200 text-green-800; }
```

### Add Fields
Update the form in `<form id="search-form">` and add corresponding JavaScript handlers.

## Debugging

Open browser DevTools (F12):

1. **Network Tab** — See all API requests
2. **Console Tab** — Check for errors
3. **Application Tab** — View stored data

All API responses are logged to console:
```javascript
console.log('AOM Response:', aom);
```

## Troubleshooting

**"Cannot connect to server"**
- Ensure server is running: `make server`
- Check port 3000 is available
- Verify CORS is enabled in server.js

**CORS errors**
- Server must have `Access-Control-Allow-Origin: *`
- Check server logs for CORS middleware

**Confirmation modal not appearing**
- Check browser console for JavaScript errors
- Verify modal div exists in HTML
- Check modal styling (z-index: 50)

**Results not displaying**
- Ensure API endpoint returns valid JSON
- Check Content-Type header is `application/json`
- Verify AOM response structure

## Performance

- Search response: ~1ms (mock data)
- UI render: <100ms
- Modal animation: 300ms fade-in
- No database queries
- All operations stateless

## Security Notes

⚠️ This is a demo/testing interface:
- No authentication implemented
- Credentials are mocked
- Idempotency keys are generated client-side
- CORS is open to all origins

For production:
- Add proper authentication
- Validate user identity server-side
- Implement rate limiting
- Log all transactions
- Encrypt sensitive data
- Use HTTPS only

---

**Status**: Complete and ready to use ✓

**Try it**: Start server and visit `http://localhost:3000` 🚀
