# Braze Team - Morning Streak Pilot Setup

## TL;DR

Create 1 new attribute, set up 1 content card, generate 1 API key. **~45 minutes total.**

---

## What You Need to Do

### Task 1: Create New Custom Attribute (2 minutes)

**Create this ONE new attribute:**

| Attribute Name | Data Type | Source | Description |
|---|---|---|---|
| `morning_streak_manual` | String | Vercel | Parent manual adds: "0,1,0,0,0,0,0" |

**You already have these (no changes needed):**
- ✅ `morning_streak_start_date` (from Redshift)
- ✅ `morning_streak_days` (from Redshift - will be renamed to `morning_streak_hardware`)

**Steps:**
1. Dashboard → Settings → Manage Settings → Custom Attributes
2. Click "Add Custom Attribute"
3. Name: `morning_streak_manual`
4. Type: String
5. Save

**Initial Value:** `"0,0,0,0,0,0,0"` (all zeros until parent makes first edit)

---

### Task 2: Create Content Card (30 minutes)

**Campaign Name:** Morning Streak Pilot

**Card Type:** Classic Card with Image

**Title:**
```
Morning Routine Progress
```

**Description:**
```
Tap to view this week's streak
```

**Image URL:**
```liquid
https://YOUR-VERCEL-APP.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}
```
*Note: Replace `YOUR-VERCEL-APP` with actual Vercel domain after deployment*

**Link URL (On-Click Behavior):**
```liquid
https://YOUR-VERCEL-APP.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}
```
*Note: Points to `/edit` so tapping the content card opens editing page directly*

**Audience:**
- Create new segment: "Morning Streak Pilot Users"
- Criteria: External ID in list (10 member IDs - we'll provide)
- Or use Custom Attribute filter if easier

**Delivery:**
- Send type: Action-Based or Recurring
- Trigger: User opens app (or daily at 8am)
- Re-eligibility: Immediate (card can update throughout day)
- Expiration: 24 hours

**Card Display Settings:**
- Show on: In-app message feed
- Priority: High
- Max dismissals: 999 (user can't dismiss permanently)

---

### Task 3: Generate API Key (5 minutes)

Vercel needs to write to `morning_streak_manual` attribute.

**Steps:**
1. Dashboard → Settings → API Keys
2. Click "Create New API Key"
3. Name: `Morning Streak Vercel App`
4. Permissions:
   - ✅ `users.track` (REQUIRED)
   - ❌ All others (not needed)
5. Save API key securely
6. **Provide to web team:**
   - API Key: `braze-xxxx-xxxx-xxxx`
   - Instance URL: `https://rest.iad-01.braze.com` (or your cluster)

---

## Data Flow Explanation

### Two Separate Arrays = No Conflicts

**Redshift writes:**
```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,0,1,0,0,0,0",  // Hardware button taps
  morning_streak_start_date: "2026-04-28"
}
```

**Vercel writes:**
```javascript
{
  external_id: "member_12345",
  morning_streak_manual: "0,1,0,0,0,0,0"     // Parent manual adds
}
```

**Braze stores both:**
```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,0,1,0,0,0,0",  // Mon, Wed (hardware)
  morning_streak_manual: "0,1,0,0,0,0,0",    // Tue (manual)
  morning_streak_start_date: "2026-04-28"
}
```

**App displays merged:**
- Mon ✓ (hardware)
- Tue ✓ (manual)
- Wed ✓ (hardware)
- Result: 3/7 days complete

---

## Testing

### Test 1: Preview Content Card

**Create test user:**
```javascript
{
  external_id: "test_user_001",
  morning_streak_hardware: "1,1,1,0,0,0,0",
  morning_streak_manual: "0,0,0,1,0,0,0",
  morning_streak_start_date: "2026-04-28"
}
```

**Preview card:**
1. Use "Preview" in campaign builder
2. Select test user
3. Verify image loads (shows 4 circles filled: Mon, Tue, Wed, Thu)
4. Click "View Link" → opens Vercel app

### Test 2: Live Test (after Vercel deployed)

1. Open Hatch app on pilot user device
2. Check content card appears in feed
3. Tap card → opens Vercel web page
4. Verify data displays correctly
5. Tap "Edit streaks" → toggle a day
6. Save
7. Wait 5 seconds → refresh feed
8. Content card image updates ✅

---

## Liquid Template Variables

**Available for use:**

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{${external_id}}}` | "member_12345" | User's member ID |
| `{{custom_attribute.${morning_streak_hardware}}}` | "1,0,1,0,0,0,0" | Hardware taps |
| `{{custom_attribute.${morning_streak_manual}}}` | "0,1,0,0,0,0,0" | Manual adds |
| `{{custom_attribute.${morning_streak_start_date}}}` | "2026-04-28" | Week start |

**Format:**
- Both arrays are 7 comma-separated values
- Position 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
- `1` = completed, `0` = not completed

---

## Common Issues & Solutions

### Issue: Image not loading in card

**Causes:**
- Vercel app not deployed yet
- Wrong domain in image URL
- Custom attributes not populated

**Solution:**
1. Test image URL in browser directly
2. Check user profile has both `hardware` and `manual` attributes
3. Verify Vercel domain is correct

### Issue: Card not showing for pilot user

**Causes:**
- User not in segment
- Attributes missing or wrong format
- Card hasn't been launched

**Solution:**
1. Check User Search → verify user in segment
2. Check custom attributes are populated
3. Verify campaign is Active

### Issue: Link opens but shows 0/7 days

**Causes:**
- URL params not passing correctly
- Custom attributes are empty strings

**Solution:**
1. Check Liquid template syntax
2. Initialize pilot users with `"0,0,0,0,0,0,0"` if attributes are null

---

## Rollout Plan

**Day 1:** Setup (Braze tasks above)
**Day 5:** Vercel deployed, update card URLs with real domain
**Week 2:** Launch to 10 pilot users
**Week 3:** Expand based on feedback

---

## Monitoring

**Metrics to track:**
- Content card impressions (daily)
- Content card clicks (CTR)
- API calls to `/users/track` (from Vercel)
- Error rate in Braze logs

**Target for pilot:**
- 80%+ users see card daily
- 30%+ CTR on card
- <5% API error rate

---

## Support Contacts

Questions about this setup?
- **Product:** product-team@company.com
- **Web team (Vercel API):** web-team@company.com
- **Redshift (data sync):** data-eng@company.com

---

## Appendix: Connected Content (Alternative)

If you want to cache the image, use Connected Content:

```liquid
{% connected_content
  https://YOUR-APP.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}
  :cache_max_age 300
  :save card_image
%}
{{card_image.url}}
```

**Note:** This adds latency. Direct URL is simpler for pilot.

---

**Status:** Ready to implement
**Estimated effort:** 45 minutes
**Risk:** Low (standard Braze content card setup)
