# Braze Integration Setup Guide

## Overview
This guide covers the complete setup for integrating the Morning Streak feature with Braze, including Cloud Data Ingestion (CDI), content cards, and dynamic image generation.

## Architecture Flow

```
Hardware Button Tap
    ↓
Hatch Database
    ↓
Redshift Data Warehouse
    ↓
Airflow ETL Job (hourly) → Braze Cloud Data Ingestion (CDI)
    ↓
Braze User Attributes Updated
    ↓
Content Card Displayed in App (with Connected Content for image)
    ↓
User Taps Card → Opens Vercel Web App
    ↓
User Edits Streak → Web App Updates Braze via REST API
```

## Part 1: Braze User Attributes Setup

### Required Attributes

Configure these custom attributes in Braze for each user (member):

```javascript
{
  // User identifier (required)
  external_id: "member_12345",          // Member ID from your system

  // Streak data (required)
  morning_streak_days: "1,1,1,0,0,0,0", // Comma-separated: 1=done, 0=not done
  morning_streak_auto: "1,1,1,0,0,0,0", // Comma-separated: 1=auto, 0=manual
  morning_streak_count: 3,               // Integer: total completed days

  // Display data (required)
  morning_streak_labels: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", // Day labels
  morning_streak_start_date: "2026-04-28",               // Week start (Monday)

  // Personalization (optional)
  child_name: "Lila"                    // Child's first name
}
```

### Attribute Types in Braze Dashboard

| Attribute Name | Type | Description |
|---|---|---|
| `morning_streak_days` | String | Comma-separated 0/1 values |
| `morning_streak_auto` | String | Comma-separated 0/1 values |
| `morning_streak_count` | Number | Integer 0-7 |
| `morning_streak_labels` | String | Comma-separated day abbreviations |
| `morning_streak_start_date` | String | ISO date format YYYY-MM-DD |
| `child_name` | String | First name only |

## Part 2: Airflow + CDI Configuration

### 2.1 Redshift Query

Your Airflow job should run this query (hourly) to calculate streak data:

```sql
WITH streak_data AS (
  SELECT
    member_id,
    child_name,
    DATE_TRUNC('week', CURRENT_DATE)::date AS week_start,
    -- Calculate which days were completed (0 or 1 for each day)
    CASE WHEN EXISTS(
      SELECT 1 FROM button_taps
      WHERE user_id = members.user_id
        AND DATE(timestamp) = week_start
    ) THEN 1 ELSE 0 END AS day_0_done,
    -- Repeat for days 1-6...

    -- Calculate which were auto-logged
    CASE WHEN EXISTS(
      SELECT 1 FROM button_taps
      WHERE user_id = members.user_id
        AND DATE(timestamp) = week_start
        AND source = 'hardware_button'
    ) THEN 1 ELSE 0 END AS day_0_auto
    -- Repeat for days 1-6...
  FROM members
)
SELECT
  member_id AS external_id,
  CONCAT(day_0_done, ',', day_1_done, ',', day_2_done, ',',
         day_3_done, ',', day_4_done, ',', day_5_done, ',', day_6_done) AS morning_streak_days,
  CONCAT(day_0_auto, ',', day_1_auto, ',', day_2_auto, ',',
         day_3_auto, ',', day_4_auto, ',', day_5_auto, ',', day_6_auto) AS morning_streak_auto,
  (day_0_done + day_1_done + day_2_done + day_3_done +
   day_4_done + day_5_done + day_6_done) AS morning_streak_count,
  'Mon,Tue,Wed,Thu,Fri,Sat,Sun' AS morning_streak_labels,
  week_start AS morning_streak_start_date,
  child_name
FROM streak_data
```

### 2.2 CDI Configuration

In Braze Cloud Data Ingestion:

1. **Data Source:** Redshift
2. **Sync Schedule:** Hourly (or match your Airflow schedule)
3. **Primary Key:** `external_id` (maps to member_id)
4. **Sync Type:** Upsert (update existing users)
5. **Columns to Sync:** All attributes listed above

## Part 3: Content Card Configuration

### 3.1 Create Content Card in Braze

**Card Type:** Classic Card (with image)

**Title:**
```liquid
{{custom_attribute.${child_name}}}'s Morning Routine
```

**Description:**
```liquid
{{custom_attribute.${morning_streak_count}}} of 7 days complete this week
```

**Image URL (using Connected Content):**
```liquid
{% connected_content
  https://YOUR-VERCEL-APP.vercel.app/api/streak-card-image?days={{custom_attribute.${morning_streak_days}}}&auto={{custom_attribute.${morning_streak_auto}}}&name={{custom_attribute.${child_name}}}&labels={{custom_attribute.${morning_streak_labels}}}
  :cache_max_age 300
  :save card_response
%}
{{card_response.url}}
```

**Note:** Since the API returns the image directly, use the endpoint URL as the image source:
```
https://YOUR-VERCEL-APP.vercel.app/api/streak-card-image?days={{custom_attribute.${morning_streak_days}}}&auto={{custom_attribute.${morning_streak_auto}}}&name={{custom_attribute.${child_name}}}&labels={{custom_attribute.${morning_streak_labels}}}
```

