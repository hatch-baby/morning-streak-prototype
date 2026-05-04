# Morning Streak Pilot - Quick Start Guide

## 🎯 What We're Building

A weekly streak tracker that shows which days a child completed their morning routine via:
- **Hardware button taps** (automatic)
- **Parent manual adds** (retroactive fixes)

## 👤 User Experience Flow

**What parents see:**

1. **Content Card in Hatch App Feed:**
   - Title: "Morning Routine Progress"
   - Image: Dynamic visualization showing "3/7" with Mon/Tue/Wed circles filled
   - "Edit" button in top-right corner

2. **Parent Taps "Edit"** → Opens Vercel web page

3. **Edit Page Shows:**
   - 7 circles (Mon-Sun) with current state
   - Hardware days (button taps): Dimmed, "Button Tap" badge, can't toggle
   - Manual days (parent added): "Added by you" badge, can toggle off
   - Empty days: Can tap to add (becomes manual)

4. **Parent Saves Changes** → Braze updates `morning_streak_manual`

5. **Back in Hatch App** → Content card image refreshes with new state

**The content card image is generated dynamically by Vercel and shows the merged hardware + manual state. The Edit button opens the full editing experience.**

## 📊 Data Architecture

**Key Concept:** Separate storage, client-side merge

```
Redshift → Braze: morning_streak_hardware
Vercel → Braze:  morning_streak_manual
Display:         merged view (hardware OR manual)
```

## 🔧 Braze Setup (3 Attributes)

```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,0,1,0,0,0,0",  // Mon=✓ Wed=✓
  morning_streak_manual: "0,1,0,0,0,0,0",    // Tue=✓
  morning_streak_start_date: "2026-04-28"
}
```

**Content Card URLs:**

Image (shows current progress):
```liquid
https://YOUR-APP.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}
```

Link (opens when "Edit" is tapped):
```liquid
https://YOUR-APP.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}
```

**Note:** The link URL points to `/edit` so tapping the content card opens the editing page directly.

## 💾 Redshift Query (Simple Rename!)

**You already have this data!** Just rename one field:

**OLD:**
```sql
SELECT
  member_id AS external_id,
  streak_data AS morning_streak_days,        -- ← Old name
  week_start AS morning_streak_start_date
FROM ...
```

**NEW:**
```sql
SELECT
  member_id AS external_id,
  streak_data AS morning_streak_hardware,    -- ← New name
  week_start AS morning_streak_start_date
FROM ...
WHERE member_id IN ('pilot_user_1', 'pilot_user_2', ...)  -- Filter to 10 users
```

**What Changed:**
- Field renamed: `morning_streak_days` → `morning_streak_hardware`
- Filter to 10 pilot users only
- Everything else stays the same!

**Updates:** Only `morning_streak_hardware` (never touches `manual`)

## 🚀 Vercel API

**Update endpoint:**
```javascript
POST /api/update-streak
{
  "family": "member_12345",
  "manual": [0,1,0,0,0,0,0]  // Only updates manual array
}
```

**Updates:** Only `morning_streak_manual` (never touches `hardware`)

## 📋 Testing Checklist

- [ ] Hardware tap → shows in `hardware` array
- [ ] Manual add → shows in `manual` array
- [ ] Hardware days are read-only (dimmed, can't toggle)
- [ ] Manual days can be toggled on/off
- [ ] Hourly sync preserves manual edits
- [ ] Content card image updates correctly
- [ ] Week resets on Monday

## 🎨 UI Behavior

**Edit Page:**
- Hardware days: "Button Tap" badge, dimmed, can't toggle
- Manual days: "Added by you" badge, can toggle
- New days: can toggle (becomes manual)

**Merge Logic:**
```javascript
const days = hardware.map((hw, i) => hw || manual[i])
// Day is complete if EITHER hardware OR manual
```

## ⚠️ Key Rules

1. **Redshift already has the data!** - Just rename `morning_streak_days` → `morning_streak_hardware`
2. **Redshift owns `hardware`** - only writes to this array
3. **Vercel owns `manual`** - only writes to this array (new attribute)
4. **Never delete hardware days** - parents can't remove button taps
5. **Manual days can be removed** - parents can undo their adds
6. **Merge happens client-side** - Braze stores separate, app combines

## 🎉 What Makes This Easy

- ✅ **Redshift infrastructure already exists** - no new queries needed
- ✅ **Just rename one field** in your existing Redshift sync
- ✅ **Create 1 new Braze attribute** (`morning_streak_manual`)
- ✅ **No complex merge logic** in Airflow - each system owns one field

## 🔍 Debugging

**Check Braze user profile:**
```
Dashboard → User Search → member_12345 → Custom Attributes
```

**Test URLs locally:**
```
http://localhost:3000/streak?family=demo&hardware=1,0,1,0,0,0,0&manual=0,1,0,0,0,0,0
```

**Verify Airflow:**
```sql
-- Check last sync
SELECT MAX(updated_at) FROM braze_syncs WHERE sync_type = 'morning_streak';
```

## 📞 Team Responsibilities

| Team | Writes To | Never Touches |
|------|-----------|---------------|
| **Redshift/Airflow** | `morning_streak_hardware` | `morning_streak_manual` |
| **Vercel** | `morning_streak_manual` | `morning_streak_hardware` |
| **Braze** | Stores both (source of truth) | - |

## 📅 Pilot Timeline

**Week 1:**
- Days 1-2: Braze setup
- Days 3-4: Redshift/Airflow setup
- Day 5: Vercel deployment

**Week 2:**
- Days 1-3: Testing
- Day 4: Launch to 10 users
- Days 5-7: Collect feedback

## ✅ Launch Checklist

- [ ] 10 pilot users identified by MAC address
- [ ] Braze attributes created
- [ ] Content card configured
- [ ] Braze API key generated
- [ ] Redshift query tested
- [ ] Airflow DAG deployed
- [ ] Vercel app deployed
- [ ] Environment variables set
- [ ] Manual tests passed
- [ ] Rollback plan ready

## 🆘 Emergency Contacts

- Braze issues: braze-support@company.com
- Vercel/API issues: web-team@company.com
- Redshift/Airflow: data-eng@company.com

---

**See `PILOT_IMPLEMENTATION_PLAN.md` for detailed step-by-step instructions.**
