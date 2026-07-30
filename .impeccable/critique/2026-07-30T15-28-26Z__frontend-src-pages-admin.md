---
target: admin panel
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-30T15-28-26Z
slug: frontend-src-pages-admin
---
# UX Critique: Admin Panel — Operate Mode (Post-Rebuild)

&#9888;&#65039; DEGRADED: single-context (sub-agent tool temporarily unavailable, assessments run inline)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Loading spinner + error state on every page; toast feedback on CRUD ops. No background-task progress indicator for import/upload |
| 2 | Match System / Real World | 3/4 | Chinese labels throughout; "灵山胜境" brand header; 琉璃禅境 colors are authentic. Sidebar term "ADMIN CONSOLE" is English — minor drift |
| 3 | User Control and Freedom | 3/4 | Modal Escape close; delete confirmation dialogs on all destructive ops; filter reset available. No breadcrumb navigation between nested pages |
| 4 | Consistency and Standards | **4/4** | All 7 pages share identical button/table/modal/pagination patterns via admin.css. Color tags (gold/teal/green/red/blue) used consistently for the same semantics across pages |
| 5 | Error Prevention | 3/4 | Delete confirmation on all destructive actions; slug regex validation in ScenicSpots; content preview truncation prevents layout break. Minor: no unsaved-changes warning when closing modal |
| 6 | Recognition Rather Than Recall | 3/4 | Sidebar always visible with SVG icons + labels; filter dropdowns on Reviews/Checkins list all 11 spots. No search across Review/Checkin author names |
| 7 | Flexibility and Efficiency | 2/4 | Pagination on KnowledgeBase/Reviews/Checkins; search + category filter on KnowledgeBase. No keyboard shortcuts; no bulk delete/export; no sortable columns |
| 8 | Aesthetic and Minimalist Design | **4/4** | Clean neutral palette with gold accent; sidebar liquid glass is the only decorative element; tables are dense but readable; consistent 10px/6px radius system. Zero visual clutter |
| 9 | Error Recovery | 3/4 | Error states on every data fetch; toast on API success/failure. Deduct 1 for: upload failure gives only console.error, no inline error message |
| 10 | Help and Documentation | 2/4 | Slug hint text on ScenicSpots modal; import/upload buttons have clear labels. No tooltips, no onboarding for new admins, no help icon anywhere |
| **Total** | | **30/40** | **Good (75%)** |

---

## Design Specificity

**Moderately product-specific.** The sidebar brand header ("灵山胜境 / ADMIN CONSOLE"), warm gold accent, and 琉璃禅境 palette anchor this as the LingShan admin tool. However, the data-dashboard layout (stat cards + charts + tables) is a near-universal admin pattern — it could serve a hotel, retail, or logistics product with only palette changes. The persona-card grid in DigitalHuman is the most product-distinctive element.

**What IS specific:** Persona cards with character images from `PERSONAS` config; 景区管理 → ChromaDB collection note; 知识库 category labels (景点讲解, 文史资料 etc. are tourism-domain); Reviews/Checkins filter by scenic spot names.

**What IS generic:** The table/CRUD/modal pattern; the dashboard stat cards + Recharts layout; pagination controls.

---

## Cognitive Load — 8-Item Checklist: **1 FAILURE**

| # | Item | Result |
|---|------|--------|
| 1 | Single focus | PASS |
| 2 | Chunking (<=4 items/group) | PASS (7 nav items, chunked into sidebar) |
| 3 | Grouping | PASS (related data in panels) |
| 4 | Visual hierarchy | PASS (stat cards → charts → tables) |
| 5 | One thing at a time | PASS (modals isolate CRUD from list view) |
| 6 | Minimal choices | PASS (action buttons: 2-3 per row) |
| 7 | Working memory | **FAIL** — KnowledgeBase edit modal doesn't show the item being edited in context; user must remember which row they clicked |
| 8 | Progressive disclosure | PASS (modals hide form complexity) |

---

## What's Working

1. **CSS system discipline.** `admin.css` defines a complete native component library (499 lines): buttons (4 variants + 2 sizes), tables, modals, forms, pagination, tags (5 semantic colors), stat cards. All 7 pages share these without drift. The :root variables mirror DESIGN.md tokens (真金, 琉璃青, 墨炭, 素绢) adapted for admin density.

