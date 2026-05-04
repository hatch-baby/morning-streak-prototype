# Content Card Approach: HTML vs Image Generation

## TL;DR

**Use HTML** if Hatch app supports custom content cards or WebView rendering.
**Use Image** only as fallback if HTML isn't supported.

---

## Comparison Table

| Feature | HTML Approach ✅ | Image Generation Approach ⚠️ |
|---------|------------------|------------------------------|
| **Rendering Speed** | Instant (native UI) | Slower (network request + decode) |
| **File Size** | ~5KB HTML/CSS | ~30-50KB PNG per image |
| **Network Requests** | 0 (template cached) | 1 per card display |
| **Offline Support** | ✅ Yes (template in app) | ❌ No (needs Vercel) |
| **Visual Quality** | ✅ Native, crisp | ⚠️ Pixelated on some screens |
| **Accessibility** | ✅ Screen readers work | ❌ Image alt text only |
| **Easy to Update** | ✅ Change HTML/CSS | ⚠️ Deploy Vercel app |
| **Mobile Dev Work** | ⚠️ Requires iOS/Android code | ✅ None (works immediately) |
| **Cost** | ✅ Free | ⚠️ Vercel serverless invocations |
| **Braze Setup** | Same (just different data format) | Same (image URL in card) |

---

## How Each Works

### HTML Approach (Recommended)

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Braze    │─────▶│ Hatch    │─────▶│ Display  │
│          │ data │ App      │ HTML │ Native   │
│ Sends:   │      │ Renders: │      │ UI       │
│ hardware │      │ <div>... │      │          │
│ manual   │      │ filled   │      │ ● ● ○    │
└──────────┘      └──────────┘      └──────────┘
                      ↑
                  Template cached
                  in app bundle
```

**Flow:**
1. Braze sends data: `{"hardware": "1,0,1,0,0,0,0", "manual": "0,1,0,0,0,0,0"}`
2. Hatch app has HTML template (in app bundle or loaded once)
3. App injects data into template
4. Renders native UI elements (circles, text)

**Pros:**
- ✅ Faster (no network request)
- ✅ Works offline
- ✅ Looks native
- ✅ Free (no serverless costs)

**Cons:**
- ⚠️ Requires mobile dev work (custom content card renderer)
- ⚠️ Template changes need app update (but rare)

---

### Image Generation Approach (Fallback)

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Braze    │─────▶│ Hatch    │─────▶│ Vercel   │─────▶│ Display  │
│          │ URL  │ App      │ HTTP │ API      │ PNG  │ Image    │
│ Sends:   │      │ Requests:│      │ Renders: │      │          │
│ image    │      │ GET /api │      │ React to │      │ [PNG]    │
│ URL      │      │ /streak  │      │ PNG      │      │          │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
```

**Flow:**
1. Braze constructs image URL with data in query params
2. Hatch app requests image from Vercel
3. Vercel serverless function generates PNG (React → image)
4. App displays PNG

**Pros:**
- ✅ No mobile dev work needed
- ✅ Works immediately (prototype friendly)
- ✅ Full control over rendering

**Cons:**
- ⚠️ Network request every time (slower, requires internet)
- ⚠️ Vercel serverless costs (small but not free)
- ⚠️ PNG can be pixelated on high-DPI screens
- ⚠️ Not accessible (screen readers see "image")

---

## Which Should You Use?

### Use HTML if:

✅ Hatch app already has custom content card rendering
✅ Mobile team can implement custom card type (~1-2 days work)
✅ You want best performance and offline support
✅ Planning to ship this to all users (not just pilot)

### Use Image if:

✅ Hatch app only supports basic Braze content cards
✅ No mobile dev resources available
✅ Need to prototype quickly (10-user pilot)
✅ Temporary solution before proper mobile implementation

---

## Hybrid Approach

**Best of both worlds:**

1. **Launch pilot with Image approach** (fast, no mobile changes)
2. **Collect feedback, validate feature works**
3. **If successful, migrate to HTML approach** (better UX, performance)

This lets you:
- ✅ Ship pilot in days (not weeks)
- ✅ Validate feature without big mobile investment
- ✅ Upgrade to HTML later when justified

---

## Mobile Team Questions

Before deciding, ask:

**Q1: Does Hatch app already have custom content card types?**
- Check if there are other custom cards (e.g., onboarding, promotions)
- If YES → HTML is easy to add

**Q2: How are content cards currently rendered?**
- Native UITableViewCell/RecyclerView? → HTML needs custom renderer
- WebView? → HTML is trivial (just inject data)

**Q3: What's the mobile release cycle?**
- Weekly releases → HTML changes ship fast
- Monthly releases → HTML updates slower

**Q4: Is this pilot or long-term feature?**
- Pilot → Image is fine for now
- Production → HTML is worth investing in

---

## Implementation Effort

### HTML Approach

| Team | Task | Time |
|------|------|------|
| **Mobile (iOS)** | Create custom content card renderer | 4-6 hours |
| **Mobile (Android)** | Create custom content card renderer | 4-6 hours |
| **Web Team** | Provide HTML template | 1 hour |
| **Braze Team** | Configure content card with extras | 30 min |
| **Testing** | QA on iOS + Android | 2-3 hours |
| **Total** | | **~2 days** |

### Image Approach

| Team | Task | Time |
|------|------|------|
| **Web Team** | Build image generation API | 2-3 hours |
| **Braze Team** | Configure content card with image URL | 30 min |
| **Testing** | QA image loads correctly | 1 hour |
| **Total** | | **~4 hours** |

---

## Recommendation

**For 10-user pilot:**
- **Use Image approach** → Ship this week
- Already built (`/api/streak-card-image`)
- Zero mobile changes
- Good enough for validation

**If pilot succeeds:**
- **Migrate to HTML** → Before scaling to 1,000+ users
- Better UX and performance
- Lower cost at scale
- Proper long-term solution

**Best path:**
1. Week 1: Launch pilot with image generation ✅
2. Week 2: Collect feedback
3. Week 3: If successful, plan HTML migration
4. Week 4-5: Mobile team implements HTML renderer
5. Week 6: Ship HTML version to pilot users
6. Week 7: Expand to all users with HTML approach

---

## Cost Analysis (at scale)

### Image Approach Costs (1,000 users)

**Assumptions:**
- 1,000 users
- Content card refreshes 5x/day (app opens)
- 5,000 image requests/day
- Vercel serverless: $0.60/million invocations

**Monthly cost:**
- 5,000 req/day × 30 days = 150,000 requests/month
- 150,000 × $0.60/1M = **$0.09/month**

(Essentially free for pilot, but grows with scale)

### HTML Approach Costs

**$0.00** - Template cached in app, no server requests

---

## Bottom Line

| Scenario | Recommendation |
|----------|----------------|
| **Pilot (10 users, 2 weeks)** | Image ✅ Fast to ship |
| **Production (1,000+ users)** | HTML ✅ Better UX/cost |
| **No mobile resources** | Image ✅ Only option |
| **Mobile team available** | HTML ✅ Worth the investment |

**Current status:** Image approach is already built and ready to deploy.
**Next step:** Confirm with mobile team if HTML is feasible for post-pilot.
