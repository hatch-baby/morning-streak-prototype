# Morning Streak Prototype - Complete Context

## Overview

A pilot feature (10 users) for tracking children's morning routine completion via hardware button taps AND parent manual edits. Data flows through Redshift → Braze → Hatch App, with a Vercel web app for editing.

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
- Parent opens Hatch app
- App requests content cards from Braze

**Braze sends:**
- Image URL with user's data in query params (via Liquid template)
- Link URL for Edit button

**Hatch app displays:**
- Fetches image from Vercel: `/api/streak-card-image?family=member_12345&hardware=1,0,0,0,0,0,0&manual=0,0,0,0,0,0,0&startDate=2026-04-28`
- Shows streak card with Monday filled (1/7)

### Step 3: Parent Taps "Edit"

**What happens:**
- Parent taps Edit in content card
- Opens browser to Vercel URL

**Vercel receives:**
```
GET /edit?family=member_12345&hardware=1,0,0,0,0,0,0&manual=0,0,0,0,0,0,0&startDate=2026-04-28
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
- Parent closes browser
- Returns to Hatch app
- App refreshes content cards

**Braze sends updated image URL:**
- `/api/streak-card-image?...&hardware=1,0,0,0,0,0,0&manual=0,1,0,0,0,0,0&...`

**Hatch app displays:**
- Streak card showing Monday + Tuesday (2/7)
- Merge logic: `hardware[i] OR manual[i]`

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
- `morning_streak_manual` (String) - Created by you

**API Key:**
- Name: Morning Streak Vercel
- Permission: `users.track`

**Content Card (in Canvas):**
- Type: Captioned Image or Banner
- Image URL: `https://{domain}/api/streak-card-image?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}`
- Click URL: `https://{domain}/edit?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}`

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

### App Doesn't Refresh After Edit
- Parent manually pulls down to refresh content cards
- New image URL fetched with updated data

## Testing Checklist

### Before Launch
- [ ] `morning_streak_manual` attribute exists in Braze
- [ ] Braze API key created with `users.track` permission
- [ ] Environment variables added to Vercel
- [ ] Content card created in Canvas
- [ ] Image URL renders correctly
- [ ] Edit page opens from content card
- [ ] Save button updates Braze attribute
- [ ] Test with 1 pilot user end-to-end

### End-to-End Test Flow
1. Set test user's `morning_streak_hardware` to `"1,0,0,0,0,0,0"`
2. Open Hatch app → verify card shows 1/7 with Monday filled
3. Tap Edit → verify edit page opens with Monday showing "Button-tap"
4. Toggle Tuesday ON → Save
5. Return to app → verify card shows 2/7 (Mon + Tue)
6. Toggle Tuesday OFF → Save
7. Return to app → verify card shows 1/7 (Mon only)

## Success Metrics

**Track in Braze:**
- Content card impressions (how many users see it)
- Content card clicks (how many tap Edit)
- Edit completions (track via Vercel API success)

**Track in Vercel:**
- `/edit` page views
- `/api/update-streak` success rate
- `/api/streak-card-image` requests

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
2. **Image-based card** - Native rendering would be faster (future)
3. **Browser-based edit** - In-app editing would be better UX (future)
4. **Manual refresh needed** - No push notification on update (future)
5. **No rewards/gamification** - Future enhancement

## Future Enhancements (Post-Pilot)

### If Pilot Succeeds
1. Native content card rendering (Mobile team, 1-2 days)
2. In-app edit modal (no browser open)
3. Multi-week history view
4. Push notification on button tap
5. Rewards for streaks (5 days, 7 days, etc.)
6. Parent insights ("Your child is most consistent on Mondays")

### Data Model Evolution
- Store weekly history: `morning_streak_week_1`, `morning_streak_week_2`, etc.
- Track longest streak: `morning_streak_best`
- Completion rate: `morning_streak_completion_pct`

## Support & Debugging

### Common Issues

**Image doesn't load:**
- Check Vercel deployment status
- Verify environment variables set
- Check browser console for 404 or 500 errors

**Edit button doesn't work:**
- Verify Braze API key has `users.track` permission
- Check Vercel logs for API errors
- Confirm `BRAZE_INSTANCE_URL` is correct

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
- Campaign Analytics → Content card performance

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

**Document Version:** 1.0
**Last Updated:** 2026-05-04
**Status:** Ready for Deployment
