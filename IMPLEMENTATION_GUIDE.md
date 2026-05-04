# Morning Streak - Implementation Guide

## Part 1: Braze Setup (45 minutes)

### Step 1: Create Custom Attributes (2 minutes)

**Navigate to:**
Dashboard → Settings → Manage Settings → Custom Attributes

**Verify these attributes already exist (from Redshift):**
- ✅ `morning_streak_hardware` (or `morning_streak_days` - will be renamed by Redshift team)
- ✅ `morning_streak_start_date`

**Create this ONE new attribute:**

**Attribute Name:** `morning_streak_manual`
- Data Type: String
- Description: Parent manual adds (from Vercel)
- Initial value: `"0,0,0,0,0,0,0"` (all zeros)
- Click "Add Custom Attribute"

**That's it!** Redshift is already syncing the hardware data.

---

### Step 2: Create API Key for Vercel (5 minutes)

**Navigate to:**
Dashboard → Settings → Developer Console → API Keys

**Create new API key:**
1. Click "Create New API Key"
2. Name: `Morning Streak Vercel App`
3. Permissions:
   - ✅ `users.track` (REQUIRED)
   - ❌ Everything else (leave unchecked)
4. Click "Save API Key"

**IMPORTANT: Copy these values immediately:**
```
API Key: braze_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Instance URL: https://rest.iad-01.braze.com
(or your cluster: iad-01, iad-02, iad-03, etc.)
```

**Save these securely** - you'll need them for Vercel deployment.

---

### Step 3: Create Content Card Campaign (30 minutes)

**Navigate to:**
Dashboard → Campaigns → Create Campaign → Content Card

#### Basic Settings

**Campaign Name:** Morning Streak Pilot

**Message Variants:** 1

**Delivery Type:** Scheduled Delivery

---

#### Option A: Image Approach (Faster - Use This First)

**Card Type:** Classic Card

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
*Replace `YOUR-VERCEL-APP` with your actual Vercel domain after deployment*

**Link URL (On-Click Behavior):**
```liquid
https://YOUR-VERCEL-APP.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}
```

**Link Opens In:** Web Browser

---

#### Option B: HTML Approach (After Mobile Team Implements)

**Card Type:** Custom Card with Extras

**Extras (JSON):**
```json
{
  "type": "morning_streak",
  "hardware": "{{custom_attribute.${morning_streak_hardware}}}",
  "manual": "{{custom_attribute.${morning_streak_manual}}}",
  "start_date": "{{custom_attribute.${morning_streak_start_date}}}",
  "family_id": "{{${external_id}}}"
}
```

---

#### Audience (Same for Both Options)

**Target Audience:**
1. Click "Add Filter"
2. Select "Custom Attribute"
3. Choose `morning_streak_hardware`
4. Condition: "is not blank"
5. OR manually create segment with 10 pilot user IDs

**Test Users:**
- Add 1-2 test users first
- Verify card shows correctly
- Then add all 10 pilot users

---

#### Delivery Schedule

**Send Type:** Scheduled Delivery

**Delivery Time:**
- Frequency: Daily
- Time: 8:00 AM
- Timezone: User's local time

**Re-eligibility Settings:**
- Allow users to receive campaign again: Immediately
- Card expires: Never (or 7 days)

**Priority:** High

---

#### Testing (Before Launch)

**Preview:**
1. Click "Preview" in composer
2. Select a test user ID
3. Check:
   - ✅ Image URL is valid (no `undefined`)
   - ✅ Link URL is valid
   - ✅ Liquid variables populated correctly

**Test Send:**
1. Click "Test"
2. Add your test user's external_id
3. Send to device
4. Verify card appears in app

**Common Issues:**
- Image doesn't load → Vercel not deployed yet
- Link has `undefined` → User missing attributes
- Card doesn't appear → User not in audience

---

### Step 4: Launch Campaign

1. Review all settings
2. Click "Launch Campaign"
3. Confirm launch

**Monitor:**
- Dashboard → Analytics → Content Card Performance
- Check impressions, clicks, dismissals

---

## Part 2: Vercel Setup (20 minutes)

### Step 1: Prepare Environment Variables

**You need from Braze (from Part 1, Step 2):**
```
BRAZE_API_KEY=braze_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
BRAZE_INSTANCE_URL=https://rest.iad-01.braze.com
```

---

### Step 2: Deploy to Vercel

**Option A: Deploy via Vercel CLI**

```bash
# Navigate to project
cd /Users/anoushkagarg/CodingProjects/morning-streak-prototype

# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? morning-streak-pilot
# - Directory? ./
# - Override settings? N

# Deploy to production
vercel --prod
```

**Option B: Deploy via Vercel Dashboard**

1. Visit https://vercel.com/new
2. Import Git Repository:
   - Connect GitHub account
   - Select `morning-streak-prototype` repo
   - Click "Import"
3. Configure Project:
   - Project Name: `morning-streak-pilot`
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Click "Deploy"

---

### Step 3: Add Environment Variables

**After deployment, add environment variables:**

1. Go to Vercel dashboard → Your project → Settings → Environment Variables

2. Add these variables:

**Variable 1:**
```
Name: BRAZE_API_KEY
Value: braze_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Environment: Production, Preview, Development
```

**Variable 2:**
```
Name: BRAZE_INSTANCE_URL
Value: https://rest.iad-01.braze.com
Environment: Production, Preview, Development
```

3. Click "Save"

4. **Redeploy** to apply environment variables:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

### Step 4: Note Your Vercel Domain

After deployment, Vercel gives you a URL:
```
https://morning-streak-pilot.vercel.app
```

**OR custom domain if configured:**
```
https://streak.hatchbaby.com
```

