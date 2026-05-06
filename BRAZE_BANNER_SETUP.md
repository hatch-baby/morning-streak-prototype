# Braze Banner Setup Guide - Morning Streak Pilot

## Overview

This guide walks through setting up a Braze Banner campaign for the Morning Streak feature. Banners refresh automatically on session start, ensuring users always see current streak data without manual refresh.

**Why Banners (not Content Cards):**
- ✅ Auto-refresh on session start (no stale data)
- ✅ Works with Hatch app's current implementation
- ✅ No 30-day expiration limit
- ✅ AI-powered design editor for quick iterations
- ✅ Hatch app doesn't support full-image content cards

---

## Prerequisites

Before starting, ensure you have:
- ✅ `morning_streak_manual` attribute created in Braze
- ✅ CDI sync active (Redshift → Braze for `morning_streak_hardware`)
- ✅ Braze API key with `users.track` permission
- ✅ Environment variables added to Vercel:
  - `BRAZE_API_KEY`
  - `BRAZE_INSTANCE_URL` (e.g., `https://rest.iad-07.braze.com`)
- ✅ Vercel app deployed at `morning-streak-pilot.vercel.app`
- ✅ Banner placement created in Hatch app (by Mobile team)

---

## Part 1: Create Banner Campaign

### Step 1: Navigate to Campaigns

1. Log in to Braze dashboard
2. Go to **Engagement** → **Campaigns** (left sidebar)
3. Click **+ Create Campaign**
4. Select **Banner**

### Step 2: Campaign Details

1. **Campaign Name:** `Morning Streak - Pilot Banner`
2. **Description:** "Pilot test of morning routine streak tracking for 10 users using auto-refreshing Banner"
3. **Teams/Tags:** (optional, add relevant tags)
4. Click **Done**

---

## Part 2: Design the Banner

### Step 1: Select Placement

1. **Placement:** Select the morning routine feed placement created by Mobile team
   - If placement doesn't exist, coordinate with Mobile team first
   - Placement ID determines where Banner appears in app

### Step 2: Create Banner HTML

You have two options for displaying the streak image:

#### Option A: Embed Image (Recommended)

```html
<div style="width: 100%; display: flex; justify-content: center; padding: 12px;">
  <img
    src="https://morning-streak-pilot.vercel.app/api/streak-card-image?hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}"
    alt="Morning routine streak progress"
    style="width: 100%; max-width: 346px; border-radius: 16px;"
  />
</div>
```

#### Option B: Full HTML/CSS Recreation

Recreate the streak visualization directly in HTML/CSS (more complex, but no external image dependency).

**For pilot, use Option A** for simplicity.

### Step 3: Configure Deep Link

**Deep Link (On Click Behavior):**

The deep link must use Hatch's custom URL scheme to open the edit page in a webview.

**Format:**
```
hatchbabyRest://www.hatch.co/l/restBaby/webview?url={URL_ENCODED_EDIT_PAGE}
```

**Where `{URL_ENCODED_EDIT_PAGE}` is the URL-encoded version of:**
```
https://morning-streak-pilot.vercel.app/edit?family={{${external_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
```

**⚠️ Critical Investigation Needed:**

Test if Liquid personalization `{{${...}}}` works when URL-encoded in the deep link. This has not been validated yet.

**Test approach:**
1. Create Banner with encoded deep link
2. Test in Hatch app with real user
3. Verify Liquid variables are replaced before encoding
4. Verify webview opens with correct personalized URL

**Alternative if encoding blocks Liquid:**
Use conditional logic in Banner HTML to construct the deep link dynamically.

---

## Part 3: Target Audience

### Step 1: Select Target Segment

1. **Target Users By Segment:**
   - Option A: Create segment with 10 pilot user IDs
   - Option B: Use test tag/attribute to identify pilot users

2. **Additional Filters:**
   - For pilot: Target only your test account initially
   - Filter: Email equals `anoushka.garg@hatch.co` OR External ID equals `1418932`

3. **Verify "Reachable Users":**
   - Should show at least 1 (you)
   - If 0, check subscription settings (below)

---

## Part 4: Schedule Delivery

### Step 1: Delivery Settings

1. **Delivery Type:** Scheduled Delivery
2. **Send Time:** Immediately (or set launch date/time)
3. **End Date:** No end date (continuous)
   - Banner will remain active and refresh on every session start

### Step 2: Refresh Settings

1. **Refresh Behavior:** On session start (automatic)
   - Liquid templates re-evaluated each time user opens app
   - Ensures streak data is always current

---

## Part 5: Conversion Tracking (Optional)

### Conversion Events

Track these events to measure success:

1. **Primary:** Streak edit completed (track via Vercel API)
2. **Secondary:** Banner click → edit page view
3. **Tertiary:** Session start with Banner refresh

Configure in **Conversion Events** section of campaign.

---

## Part 6: Send Settings

### Critical Settings to Check

1. **Subscription Status:**
   - Set to **"All Users (including unsubscribed)"** for pilot testing
   - This prevents "Reachable users is 0" issue

2. **Frequency Capping:**
   - **Disable** for pilot
   - Banner should refresh on every session start

3. **Quiet Hours:**
   - Disable for pilot (Banners are non-intrusive)

---

## Part 7: Review & Launch

### Pre-Launch Checklist

- [ ] Banner HTML includes image with Liquid variables
- [ ] Deep link format tested with Liquid personalization
- [ ] Placement ID matches Mobile team's implementation
- [ ] Target audience includes at least your test account
- [ ] Reachable users > 0
- [ ] Subscription status set to "All Users"
- [ ] Delivery schedule set to immediate/continuous
- [ ] Refresh on session start enabled

### Step 1: Review Campaign

