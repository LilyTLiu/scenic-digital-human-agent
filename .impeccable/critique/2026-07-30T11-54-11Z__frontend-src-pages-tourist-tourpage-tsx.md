---
target: TourPage
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-07-30T11-54-11Z
slug: frontend-src-pages-tourist-tourpage-tsx
---
# UX Critique: TourPage — Operate Mode

Method: dual-agent (A: Design Review · B: Detector + Browser Evidence)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Weather has no loading/retry state; clock never updates; connectivity status absent |
| 2 | Match System / Real World | 3 | Authentic Buddhist terminology; custom SVG icons; "入境" label potentially confusing |
| 3 | User Control and Freedom | 3 | Close button + overlay click; no Escape key; no back-to-previous-spot |
| 4 | Consistency and Standards | 3 | `--spot` CSS var as single source; font discipline holds; star ratings break icon system |
| 5 | Error Prevention | 2 | TTS three-tier fallback good; form validation minimal; no unsaved-form warning |
| 6 | Recognition Rather Than Recall | 3 | Spot cards with icon/name/tags; reviews hidden in collapsed accordions; hero clickability invisible |
| 7 | Flexibility and Efficiency | 1 | No search, filter, favorites, sort, or keyboard shortcuts; no audio speed control |
| 8 | Aesthetic and Minimalist Design | 4 | Liquid glass cards exceptional; warm shadows; time-of-day tints; staggered card entrance |
| 9 | Error Recovery | 2 | Audio error recovery excellent; weather `⁇` broken on mobile; no offline detection |
| 10 | Help and Documentation | 1 | Rich spot descriptions + guide tips; zero onboarding; no tooltips; no "how to use" |
| **Total** | | **24/40** | **Acceptable** (60%) |

---

## Design Specificity Verdict

**This composition is strongly grounded in THIS product.** It could not be used unchanged for an unrelated product.

**LLM assessment**: The "琉璃禅境" visual language — liquid glass cards (`backdrop-filter: blur(18px) saturate(140%)` + semi-transparent white + inset highlight), warm gold Buddhist palette (`#c8963e`), custom SVG icons drawn from Buddhist architecture (Buddha silhouette, lotus, pagoda, temple gate, mudra hand), and weather-responsive atmosphere system (rain/snow canvas with `prefers-reduced-motion`) — are all product-defining. Spot grouping reflects the actual experiential organization of Ling Shan (core/culture/zen). A hotel booking app or food delivery service would have no reason to use any of these material metaphors.

**Deterministic scan**: 153 findings total (1 warning, 152 advisory). The single warning is `transition: max-height` on the accordion body (index.css:1168) — defensible but improvable. All 8 TourPage.tsx findings are per-spot theme colors (intentional). ~25 CSS findings are glass-morphism translucency variants already documented in DESIGN.md's `components` block. ~35 font-size findings fall within typography ranges. 2 genuine undocumented colors: `#d4a94b` (review stars gold variant) and `#1f342f`/`#f8df9a` pair (sidebar branding). 1 likely bug: `border-radius: 1px` at index.css:1087.

**Browser visualization**: Unavailable. Dev server not running during scan.

---

## Overall Impression

The liquid glass visual language is exceptional — among the best web implementations of the Apple Liquid Glass aesthetic for non-Apple contexts. The weather-responsive atmosphere (three-layer rain parallax, snow drift, time-of-day tints) demonstrates craft investment rare outside of ambient art installations. Content quality (spot descriptions, guide tips, Buddhist terminology) is culturally literate and tonally appropriate.

However, the interface is an *encyclopedia pretending to be a tour guide*. It displays information beautifully but provides no path through it. Ten (now eleven) spot cards are presented as equals with no guidance on where to start. Search, filter, favorites, and route integration are absent. The hero carousel is a decorative billboard rather than a functional concierge. First-time visitors receive zero onboarding. The weather error state is actively confusing.

**The single biggest opportunity**: Transform the hero from a decorative carousel into a context-aware concierge that guides the visitor's journey through the park — showing recommended next spots, upcoming showtimes, and personalized suggestions based on time-of-day.

