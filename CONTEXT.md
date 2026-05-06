# Morning Streak Prototype - Complete Context

## Overview

A pilot feature (10 users) for tracking children's morning routine completion via hardware button taps AND parent manual edits. Data flows through Redshift → Braze → Hatch App (via Banner), with a Vercel web app for editing.

**Why Banners (not Content Cards):**
- Hatch app does not support full-image content cards
- Banners refresh automatically on session start (content always current)
- Simpler setup with AI-powered drag-and-drop editor
- No 30-day expiration limit

## Architecture

```
Hardware Button → Database → Redshift (hourly) → Braze
                                                    ↓
                                               Hatch App
                                            (displays streak)
                                                    ↓
                                              Parent taps Edit
                                                    ↓
                                              Vercel Web App
                                                    ↓
                                                  Braze
                                            (updates manual)
```

## Data Model

### Braze Attributes (per user)

```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,0,1,0,0,0,0",  // From Redshift (button taps)
  morning_streak_manual: "0,1,0,0,0,0,0",    // From Vercel (parent edits)
  morning_streak_start_date: "2026-04-28"    // From Redshift (Monday)
}
```

### Data Ownership

| Attribute | Written By | Updated By | Frequency |
|-----------|-----------|------------|-----------|
| `morning_streak_hardware` | Redshift | Redshift only | Hourly |
| `morning_streak_manual` | Vercel | Vercel only | On parent save |
| `morning_streak_start_date` | Redshift | Redshift only | Weekly (Monday) |

**Critical:** Hardware and manual arrays are **separate** to prevent conflicts.

### Merge Logic (Client-Side)

```javascript
// In Hatch app or Vercel app:
const days = hardware.map((hw, i) => hw || manual[i])
// Day is complete if EITHER hardware OR manual is true
```

## Complete User Flow

### Step 1: Kid Taps Button (Monday)

**What happens:**
- Kid presses hardware button
- Event logged to database

**Redshift (hourly):**
- Reads button tap events
- Calculates: `morning_streak_hardware: "1,0,0,0,0,0,0"`
- Sends to Braze via Airflow → CDI

**Braze stores:**
```
member_12345
  morning_streak_hardware: "1,0,0,0,0,0,0"
  morning_streak_manual: "0,0,0,0,0,0,0"
  morning_streak_start_date: "2026-04-28"
```

### Step 2: Parent Opens Hatch App

**What happens:**
- Parent opens Hatch app (session start)
- Banner refreshes automatically with latest user data

**Braze evaluates Liquid templates:**
- `{{${morning_streak_hardware}}}` → `"1,0,0,0,0,0,0"`
- `{{${morning_streak_manual}}}` → `"0,0,0,0,0,0,0"`
- Generates image URL with personalized data

**Hatch app displays:**
- Banner shows embedded image from Vercel: `/api/streak-card-image?hardware=1,0,0,0,0,0,0&manual=0,0,0,0,0,0,0`
- Shows streak card with Monday filled (1/7)
- **Key:** Banner refreshes automatically - no stale data

### Step 3: Parent Taps Banner

**What happens:**
- Parent taps Banner
- Deep link opens Hatch webview with Vercel edit page

**Deep link format:**
```
hatchbabyRest://www.hatch.co/l/restBaby/webview?url={URL_ENCODED_EDIT_PAGE}
```

Where `{URL_ENCODED_EDIT_PAGE}` contains:
```
https://morning-streak-pilot.vercel.app/edit?family={{${external_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
```

**Vercel displays:**
- Edit page with 7 days
- Monday shows "Button-tap" badge
- All days can be toggled

### Step 4: Parent Adds Tuesday Manually

**What happens:**
- Parent taps Tuesday circle to add it
- Parent taps "Save"

**Vercel sends to Braze:**
```http
POST https://rest.iad-01.braze.com/users/track
{
  "attributes": [{
    "external_id": "member_12345",
    "morning_streak_manual": "0,1,0,0,0,0,0"
  }]
}
```

**Braze now stores:**
```
member_12345
  morning_streak_hardware: "1,0,0,0,0,0,0"  (unchanged)
  morning_streak_manual: "0,1,0,0,0,0,0"   (updated!)
  morning_streak_start_date: "2026-04-28"
```

**Key:** Manual array updated without touching hardware!

### Step 5: Parent Returns to Hatch App

**What happens:**
- Parent closes webview
- Returns to Hatch app
- **Banner refreshes automatically** (session start triggers refresh)

