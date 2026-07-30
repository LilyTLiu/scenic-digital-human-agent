---
target: TourPage
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-30T13-07-49Z
slug: frontend-src-pages-tourist-tourpage-tsx
---
# UX Critique: TourPage — Operate Mode (Post-Upgrade)

Method: dual-agent (A: Design Review · B: Detector + Browser Evidence)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | 实时时钟、天气重试、音频状态、加载提示到位；表单提交失败静默吞错 |
| 2 | Match System / Real World | 4/4 | 真图替换占位图；佛教术语精准；标签映射游客心智模型；分组符合游览逻辑 |
| 3 | User Control and Freedom | 3/4 | Escape关闭、搜索清除、空态重置；缺少移动端滑动关闭、Hero无手动暂停 |
| 4 | Consistency and Standards | 3.5/4 | 古铜/金色系统一致；衬线/无衬线规则严守；收藏按钮伪装为筛选chip |
| 5 | Error Prevention | 2/4 | 图片fallback好；表单无字数限制、无未保存确认、无鉴权 |
| 6 | Recognition Rather Than Recall | 3/4 | 搜索+筛选可见；引导关闭后无重新入口 |
| 7 | Flexibility and Efficiency | 3/4 | 搜索+筛选+收藏；无"全部展开/收起"、无滑动手势 |
| 8 | Aesthetic and Minimalist Design | 3.5/4 | 液态玻璃执行一致；描述截断150字损失核心内容 |
| 9 | Error Recovery | 2.5/4 | 天气重试优秀、音频错误清晰；表单失败静默、无网络错误说明 |
| 10 | Help and Documentation | 2.5/4 | 首次引导3步骤；不可重新访问、无FAQ/工具提示 |
| **Total** | | **29.5/40** | **Good (73.8%)** |

---

## Design Specificity Verdict

**Substantially improved from 24/40.** The shift to real scenic photos + deep domain copywriting makes the product feel genuinely about THIS scenic area. One holdover: checkin images still use Picsum, undermining the authenticity the rest of the design establishes.

**Detector**: 172 findings, ~90% false positives (glass transparency variants, per-spot colors, font-size within DESIGN.md ranges). 5 actionable findings: cool-gray shadow violations, pure-black shadow, max-height transition warning, off-scale border-radius, undocumented sidebar colors.

---

## Overall Impression

The upgrades (real images, search/filter/favorites, backend reviews, onboarding, live clock, weather retry, Escape key) collectively transformed the interface from an "encyclopedia" (24/40) to a functional tour guide (29.5/40). The material system is disciplined, the environmental responsiveness (time-of-day tints, rain/snow canvas) is tasteful, and the content quality is culturally authoritative.

Critical gap: the most valuable content asset — the 300+ character spot descriptions — is truncated to 150 characters with no "read more." The reason tourists open the detail panel is largely unavailable.

---

## Priority Issues

### [P0] Silent Form Submission Failures
Lines 478/495 — empty `catch {}` blocks. User gets zero feedback on network failure. Add inline error banner + retry.

### [P1] Description Truncation Discards Core Content
Line 536 — `spot.description.slice(0, 150)`. Full rich narratives are never displayed. Add "read more" expansion or full-text accordion section.

### [P1] Onboarding Steals the Hero Moment
FirstVisitGuide (z-index 1000) blocks the hero carousel entirely. Delay or convert to contextual tooltips.

### [P2] Weather Error Too Small on Mobile
12px SVG icon + 10-11px text on busy hero background. Increase to 18px icon with larger label.

### [P3] Checkin Images Still Use Picsum
Undermines authenticity after all scenic photos were replaced. Use colored initial placeholder instead.

---

## Persona Red Flags

- **Casey**: No swipe-to-dismiss; no mobile carousel pause; filter chips conflict with vertical scroll
- **Jordan**: Onboarding un-recoverable; hero says "入境" not "灵山胜境"; no favorite confirmation toast
- **Wei**: Description truncated at 150 chars; guide tips practical not cultural; no cross-spot linking

---

## Minor Observations

1. CJK truncation risk — `slice(0, 150)` on UTF-16
2. Only 3 hero spots (拈花湾 excluded despite having heroImage-worthy visual)
3. Stagger animation indices break under filtering
4. No `aria-live` for dynamic content announcements
5. Right-column scroll position not preserved across spot changes
6. `prefers-reduced-motion` CSS/media vs canvas pattern mismatch

## Questions to Consider

1. What if hero text were dynamic per-slide instead of static "入境"?
2. What if 收藏 were split from filter chips into a segmented control?
3. Could the detail panel left column show full description with scrolling?
4. What if weather effects were probabilistic based on actual WMO intensity?
5. What if onboarding were a contextual banner instead of a blocking modal?