1. Click **Review** (top right)
2. Check all settings match this guide
3. Verify no validation errors

### Step 2: Test with 1 User First

**Before launching to 10 users:**

1. Launch Banner with target audience = YOUR account only
2. Open Hatch app
3. Verify Banner appears with streak image
4. Tap Banner → verify webview opens edit page
5. Make edit → Save
6. Close app → Reopen app
7. Verify Banner refreshed with updated data

### Step 3: Launch to 10 Pilot Users

Once single-user test succeeds:

1. Update target audience to include 10 pilot users
2. Save campaign
3. Monitor for 24 hours
4. Check analytics for impressions and clicks

---

## Part 8: Testing & Verification

### Test 1: Banner Appears

**Expected:**
- User opens Hatch app
- Banner appears at designated placement
- Image shows correct streak count

**Troubleshooting:**
- If Banner doesn't appear:
  - Check placement ID matches Mobile team's config
  - Verify user matches targeting criteria
  - Check campaign is active (not paused)

### Test 2: Image Loads Correctly

**Expected:**
- Image displays streak visualization
- Completed days show checkmarks
- Count shows `X/7`

**Troubleshooting:**
- If image doesn't load:
  - Test image URL in browser with real values
  - Check Vercel deployment is active
  - Verify Liquid variables are evaluated correctly

### Test 3: Deep Link Works

**Expected:**
- User taps Banner
- Webview opens inside Hatch app
- Edit page loads with personalized data

**Troubleshooting:**
- If deep link fails:
  - Verify URL encoding preserves Liquid variables
  - Check `hatchbabyRest://` scheme is correct
  - Test edit page URL in browser first
  - Coordinate with Mobile team on webview config

### Test 4: Banner Refreshes After Edit

**Expected:**
1. User edits streak → Saves
2. User closes app completely
3. User reopens app (session start)
4. Banner shows updated streak data automatically

**Troubleshooting:**
- If Banner doesn't refresh:
  - Verify user closed app completely (not just backgrounded)
  - Check Braze attribute was updated (User Search)
  - Confirm session start event firing in app
  - Verify "refresh on session start" enabled in campaign

---

## Part 9: Monitoring & Analytics

### Daily Checks (First Week)

1. **Braze Dashboard → Campaign Analytics:**
   - Impressions: How many users saw Banner
   - Clicks: How many tapped Banner
   - Refresh rate: How often Banner re-evaluated

2. **User Search:**
   - Check 2-3 pilot users daily
   - Verify `morning_streak_hardware` updating from Redshift
   - Verify `morning_streak_manual` updating from Vercel

3. **Vercel Logs:**
   - Filter for `/api/update-streak` requests
   - Check success rate (should be ~100%)
   - Monitor for any 500 errors

### Key Metrics

| Metric | Target (Week 1) | Meaning |
|--------|----------------|---------|
| Banner Impressions | 70+ | 10 users × 7 days (avg 1/day) |
| Banner Clicks | 20+ | ~20% click rate |
| Edit Saves | 10+ | ~50% of clicks result in save |
| Refresh Success Rate | 100% | All session starts refresh Banner |

---

## Part 10: Troubleshooting

### Issue: "Reachable Users is 0"

**Causes:**
1. Subscription status too restrictive
2. User doesn't match targeting filters
3. Placement not available in user's app version

**Solutions:**
1. Change Subscription Status to "All Users"
2. Simplify targeting to just your email/ID
3. Verify Mobile team deployed Banner placement

### Issue: Liquid Variables Not Working in Deep Link

**Cause:**
URL encoding might prevent Liquid evaluation

**Solutions:**
1. Test if variables evaluated before encoding
2. Use JavaScript in Banner HTML to construct link dynamically
3. Fall back to static deep link with prompt to refresh

### Issue: Banner Shows Stale Data

**Cause:**
User hasn't triggered session start event

**Solutions:**
1. Instruct user to close app completely and reopen
2. Verify session start event tracking in app
3. Check if "refresh on session start" is enabled

---

## Success Criteria

Banner pilot is successful if:

✅ All 10 users see Banner in app within 24 hours
✅ 80%+ of Banners display correct streak data
✅ 50%+ of users tap Banner at least once
✅ 90%+ of edit saves succeed
✅ Banner refreshes correctly within 1 session start after edit
✅ No critical bugs or crashes reported

---

## Next Steps After Successful Pilot

1. Expand to 100 users (Week 2)
2. Add gamification (rewards for 5-day, 7-day streaks)
3. Build native Banner rendering (faster load)
4. Add push notification when button tapped
5. Multi-week history tracking
6. Parent insights and analytics

---

## Deep Link Testing Script

Use this to validate deep link personalization:

**Test URL (replace with your data):**
```
hatchbabyRest://www.hatch.co/l/restBaby/webview?url=https%3A%2F%2Fmorning-streak-pilot.vercel.app%2Fedit%3Ffamily%3D1418932%26hardware%3D1%2C0%2C1%2C0%2C0%2C0%2C0%26manual%3D0%2C0%2C0%2C0%2C0%2C0%2C0%26startDate%3D2026-04-28
```

**Verify:**
1. Webview opens in Hatch app
2. Edit page loads
3. Streak data matches user's actual data
4. All 7 days are toggleable

---

## Document Version

**Version:** 1.0
**Last Updated:** 2026-05-05
**Status:** Ready for Banner Campaign Creation

---

## References

- **CONTEXT.md** - Complete system architecture
- **Braze Banner Docs** - https://www.braze.com/docs/developer_guide/banners
- **Vercel Deployment** - https://morning-streak-pilot.vercel.app
- **Deep Link Format** - Provided by Hatch Braze expert
