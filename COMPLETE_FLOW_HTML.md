# Morning Streak - Complete Flow (HTML Content Card Approach)

## Overview

This document shows the complete user experience and data flow using **custom HTML content cards**.

---

## The User Experience

### 1. Child Uses Hardware (Morning)

```
Monday 8:00 AM
└─ Child presses button on Hatch device
   └─ Event logged in database:
       { member_id: "12345", event: "morning_routine_complete", timestamp: "2026-05-05 08:00:00" }
```

---

### 2. Data Syncs to Braze (Hourly - Automated)

```
Monday 9:00 AM (hourly Airflow job)

Redshift Query:
┌─────────────────────────────────────────────────────┐
│ SELECT member_id,                                   │
│        streak_array AS morning_streak_hardware,     │
│        week_start AS morning_streak_start_date      │
│ FROM morning_routines                               │
│ WHERE member_id IN (/* 10 pilot users */)           │
└─────────────────────────────────────────────────────┘
         ↓
Airflow DAG runs
         ↓
CDI sends to Braze:
┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   external_id: "member_12345",                      │
│   morning_streak_hardware: "1,0,0,0,0,0,0",         │
│   morning_streak_start_date: "2026-05-05"           │
│ }                                                   │
└─────────────────────────────────────────────────────┘
```

**What Redshift writes:**
- `morning_streak_hardware` ← Hardware button taps only
- `morning_streak_start_date` ← Monday of current week

**What Redshift NEVER touches:**
- `morning_streak_manual` ← Vercel owns this

---

### 3. Parent Opens Hatch App

```
Monday 10:00 AM
└─ Parent opens Hatch app
   └─ App requests content cards from Braze
      └─ Braze sends content card data:
```

**Content Card Payload:**
```json
{
  "id": "card_abc123",
  "type": "morning_streak",
  "created": 1672934400,
  "updated": 1672934400,
  "extras": {
    "hardware": "1,0,0,0,0,0,0",
    "manual": "0,0,0,0,0,0,0",
    "start_date": "2026-05-05",
    "family_id": "member_12345"
  }
}
```

---

### 4. Hatch App Renders Content Card

**App code processes data:**

```javascript
// In Hatch app (iOS/Android)
function renderMorningStreakCard(contentCard) {
  const { hardware, manual, family_id, start_date } = contentCard.extras

  // Parse comma-separated strings to boolean arrays
  const hardwareArr = hardware.split(',').map(d => d === '1')
  const manualArr = manual.split(',').map(d => d === '1')

  // Merge: day is complete if EITHER hardware OR manual
  const days = hardwareArr.map((hw, i) => hw || manualArr[i])

  // Count completed days
  const count = days.filter(d => d).length

  // Build edit URL
  const editUrl = `https://your-app.vercel.app/edit?family=${family_id}&hardware=${hardware}&manual=${manual}&startDate=${start_date}`

  // Render HTML template with data
  return {
    html: loadTemplate('morning_streak_card.html'),
    data: { days, count, editUrl }
  }
}
```

**What parent sees:**

```
┌─────────────────────────────────────────┐
│ 🔵 MORNING ROUTINE           Edit │    │
│                                         │
│    1                                    │
│   /7    ● ○ ○ ○ ○ ○ ○                  │
│        Mon Tue Wed Thu Fri Sat Sun      │
│                                         │
│ Tap to view this week's streak          │
└─────────────────────────────────────────┘
```

- **Static:** Title, Edit button, day labels, styling
- **Dynamic:** Count (1/7), filled circles (Monday only)

---

### 5. Parent Taps "Edit" Button

```
Monday 6:00 PM
└─ Parent notices child forgot to tap Tuesday button
   └─ Taps "Edit" in content card
      └─ Opens browser with URL:
```

**URL opened:**
```
https://your-app.vercel.app/edit?
  family=member_12345&
  hardware=1,0,0,0,0,0,0&
  manual=0,0,0,0,0,0,0&
  startDate=2026-05-05
