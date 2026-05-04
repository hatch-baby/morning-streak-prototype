# Morning Streak Feature - 10-User Pilot Implementation Plan

## Overview

**Goal:** Launch morning streak tracking to 10 pilot users identified by MAC addresses

**Timeline:** 2 weeks (1 week setup + 1 week testing)

**Teams Involved:**
- Redshift Engineering
- Braze Team
- Web Team (Vercel)

## 🎉 Good News: Infrastructure Already Exists!

**What's Already Built:**
- ✅ **Redshift:** Already calculating `morning_streak_days` from hardware button taps
- ✅ **Redshift:** Already sending to Braze hourly
- ✅ **Braze:** Already has `morning_streak_start_date` attribute
- ✅ **Vercel:** New app is ready to deploy

**What Needs to Change:**
- 🔄 **Redshift:** Rename field: `morning_streak_days` → `morning_streak_hardware` (5 min)
- ✅ **Braze:** Create 1 new attribute: `morning_streak_manual` (2 min)
- ✅ **Braze:** Set up content card (30 min)
- ✅ **Vercel:** Deploy app with API credentials (10 min)

**Total Setup Time:** ~1 hour (not including testing)

This is mostly **configuration**, not building from scratch!

---

## Phase 1: Braze Setup (Week 1, Days 1-2)

### Step 1.1: Update/Create Custom Attributes

**Who:** Braze Team

**Current State:**
You likely already have:
- ✅ `morning_streak_days` (existing - from Redshift)
- ✅ `morning_streak_start_date` (existing - from Redshift)

**Required Changes:**

| Attribute | Action | Data Type | Description |
|---|---|---|---|
| `morning_streak_hardware` | **CREATE NEW** | String | Hardware button taps: "1,0,1,0,0,0,0" |
| `morning_streak_manual` | **CREATE NEW** | String | Parent manual adds: "0,1,0,0,0,0,0" |
| `morning_streak_start_date` | **Keep as-is** | String | Week start (Monday): "2026-04-28" |
| `morning_streak_days` | **Deprecated** | String | No longer used (replace with hardware) |

**Steps:**
1. Go to Braze Dashboard → Settings → Manage Settings → Custom Attributes
2. Click "Add Custom Attribute"
3. Name: `morning_streak_hardware`, Type: String
4. Click "Add Custom Attribute"
5. Name: `morning_streak_manual`, Type: String
6. (Optional) Hide/archive `morning_streak_days` - no longer used

**Verification:**
- `morning_streak_hardware` created (will be populated by Redshift)
- `morning_streak_manual` created (will be populated by Vercel)
- `morning_streak_start_date` exists (already in use)

**Note:** For pilot users, `morning_streak_manual` will start as `"0,0,0,0,0,0,0"` (all zeros) until a parent makes their first manual edit.

---

### Step 1.2: Create Content Card Template

**Who:** Braze Team

**Action:** Create a new Content Card campaign

**Card Settings:**

**Name:** Morning Streak Pilot

**Card Type:** Classic Card

**Title:**
```
Morning Routine Progress
```

**Description:**
```liquid
Tap to view this week's streak
```

**Image URL:**
```liquid
https://YOUR-VERCEL-APP.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}
```

**Link URL (On-Click Behavior):**
```liquid
https://YOUR-VERCEL-APP.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}
```
*Note: Points to `/edit` so tapping the content card (via "Edit" button) opens editing page directly*

**Audience:**
- Create segment: "Morning Streak Pilot Users"
- Add the 10 pilot users by external_id (member_id)

**Delivery:**
- Send type: Recurring
- Schedule: Daily at 8:00 AM user local time
- Re-eligibility: Immediate

**Verification:**
- Preview card with test data
- Check image URL generates correctly
- Verify link URL format

---

### Step 1.3: Generate Braze API Key

**Who:** Braze Team

**Action:** Create API key for Vercel to update manual array

**Steps:**
1. Braze Dashboard → Settings → API Keys
2. Create New API Key: "Morning Streak Vercel"
3. Permissions required:
   - `users.track` ✅