---

## What's Working

1. **The liquid glass card system defines the product.** `rgba(255,255,255,0.42)` + `backdrop-filter: blur(18px) saturate(140%)` + `inset 0 1px 0 rgba(255,255,255,0.60)` + cursor-tracking radial gradient creates genuine optical depth. Cards feel physically present, not just styled. The dual-layer warm shadow system (2px near + 8px far in `rgba(44,41,38,...)`) and the 6px hover lift with parallax image shift are responsive and tactile.

2. **The weather-atmosphere integration shows ambition.** Three-layer rain with sinusoidal wobble, wind drift, and bottom mist. Snow with per-flake phase offsets. Time-of-day tints (dawn amber, dusk crimson, night indigo) with 2s CSS transitions. Both canvas effects respect `prefers-reduced-motion`. This is environmental design at a level rare in web applications.

3. **Content quality matches the cultural context.** Spot descriptions explain Buddhist iconography in accessible terms ("无畏印表示拔除众生痛苦"). Guide tips are specific and actionable ("抱佛脚需脱鞋，建议穿易脱的鞋子；顺时针绕佛三圈祈福"). SVG icons replace emoji with culturally literate Buddhist architectural vocabulary.

---

## Priority Issues

### [P0] Weather error UI is broken on mobile
**What**: The weather error state shows `⁇` (U+2047), unrecognizable at small sizes, with only a `title` tooltip (inaccessible on touch). No retry mechanism.
**Why it matters**: Weather is the first dynamic status signal (hero top-right). Outdoor visitors making shelter decisions need reliable weather. A broken indicator erodes trust in the entire system.
**Fix**: Replace `⁇` with a cloud-off SVG icon + "天气未知" text. Add tappable retry area calling `fetchWuxiWeather()`. Show "上次更新" timestamp on success.
**Suggested command**: `/impeccable harden TourPage` — specifically the weather error/recovery UI

### [P0] Wall of 11 cards violates minimal-choices guideline
**What**: Desktop shows all 11 cards in a 4-column grid. Mobile expand reveals all 11. Recommended ceiling is ≤4 visible options per decision point.
**Why it matters**: Eleven visually rich glass cards create decision paralysis. Jordan (Confused First-Timer) has no guidance on where to begin.
**Fix**: Replace single "查看全部" expand button with per-group expand toggles. Add horizontal filter chips: "全部 / 建筑 / 演出 / 祈福 / 禅修". On desktop, retain grid but reduce visual weight of secondary groups.
**Suggested command**: `/impeccable layout TourPage` — per-group expand toggles + filter chips

### [P1] No onboarding or first-use guidance
**What**: Only one instructional line exists: "点击卡片聆听讲解". No indication hero is tappable, detail panels contain audio, accordions expand, or reviews/checkins exist.
**Why it matters**: Product principle states "零摩擦上手." Current state is zero-guidance. Core features are undiscoverable.
**Fix**: One-time coach-mark overlay (3 steps, localStorage-gated): (1) tap hero/cards, (2) play audio, (3) expand accordions. "跳过" button on each step.
**Suggested command**: `/impeccable onboard TourPage`

### [P1] No search, filter, or favorites
**What**: Cannot search by name, filter by tag, sort by any criterion, or bookmark spots. Rich tag data (建筑/演出/祈福/禅修/亲子 etc.) sits unused.
**Why it matters**: Different personas have different discovery needs. Wei wants historical spots. Casey wants "that giant hand" she heard about. Families want "亲子" spots.
**Fix**: Add horizontal scrollable filter chips below header. Simple text search on `spot.name` + `spot.shortDesc`. localStorage-based favorites.
**Suggested command**: `/impeccable layout TourPage` — filter bar + search

### [P2] Static time display undermines live-guide credibility
**What**: Clock captures `new Date()` once on mount and never updates. TimePeriod and tints are frozen. After 5 minutes, displayed time is wrong.
**Why it matters**: A tour guide with wrong time feels unreliable. The time-awareness feature backfires.
**Fix**: `useEffect` with 30s `setInterval` updating clock display and re-evaluating `timePeriod`.
**Suggested command**: `/impeccable harden TourPage` — live clock update