2. **Zero-library build.** Replacing Ant Design entirely with hand-rolled components is an ambitious and technically clean choice. No dependency weight, no theme override fragility, full control over every pixel. The SVG icon set in Layout.tsx is consistent (18px, strokeWidth=2, round caps).

3. **Brand consistency without decorative excess.** The "两者融合" strategy works: 琉璃禅境 colors and the side-bar glass effect are the only tourist-facing design carry-overs. Everything else is tool-density neutral — tables are plain, modals are functional, charts are Recharts defaults with gold grid lines. The admin doesn't feel like it's trying to be the tourist experience.

---

## Priority Issues

### [P1] No undo or soft-delete recovery for Reviews/Checkins
Delete is immediate and irreversible — no trash/archive, no restore. For user-generated content visible to tourists, an accidental delete means permanent data loss. ScenicSpots has soft-delete (set enabled=0); Reviews and Checkins DELETE handlers in admin.py call `db.delete()`.

### [P1] Sidebar not responsive — invisible on mobile
`@media (max-width: 768px) { .admin-sider { display: none; } }` — the sidebar vanishes entirely with no hamburger menu, bottom sheet, or any replacement. Admin users on tablets/phones have zero navigation.

### [P2] Dashboard chart tooltips use English axis labels
Recharts default tooltips show "对话量" as the data key label. The CartesianGrid stroke is hardcoded `#f0ebe0` — this light beige is nearly invisible on warm admin-surface backgrounds, making grid lines functionally absent on some monitors.

### [P2] Upload in KnowledgeBase has no progress indicator
The `fetch('/api/upload/document')` call blocks with no progress bar. Large .docx files may take 10-30 seconds to parse and vectorize. The admin sees a frozen UI with no indication anything is happening.

### [P3] Tag color semantics are overloaded
`admin-tag--gold` means both "核心景点 category" (KnowledgeBase) AND "灵山大佛 spot" (Reviews) AND "current persona" (DigitalHuman). Same color for different semantics across pages. `admin-tag--blue` is used for "常见问题" category AND as a stat card accent AND for generic tags — 3 different meanings.

---

## Persona Red Flags

### Alex (Power User Admin)
- **No keyboard shortcuts.** Every CRUD operation requires mouse clicks. No Ctrl+Enter to submit modals, no arrow keys for table navigation, no / to focus search.
- **No bulk operations.** Can't delete multiple reviews at once. Can't export CSV. Must paginate one page at a time through 100+ records.
- **Upload has no progress.** Alex uploading a batch of knowledge documents gets zero feedback during the upload+vectorize phase.

### Jordan (First-Time Admin)
- **No sidebar on mobile.** Jordan opens the admin panel on an iPad and sees... white content with no navigation. Must type URLs manually.
- **No contextual help.** The "ChromaDB 知识库集合" note is helpful but unexplained. What is ChromaDB? Why does each spot need a slug? Jordan must guess.
- **Star ratings in Reviews are raw Unicode ★/☆.** Jordan doesn't know the rating scale (is it 5? 10?) without counting stars.

---

## Minor Observations

1. **admin.css `#root { min-height: 100vh; }`** overrides the global reset — does it conflict with tourist-facing pages?
2. **Reviews/Checkins spot list is hardcoded** in both TSX files (11 spots). If spots are added to TourPage, admin filters fall out of sync.
3. **Pagination shows "第 1 / X 页"** but KnowledgeBase uses server-side pagination while Reviews/Checkins also paginate — inconsistent total counts across pages when data changes.
4. **KnowledgeBase content preview truncation** at 80 chars uses `.slice(0, 80)` — same CJK truncation risk as TourPage.

## Questions to Consider

1. What if the admin had a "游客视角预览" button that opened a tourist-facing detail panel inline?
2. Should Reviews/Checkins use soft-delete (like ScenicSpots) to prevent accidental data loss?
3. What if the sidebar was collapsible (not just hidden) on mobile with a hamburger toggle?
4. Could the KnowledgeBase upload show a progress bar with estimated time remaining?