4. Save API key securely

**Provide to Web Team:**
- API Key: `braze-xxxx-xxxx-xxxx`
- Instance URL: `https://rest.iad-01.braze.com` (or your cluster)

---

## Phase 2: Redshift/Airflow Setup (Week 1, Days 3-4)

### Step 2.1: Rename Existing Field

**Who:** Redshift Engineering

**Current State:**
Redshift is already sending:
```javascript
{
  external_id: "member_12345",
  morning_streak_days: "1,1,1,0,0,0,0",      // Current name
  morning_streak_start_date: "2026-04-28"
}
```

**Required Change:**
Simply rename `morning_streak_days` → `morning_streak_hardware`

```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,1,1,0,0,0,0",  // New name
  morning_streak_start_date: "2026-04-28"
}
```

**Why:**
- Clarifies this is hardware button tap data only
- Distinguishes from `morning_streak_manual` (parent edits)
- Prevents data ownership confusion

---

### Step 2.2: Identify Pilot Users

**Who:** Redshift Engineering

**Query to identify 10 pilot users by MAC address:**

```sql
-- Replace with actual MAC addresses
WITH pilot_macs AS (
  SELECT unnest(ARRAY[
    'AA:BB:CC:DD:EE:01',
    'AA:BB:CC:DD:EE:02',
    'AA:BB:CC:DD:EE:03',
    'AA:BB:CC:DD:EE:04',
    'AA:BB:CC:DD:EE:05',
    'AA:BB:CC:DD:EE:06',
    'AA:BB:CC:DD:EE:07',
    'AA:BB:CC:DD:EE:08',
    'AA:BB:CC:DD:EE:09',
    'AA:BB:CC:DD:EE:10'
  ]) AS mac_address
)
SELECT
  d.member_id,
  d.mac_address,
  u.email
FROM devices d
JOIN pilot_macs p ON d.mac_address = p.mac_address
JOIN users u ON d.member_id = u.member_id
```

**Output:** List of 10 member_ids for pilot

---

### Step 2.3: Update Existing Query

**Who:** Redshift Engineering

**What to Change:**
Your existing streak calculation query just needs a field name update.

**In your current query, change this line:**
```sql
-- OLD:
... AS morning_streak_days,

-- NEW:
... AS morning_streak_hardware,
```

**Example of what your query should output:**
```sql
SELECT
  member_id AS external_id,
  streak_calculation AS morning_streak_hardware,  -- ← Changed from morning_streak_days
  week_start AS morning_streak_start_date
FROM your_existing_streak_table
WHERE member_id IN (
  -- 10 pilot member_ids
)
```

**Output Format (should already be correct):**
```
external_id: "member_12345"
morning_streak_hardware: "1,0,1,0,0,0,0"
morning_streak_start_date: "2026-04-28"
```

**Test Query:**
- Run for one pilot member_id
- Verify output format: `"1,0,1,0,0,0,0"` (7 values, comma-separated)
- Verify start_date is current Monday
- **New field name shows up as `morning_streak_hardware`**

---

### Step 2.4: Update Airflow/CDI Configuration

**Who:** Redshift Engineering

**What to Change:**
In your existing Airflow DAG or CDI sync, update the attribute name in the Braze payload.

**OLD Braze payload:**
```python
{
    "attributes": [{
        "external_id": member_id,
        "morning_streak_days": streak_data,        # ← Old name
        "morning_streak_start_date": start_date
    }]
}
```

**NEW Braze payload:**
```python
{
    "attributes": [{
        "external_id": member_id,
        "morning_streak_hardware": streak_data,   # ← New name
        "morning_streak_start_date": start_date
    }]
}
```

**If using CDI (Cloud Data Ingestion):**
Update the attribute mapping in your CDI configuration:
- Source Column: `streak_data`
- Target Attribute: `morning_streak_hardware` (changed from `morning_streak_days`)

**Testing:**
1. Test sync with one pilot user
2. Check Braze user profile shows `morning_streak_hardware` attribute
3. Verify format: `"1,0,1,0,0,0,0"`

