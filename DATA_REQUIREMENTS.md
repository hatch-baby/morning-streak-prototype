# Morning Streak Feature - Data Requirements

## Executive Summary

**Purpose:** Enable parents to track their child's morning routine completion via a Braze content card that displays a visual weekly streak.

**Teams Involved:**
- **Redshift Engineering:** Calculate and prepare streak data
- **Braze Team:** Configure user attributes and content cards
- **Web Team:** Maintain Vercel application for editing streaks

---

## Data Requirements by Attribute

### 1. `external_id` (Member ID)

**What:** Unique identifier for each family/user account

**How:**
- Use existing `member_id` from your user database
- Map to Braze's `external_id` field in CDI sync

**Why:**
- Links streak data to correct user account
- Enables cross-platform tracking (app + web)
- Required for Braze User Track API updates

**Example:** `"member_12345"`

**Data Type:** String

**Source:** Existing user table in Redshift

---

### 2. `morning_streak_days`

**What:** Which days of the week the child completed their morning routine

**How:**
- 7 comma-separated values (0 or 1)
- Position 0 = Monday, Position 1 = Tuesday, ... Position 6 = Sunday
- `1` means completed, `0` means not completed
- Query button tap events from Redshift for current week
- Week starts Monday, resets weekly

**Why:**
- Displays accurate visual progress (which specific days are complete)
- Supports parent editing (can retroactively add/remove days)
- Handles cases where child misses hardware tap but parent adds manually
- Enables 128 possible completion patterns (not just a count)

**Example:** `"1,1,1,0,0,0,0"` means Monday, Tuesday, Wednesday complete

**Data Type:** String (not array - easier for Liquid templating)

**Format:** Exactly 7 values, comma-separated, no spaces

**Calculation:**
```sql
-- For each day of current week (Mon-Sun)
CASE
  WHEN EXISTS(
    SELECT 1 FROM button_taps
    WHERE user_id = u.user_id
      AND DATE(timestamp) = week_start + interval '0 days'
      AND status = 'completed'
  ) THEN 1
  ELSE 0
END AS monday_done
-- Repeat for Tue (+1 day), Wed (+2 days), etc.
```

---

### 3. `morning_streak_auto`

**What:** Which completed days were logged automatically via hardware button vs. manually added by parent

**How:**
- 7 comma-separated values (0 or 1)
- Matches positions of `morning_streak_days`
- `1` means auto-logged (hardware button tap), `0` means manually added
- Query button tap source: `source = 'hardware_button'` vs. `source = 'manual'`

**Why:**
- Differentiates organic behavior (child pressed button) from parent intervention
- Displays "Button Tap" badge in UI for auto-logged days
- Product analytics: measure hardware button adoption rate
- Helps parents see which days child independently completed routine

**Example:** `"1,1,1,0,0,0,0"` with days `"1,1,1,1,0,0,0"` means:
- Mon/Tue/Wed: Auto-logged via button
- Thursday: Manually added by parent

**Data Type:** String

**Format:** Exactly 7 values, matches length of `morning_streak_days`

**Business Value:** Understand engagement with physical hardware vs. app-only usage

---

### 4. `morning_streak_count`

**What:** Total number of completed days this week (0-7)

**How:**
- Sum of 1's in `morning_streak_days`
- Can be calculated in Redshift or derived client-side
- We send it to reduce client-side processing

**Why:**
- Quick display of progress ("3 of 7 days")
- Enables Braze segmentation: "users with count >= 5" (goal hit)
- Supports conditional messaging: different copy for 0, 1-4, 5-6, 7 days
- Used for push notification triggers

**Example:** `3` (if three days are complete)

**Data Type:** Integer (Number in Braze)

**Range:** 0-7

**Calculation:**
```sql
(day_0 + day_1 + day_2 + day_3 + day_4 + day_5 + day_6) AS morning_streak_count
```

---

### 5. `morning_streak_labels`

**What:** Day-of-week labels to display under each circle (Mon, Tue, Wed, etc.)

