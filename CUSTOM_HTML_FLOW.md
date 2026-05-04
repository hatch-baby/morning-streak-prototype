# Morning Streak - Custom HTML Content Card Flow

## Complete Flow with Custom HTML

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Child Uses Hardware                                     │
│                                                                  │
│  Monday Morning:                                                 │
│  Child taps hardware button on device                           │
│  ↓                                                               │
│  Event logged in database                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Data Syncs (Hourly - Automated)                         │
│                                                                  │
│  Redshift calculates: "1,0,0,0,0,0,0" (Monday completed)        │
│  ↓                                                               │
│  Airflow DAG runs                                                │
│  ↓                                                               │
│  CDI sends to Braze:                                             │
│  {                                                               │
│    external_id: "member_12345",                                  │
│    morning_streak_hardware: "1,0,0,0,0,0,0",                     │
│    morning_streak_start_date: "2026-04-28"                       │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Braze Content Card Displays in Hatch App                │
│                                                                  │
│  Content card data sent to app:                                 │
│  {                                                               │
│    type: "morning_streak",                                       │
│    extras: {                                                     │
│      hardware: "1,0,0,0,0,0,0",                                  │
│      manual: "0,0,0,0,0,0,0",                                    │
│      start_date: "2026-04-28",                                   │
│      edit_url: "https://app.vercel.app/edit?..."                 │
│    }                                                             │
│  }                                                               │
│  ↓                                                               │
│  Hatch app renders HTML template with data:                     │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ 🔵 MORNING ROUTINE                    Edit │  │               │
│  │                                              │               │
│  │     1                                        │               │
│  │    /7   ● ○ ○ ○ ○ ○ ○                       │               │
│  │        Mon Tue Wed Thu Fri Sat Sun           │               │
│  │                                              │               │
│  │  Tap to view this week's streak              │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  - HTML/CSS is static (same for everyone)                       │
│  - Only data changes: count and filled circles                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Parent Taps "Edit" Button                               │
│                                                                  │
│  Taps the Edit link in the content card                         │
│  ↓                                                               │
│  Opens in browser:                                               │
│  https://app.vercel.app/edit?family=member_12345&...             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Vercel Edit Page Shows                                  │
│                                                                  │
│  Same HTML template, but in edit mode:                          │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │  Morning Routine - Week of Apr 28   │                        │
│  │                                      │                        │
│  │   ●    ○    ○    ○    ○    ○    ○   │                        │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun  │                        │
│  │  Button                              │                        │
│  │   Tap                                │                        │
│  │                                      │                        │
│  │  [Edit Streaks]  [Save]              │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  Parent taps Tuesday circle → fills in                          │
│  Parent taps "Save"                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Vercel Updates Braze                                    │
│                                                                  │
│  POST /api/update-streak                                        │
│  {                                                               │
│    family: "member_12345",                                       │
│    manual: [0,1,0,0,0,0,0]                                      │
│  }                                                               │
│  ↓                                                               │
│  Calls Braze Users Track API:                                   │
│  {                                                               │
│    attributes: [{                                                │
│      external_id: "member_12345",                                │
│      morning_streak_manual: "0,1,0,0,0,0,0"                      │
│    }]                                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Content Card Refreshes in Hatch App                     │
│                                                                  │
│  Braze sends updated data:                                       │
│  {                                                               │
│    hardware: "1,0,0,0,0,0,0",                                    │
│    manual: "0,1,0,0,0,0,0"     ← Updated!                       │
│  }                                                               │
│  ↓                                                               │
│  App re-renders HTML template:                                  │
│                                                                  │
│     2                                                            │
│    /7   ● ● ○ ○ ○ ○ ○                                           │
│        Mon Tue Wed Thu Fri Sat Sun                               │
│                                                                  │
│  Both Monday and Tuesday now filled!                            │
└─────────────────────────────────────────────────────────────────┘
```

## The HTML Content Card Template

### Static HTML/CSS (never changes)

```html
<!DOCTYPE html>
<html>
<head>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #B8C5D6;
    padding: 16px;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #040F1F;
    letter-spacing: 0.5px;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #040F1F;
    border-radius: 50%;
  }

  .edit-btn {
    color: #040F1F;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(4,15,31,0.05);
  }

  .streak-display {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .count {
    font-size: 48px;
    font-weight: 300;
    color: #040F1F;
    line-height: 1;
  }

  .count-label {
    font-size: 24px;
    color: rgba(4,15,31,0.4);
  }

  .days-container {
    flex: 1;
  }

  .circles {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(4,15,31,0.2);
    background: transparent;
    transition: all 0.2s ease;
  }

  .circle.filled {
    background: #040F1F;
    border-color: #040F1F;
  }

  .labels {
    display: flex;
    gap: 8px;
  }

  .label {
    width: 40px;
    text-align: center;
    font-size: 11px;
    color: rgba(4,15,31,0.6);
    font-weight: 500;
  }

  .description {
    margin-top: 16px;
    font-size: 13px;
    color: rgba(4,15,31,0.6);
  }
</style>
</head>
<body>

<div class="card">
  <div class="header">
    <div class="title">
      <div class="dot"></div>
      MORNING ROUTINE
    </div>
    <a href="{{edit_url}}" class="edit-btn">Edit</a>
  </div>

  <div class="streak-display">
    <div class="count">
      {{completed_count}}<span class="count-label">/7</span>
    </div>

    <div class="days-container">
      <div class="circles">
        {{#each days}}
          <div class="circle {{#if this}}filled{{/if}}"></div>
        {{/each}}
      </div>
      <div class="labels">
        <div class="label">Mon</div>
        <div class="label">Tue</div>
        <div class="label">Wed</div>
        <div class="label">Thu</div>
        <div class="label">Fri</div>
        <div class="label">Sat</div>
        <div class="label">Sun</div>
      </div>
    </div>
  </div>

  <div class="description">
    Tap to view this week's streak
  </div>
</div>

</body>
</html>
```

### Dynamic Data Injection (JavaScript in app)

```javascript
// Braze content card data
const contentCard = {
  extras: {
    hardware: "1,0,0,0,0,0,0",
    manual: "0,1,0,0,0,0,0",
    start_date: "2026-04-28",
    family_id: "member_12345"
  }
}

// Merge hardware and manual arrays
function processStreakData(extras) {
  const hardware = extras.hardware.split(',').map(d => d === '1')
  const manual = extras.manual.split(',').map(d => d === '1')
  const days = hardware.map((hw, i) => hw || manual[i]) // Merge

  return {
    days: days, // [true, true, false, false, false, false, false]
    completed_count: days.filter(d => d).length, // 2
    edit_url: `https://your-app.vercel.app/edit?family=${extras.family_id}&hardware=${extras.hardware}&manual=${extras.manual}&startDate=${extras.start_date}`
  }
}

// Render template
const data = processStreakData(contentCard.extras)

// Replace template variables:
// {{completed_count}} → 2
// {{#each days}} → Loop and add "filled" class if true
// {{edit_url}} → Full Vercel URL
```

## Braze Configuration

### Content Card Setup

**Card Type:** Custom HTML Card (or In-App Message)

**HTML Template:** Use the HTML above

**Data (sent in `extras`):**
```liquid
{
  "type": "morning_streak",
  "hardware": "{{custom_attribute.${morning_streak_hardware}}}",
  "manual": "{{custom_attribute.${morning_streak_manual}}}",
  "start_date": "{{custom_attribute.${morning_streak_start_date}}}",
  "family_id": "{{${external_id}}}"
}
```

**Audience:** Morning Streak Pilot Users (10 users)

**Delivery:**
- Daily at 8am local time
- Re-eligibility: Immediate (updates throughout day)

### Alternative: In-App Message (If Content Cards Don't Support HTML)

**Message Type:** Full Screen / Modal

**HTML:** Same as above + inline `<script>` for rendering

**Trigger:** App open

**Audience:** Same 10 pilot users

## What Changed from Image Approach

### ✅ What We KEEP:

1. **Braze stores the data** (source of truth):
   - `morning_streak_hardware`
   - `morning_streak_manual`
   - `morning_streak_start_date`

2. **Redshift writes hardware** (hourly via Airflow/CDI)

3. **Vercel writes manual** (immediate via REST API)

4. **Separate storage, client-side merge** (same architecture)

### ❌ What We REMOVE:

1. ~~`/api/streak-card-image` endpoint~~ (no image generation needed)
2. ~~Vercel OG image dependencies~~ (no `@vercel/og` package)
3. ~~PNG rendering logic~~ (HTML/CSS instead)

### ✅ What We ADD:

1. **HTML template** (in Braze or Hatch app code)
2. **JavaScript merge logic** (in Hatch app)

## Hatch App Implementation

### Option A: Custom Content Card Renderer

```swift
// iOS example (Hatch app code)
extension BrazeContentCardUIDelegate {
  func contentCard(_ card: Braze.ContentCard,
                   prepare cell: UITableViewCell) {

    if card.extras["type"] == "morning_streak" {
      // Get data
      let hardware = card.extras["hardware"]?.split(separator: ",").map { $0 == "1" }
      let manual = card.extras["manual"]?.split(separator: ",").map { $0 == "1" }

      // Merge
      let days = zip(hardware ?? [], manual ?? []).map { $0 || $1 }
      let count = days.filter { $0 }.count

      // Render custom cell
      let streakCell = cell as! MorningStreakContentCardCell
      streakCell.configure(days: days, count: count, editURL: card.url)
    }
  }
}
```

### Option B: WebView Rendering

```swift
// iOS example (simpler approach)
extension BrazeContentCardUIDelegate {
  func contentCard(_ card: Braze.ContentCard,
                   prepare cell: UITableViewCell) {

    if card.extras["type"] == "morning_streak" {
      let webView = cell.contentView as! WKWebView

      // Load HTML template
      var html = loadHTMLTemplate("morning_streak_card.html")

      // Inject data
      let hardware = card.extras["hardware"] ?? ""
      let manual = card.extras["manual"] ?? ""
      let merged = mergeArrays(hardware, manual)

      html = html.replacingOccurrences(of: "{{completed_count}}",
                                      with: "\(merged.count)")
      html = html.replacingOccurrences(of: "{{days}}",
                                      with: merged.toJSON())

      webView.loadHTMLString(html, baseURL: nil)
    }
  }
}
```

## Benefits of HTML Approach

✅ **Faster rendering** - No network request for image
✅ **Native look** - Real UI elements, not a static image
✅ **Smaller payload** - Just data, not image bytes
✅ **Easier updates** - Change HTML/CSS without Vercel deploy
✅ **Better accessibility** - Screen readers can parse
✅ **Offline support** - Template cached in app

## Files That Need Changes

### Keep (no changes):
- ✅ `/app/edit/page.tsx` - Edit interface
- ✅ `/api/update-streak/route.ts` - Update API
- ✅ All documentation about data flow

### Remove:
- ❌ `/api/streak-card-image/route.tsx` - No longer needed
- ❌ `/app/streak/page.tsx` - Not used (goes straight to edit)

### Add:
- ✅ `morning_streak_card.html` - HTML template (in Hatch app or Braze)
- ✅ Hatch app code to render custom content card

## Next Steps

1. **Confirm with mobile team**: Does Hatch app support custom content cards or WebView rendering?

2. **If YES**:
   - Provide HTML template to mobile team
   - Mobile team implements custom card renderer
   - Braze team configures content card with `extras` data

3. **If NO**:
   - Use Braze In-App Message instead (fully supports HTML)
   - Or fall back to image generation approach

---

**This is the cleaner architecture!** HTML rendering instead of image generation.