**Deployment:**
1. Update existing DAG/CDI configuration
2. Test manually with one user
3. Deploy to production (hourly schedule already exists)

**Important:**
- Only writes to `morning_streak_hardware`
- Never touches `morning_streak_manual` (Vercel owns that)
- `morning_streak_start_date` stays the same

---

## Phase 3: Vercel Deployment (Week 1, Day 5)

### Step 3.1: Deploy to Vercel

**Who:** Web Team

**Steps:**

1. **Push code to GitHub:**
```bash
cd /Users/anoushkagarg/CodingProjects/morning-streak-prototype
git add .
git commit -m "Morning streak pilot - hardware/manual separation"
git push origin main
```

2. **Import to Vercel:**
- Visit vercel.com/new
- Import GitHub repository
- Project name: `morning-streak-pilot`

3. **Add Environment Variables:**
```
BRAZE_API_KEY=braze-xxxx-xxxx-xxxx  (from Step 1.3)
BRAZE_INSTANCE_URL=https://rest.iad-01.braze.com
```

4. **Deploy:**
- Click "Deploy"
- Wait for deployment to complete
- Note the production URL: `https://your-app.vercel.app`

5. **Update Braze Content Card:**
- Go back to Braze
- Update image/link URLs with actual Vercel domain

**Verification:**
- Visit: `https://your-app.vercel.app`
- Should redirect to demo streak page
- Test image endpoint: `/api/streak-card-image?hardware=1,0,1,0,0,0,0&manual=0,1,0,0,0,0,0`

---

## Phase 4: Testing (Week 2, Days 1-3)

### Step 4.1: Manual Test Checklist

**Who:** All teams

**Test Cases:**

#### Test 1: Hardware Tap Flow
- [ ] Child taps hardware button Monday morning
- [ ] Wait for hourly Airflow sync
- [ ] Check Braze user profile: `morning_streak_hardware = "1,0,0,0,0,0,0"`
- [ ] Parent opens app
- [ ] Content card appears with correct image
- [ ] Card shows Monday filled, rest empty
- [ ] Tap card → opens Vercel app
- [ ] Vercel shows Monday complete, "Button Tap" badge

