# Team Responsibilities - Who Does What

## TL;DR

| Team | Already Done ✅ | Need to Do 🔨 | Time |
|------|----------------|---------------|------|
| **Redshift** | Everything | Nothing | 0 min |
| **You (Braze + Vercel)** | Code written | Deploy & configure | 55 min |
| **Mobile** | Nothing | Nothing (for pilot) | 0 min |

---

## Redshift Team: Already Done ✅

**What they're already doing:**
- ✅ Calculating `morning_streak_hardware` from button tap events
- ✅ Syncing to Braze hourly via Airflow → CDI
- ✅ Sending `morning_streak_start_date` (current week's Monday)
- ✅ Handling week rollovers

**What they send to Braze:**
```javascript
{
  external_id: "member_12345",
  morning_streak_hardware: "1,0,1,0,0,0,0",
  morning_streak_start_date: "2026-04-28"
}
```

**What they need to do for pilot:**
- Nothing! (Just confirm it's working)
- Optional: Rename `morning_streak_days` → `morning_streak_hardware` for clarity

**Time: 0 minutes** (or 5 min for optional rename)

---

## You (Web Team): Braze + Vercel 🔨

### What's Already Done ✅

**Code written:**
- ✅ `/app/edit/page.tsx` - Edit interface
- ✅ `/app/api/update-streak/route.ts` - Braze update API
- ✅ `/app/api/streak-card-image/route.tsx` - Image generation
- ✅ All UI components and styling

**What you need to do:**

### Braze Setup (30 min)

1. **Create 1 attribute** (2 min)
   - `morning_streak_manual` (String)

2. **Generate API key** (3 min)
   - Name: Morning Streak Vercel
   - Permission: `users.track`
   - Copy key + instance URL

3. **Create content card** (25 min)
   - Classic card with image + link
   - Use Liquid templates for dynamic data
   - Target pilot users

### Vercel Setup (15 min)

1. **Deploy app** (5 min)
   ```bash
   vercel --prod
   ```

2. **Add env vars** (5 min)
   - `BRAZE_API_KEY`
   - `BRAZE_INSTANCE_URL`

3. **Update Braze URLs** (5 min)
   - Replace placeholder with real domain

### Testing (10 min)

1. Test image loads
2. Test edit page opens
3. Test save updates Braze

**Total: 55 minutes**

---

## Mobile Team: Nothing (For Pilot) ✅

**What they need to do:**
- Nothing! Content cards already work in Hatch app

**Why:**
- Braze content cards display automatically
- Using image approach (no custom rendering needed)
- Edit page opens in browser (no in-app changes)

**Future (if pilot succeeds):**
- Implement custom HTML content card renderer
- Better performance and offline support
- Estimated: 1-2 days work

**For pilot: 0 minutes**

---

## What Each System Owns

### Redshift Owns (Already Working)
```
morning_streak_hardware: "1,0,1,0,0,0,0"
morning_streak_start_date: "2026-04-28"
```

**Rules:**
- Writes hourly via Airflow
- Never touches `morning_streak_manual`
- Source: Database button tap events

### Vercel Owns (You're Building This)
```
morning_streak_manual: "0,1,0,0,0,0,0"
```

**Rules:**
- Writes immediately when parent saves
- Never touches `morning_streak_hardware`
- Source: Parent edits in web app

### Braze Owns (Storage Only)
```
{
  morning_streak_hardware: "1,0,1,0,0,0,0",
  morning_streak_manual: "0,1,0,0,0,0,0",
  morning_streak_start_date: "2026-04-28"
}
```

**Rules:**
- Stores both arrays separately
- Source of truth
- Never modifies data (just stores)

### Hatch App Owns (Display Only)
```
Merged view: [1,1,1,0,0,0,0]
Count: 3/7
```

**Rules:**
- Reads from Braze
- Merges: `hardware[i] OR manual[i]`
- Never writes data

---

## Data Flow Ownership

```
Hardware Button → Database → Redshift → Braze
                                         ↓
                                    Hatch App
                                    (displays)
                                         ↓
                                    Parent taps Edit
                                         ↓
                                    Vercel App → Braze
                                         ↓
                                    Hatch App
                                    (refreshes)
```

**Clear boundaries:**
- Redshift → Braze (hardware only)
- Vercel → Braze (manual only)
- No system touches the other's data

---

## Communication Needed

### From Redshift Team (One Time)

**Need to confirm:**
1. ✅ `morning_streak_hardware` attribute exists in Braze?
   - OR: Is it currently named `morning_streak_days`?
2. ✅ What's the hourly sync schedule?
3. ✅ Can we get a list of 10 pilot user `external_id`s?

**That's it!** No code changes or new queries.

### From Mobile Team (One Time)

**Need to confirm:**
1. ✅ Content cards already display in Hatch app?
2. ✅ Links from content cards open in browser?

**That's it!** No app updates needed for pilot.

---

## Risk Assessment

| Risk | Mitigation | Owner |
|------|------------|-------|
| Redshift overwrites manual edits | Separate fields (`hardware` vs `manual`) | Architecture |
| Hardware taps not syncing | Already working (no changes) | Redshift |
| Content card doesn't appear | Test with 1 user first | You |
| Vercel API fails | Check logs, retry logic built in | You |
| Week rollover breaks | Both systems reset to zeros | Redshift + You |

**Biggest risk mitigation:**
- Separate storage means NO CONFLICTS
- Each system owns one field
- Can't accidentally overwrite each other

---

## Launch Checklist

### Redshift Team
- [ ] Confirm `morning_streak_hardware` syncing to Braze
- [ ] Provide 10 pilot user IDs

### You (Web Team)
- [ ] Create `morning_streak_manual` attribute in Braze
- [ ] Generate Braze API key
- [ ] Deploy Vercel app
- [ ] Configure content card
- [ ] Test end-to-end with 1 user

### Mobile Team
- [ ] Nothing (verify content cards work)

### All Teams
- [ ] Launch to 1 test user
- [ ] Verify full flow works
- [ ] Launch to 10 pilot users
- [ ] Monitor for 1 week

---

## Post-Launch Support

| Issue | Owner |
|-------|-------|
| Hardware taps not appearing | Redshift |
| Manual edits not saving | You (Vercel) |
| Content card not showing | You (Braze) |
| Edit page broken | You (Vercel) |
| Week not resetting | Redshift + You |
| App crashes | Mobile |

**Most likely issues:**
- Braze configuration (Liquid templates)
- Vercel environment variables
- User not in pilot segment

**Unlikely issues:**
- Redshift sync (already working)
- Mobile app (no changes)

---

## Success Metrics (Who Monitors)

### Redshift Monitors:
- Hourly sync runs successfully
- `morning_streak_hardware` populated for pilot users

### You Monitor:
- Content card impressions (Braze dashboard)
- Content card clicks (Braze dashboard)
- Vercel API calls (Vercel dashboard)
- Manual edit success rate

### Mobile Monitors:
- Nothing (no app changes)

### Product Monitors:
- User engagement
- Feedback from pilot users
- Feature adoption

---

## Timeline

| Day | Team | Task |
|-----|------|------|
| **Day 1** | You | Braze + Vercel setup (55 min) |
| **Day 1** | You | Test with 1 user |
| **Day 2** | You | Fix any issues |
| **Day 2** | All | Launch to 10 pilot users |
| **Week 1** | All | Monitor, collect feedback |
| **Week 2** | Product | Decide: iterate or expand |

**Total effort:**
- Redshift: 0 hours (already done)
- You: ~2 hours (setup + testing)
- Mobile: 0 hours (no changes)

---

## After Pilot Success

**If pilot succeeds, consider:**
1. Migrate to HTML content cards (better UX)
   - Mobile team: 1-2 days work
2. Expand to 100 users, then 1,000, then all
3. Add features: rewards, insights, notifications

**If pilot fails, iterate:**
1. Fix issues with 10-user group
2. Re-test before expanding
3. Low risk: only 10 users affected

---

**Bottom line:** You're building 2 things (Braze + Vercel), Redshift is already done, Mobile does nothing. 55 minutes total.