**Braze re-evaluates Liquid with new data:**
- `{{${morning_streak_manual}}}` → `"0,1,0,0,0,0,0"` (updated!)
- New image URL generated with latest data

**Hatch app displays:**
- Banner shows updated streak: Monday + Tuesday (2/7)
- Merge logic: `hardware[i] OR manual[i]`
- **Key:** No manual refresh needed - Banner updates automatically

### Step 6: Kid Taps Button Again (Wednesday)

**Redshift (hourly):**
- Updates: `morning_streak_hardware: "1,0,1,0,0,0,0"`

**Braze now stores:**
```
member_12345
  morning_streak_hardware: "1,0,1,0,0,0,0"  (updated!)
  morning_streak_manual: "0,1,0,0,0,0,0"   (preserved!)
```

**Key:** Manual edits are NOT overwritten!

### Step 7: Parent Opens App Again

**Hatch app displays:**
- Mon (hardware) + Tue (manual) + Wed (hardware) = 3/7

### Step 8: Parent Removes False Positive

**What happens:**
- Parent taps Edit
- Toggles Tuesday OFF (was manually added)
- Taps Save

**Vercel sends:**
```json
{
  "attributes": [{
    "external_id": "member_12345",
    "morning_streak_manual": "0,0,0,0,0,0,0"
  }]
}
```

**Result:**
- Only Mon + Wed show (both hardware)
- Tuesday manual add removed

## Technical Implementation

### Vercel Web App

**Repository:** `https://github.com/hatch-baby/morning-streak-prototype`

**Key Files:**
- `/app/edit/page.tsx` - Edit interface
- `/app/api/update-streak/route.ts` - Updates Braze
- `/app/api/streak-card-image/route.tsx` - Generates card image
- `/app/streak/page.tsx` - Standalone streak view (optional)

**Environment Variables:**
```
BRAZE_API_KEY=<your-api-key>
BRAZE_INSTANCE_URL=https://rest.iad-01.braze.com
```

**Deployment:**
- Platform: Vercel
- Team: hatch-internal
- Domain: (your-vercel-domain)

### Braze Setup

**Custom Attributes:**
- `morning_streak_manual` (String) - Created in Braze Data Settings

**API Key:**
- Name: Morning Streak Vercel
- Permission: `users.track`

**Banner Campaign (Scheduled Delivery):**
- **Campaign Type:** Scheduled Banner
- **Delivery:** Continuous (start now, no end date)
- **Refresh:** Automatic on session start
- **Placement:** Morning routine feed placement

**Banner Content:**
- **HTML:** Embed image with personalized Liquid variables
- **Image Source:** `https://morning-streak-pilot.vercel.app/api/streak-card-image?hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}`

**Deep Link (On Click):**
```
hatchbabyRest://www.hatch.co/l/restBaby/webview?url={URL_ENCODED_EDIT_PAGE}
```
Where encoded URL is:
```
https://morning-streak-pilot.vercel.app/edit?family={{${external_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
```

### Redshift Pipeline

**Already working - no changes needed:**
- Reads button tap events from database
- Calculates `morning_streak_hardware` array
- Sends to Braze hourly via Airflow → CDI
- Manages week rollovers (Monday start)

## Edge Cases & Handling

### Week Rollover
- **When:** Every Monday
- **What:** Both arrays reset to all zeros
- **Who:** Redshift sets `morning_streak_start_date` to new Monday
- **Effect:** Fresh week starts

### Parent Edits Before Hardware Sync
- Manual edits saved immediately
- Hardware syncs hourly
- Both preserved separately - no conflict

### Parent Removes Hardware Day
- Edit page shows "Button-tap" badge (origin)
- Parent can toggle it off
- Manual array saves as `0` for that day
- On next display, merge logic excludes it

### Multiple Edits Same Day
- Each save overwrites previous manual array
- Last save wins
- Hardware array untouched

### Banner Doesn't Update After Edit
- **Automatic refresh:** Banner refreshes on next session start
- **Manual refresh:** User can force refresh by closing/reopening app
- **Key advantage over Content Cards:** No manual pull-to-refresh needed

## Testing Checklist

### Before Launch
- [ ] `morning_streak_manual` attribute exists in Braze
- [ ] Braze API key created with `users.track` permission
- [ ] Environment variables added to Vercel
- [ ] Banner placement created in app (by Mobile team)
- [ ] Banner campaign created with scheduled delivery
- [ ] Image URL renders correctly in Banner HTML
- [ ] Deep link format tested with Liquid personalization
- [ ] Edit page opens from Banner tap
- [ ] Save button updates Braze attribute
- [ ] Banner refreshes automatically on session start
- [ ] Test with 1 pilot user end-to-end

