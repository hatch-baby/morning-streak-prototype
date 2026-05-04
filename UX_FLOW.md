# Morning Streak - Complete UX Flow

## Visual Flow Diagram

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
│ STEP 3: Content Card Displays in Hatch App                      │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │ 🔵 MORNING ROUTINE                    Edit │  │               │
│  │                                              │               │
│  │  [Image from Vercel API showing:]            │               │
│  │                                              │               │
│  │     1                                        │               │
│  │    /7   ● ○ ○ ○ ○ ○ ○                       │               │
│  │        Mon Tue Wed Thu Fri Sat Sun           │               │
│  │                                              │               │
│  │  Tap to view this week's streak              │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  Image URL:                                                      │
│  /api/streak-card-image?hardware=1,0,0,0,0,0,0&manual=0,0,0...  │
│                                                                  │
│  (Vercel generates PNG on-the-fly showing merged state)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Parent Taps "Edit" Button                               │
│                                                                  │
│  Card link opens in browser:                                    │
│  https://your-app.vercel.app/edit?family=member_12345&...       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Edit Page Shows in Browser                              │
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
│  - Monday: Filled, dimmed, "Button Tap" badge (can't toggle)    │
│  - Other days: Empty, can tap to add manually                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Parent Adds Tuesday Manually                            │
│                                                                  │
│  Parent taps Tuesday circle                                     │
│  ↓                                                               │
│  Tuesday fills in, shows "Added by you" badge                   │
│  ↓                                                               │
│  Parent taps "Save"                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Vercel Updates Braze (Immediate)                        │
│                                                                  │
│  POST /api/update-streak                                        │
│  {                                                               │
│    family: "member_12345",                                       │
│    manual: [0,1,0,0,0,0,0]  // Tuesday added                    │
│  }                                                               │
│  ↓                                                               │
│  Calls Braze Users Track API:                                   │
│  {                                                               │
│    attributes: [{                                                │
│      external_id: "member_12345",                                │
│      morning_streak_manual: "0,1,0,0,0,0,0"                      │
│    }]                                                            │
│  }                                                               │
│                                                                  │
│  Note: Only updates manual array, never touches hardware!       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Content Card Refreshes                                  │
│                                                                  │
│  Parent returns to Hatch app                                    │
│  ↓                                                               │
│  Content card image regenerates:                                │
│  /api/streak-card-image?hardware=1,0,0,0,0,0,0&manual=0,1,0...  │
│  ↓                                                               │
│  Now shows:                                                      │
│                                                                  │
│     2                                                            │
│    /7   ● ● ○ ○ ○ ○ ○                                           │
│        Mon Tue Wed Thu Fri Sat Sun                               │
│                                                                  │
│  (Both Monday and Tuesday filled!)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Next Hardware Tap (Preserves Manual)                    │
│                                                                  │
│  Wednesday Morning:                                              │
│  Child taps hardware button again                               │
│  ↓                                                               │
│  Hourly sync runs (Redshift → Braze):                           │
│  {                                                               │
│    morning_streak_hardware: "1,0,1,0,0,0,0"  // Mon + Wed       │
│  }                                                               │
│  ↓                                                               │
│  Braze now has BOTH:                                             │
│  - hardware: "1,0,1,0,0,0,0"                                     │
│  - manual: "0,1,0,0,0,0,0"   ← PRESERVED! ✅                     │
│  ↓                                                               │
│  Content card shows:                                             │
│                                                                  │
│     3                                                            │
│    /7   ● ● ● ○ ○ ○ ○                                           │
│        Mon Tue Wed Thu Fri Sat Sun                               │
│                                                                  │
│  All three days visible! No data loss!                          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

### The Content Card is Just a Display

The content card **shows** data but doesn't store it. Think of it like:
- **Image**: Generated by Vercel API (like a photo taken of current state)
- **Edit button/link**: Opens the full Vercel page in browser

### Two Separate Data Streams

**Redshift → Braze** (Hourly):
- Writes to: `morning_streak_hardware`
- Contains: Hardware button taps only
- Format: `"1,0,1,0,0,0,0"`

**Vercel → Braze** (Immediate):
- Writes to: `morning_streak_manual`
- Contains: Parent manual adds only
- Format: `"0,1,0,0,0,0,0"`

**Display** (Merged):
- Reads: Both arrays
- Shows: Day is complete if hardware[i] OR manual[i]
- Result: `"1,1,1,0,0,0,0"` (Mon/Tue/Wed)

### Why This Works

1. **No conflicts**: Each system writes to its own field
2. **No data loss**: Redshift can't overwrite parent edits
3. **Real-time updates**: Parent sees changes immediately
4. **Source of truth**: Braze stores both, apps merge on read

### User Experience Timeline

| Time | Event | What Updates |
|------|-------|--------------|
| Mon 8am | Child taps button | Database logs event |
| Mon 9am | Airflow runs | Braze `hardware` = "1,0,0,0,0,0,0" |
| Mon 9:01am | Parent opens app | Content card shows 1/7 |
| Mon 6pm | Parent adds Tue manually | Braze `manual` = "0,1,0,0,0,0,0" |
| Mon 6:01pm | Parent checks app | Content card shows 2/7 |
| Tue 9am | Airflow runs again | Braze `hardware` still "1,0,0,0,0,0,0" |
| Tue 9:01am | Parent checks app | Content card still shows 2/7 (manual preserved) |

## Common Questions

**Q: What if parent opens Edit and changes nothing?**
A: No API call is made if they cancel or save without changes.

**Q: Can parent remove a hardware day?**
A: No! Hardware days are dimmed and can't be toggled. Only manual days can be removed.

**Q: What if parent adds Wednesday manually, then child taps hardware Wednesday?**
A: No problem! Both become `1`, display shows Wednesday once. Redundant but harmless.

**Q: How does the week reset?**
A: Every Monday, Airflow updates `morning_streak_start_date` to current Monday and resets both arrays to `"0,0,0,0,0,0,0"`.

**Q: What does the parent see in Edit if they open it twice?**
A: The latest state from Braze. URL params are always fresh from content card Liquid templates.

**Q: Is the content card image cached?**
A: No! Braze fetches it fresh each time based on current attribute values.

## Technical Details

### Content Card Configuration in Braze

```
Card Type: Classic Card
Title: "Morning Routine Progress"
Description: "Tap to view this week's streak"

Image URL:
https://your-app.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}

Link URL (triggered by "Edit" button or card tap):
https://your-app.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}
```

### Braze Data Structure

```javascript
{
  external_id: "member_12345",

  // Written by Redshift (hourly via Airflow/CDI)
  morning_streak_hardware: "1,0,1,0,0,0,0",
  morning_streak_start_date: "2026-04-28",

  // Written by Vercel (immediately via REST API)
  morning_streak_manual: "0,1,0,0,0,0,0"
}
```

### Vercel Pages

**`/edit` page**:
- Receives: `family`, `hardware`, `manual`, `startDate` as query params
- Displays: 7 circles with current merged state
- Allows: Toggle manual days only (hardware read-only)
- Saves: Calls `/api/update-streak` with new manual array

**`/api/streak-card-image` endpoint**:
- Receives: `hardware`, `manual` as query params
- Generates: PNG image showing circles and count
- Returns: Image file (for Braze content card)

**`/api/update-streak` endpoint**:
- Receives: `family`, `manual` array in request body
- Updates: Braze `morning_streak_manual` attribute only
- Returns: `{ok: true}` on success

---

**This flow ensures:**
- ✅ Hardware taps are never lost
- ✅ Parent manual adds are preserved during hourly syncs
- ✅ Content card always shows accurate merged state
- ✅ No conflicts between Redshift and Vercel writes
