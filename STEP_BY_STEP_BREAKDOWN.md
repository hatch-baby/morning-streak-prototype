# Morning Streak - Complete Step-by-Step Breakdown

---

## Step 1: Kid Taps Button (Monday)

### What happens:
- Kid presses hardware button
- Event logged to database

### Redshift (hourly):
- Reads button tap events
- Calculates: `morning_streak_hardware: "1,0,0,0,0,0,0"`
- Sends to Braze via Airflow → CDI

### Braze stores:
```
member_12345
  morning_streak_hardware: "1,0,0,0,0,0,0"
  morning_streak_manual: "0,0,0,0,0,0,0"
  morning_streak_start_date: "2026-04-28"
```

### Vercel:
- No action

---

## Step 2: Parent Opens Hatch App

### What happens:
- Parent opens Hatch app
- App requests content cards from Braze

### Redshift:
- No action

### Braze sends to app:
```json
{
  "type": "morning_streak",
  "extras": {
    "hardware": "1,0,0,0,0,0,0",
    "manual": "0,0,0,0,0,0,0",
    "start_date": "2026-04-28",
    "family_id": "member_12345"
  }
}
```

### Vercel:
- No action

### Hatch app displays:
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

---

## Step 3: Parent Taps "Edit" Button

### What happens:
- Parent taps Edit button in content card
- Opens browser to Vercel URL

### Redshift:
- No action

### Braze:
- No action (already has data)

### Vercel receives request:
```
GET /edit?
  family=member_12345&
  hardware=1,0,0,0,0,0,0&
  manual=0,0,0,0,0,0,0&
  startDate=2026-04-28
```

### Vercel displays:
```
┌────────────────────────────────────────────┐
│  Morning Routine - Week of Apr 28          │
│                                             │
│   ●    ○    ○    ○    ○    ○    ○          │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun         │
│  Button                                     │
│   Tap                                       │
│                                             │
│  [Edit Streaks]  [Save]                     │
└────────────────────────────────────────────┘
```

---

## Step 4: Parent Adds Tuesday Manually

### What happens:
- Parent taps Tuesday circle
- Tuesday fills in
- Parent taps "Save"

### Redshift:
- No action

### Braze:
- Waiting for update...

### Vercel sends to Braze:
```
POST https://rest.iad-01.braze.com/users/track
{
  "attributes": [{
    "external_id": "member_12345",
    "morning_streak_manual": "0,1,0,0,0,0,0"
  }]
}
```

### Braze now stores:
```
member_12345
  morning_streak_hardware: "1,0,0,0,0,0,0"    (unchanged)
  morning_streak_manual: "0,1,0,0,0,0,0"      (updated!)
  morning_streak_start_date: "2026-04-28"
```

---

## Step 5: Parent Returns to Hatch App

### What happens:
- Parent closes browser
- Returns to Hatch app
- App refreshes content cards

### Redshift:
- No action

### Braze sends updated data:
```json
{
  "type": "morning_streak",
  "extras": {
    "hardware": "1,0,0,0,0,0,0",
    "manual": "0,1,0,0,0,0,0",    ← Changed!
    "start_date": "2026-04-28",
    "family_id": "member_12345"
  }
}
```

### Vercel:
- No action

### Hatch app displays:
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

Merge logic: `hardware[i] OR manual[i]`
- Monday: `1 OR 0 = 1` ✓
- Tuesday: `0 OR 1 = 1` ✓
- Result: 2/7

---

## Step 6: Kid Taps Button Again (Wednesday)

### What happens:
- Kid presses hardware button Wednesday morning
- Event logged to database

### Redshift (hourly):
- Reads button tap events
- Calculates: `morning_streak_hardware: "1,0,1,0,0,0,0"`
- Sends to Braze via Airflow → CDI

### Braze now stores:
```
member_12345
  morning_streak_hardware: "1,0,1,0,0,0,0"    (updated!)
  morning_streak_manual: "0,1,0,0,0,0,0"      (preserved!)
  morning_streak_start_date: "2026-04-28"
```

**Key: Manual array was NOT overwritten!**

### Vercel:
- No action

---

## Step 7: Parent Opens App Again

### What happens:
- Parent opens Hatch app
- App requests content cards

### Redshift:
- No action (already synced)

### Braze sends:
```json
{
  "type": "morning_streak",
  "extras": {
    "hardware": "1,0,1,0,0,0,0",    ← Updated (Mon + Wed)
    "manual": "0,1,0,0,0,0,0",      ← Preserved (Tue)
    "start_date": "2026-04-28",
    "family_id": "member_12345"
  }
}
```