```

---

### 6. Vercel Edit Page Displays

**Vercel page receives URL params and renders:**

```tsx
// /app/edit/page.tsx
export default function EditPage({ searchParams }) {
  const hardware = searchParams.hardware.split(',').map(d => d === '1')
  const manual = searchParams.manual.split(',').map(d => d === '1')
  const family = searchParams.family

  // Merged state (for display)
  const days = hardware.map((hw, i) => hw || manual[i])

  // UI shows:
  // - Hardware days: dimmed, "Button Tap" badge, can't toggle
  // - Manual days: "Added by you" badge, can toggle
  // - Empty days: can tap to add (becomes manual)
}
```

**What parent sees:**

```
┌────────────────────────────────────────────┐
│  Morning Routine - Week of May 5           │
│                                             │
│   ●    ○    ○    ○    ○    ○    ○          │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun         │
│  Button                                     │
│   Tap                                       │
│                                             │
│  Monday is dimmed (can't toggle)            │
│  Other days are clickable                   │
│                                             │
│  [Edit Streaks]  [Save]                     │
└────────────────────────────────────────────┘
```

---

### 7. Parent Adds Tuesday Manually

```
Monday 6:01 PM
└─ Parent taps Tuesday circle
   └─ Circle fills in, shows "Added by you" badge
      └─ Parent taps "Save"
```

**Frontend JavaScript:**
```javascript
async function handleSave() {
  // Only send manual array (never touch hardware!)
  const response = await fetch('/api/update-streak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      family: 'member_12345',
      manual: [0, 1, 0, 0, 0, 0, 0]  // Tuesday = 1
    })
  })
}
```

---

### 8. Vercel Updates Braze

```
Monday 6:01 PM (immediate)

Vercel API endpoint:
┌─────────────────────────────────────────────────────┐
│ POST /api/update-streak                             │
│ Body: { family: "member_12345", manual: [0,1,0...] }│
└─────────────────────────────────────────────────────┘
         ↓
Calls Braze Users Track API:
┌─────────────────────────────────────────────────────┐
│ POST https://rest.iad-01.braze.com/users/track      │
│ {                                                   │
│   "attributes": [{                                  │
│     "external_id": "member_12345",                  │
│     "morning_streak_manual": "0,1,0,0,0,0,0"        │
│   }]                                                │
│ }                                                   │
└─────────────────────────────────────────────────────┘
```

**Braze now stores:**
```json
{
  "external_id": "member_12345",
  "morning_streak_hardware": "1,0,0,0,0,0,0",  ← Redshift (unchanged)
  "morning_streak_manual": "0,1,0,0,0,0,0",    ← Vercel (updated!)
  "morning_streak_start_date": "2026-05-05"
}
```

**Key: NO CONFLICT!**
- Redshift only writes `hardware`
- Vercel only writes `manual`
- They never overwrite each other

---

### 9. Content Card Refreshes

```
Monday 6:02 PM
└─ Parent closes browser, returns to Hatch app
   └─ App refreshes content cards
      └─ Braze sends updated data:
```

**Updated Content Card Payload:**
```json
{
  "extras": {
    "hardware": "1,0,0,0,0,0,0",
    "manual": "0,1,0,0,0,0,0",   ← Changed!
    "start_date": "2026-05-05",
    "family_id": "member_12345"
  }
}
```

**App re-renders:**
```javascript
// Merge: [1,0,0,0,0,0,0] OR [0,1,0,0,0,0,0] = [1,1,0,0,0,0,0]
const days = [true, true, false, false, false, false, false]
const count = 2
```

**Parent now sees:**

```
┌─────────────────────────────────────────┐
│ 🔵 MORNING ROUTINE           Edit │    │
│                                         │
│    2                                    │
│   /7    ● ● ○ ○ ○ ○ ○                  │
│        Mon Tue Wed Thu Fri Sat Sun      │
│                                         │
│ Tap to view this week's streak          │
└─────────────────────────────────────────┘
```

**Both Monday and Tuesday are now filled!** ✅

---

### 10. Next Hardware Tap (Preserves Manual)

```
Wednesday 8:00 AM
└─ Child taps hardware button again
   └─ Database logs event
      └─ Wednesday 9:00 AM (hourly sync)
