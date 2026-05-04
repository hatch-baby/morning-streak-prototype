# What You Need to Build - Quick Checklist

## Assumptions ✅

**Already available (no action needed):**
- ✅ Redshift is syncing `morning_streak_hardware` to Braze (hourly)
- ✅ Redshift is syncing `morning_streak_start_date` to Braze
- ✅ Hardware button tap events are being logged
- ✅ The calculation logic already exists

**What this means:**
You don't need to build anything in Redshift or set up any data pipelines. The hardware data is already flowing to Braze.

---

## What You Actually Need to Build

### 1. Braze Setup (30 minutes total)

#### Task 1.1: Create ONE New Attribute (2 min)
```
Navigate: Dashboard → Settings → Custom Attributes
Click: Add Custom Attribute
Name: morning_streak_manual
Type: String
Default: "0,0,0,0,0,0,0"
```

#### Task 1.2: Generate API Key (3 min)
```
Navigate: Dashboard → Settings → Developer Console → API Keys
Click: Create New API Key
Name: Morning Streak Vercel
Permissions: ✅ users.track only
Copy: API key + Instance URL
```

#### Task 1.3: Create Content Card (25 min)
```
Navigate: Dashboard → Campaigns → Create Campaign → Content Card
Name: Morning Streak Pilot
Type: Classic Card

Title: Morning Routine Progress
Description: Tap to view this week's streak

Image URL:
https://YOUR-APP.vercel.app/api/streak-card-image?hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}

Link URL:
https://YOUR-APP.vercel.app/edit?family={{${external_id}}}&hardware={{custom_attribute.${morning_streak_hardware}}}&manual={{custom_attribute.${morning_streak_manual}}}&startDate={{custom_attribute.${morning_streak_start_date}}}

Audience: Users with morning_streak_hardware attribute
Delivery: Daily at 8am local time
```

---

### 2. Vercel Deployment (15 minutes total)

#### Task 2.1: Deploy App (5 min)
```bash
cd /Users/anoushkagarg/CodingProjects/morning-streak-prototype
vercel --prod
```
OR use Vercel dashboard: https://vercel.com/new

#### Task 2.2: Add Environment Variables (5 min)
```
Go to: Vercel Dashboard → Project → Settings → Environment Variables

Add:
BRAZE_API_KEY = [from Braze Task 1.2]
BRAZE_INSTANCE_URL = https://rest.iad-01.braze.com

Then: Redeploy
```

#### Task 2.3: Update Braze with Domain (5 min)
```
Copy your Vercel URL: https://morning-streak-pilot.vercel.app

Go back to Braze content card
Replace YOUR-APP with actual domain
Save changes
```

---

### 3. Testing (10 minutes)

#### Test 1: Image Loads
```bash
curl "https://your-app.vercel.app/api/streak-card-image?hardware=1,0,1,0,0,0,0&manual=0,1,0,0,0,0,0"
```
Should return PNG image.

#### Test 2: Edit Page Opens
```
Open in browser:
https://your-app.vercel.app/edit?family=test&hardware=1,0,0,0,0,0,0&manual=0,0,0,0,0,0,0&startDate=2026-04-28
```
Should show edit interface.

#### Test 3: Save Works
1. Open edit page
2. Toggle a day
3. Click Save
4. Check Braze user profile → `morning_streak_manual` updated

---

## Total Time Estimate

| Task | Time |
|------|------|
| Braze setup | 30 min |
| Vercel deployment | 15 min |
| Testing | 10 min |
| **Total** | **55 minutes** |

---

## What You Don't Need to Build

❌ Redshift queries (already exist)
❌ Airflow DAGs (already running)
❌ Database schemas (already set up)
❌ Hardware button integration (already works)
❌ CDI configuration (already syncing)

**You're only building:**
1. One new Braze attribute
2. One Braze content card
3. Vercel deployment (code already written)

---

## Files Already Built (No Changes Needed)

✅ `/app/edit/page.tsx` - Edit interface
✅ `/app/api/update-streak/route.ts` - Update API
✅ `/app/api/streak-card-image/route.tsx` - Image generation
✅ All styling and UI components

**The code is done. You just need to deploy and configure.**

---

## Quick Start Command

```bash
# 1. Deploy to Vercel
cd /Users/anoushkagarg/CodingProjects/morning-streak-prototype
vercel --prod

# 2. Note the URL
# Example: https://morning-streak-pilot.vercel.app

# 3. Add environment variables in Vercel dashboard
# BRAZE_API_KEY = [get from Braze]
# BRAZE_INSTANCE_URL = https://rest.iad-01.braze.com

# 4. Set up Braze content card with the URLs above

# Done! 🎉
```

---

## Dependencies

**You need from Redshift team:**
- Confirmation that `morning_streak_hardware` attribute exists in Braze
- Confirmation that `morning_streak_start_date` attribute exists in Braze
- List of 10 pilot user `external_id`s

**That's it!** No code changes or queries needed from Redshift.

---

## After Launch

**Monitor:**
- Braze: Content card impressions/clicks
- Vercel: Function logs for errors
- User feedback: Are manual edits working?

**Expand:**
- If successful after 1 week → expand to more users
- If issues → iterate on pilot group first

---

## Support

**Issues with Braze:**
- Check user has `morning_streak_hardware` attribute
- Verify campaign is Active
- Check Braze Message Activity Log

**Issues with Vercel:**
- Check environment variables set correctly
- Check function logs for errors
- Verify API key has `users.track` permission

**Data not syncing:**
- This is on Redshift side (already working)
- You only control `morning_streak_manual` (from Vercel)