### End-to-End Test Flow
1. Set test user's `morning_streak_hardware` to `"1,0,0,0,0,0,0"`
2. Open Hatch app → verify Banner shows 1/7 with Monday filled
3. Tap Banner → verify edit page opens in webview with Monday showing "Button-tap"
4. Toggle Tuesday ON → Save
5. Close app completely → Reopen app (triggers session start)
6. Verify Banner shows 2/7 (Mon + Tue) **automatically refreshed**
7. Tap Banner → Toggle Tuesday OFF → Save
8. Close app → Reopen app
9. Verify Banner shows 1/7 (Mon only)

## Success Metrics

**Track in Braze:**
- Banner impressions (how many users see it)
- Banner clicks (how many tap to edit)
- Banner refresh rate (session starts)

**Track in Vercel:**
- `/edit` page views
- `/api/update-streak` success rate
- `/api/streak-card-image` requests (from Banner embeds)

## Rollout Plan

### Phase 1: Single User Test (Day 1)
- Deploy to production
- Enable for 1 test user
- Verify full flow works
- Monitor for errors

### Phase 2: 10 Pilot Users (Day 2)
- Expand to 10 users (from Redshift team list)
- Monitor for 1 week
- Collect feedback

### Phase 3: Decision (Week 2)
- **If successful:** Plan expansion to 100 → 1,000 → all users
- **If issues:** Fix with small group, re-test

## Known Limitations (Pilot)

1. **Week view only** - No historical data or multi-week tracking
2. **Image-based Banner** - Native rendering would be faster (future)
3. **Webview-based edit** - In-app editing would be better UX (future)
4. **Session-start refresh only** - Real-time updates would require push (future)
5. **No rewards/gamification** - Future enhancement

## Advantages of Banner Approach

1. **Auto-refresh** - Banner refreshes on session start (no stale data)
2. **No 30-day limit** - Can run continuously without expiration
3. **AI-powered design** - Marketers can iterate without developer changes
4. **Works with current app** - No need for full-image content card support

## Future Enhancements (Post-Pilot)

### If Pilot Succeeds
1. Native Banner rendering (faster load times)
2. In-app edit modal (no webview needed)
3. Multi-week history view in Banner
4. Push notification on button tap with Banner update
5. Rewards for streaks (5 days, 7 days, etc.)
6. Parent insights ("Your child is most consistent on Mondays")
7. Real-time Banner refresh (not just session start)

### Data Model Evolution
- Store weekly history: `morning_streak_week_1`, `morning_streak_week_2`, etc.
- Track longest streak: `morning_streak_best`
- Completion rate: `morning_streak_completion_pct`

## Support & Debugging

### Common Issues

**Banner doesn't appear:**
- Verify Banner placement exists in Hatch app
- Check Banner campaign is active (scheduled delivery)
- Confirm user matches targeting criteria

**Image doesn't load in Banner:**
- Check Vercel deployment status
- Verify environment variables set
- Check Banner HTML for correct image URL
- Test image URL in browser with real values

**Deep link doesn't work:**
- Verify deep link format: `hatchbabyRest://www.hatch.co/l/restBaby/webview?url={...}`
- Check URL encoding is correct
- Test if Liquid variables {{${...}}} are evaluated before encoding
- Confirm edit page URL works in browser

**Edit/Save doesn't work:**
- Verify Braze API key has `users.track` permission
- Check Vercel logs for API errors
- Confirm `BRAZE_INSTANCE_URL` is correct

**Banner doesn't refresh:**
- User must close and reopen app (session start)
- Check if user's attributes were updated in Braze
- Verify Banner campaign "refresh on session start" is enabled

**Hardware taps not showing:**
- Confirm Redshift sync is running hourly
- Check Braze attribute `morning_streak_hardware` populated
- Verify CDI connection

**Manual edits disappear:**
- Check Redshift isn't overwriting `morning_streak_manual`
- Verify separate attribute ownership

### Logs & Monitoring

**Vercel:**
- Dashboard → Project → Logs
- Filter by `/api/update-streak` for save requests

**Braze:**
- User Search → Find test user → View attributes
- Campaign Analytics → Banner performance (impressions, clicks)
- Banner refresh logs (session start events)

**Redshift:**
- Airflow logs for CDI sync job

## Contact & Ownership