**Copy this domain** - you need it for Braze setup!

---

### Step 5: Update Braze Content Card URLs

**Go back to Braze:**
1. Dashboard → Campaigns → Morning Streak Pilot
2. Edit campaign
3. Replace `YOUR-VERCEL-APP` with actual domain:

**Image URL:**
```liquid
https://morning-streak-pilot.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}
```

**Link URL:**
```liquid
https://morning-streak-pilot.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}
```

4. Save changes

---

### Step 6: Test Vercel Endpoints

**Test 1: Image Generation**
```bash
curl "https://morning-streak-pilot.vercel.app/api/streak-card-image?hardware=1,0,1,0,0,0,0&manual=0,1,0,0,0,0,0"
```
Should return a PNG image.

**Test 2: Edit Page**
```bash
open "https://morning-streak-pilot.vercel.app/edit?family=test_user&hardware=1,0,1,0,0,0,0&manual=0,1,0,0,0,0,0&startDate=2026-04-28"
```
Should open browser with edit interface.

**Test 3: Update API**
```bash
curl -X POST "https://morning-streak-pilot.vercel.app/api/update-streak" \
  -H "Content-Type: application/json" \
  -d '{
    "family": "test_user_001",
    "manual": [0,1,0,1,0,0,0]
  }'
```
Should return `{"ok": true}` and update Braze.

---

## Part 3: End-to-End Testing (30 minutes)

### Test 1: Manual Test with Real User

**Prerequisites:**
- One test user in Braze with attributes populated
- Content card campaign running
- Vercel app deployed

**Steps:**
1. Open Hatch app on test device
2. Navigate to content card feed
3. Verify card appears with correct image
4. Tap card → should open Vercel edit page
5. Toggle a day on/off
6. Tap "Save"
7. Wait 5-10 seconds
8. Return to Hatch app
9. Refresh feed
10. Verify card image updated

**Expected Result:**
- ✅ Card shows current streak count
- ✅ Circles filled correctly
- ✅ Edit page opens in browser
- ✅ Can toggle manual days
- ✅ Save updates Braze
- ✅ Card refreshes with new data

---

### Test 2: Hardware Tap Preserves Manual Edit

**Prerequisites:**
- Test user has manual edit (e.g., Tuesday added)

**Steps:**
1. Child taps hardware button (Wednesday)
2. Wait for hourly Redshift sync
3. Check Braze user profile:
   - `morning_streak_hardware` should include Wednesday
   - `morning_streak_manual` should still have Tuesday
4. Open Hatch app
5. Verify content card shows both days

**Expected Result:**
- ✅ Hardware tap added to hardware array
- ✅ Manual edit preserved in manual array
- ✅ Both visible in UI

---

### Test 3: Remove Manual Day

**Steps:**
1. Open edit page
2. Find a manually added day (shows "Added by you" badge)
3. Toggle it OFF
4. Save
5. Refresh content card
6. Verify day removed

**Expected Result:**
- ✅ Manual day can be toggled off
- ✅ Hardware days cannot be toggled (dimmed)
- ✅ Content card updates immediately

---

## Part 4: Monitoring & Troubleshooting

### Monitor Braze

**Content Card Performance:**
- Dashboard → Analytics → Content Card Performance
- Check: Impressions, Clicks, Dismissals

**User Attributes:**
- Dashboard → User Search → Enter external_id
- Check: All 3 attributes populated correctly

---

### Monitor Vercel

**Deployment Logs:**
- Vercel Dashboard → Your Project → Deployments
- Click on deployment → View Function Logs

**Runtime Logs:**
- Check `/api/update-streak` function logs
- Look for errors in Braze API calls

**Common Errors:**
```
Error: Missing BRAZE_API_KEY
→ Add environment variable in Vercel

Error: 401 Unauthorized (Braze)
→ Check API key permissions (needs users.track)

Error: 400 Bad Request (Braze)
→ Check payload format (external_id, attributes)
```

---

### Debug Checklist

**Card not showing:**
- [ ] User has `morning_streak_hardware` attribute
- [ ] User in campaign audience
- [ ] Campaign is Active
- [ ] Check Braze Developer Console → Message Activity Log

**Image not loading:**
- [ ] Vercel app deployed
- [ ] Image URL correct in Braze
- [ ] Test image URL in browser directly
- [ ] Check Vercel function logs

**Edit page broken:**
- [ ] Link URL correct in Braze
- [ ] URL params formatted correctly
- [ ] Check browser console for errors

**Save not working:**
- [ ] BRAZE_API_KEY set in Vercel
- [ ] API key has `users.track` permission
- [ ] Check Vercel function logs for errors
- [ ] Verify Braze user profile updated

---

## Quick Reference

### Braze URLs
```
Dashboard: https://dashboard.braze.com
REST API: https://rest.iad-01.braze.com
```

### Vercel URLs
```
Dashboard: https://vercel.com/dashboard
Your App: https://morning-streak-pilot.vercel.app
```

### Key Endpoints
```
Image: /api/streak-card-image?hardware=...&manual=...
Edit: /edit?family=...&hardware=...&manual=...&startDate=...
Update: /api/update-streak (POST)
```

### Data Format
```
hardware: "1,0,1,0,0,0,0" (comma-separated)
manual: "0,1,0,0,0,0,0" (comma-separated)
start_date: "2026-04-28" (YYYY-MM-DD)
```

---

## Next Steps After Implementation

1. ✅ Test with 1-2 internal users
2. ✅ Fix any issues
3. ✅ Add 10 pilot users to Braze segment
4. ✅ Enable campaign for pilot
5. ✅ Monitor for 1 week
6. ✅ Collect feedback
7. ✅ Iterate or expand

**Good luck!** 🚀