**How:**
- 7 comma-separated day abbreviations
- Always: `"Mon,Tue,Wed,Thu,Fri,Sat,Sun"`
- Currently static, but extensible for internationalization later

**Why:**
- Users need to know which day corresponds to which circle
- Critical for parent editing: "I know she did it Wednesday"
- Supports future i18n: Spanish = "Lun,Mar,Mié,Jue,Vie,Sáb,Dom"
- Handles edge cases like: "What if week starts Sunday in some regions?"

**Example:** `"Mon,Tue,Wed,Thu,Fri,Sat,Sun"`

**Data Type:** String

**Current Value:** Always the same for US customers, but sent via CDI for consistency

**Future Enhancement:** Localize based on user language preference

---

### 6. `morning_streak_start_date`

**What:** The Monday of the current week (week start date)

**How:**
- Calculate: `DATE_TRUNC('week', CURRENT_DATE)::date`
- ISO format: `YYYY-MM-DD`
- Week starts on Monday (per ISO 8601)

**Why:**
- Anchors the streak to a specific calendar week
- Enables "Week of April 28" display in UI
- Critical for parent editing: "Which week am I looking at?"
- Supports historical tracking: "Show me last week's streak"
- Handles data freshness: if date is old, prompt sync

**Example:** `"2026-04-28"` (the Monday of that week)

**Data Type:** String (ISO date)

**Format:** `YYYY-MM-DD`

**Business Use Case:** Parents often ask "Is this for last week or this week?"

---

### 7. `child_name` (Optional but Recommended)

**What:** Child's first name for personalization

**How:**
- Query from existing user/child profile table
- First name only (no last name for privacy)

**Why:**
- Personalized content card: "Lila's morning routine"
- Friendly messaging: "Ready to start Lila's first morning routine?"
- Increased engagement through personalization
- Multi-child support: Future can show multiple cards per family

**Example:** `"Lila"`

**Data Type:** String

**Privacy:** First name only, no PII beyond what's already in Braze

---

## Data Freshness & Sync Strategy

### Sync Frequency

**Recommendation:** Hourly

**Why Hourly:**
- Balance between real-time updates and system load
- Most parents check in evening (not minute-by-minute)
- Reduces Braze API costs (vs. real-time streaming)
- Matches existing Airflow batch job cadence

**Alternative:** Real-time via event stream (if critical)

### Data Retention

- **Current week:** Always fresh, updated hourly
- **Historical weeks:** Archive for analytics (not sent to Braze)
- **Reset behavior:** Monday 00:00 UTC, all values reset to "0,0,0,0,0,0,0"

---

## Example: Full User Record

```json
{
  "external_id": "member_12345",
  "morning_streak_days": "1,1,1,1,0,0,0",
  "morning_streak_auto": "1,1,1,0,0,0,0",
  "morning_streak_count": 4,
  "morning_streak_labels": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  "morning_streak_start_date": "2026-04-28",
  "child_name": "Lila"
}
```

**Interpretation:**
- Week of April 28, 2026
- 4 days completed: Monday, Tuesday, Wednesday, Thursday
- First 3 days auto-logged (button tap)
- Thursday manually added by parent
- Child's name is Lila

---

## Business Context by User Segment

### New Users (Day 0)
```json
{
  "morning_streak_count": 0,
  "morning_streak_days": "0,0,0,0,0,0,0",
  "morning_streak_auto": "0,0,0,0,0,0,0"
}
```
**Message:** "Ready to start your first morning routine?"

### Goal Hit (5+ days)
```json
{
  "morning_streak_count": 5
}
```
**Message:** "Goal hit! 5 of 7 days done!"
**Badge:** Green border, checkmark icon

### Perfect Week (7 days)
```json
{
  "morning_streak_count": 7,
  "morning_streak_days": "1,1,1,1,1,1,1"
}
```
**Message:** "Perfect week! 🏆"
**Reward:** Special confetti animation, trophy badge