#### Test 2: Manual Add Flow
- [ ] From Test 1, parent taps "Edit streaks"
- [ ] Toggle Tuesday on (manual add)
- [ ] Save
- [ ] Check Braze user profile: `morning_streak_manual = "0,1,0,0,0,0,0"`
- [ ] Content card refreshes
- [ ] Image shows Mon + Tue filled
- [ ] Re-open edit page
- [ ] Monday shows "Button Tap" (dimmed, can't toggle)
- [ ] Tuesday shows "Added by you" (can toggle)

#### Test 3: Hardware Preserves Manual
- [ ] From Test 2 (hardware: Mon, manual: Tue)
- [ ] Child taps hardware button Wednesday
- [ ] Wait for hourly sync
- [ ] Check Braze: `hardware = "1,0,1,0,0,0,0"`, `manual = "0,1,0,0,0,0,0"` (preserved!)
- [ ] Content card shows Mon, Tue, Wed
- [ ] Open edit: Mon + Wed = "Button Tap", Tue = "Added by you"

#### Test 4: Remove Manual Day
- [ ] From Test 3
- [ ] Parent opens edit
- [ ] Toggle Tuesday off (was manual)
- [ ] Save
- [ ] Check Braze: `manual = "0,0,0,0,0,0,0"`
- [ ] Content card now shows only Mon + Wed (hardware only)

#### Test 5: Week Rollover
- [ ] Wait until next Monday
- [ ] Check Airflow resets start_date
- [ ] All arrays reset to "0,0,0,0,0,0,0"
- [ ] Content card shows fresh week

---

### Step 4.2: Automated Tests

**Who:** Web Team

**Test Script:**

```bash
# Test image generation
curl "https://your-app.vercel.app/api/streak-card-image?hardware=1,1,1,0,0,0,0&manual=0,0,0,1,0,0,0"
# Should return PNG

# Test streak page
curl "https://your-app.vercel.app/streak?family=member_12345&hardware=1,1,1,0,0,0,0&manual=0,0,0,1,0,0,0&startDate=2026-04-28"
# Should return HTML

# Test update API (requires valid Braze key)
curl -X POST "https://your-app.vercel.app/api/update-streak" \
  -H "Content-Type: application/json" \
  -d '{"family":"member_12345","manual":[0,0,0,1,0,0,0]}'
# Should return {"ok":true}
```

---

## Phase 5: Pilot Launch (Week 2, Day 4)

### Step 5.1: Enable for Pilot Users

**Who:** Braze Team

**Actions:**
1. Verify all 10 users have `morning_streak_hardware` attribute populated
2. Enable Content Card campaign for "Morning Streak Pilot Users" segment
3. Send push notification:
   - "Check out your new Morning Routine streak tracker! 🌅"
   - Link to content card

**Monitor:**
- Content card impressions
- Content card clicks
- API errors in Vercel logs

---

### Step 5.2: Collect Feedback

**Who:** Product Team

**Week 2, Days 5-7:**
- Send survey to 10 pilot users
- Interview 3-5 users
- Monitor Slack/support tickets

**Questions:**
- Does the streak motivate morning routine?
- Is hardware button working reliably?
- Did you use manual add feature?
- Any bugs/confusion?

---

## Phase 6: Iteration or Full Rollout (Week 3+)

### Success Criteria for Full Rollout:
- [ ] 80%+ of pilot users active weekly
- [ ] <5% API error rate
- [ ] No data loss incidents
- [ ] Positive user feedback
- [ ] Airflow sync runs reliably

### If Successful:
- Expand to 100 users
- Then 1,000 users
- Then all users

### If Issues:
- Fix bugs
- Iterate on pilot
- Re-test before expanding

---

## Rollback Plan

### If Critical Issues Arise:

**Immediate Actions:**
1. Braze Team: Pause content card campaign
2. Web Team: Add feature flag to disable editing
3. Redshift: Stop Airflow DAG

**Data Cleanup:**
- Manual edits in Braze will remain
- Can resume without data loss
- Hardware taps continue to log in database

---

## Support Contacts

| Issue | Team | Contact |
|-------|------|---------|
| Content card not showing | Braze Team | braze-support@company.com |
| Image not loading | Web Team | web-team@company.com |
| Hardware taps not syncing | Data Engineering | data-eng@company.com |
| General bugs | Product Team | product@company.com |

---

## Appendix: Quick Reference

### Braze Attributes - Before vs After

**CURRENT (what you have now):**
```javascript
{
  external_id: "member_12345",
  morning_streak_days: "1,0,1,0,0,0,0",      // From Redshift
  morning_streak_start_date: "2026-04-28"    // From Redshift
}
```

**NEW (for pilot):**
```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,0,1,0,0,0,0",  // From Redshift (renamed!)
  morning_streak_manual: "0,1,0,0,0,0,0",    // From Vercel (new!)
  morning_streak_start_date: "2026-04-28"    // From Redshift (no change)
}
```

**What Changed:**
- ✅ `morning_streak_days` → `morning_streak_hardware` (renamed)
- ✅ `morning_streak_manual` (new attribute)
- ✅ `morning_streak_start_date` (unchanged)

### URL Formats
```
Image: /api/streak-card-image?hardware=X&manual=Y
Page: /streak?family=ID&hardware=X&manual=Y&startDate=DATE
Edit: /edit?family=ID&hardware=X&manual=Y&startDate=DATE
```

### Key Rules
- Redshift ONLY writes `morning_streak_hardware`
- Vercel ONLY writes `morning_streak_manual`
- Hardware days cannot be removed by parents
- Manual days can be toggled on/off

---

**Document Version:** 1.0
**Last Updated:** 2026-05-04
**Owner:** Product Team
**Next Review:** After Week 2 testing