```

**Redshift calculates:**
```sql
-- Monday + Wednesday hardware taps
"1,0,1,0,0,0,0"
```

**Airflow sends to Braze:**
```json
{
  "external_id": "member_12345",
  "morning_streak_hardware": "1,0,1,0,0,0,0"   ← Updated (Mon + Wed)
}
```

**IMPORTANT: Braze now has BOTH:**
```json
{
  "morning_streak_hardware": "1,0,1,0,0,0,0",  ← Redshift updated this
  "morning_streak_manual": "0,1,0,0,0,0,0"     ← Preserved! Not touched!
}
```

**App displays merged:**
```
┌─────────────────────────────────────────┐
│ 🔵 MORNING ROUTINE           Edit │    │
│                                         │
│    3                                    │
│   /7    ● ● ● ○ ○ ○ ○                  │
│        Mon Tue Wed Thu Fri Sat Sun      │
│                                         │
│ Tap to view this week's streak          │
└─────────────────────────────────────────┘
```

**All three days visible!**
- Mon: Hardware tap ✅
- Tue: Manual add ✅
- Wed: Hardware tap ✅

**No data loss!** The manual add from Monday night was preserved during Wednesday's hourly sync.

---

## Data Ownership Summary

| Attribute | Written By | Frequency | Purpose |
|-----------|------------|-----------|---------|
| `morning_streak_hardware` | Redshift | Hourly | Hardware button taps only |
| `morning_streak_manual` | Vercel | Immediate | Parent manual adds only |
| `morning_streak_start_date` | Redshift | Weekly | Current week's Monday |

**Rules:**
1. Redshift ONLY writes `hardware` (never reads or writes `manual`)
2. Vercel ONLY writes `manual` (never reads or writes `hardware`)
3. Display merges both client-side: `day_complete = hardware[i] OR manual[i]`
4. Hardware days can't be removed by parents
5. Manual days can be toggled on/off

---

## Week Rollover

```
Sunday 11:59 PM → Monday 12:00 AM

Redshift detects new week:
┌─────────────────────────────────────────────────────┐
│ UPDATE user_attributes                              │
│ SET morning_streak_hardware = "0,0,0,0,0,0,0",      │
│     morning_streak_start_date = "2026-05-12"        │
│ WHERE ...                                           │
└─────────────────────────────────────────────────────┘

Airflow syncs to Braze:
┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   morning_streak_hardware: "0,0,0,0,0,0,0",         │
│   morning_streak_start_date: "2026-05-12"           │
│ }                                                   │
└─────────────────────────────────────────────────────┘

Vercel also resets manual array:
┌─────────────────────────────────────────────────────┐
│ POST /api/reset-week (called by scheduled job)     │
│ {                                                   │
│   morning_streak_manual: "0,0,0,0,0,0,0"            │
│ }                                                   │
└─────────────────────────────────────────────────────┘
```

**Fresh week starts!** All circles empty again.

---

## File Structure

### Hatch App (iOS/Android)
```
HatchApp/
├── ContentCards/
│   ├── MorningStreakCard.swift
│   │   - Custom content card renderer
│   │   - Reads extras data from Braze
│   │   - Renders HTML template with data
│   └── morning_streak_card.html
│       - HTML/CSS template (static)
│       - JavaScript data injection
```

### Vercel App
```
morning-streak-prototype/
├── app/
│   ├── edit/
│   │   └── page.tsx          → Edit interface
│   └── api/
│       └── update-streak/
│           └── route.ts      → Updates Braze manual array
└── morning_streak_card.html  → Template (copy to Hatch app)
```

---

## Braze Configuration

**Content Card Settings:**

```yaml
Campaign Name: Morning Streak Pilot
Card Type: Custom Card (with extras)
Audience: Morning Streak Pilot Users (10 users)

Extras (JSON):
{
  "type": "morning_streak",
  "hardware": "{{custom_attribute.${morning_streak_hardware}}}",
  "manual": "{{custom_attribute.${morning_streak_manual}}}",
  "start_date": "{{custom_attribute.${morning_streak_start_date}}}",
  "family_id": "{{${external_id}}}"
}

Delivery:
- Schedule: Daily at 8:00 AM local time
- Re-eligibility: Immediate
- Expiration: Never
```

---

## Benefits of This Architecture

✅ **No conflicts** - Each system owns one field
✅ **No data loss** - Redshift can't overwrite manual edits
✅ **Real-time updates** - Parents see changes immediately
✅ **Source of truth** - Braze stores both arrays
✅ **Simple merge** - Client-side OR logic
✅ **Fast rendering** - No image generation, native UI
✅ **Offline support** - Template cached in app
✅ **Accessible** - Screen readers can parse HTML
✅ **Free** - No Vercel serverless costs for images

---

## Next Steps

1. ✅ **Mobile team** implements custom content card renderer
2. ✅ **Braze team** configures content card with extras
3. ✅ **Redshift team** renames field to `morning_streak_hardware`
4. ✅ **Vercel team** deploys edit page and update API
5. ✅ **Test** with one pilot user
6. ✅ **Launch** to 10 pilot users

**Timeline:** 1-2 weeks for full implementation