---

## Analytics & Reporting Use Cases

### Product Analytics (via Braze)
- Segment: Users with `morning_streak_count >= 5` (weekly)
- Retention: Avg `morning_streak_count` per user (28-day rolling)
- Feature adoption: % of days that are `auto = 1` (hardware engagement)

### Marketing Campaigns
- Re-engagement: Users with `morning_streak_count = 0` for 2+ weeks
- Celebration: Push notification when count hits 7
- Upsell: Users with perfect weeks → promote related products

### Business Intelligence
- Weekly completion rate by cohort
- Hardware button tap rate (auto vs. manual)
- Parent editing behavior (manual adds after missed days)

---

## Data Quality Requirements

### Required Validations

| Attribute | Validation | Error Handling |
|---|---|---|
| `morning_streak_days` | Exactly 7 values, only 0 or 1 | Skip user, log error |
| `morning_streak_auto` | Matches length of `_days` | Default to all 0's |
| `morning_streak_count` | Integer 0-7 | Recalculate from `_days` |
| `morning_streak_labels` | Exactly 7 values | Use default "Mon,Tue,..." |
| `morning_streak_start_date` | Valid ISO date | Use current week start |

### Data Integrity Checks

- `morning_streak_count` should equal sum of `morning_streak_days`
- `morning_streak_auto` can only be 1 where `morning_streak_days` is 1
- `morning_streak_start_date` should be a Monday

---

## Implementation Checklist

### For Redshift Engineering Team
- [ ] Create query to calculate 7-day completion array
- [ ] Distinguish auto vs. manual source for each day
- [ ] Calculate sum (count) for quick access
- [ ] Add week start date (Monday)
- [ ] Schedule Airflow job (hourly)
- [ ] Set up CDI connection to Braze
- [ ] Add data quality validations
- [ ] Test with 5-10 sample users

### For Braze Team
- [ ] Create custom attributes (7 attributes)
- [ ] Configure data types (String vs. Number)
- [ ] Set up CDI sync from Redshift
- [ ] Create content card template
- [ ] Configure Connected Content for image
- [ ] Set up audience segmentation rules
- [ ] Test Liquid templating with sample data
- [ ] Enable API key for `users.track` permission

### For Web Team
- [ ] Deploy Vercel app with env variables
- [ ] Test `/api/streak-card-image` endpoint
- [ ] Test `/api/update-streak` endpoint
- [ ] Verify Braze API integration works
- [ ] Test end-to-end parent editing flow

---

## Questions & Answers

**Q: Why send labels if they're always the same?**
A: Future-proofing for i18n (Spanish, French, etc.) and regional week start differences (Sunday vs. Monday).

**Q: Why string format instead of JSON array?**
A: Braze Liquid templating works better with comma-separated strings. Arrays require loops and are harder to pass in URLs.

**Q: Why hourly sync instead of real-time?**
A: Most parents check once per day (evening). Hourly is fresh enough, reduces costs, and fits existing ETL patterns.

**Q: What if a user has multiple children?**
A: Current design: one streak per member (primary child). Future: add `child_id` dimension and send multiple records.

**Q: How do we handle timezones?**
A: Week start is in user's local timezone. Redshift query should use user's timezone_offset to calculate correct Monday.

**Q: What happens when the week resets?**
A: Monday 00:00 (user's local time), all fields reset to 0's. Airflow job should detect new week and reset values.

---

## Success Metrics

**Launch Goals (Week 1):**
- 90%+ CDI sync success rate
- <500ms image generation latency
- <5% API error rate on manual edits
- 50%+ content card click-through rate

**Long-term (Month 1):**
- 60%+ of users complete 5+ days/week
- 30%+ of completions are auto-logged (hardware button)
- <10% of weeks have parent edits (indicates good button tap habit)

---

**Document Owner:** Product Team
**Technical Reviewers:** Data Engineering, Braze Team, Web Team
**Last Updated:** 2026-05-04
**Version:** 1.0
