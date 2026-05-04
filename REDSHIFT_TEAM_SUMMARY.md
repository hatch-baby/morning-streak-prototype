# Redshift Team - Morning Streak Pilot Changes

## TL;DR

**You already have 99% of what we need!** Just rename one field in your existing Braze sync.

---

## What You're Already Doing ✅

You're currently sending to Braze:
```javascript
{
  external_id: "member_12345",
  morning_streak_days: "1,0,1,0,0,0,0",      // Calculated from button_taps
  morning_streak_start_date: "2026-04-28"    // Week start
}
```

This is **perfect!** The calculation logic, data format, and sync schedule are all correct.

---

## What Needs to Change 🔄

### 1. Rename One Field (5 minutes)

**In your query:**
```sql
-- OLD:
SELECT
  member_id AS external_id,
  calculated_streak AS morning_streak_days,        -- ← Change this
  week_start AS morning_streak_start_date
FROM ...

-- NEW:
SELECT
  member_id AS external_id,
  calculated_streak AS morning_streak_hardware,    -- ← New name
  week_start AS morning_streak_start_date
FROM ...
```

**In your Airflow DAG or CDI config:**
```python
# OLD:
{
  "attributes": [{
    "external_id": member_id,
    "morning_streak_days": streak_data,        # ← Change this
    "morning_streak_start_date": start_date
  }]
}

# NEW:
{
  "attributes": [{
    "external_id": member_id,
    "morning_streak_hardware": streak_data,   # ← New name
    "morning_streak_start_date": start_date
  }]
}
```

**That's it!**

---

### 2. Filter to 10 Pilot Users (10 minutes)

Add a WHERE clause to limit sync to pilot users:

```sql
WHERE member_id IN (
  -- 10 pilot member_ids (we'll provide these)
  'member_12345',
  'member_67890',
  -- ... etc
)
```

**We'll give you the list of 10 member IDs after identifying by MAC address.**

---

## Why the Rename?

**Current Name:** `morning_streak_days`
- Ambiguous - could mean hardware taps OR manual adds

**New Name:** `morning_streak_hardware`
- Clear ownership: Redshift owns hardware button taps
- Vercel will own a separate field: `morning_streak_manual` (parent edits)
- No confusion about which system writes what

**Benefit:** Your data will **never conflict** with Vercel's manual edits because you write to separate fields.

---

## Testing Checklist

**After making changes:**
- [ ] Run query for one pilot user
- [ ] Verify output has `morning_streak_hardware` field (not `morning_streak_days`)
- [ ] Verify format: `"1,0,1,0,0,0,0"` (7 comma-separated values)
- [ ] Verify start_date is current Monday
- [ ] Check Braze user profile shows new attribute name
- [ ] Confirm hourly sync still works

---

## Timeline

| Day | Task | Time |
|-----|------|------|
| **Day 1** | Rename field in query | 5 min |
| **Day 1** | Update Airflow/CDI config | 5 min |
| **Day 1** | Get list of 10 pilot member_ids | 10 min |
| **Day 1** | Add WHERE filter for pilot users | 5 min |
| **Day 2** | Test with one user | 15 min |
| **Day 2** | Deploy to production | 10 min |
| **Total** | | **50 minutes** |

---

## What You Don't Need to Do ❌

- ❌ **No new queries** - use existing logic
- ❌ **No merge logic** - just rename one field
- ❌ **No read from Braze** - still just write-only
- ❌ **No manual edits handling** - Vercel handles that
- ❌ **No new infrastructure** - use existing Airflow/CDI

---

## Data Ownership

**After pilot launches:**

| Attribute | Owner | What It Stores |
|-----------|-------|----------------|
| `morning_streak_hardware` | **Redshift** | Hardware button taps only |
| `morning_streak_manual` | Vercel | Parent manual adds only |
| `morning_streak_start_date` | **Redshift** | Week start date |

**Your responsibility:** Only `morning_streak_hardware` (button taps)

**You never touch:** `morning_streak_manual` (parent edits)

---

## Example Flow

**Monday 9am:**
- Child taps hardware button
- Your hourly sync runs
- Braze updated: `hardware: "1,0,0,0,0,0,0"`

**Monday 6pm:**
- Parent manually adds Tuesday in Vercel app
- Vercel updates Braze: `manual: "0,1,0,0,0,0,0"`

**Tuesday 10am (next sync):**
- Your sync runs again
- Braze updated: `hardware: "1,0,0,0,0,0,0"` (same, no Tuesday tap yet)
- **Braze still has:** `manual: "0,1,0,0,0,0,0"` (preserved! ✅)
- **No conflict!** Separate fields = no overwrites

**The UI merges both:**
- Shows Mon + Tue complete
- Mon = "Button Tap" badge
- Tue = "Added by you" badge

---

## Questions?

**Q: What if I accidentally write to the wrong field?**
A: Worst case, a parent's manual edit gets overwritten. They can re-add it. No data loss in source tables.

**Q: Do I need to read current state before writing?**
A: **No!** Just write your hardware taps. Vercel writes separately to `manual`.

**Q: What about week rollover?**
A: Your existing logic already handles this - just rename the field.

**Q: Can I test with one user first?**
A: **Yes, please!** Test with one pilot user before enabling all 10.

---

## Contact

Questions about this change?
- **Product:** product-team@company.com
- **Web team (Vercel):** web-team@company.com
- **Braze setup:** braze-team@company.com

---

**Status:** Ready to implement
**Estimated effort:** < 1 hour
**Risk:** Very low (minor config change to existing pipeline)