**Link URL (deep link to web app):**
```liquid
https://YOUR-VERCEL-APP.vercel.app/streak?family={{${user_id}}}&name={{custom_attribute.${child_name}}}&days={{custom_attribute.${morning_streak_days}}}&auto={{custom_attribute.${morning_streak_auto}}}&labels={{custom_attribute.${morning_streak_labels}}}
```

### 3.2 Card Delivery Settings

**Audience:**
- Users with `morning_streak_count` greater than 0
- Or all users if you want to show Day 0 state

**Delivery:**
- Triggered: When `morning_streak_count` changes
- Or Scheduled: Daily refresh

**Re-eligibility:**
- Users can receive this card multiple times

## Part 4: Vercel Deployment

### 4.1 Environment Variables

Set these in Vercel Project Settings → Environment Variables:

```bash
BRAZE_API_KEY=your-braze-rest-api-key-here
BRAZE_INSTANCE_URL=https://rest.iad-01.braze.com
```

**Finding your Braze instance URL:**
- Check your Braze dashboard URL
- Common values:
  - US-01: `https://rest.iad-01.braze.com`
  - US-02: `https://rest.iad-02.braze.com`
  - US-03: `https://rest.iad-03.braze.com`
  - EU-01: `https://rest.fra-01.braze.eu`

### 4.2 Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add morning streak feature with day labels"
git push origin main

# Import in Vercel dashboard
# 1. Visit vercel.com/new
# 2. Import your GitHub repository
# 3. Add environment variables (step 4.1)
# 4. Deploy
```

### 4.3 Test the Deployment

Test the image endpoint:
```
https://YOUR-APP.vercel.app/api/streak-card-image?days=1,1,1,0,0,0,0&auto=1,1,1,0,0,0,0&name=Lila&labels=Mon,Tue,Wed,Thu,Fri,Sat,Sun
```

Test the streak page:
```
https://YOUR-APP.vercel.app/streak?family=demo&name=Lila&days=1,1,1,0,0,0,0&auto=1,1,1,0,0,0,0&labels=Mon,Tue,Wed,Thu,Fri,Sat,Sun
```

## Part 5: Testing the Complete Flow

### 5.1 Manual Testing Checklist

**CDI Data Flow:**
- [ ] Airflow job runs successfully
- [ ] Data appears in Braze user profiles
- [ ] Attributes have correct format (check one test user)

**Content Card Display:**
- [ ] Card appears in Hatch app
- [ ] Image loads correctly
- [ ] Day labels show correct days (Mon-Sun)
- [ ] Completed days show darker blue
- [ ] Count matches actual completions

**Web App Flow:**
- [ ] Tapping card opens Vercel app
- [ ] Correct data displays on /streak page
- [ ] Day labels match Braze data
- [ ] "Edit streaks" button works
- [ ] Can toggle days on/off on /edit page
- [ ] Saving updates Braze successfully
- [ ] Content card reflects changes after refresh

### 5.2 Test User States

Create test users with different states:

**Day 0 (new user):**
```
days: "0,0,0,0,0,0,0"
auto: "0,0,0,0,0,0,0"
count: 0
```

**Day 3 (partial week, all auto):**
```
days: "1,1,1,0,0,0,0"
auto: "1,1,1,0,0,0,0"
count: 3
```

**Day 5 (goal hit, mix of auto + manual):**
```
days: "1,1,1,1,1,0,0"
auto: "1,1,1,0,0,0,0"
count: 5
```

**Day 7 (perfect week):**
```
days: "1,1,1,1,1,1,1"
auto: "1,1,1,1,1,1,1"
count: 7
```

## Part 6: Monitoring & Troubleshooting

### 6.1 Key Metrics to Monitor

- CDI sync success rate (Braze dashboard)
- Content card impressions
- Content card clicks
- API error rates (`/api/update-streak` failures)
- Image generation latency

### 6.2 Common Issues

**Issue:** Content card not showing
- Check user has `morning_streak_count` attribute set
- Verify audience targeting rules
- Check card hasn't been dismissed

**Issue:** Image not loading
- Verify Vercel deployment is live
- Check Connected Content cache settings
- Test image URL directly in browser
- Check for special characters in names/labels

**Issue:** Data not syncing from Redshift
- Verify CDI connection status
- Check Airflow job logs
- Verify external_id matches between systems

**Issue:** Edit page not saving
- Check Braze API key permissions (needs `users.track`)
- Verify BRAZE_INSTANCE_URL is correct
- Check browser console for errors

## Part 7: Future Enhancements

Potential improvements:
- Add push notifications when streak is broken
- Weekly summary email
- Multiple children per family
- Longer streak history (beyond 7 days)
- Rewards/badges for perfect weeks
- Social sharing features

## Support

For questions or issues:
- Vercel deployment issues: Check Vercel logs
- Braze configuration: Check Braze Message Activity Log
- API errors: Check Vercel Function logs
- Data pipeline: Check Airflow task logs

---

**Version:** 1.0
**Last Updated:** 2026-05-04
**Maintainer:** Hatch Team