### Vercel:
- No action

### Hatch app displays:
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

Merge logic: `hardware[i] OR manual[i]`
- Monday: `1 OR 0 = 1` ✓ (hardware)
- Tuesday: `0 OR 1 = 1` ✓ (manual)
- Wednesday: `1 OR 0 = 1` ✓ (hardware)
- Result: 3/7

---

## Step 8: Parent Removes Tuesday Manual Add

### What happens:
- Parent taps Edit
- Opens Vercel page
- Toggles Tuesday OFF
- Taps Save

### Redshift:
- No action

### Braze:
- Waiting for update...

### Vercel sends to Braze:
```
POST https://rest.iad-01.braze.com/users/track
{
  "attributes": [{
    "external_id": "member_12345",
    "morning_streak_manual": "0,0,0,0,0,0,0"    (Tuesday removed)
  }]
}
```

### Braze now stores:
```
member_12345
  morning_streak_hardware: "1,0,1,0,0,0,0"    (unchanged)
  morning_streak_manual: "0,0,0,0,0,0,0"      (Tuesday removed!)
  morning_streak_start_date: "2026-04-28"
```

### Hatch app displays:
```
┌─────────────────────────────────────────┐
│ 🔵 MORNING ROUTINE           Edit │    │
│                                         │
│    2                                    │
│   /7    ● ○ ● ○ ○ ○ ○                  │
│        Mon Tue Wed Thu Fri Sat Sun      │
│                                         │
│ Tap to view this week's streak          │
└─────────────────────────────────────────┘
```

Only Monday and Wednesday remain (both hardware).

---

## Step 9: Week Rollover (Next Monday)

### What happens:
- New week begins
- System resets streak arrays

### Redshift (Monday morning):
- Detects new week
- Calculates: `morning_streak_hardware: "0,0,0,0,0,0,0"`
- Updates: `morning_streak_start_date: "2026-05-05"`
- Sends to Braze

### Braze now stores:
```
member_12345
  morning_streak_hardware: "0,0,0,0,0,0,0"    (reset!)
  morning_streak_manual: "0,1,0,0,0,0,0"      (old manual still there)
  morning_streak_start_date: "2026-05-05"     (new week!)
```

**Note:** Manual array might still have old data until Vercel resets it.

### Vercel (scheduled job):
- Detects new week from `start_date`
- Resets manual array to all zeros
```
POST /users/track
{
  "external_id": "member_12345",
  "morning_streak_manual": "0,0,0,0,0,0,0"
}
```

### Braze final state:
```
member_12345
  morning_streak_hardware: "0,0,0,0,0,0,0"
  morning_streak_manual: "0,0,0,0,0,0,0"
  morning_streak_start_date: "2026-05-05"
```

### Hatch app displays:
```
┌─────────────────────────────────────────┐
│ 🔵 MORNING ROUTINE           Edit │    │
│                                         │
│    0                                    │
│   /7    ○ ○ ○ ○ ○ ○ ○                  │
│        Mon Tue Wed Thu Fri Sat Sun      │
│                                         │
│ Tap to view this week's streak          │
└─────────────────────────────────────────┘
```

Fresh week starts!

---

## Summary: Who Writes What

| System | Writes To | Frequency | Reads From |
|--------|-----------|-----------|------------|
| **Redshift** | `morning_streak_hardware` | Hourly | Database events |
| **Redshift** | `morning_streak_start_date` | Weekly | Current date |
| **Vercel** | `morning_streak_manual` | Immediate | User edits |
| **Braze** | (stores all) | N/A | N/A |
| **Hatch App** | (displays) | On refresh | Braze |

### Key Rules:
1. Redshift NEVER reads or writes `manual`
2. Vercel NEVER reads or writes `hardware`
3. Both write to separate fields → NO CONFLICTS
4. Display merges client-side: `hardware[i] OR manual[i]`
5. Hardware days can't be removed by parents
6. Manual days can be toggled on/off

---

## Data Flow Diagram

```
Hardware Button → Database → Redshift → Airflow → CDI → Braze
                                                          ↓
                                                    Stores both:
                                                    - hardware
                                                    - manual
                                                          ↓
                                                    Hatch App
                                                    (displays merged)
                                                          ↓
                                                    Parent taps Edit
                                                          ↓
                                                    Opens Vercel
                                                          ↓
                                                    Parent edits
                                                          ↓
                                        Vercel → Braze API → Updates manual
                                                          ↓
                                                    Hatch App refreshes
```

**No loops, no conflicts, single source of truth = Braze**