| Component | Owner | Contact |
|-----------|-------|---------|
| Vercel App | You (Web Team) | - |
| Braze Setup | You (Web Team) | - |
| Redshift Pipeline | Redshift Team | - |
| Mobile App (future) | Mobile Team | - |
| Product Decision | Product Team | - |

---

## Implementation Progress (May 5, 2026)

### ✅ What's Working

**Vercel Application:**
- Edit page loads and displays all 7 days with toggle controls
- Save API successfully calls Braze `/users/track` endpoint (200 responses)
- Image generation API creates 2x resolution (692×190) streak cards for Retina displays
- Success message shows after save (since webview auto-close doesn't work)
- All endpoints tested and functional in Safari

**Braze Setup:**
- All custom attributes created:
  - `morning_streak_hardware`
  - `morning_streak_manual`
  - `morning_streak_start_date`
- Banner campaign successfully displays in Hatch app
- CDI sync active (Redshift → Braze hourly)
- Test user profile populated with all required attributes

**Technical Implementation:**
- Debug logging added to track request flow
- Timeout handling prevents hanging saves
- Proper error messaging for network issues
- Header and close button removed for cleaner webview experience

### ❌ Current Issues

**1. Liquid Personalization in Banner Deep Link**
- **Problem:** Banner deep link passes empty values for all personalization variables
- **Evidence:** Vercel logs show `family=&hardware=&manual=&startDate=`
- **Root Cause:** Using incorrect Liquid syntax for custom attributes
- **Current:** `{{${morning_streak_hardware}}}`
- **Needed:** `{{custom_attribute.${morning_streak_hardware}}}`
- **Impact:** Edit page can't load user data, save updates wrong/no user

**2. Array Length Mismatch**
- **Problem:** Braze attributes show 6 values instead of 7
- **Example:** `morning_streak_hardware: "0,0,0,0,0,0"` (missing 7th day)
- **Impact:** Edit page expects 7 days but receives 6
- **Likely Cause:** Redshift pipeline configuration

**3. Banner Re-entry Configuration**
- **Problem:** Banner doesn't refresh after attribute updates
- **Cause:** "Frequency Capping Rules ON" + "Users not eligible to re-enter"
- **Workaround:** Stop and restart campaign, or switch to Canvas with re-entry enabled

### 🔧 Fixes Needed

**Immediate (Blocks End-to-End Testing):**
1. Update Banner deep link to use `{{custom_attribute.${...}}}` syntax for custom attributes
2. OR switch to Canvas approach with correct Liquid syntax
3. Fix array length to 7 values in Redshift pipeline

**Nice to Have:**
1. Enable Banner re-entry or use Canvas for auto-refresh
2. Test webview auto-close alternatives (currently shows success message)
3. Add native Banner rendering in app (vs. image URL)

### 📝 Testing Status

**Tested & Working:**
- ✅ Direct URL access in Safari (with hardcoded values)
- ✅ Save API → Braze update (confirmed via curl tests)
- ✅ Image generation at 2x resolution
- ✅ Edit page UI and toggle functionality
- ✅ Success/error message display

**Blocked - Needs Banner Personalization Fix:**
- ❌ Banner tap → Edit page with user data
- ❌ Save → Update user's Braze profile
- ❌ Close app → Reopen → See refreshed Banner

**Not Yet Tested:**
- Canvas approach with Banner delivery
- Multi-user pilot (waiting for single-user success)
- Week rollover behavior
- Hardware+manual merge logic in production

### 🎯 Next Steps

**Option A: Fix Campaign (Quick)**
1. Update Banner campaign's web URL with correct Liquid syntax
2. Test Banner tap → Edit with populated data
3. Verify save updates correct user
4. Enable re-entry or create new campaign

**Option B: Switch to Canvas (Recommended)**
1. Create Canvas with Session Start trigger
2. Banner step with correct Liquid syntax
3. Enable immediate re-entry
4. Test complete flow

**Then:**
5. Fix array length to 7 days (coordinate with Redshift team)
6. Test with 1 user end-to-end
7. Expand to 10 pilot users
8. Monitor analytics and iterate

### 📊 Metrics to Track

**Technical:**
- `/edit` page load success rate
- `/api/update-streak` success rate (currently 100%)
- Braze attribute update latency
- Banner impression rate

**User:**
- Banner tap rate
- Edit completion rate
- Days manually added per week
- Week-over-week streak completion

---

**Document Version:** 1.1
**Last Updated:** 2026-05-05
**Status:** In Progress - Blocked on Liquid Personalization
