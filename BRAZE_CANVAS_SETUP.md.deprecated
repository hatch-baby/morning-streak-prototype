# Braze Canvas Setup - Step-by-Step Guide

## Prerequisites

Before starting, ensure you have:
- ✅ `morning_streak_manual` attribute created in Braze
- ✅ Braze API key with `users.track` permission
- ✅ Environment variables added to Vercel
- ✅ Your Vercel domain (e.g., `morning-streak-prototype.vercel.app`)

---

## Part 1: Create Custom Attribute in Braze

### Step 1: Navigate to Custom Attributes
1. Log in to Braze dashboard
2. Go to **Data Settings** (left sidebar)
3. Click **Custom Attributes**

### Step 2: Create New Attribute
1. Click **+ Add Custom Attribute**
2. **Attribute Name:** `morning_streak_manual`
3. **Data Type:** String
4. **Description:** "Parent-edited morning routine days (0/1 array)"
5. Click **Save**

✅ **Verify:** You should see `morning_streak_manual` in your attributes list

---

## Part 2: Generate Braze API Key

### Step 1: Navigate to API Settings
1. Go to **Settings** → **APIs and Identifiers** (left sidebar)
2. Scroll to **REST API Keys** section

### Step 2: Create New API Key
1. Click **+ Create New API Key**
2. **API Key Name:** `Morning Streak Vercel`
3. **Permissions:** Check ONLY `users.track` (or "User Data - Track Users")
4. **IP Whitelist:** Leave blank (or add Vercel IPs if required by your security policy)
5. Click **Save**

### Step 3: Copy Credentials
1. Copy the **API Key** (starts with a long string)
2. Copy your **REST Endpoint** (e.g., `https://rest.iad-01.braze.com`)

✅ **Add to Vercel:**
- Go to Vercel project → Settings → Environment Variables
- Add `BRAZE_API_KEY` = [your API key]
- Add `BRAZE_INSTANCE_URL` = [your REST endpoint]
- Redeploy your app

---

## Part 3: Set Up Canvas

### Step 1: Create New Canvas
1. Go to **Engagement** → **Canvas** (left sidebar)
2. Click **+ Create Canvas**
3. Choose **Canvas Flow** (recommended)

### Step 2: Name Your Canvas
1. **Canvas Name:** `Morning Streak - Pilot`
2. **Description:** "Pilot test of morning routine tracking for 10 users"
3. **Teams/Tags:** (optional, add relevant tags)
4. Click **Create Canvas**

---

## Part 4: Configure Canvas Entry

### Step 1: Entry Schedule
1. Click **Entry Schedule** step
2. **Schedule Type:** Choose **Action-Based**
   - This triggers when user data updates (when Redshift syncs)
3. **Trigger Action:** "Perform Custom Event" → Select "Session Start"
   - OR use "Update User Profile" if available
4. **Re-eligibility:** Check "Users can re-enter this Canvas"
   - **Window:** Every 1 hour (matches Redshift sync)

**Alternative (Scheduled):**
- If action-based isn't working, use **Scheduled Delivery**
- **Send at:** Every day at 6:00 AM (or when parents typically check app)
- **Frequency:** Daily

### Step 2: Entry Audience
1. Click **Entry Audience**
2. **Segment:** Create or select a segment with your 10 pilot users
   - Option A: Create new segment with specific user IDs
   - Option B: Use test tag/attribute to identify pilot users
3. **Filters (critical):**
   - Add filter: `morning_streak_hardware` "is not blank"
   - This ensures only users with streak data see the card
4. Click **Save**

✅ **Verify:** Check "Reachable Users" shows ~10 users

---

## Part 5: Add Content Card Message Step

### Step 1: Add Message Step
1. In Canvas builder, click **+** to add a step after Entry
2. Choose **Message**
3. **Step Name:** "Send Morning Streak Card"

### Step 2: Select Channel
1. Click **+ Add Messaging Channel**
2. Select **Content Card**
3. Click **Done**