### [P3] Escape key does not dismiss detail panel
**What**: Desktop users expect Escape to close modals. WCAG 2.1 Level A concern (2.1.1 Keyboard).
**Fix**: `useEffect` in DetailPanel adding `keydown` listener on Escape → `onClose()`.
**Suggested command**: `/impeccable polish TourPage` — Escape key handler

### [P3] Review/checkin features are undiscoverable dead weight
**What**: Hidden in collapsed accordions at the bottom of a scrollable panel. Emoji avatars clash with the reverent tone. No backend persistence.
**Fix**: Surface average rating + review count on spot cards. Move top review above-fold in detail panel. Replace emoji avatars with initial-based or colored-circle placeholders.
**Suggested command**: `/impeccable bolder TourPage` — surface social proof on cards

---

## Persona Red Flags

### Casey (Distracted Mobile User) — PRIMARY
- **Hero auto-advance steals attention** — 5s interval tuned for seated user, not walking/glancing
- **Weather `⁇` meaningless at split-second glance** — consumes attention, returns zero value
- **Detail panel full-screen takeover loses spatial anchor** — can't compare adjacent spots without memory load
- **No "distance to this spot" context** — physically walking, no geolocation awareness

### Jordan (Confused First-Timer)
- **"入境" reads as UI state, not welcome** — poetic label prioritizes aesthetics over communicative clarity
- **Hero is an invisible button** — zero affordance that 60vh carousel is tappable
- **"…" truncation looks like a loading failure** — waits for more content that never arrives
- **No recommended starting point** — 11 cards, no "start here" indication
- **Accordion interactivity non-obvious** — collapsed sections look like static labels

### Wei (Cultural Tourist)
- **150-char truncation gatekeeps cultural depth** — cuts off mid-sentence at most significant cultural explanation
- **No cross-spot cultural connections** — 祥符禅寺 and 灵山大佛 are historically connected but presented as isolated cards
- **Cultural terminology lacks inline explanation** — "无畏印", "五明之学" appear without definitions
- **Emoji avatars clash with reverent tone** — 🧑‍🦰🧘🐟 after carefully constructed zen atmosphere
- **Audio-only deep content assumes listening preference** — no "read full description" text expansion

---

## Minor Observations

1. **`border-radius: 1px` at index.css:1087** — likely unintentional; verify if meant to be 0 or 10px
2. **`#d4a94b` gold variant (review stars)** — not in DESIGN.md palette; replace with `--gold` or document
3. **`#1f342f` + `#f8df9a` deep green/pale gold pair** — in sidebar/hero branding, undocumented palette addition
4. **Duplicate `@keyframes zenTextIn`** — defined twice, second silently overwrites first (dead code)
5. **Duplicate `.page-atmo--snow .page-snow` rule** — first block dead due to cascade
6. **`text-shadow` on hero clock invisible** — dark shadow on dark glass background
7. **`icon` field in SCENIC_SPOTS is dead data** — emoji values never rendered since SVG migration
8. **Review star color inconsistency** — hardcoded `#d4a94b` vs design system `--gold`

---

## Questions to Consider

1. **What if the detail panel were an inline expansion rather than a modal overlay?** Maintain spatial context, solve the memory-bridge problem, feel more like browsing than entering a separate room.
2. **Should the spots be ordered by geo-spatial walking path?** Current grouping is conceptual (core/culture/zen). A walking-path order with "you are here" would transform it from encyclopedia to navigation tool.
3. **What if the hero carousel was a "current context" concierge?** Show nearest spot, next showtime, time-of-day recommendation — transforming a decorative billboard into a functional guide.
4. **Is the review/checkin system worth its implementation cost?** ~250 lines, undiscoverable, emoji avatars clash, no persistence. Would social proof be better served through the existing AI chat?
5. **Should tour page and recommend page be unified?** Routes exist on separate tab, no integration with spot browsing.