### Step 3: Configure Content Card

#### Card Appearance:
1. **Card Type:** Select "Captioned Image" (or "Banner" if captioned isn't available)
2. **Language:** English (or your default)

#### Image Settings:
1. **Image URL:** Paste this (replace `YOUR-VERCEL-DOMAIN`):
   ```
   https://YOUR-VERCEL-DOMAIN/api/streak-card-image?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
   ```

   **Example:**
   ```
   https://morning-streak-prototype.vercel.app/api/streak-card-image?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
   ```

2. **Image Alt Text:** "Morning routine streak progress"

#### Card Content:
1. **Title:** Leave blank (image contains everything)
2. **Description:** Leave blank (image contains everything)
3. **Link Text:** Leave blank

#### On-Click Behavior:
1. **On-Click Behavior:** Select "Redirect to Web URL"
2. **Click Action URL:** Paste this (replace `YOUR-VERCEL-DOMAIN`):
   ```
   https://YOUR-VERCEL-DOMAIN/edit?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
   ```

   **Example:**
   ```
   https://morning-streak-prototype.vercel.app/edit?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
   ```

3. **Open Link In:** Device Browser (or "In-App Browser" if preferred)

#### Card Settings:
1. **Card Pinned:** No (users can dismiss)
2. **Dismissal:** Allow users to dismiss
3. **Expiration:**
   - **Expire card after:** 7 days
   - **Remove at:** Specific time (Monday 12:01 AM - when week rolls over)

### Step 4: Key-Value Pairs (Optional but Recommended)
1. Scroll to **Key-Value Pairs** section
2. Click **+ Add Key-Value Pair**
3. Add these pairs:

   | Key | Value |
   |-----|-------|
   | `type` | `morning_streak` |
   | `family` | `{{${user_id}}}` |
   | `hardware` | `{{${morning_streak_hardware}}}` |
   | `manual` | `{{${morning_streak_manual}}}` |
   | `start_date` | `{{${morning_streak_start_date}}}` |

4. Click **Done**

### Step 5: Delivery Settings
1. **Delivery:** Send immediately when user enters Canvas
2. **Quiet Hours:** Respect quiet hours (optional)
3. **Rate Limiting:** None needed for 10 users

### Step 6: Save Message Step
1. Click **Done** at bottom of message configuration
2. Message step should now show in Canvas flow

---

## Part 6: Configure Canvas Exit

### Step 1: Set Exit Criteria
1. Click **Canvas Settings** (gear icon, top right)
2. Scroll to **Exit Criteria**
3. **Exit Events:**
   - User uninstalls app
   - User opts out of content cards
4. **Exception Events:** None needed

### Step 2: Configure Send Settings
1. **Subscription Status:** Subscribed or Opted-In (to content cards)
2. **Frequency Capping:** None (single card, updates in place)

---

## Part 7: Test & Launch

### Step 1: Test with 1 User First
1. Before launching, click **Test** (top right)
2. Enter a test user ID (one of your 10 pilot users)
3. **Preview:**
   - Check image URL resolves correctly
   - Check click URL is correct
4. **Send Test:**
   - Send test content card to that user
   - Verify they receive it in their app

### Step 2: Verify Test User Experience
1. Open Hatch app as test user
2. Check content card appears with streak image
3. Tap card → verify edit page opens in browser
4. Make edit → Save
5. Return to app → pull to refresh → verify updated image

### Step 3: Launch Canvas
1. Once test succeeds, click **Launch Canvas** (top right)
2. **Final Checklist:**
   - ✅ Entry audience = 10 pilot users
   - ✅ Image URL uses correct Vercel domain
   - ✅ Click URL uses correct Vercel domain
   - ✅ Re-eligibility enabled (1 hour window)
   - ✅ API key permissions verified
3. Click **Launch**

✅ **Canvas is now live!**

---

## Part 8: Monitor & Verify

### Day 1: Check Initial Delivery
1. Go to **Canvas** → **Morning Streak - Pilot**
2. Click **Canvas Details**
3. Check **Entries:** Should show ~10 users entered
4. Check **Messages Sent:** Should show content cards sent

### Throughout Week: Monitor Performance
1. **Canvas Analytics:**
   - **Impressions:** How many users saw the card
   - **Clicks:** How many tapped Edit
   - **Unique Clicks:** Unique users who edited

2. **User Attributes:**
   - Go to **User Search**
   - Find a pilot user
   - Check attributes:
     - `morning_streak_hardware` (from Redshift)
     - `morning_streak_manual` (from Vercel)
     - Both should be populated

3. **Vercel Logs:**
   - Go to Vercel dashboard → Project → Logs
   - Filter for `/api/update-streak`
   - Verify POST requests succeeding (status 200)

---

## Troubleshooting

### Image Doesn't Load in Content Card

**Check 1: Verify Image URL**
1. Copy image URL from Braze
2. Open in browser (replace Liquid tags with real values)
3. Should return an image, not an error

**Example test URL:**
```
https://your-domain.vercel.app/api/streak-card-image?family=test_user&hardware=1,0,0,0,0,0,0&manual=0,0,0,0,0,0,0&startDate=2026-04-28
```

**Check 2: Verify Vercel Deployment**
1. Go to Vercel dashboard
2. Check deployment status = "Ready"
3. Check domain is accessible

**Check 3: Check Liquid Syntax**
- Ensure: `{{${user_id}}}` (double curly braces, dollar sign)
- NOT: `{${user_id}}` or `{{user_id}}`

### Edit Page Doesn't Open

**Check 1: Verify Click URL**
- Test URL in browser with real values
- Should open edit page, not 404

**Check 2: Check Mobile Browser Support**
- Verify "Device Browser" selected in Braze
- Try "In-App Browser" if device browser fails

### Save Button Doesn't Work

**Check 1: Verify Environment Variables**
1. Vercel → Settings → Environment Variables
2. Confirm `BRAZE_API_KEY` and `BRAZE_INSTANCE_URL` set
3. Redeploy if just added

**Check 2: Check API Key Permissions**
- Go to Braze API Settings
- Verify key has `users.track` permission checked

**Check 3: Check Vercel Logs**
1. Vercel dashboard → Logs
2. Filter for errors during save
3. Look for 401 (auth), 403 (permissions), or 500 (server) errors

### Content Card Doesn't Update After Edit

**Check 1: User Needs to Refresh**
- Pull down in app to refresh content cards
- Braze re-evaluates Liquid template with new data

**Check 2: Verify Attribute Updated**
1. Braze User Search → Find user
2. Check `morning_streak_manual` attribute
3. Should show new values after save

**Check 3: Check Re-Eligibility**
- Canvas Settings → Re-eligibility window should allow updates

---

## Quick Reference: URLs to Use in Braze

**Replace `YOUR-VERCEL-DOMAIN` with your actual domain (e.g., `morning-streak-prototype.vercel.app`)**

### Image URL (paste in "Image URL" field):
```
https://YOUR-VERCEL-DOMAIN/api/streak-card-image?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
```

### Click URL (paste in "Click Action URL" field):
```
https://YOUR-VERCEL-DOMAIN/edit?family={{${user_id}}}&hardware={{${morning_streak_hardware}}}&manual={{${morning_streak_manual}}}&startDate={{${morning_streak_start_date}}}
```

---

## Success Checklist

After completing setup, you should have:
- ✅ Content card visible in Hatch app for pilot users
- ✅ Card shows correct streak count and filled days
- ✅ Tapping card opens edit page in browser
- ✅ Edit page shows all 7 days with correct states
- ✅ Save button updates Braze `morning_streak_manual` attribute
- ✅ Returning to app and refreshing shows updated streak

---

**Need Help?** Refer to CONTEXT.md for architecture details and data flow documentation.
