# UI report (commit b0c482b, frontend)

## Dashboard widgets: cropping fix
Harness: /tmp/inos3/scratch/ui/widgets.js. It mocks the saved layout so every library widget for /design (37) and /build (82) renders at each size through real react-grid-layout, then checks every text node against its clipping ancestors.
- Before: cropped text in inventory.by_category (h=3), inventory.movement_trend, boq/quot value trends (axis labels, hero value), vendors.onboarding_trend, plus stat numbers clipped by `line-height:1`. Visual checks also found tables wrapping or cutting columns at 3 cols, donut legends shrinking to "D…", and hero values wrapping ("₹2.65 / Cr").
- After: 0 issues on both apps at every size tested (stat 2x2…6x2/3x4; others 3x3…12x4, 6x6, 3x6).

Size rules (`constraintsFor` in AppDashboard.jsx):
| kind | min | max |
|---|---|---|
| stat (small-only) | 2x2 | 6x3 |
| list | 3x3 | - |
| chart / donut | 4x3 | - |
| wide-only (no medium size: tables, hero trends) | 6x4 | - |
Older saved layouts below these minimums are shown at the minimum and re-packed, so nothing overlaps. The tablet and phone layouts are built from the clamped desktop layout.

How the content adapts:
- WidgetShell and `.dash-item__body` are CSS size containers (`container: widget / size`).
- Stat numbers use `clamp(22px,14cqi,34px)`.
- Hero values scale and never wrap. "vs prev" is hidden below 380px and the delta below 240px.
- Donut size follows the tile. The legend % is hidden when narrow, and each legend row has a title tooltip.
- Table cells don't wrap. The table scrolls horizontally and its header sticks.
- Lists scroll instead of cropping.
- Compact INR axis ticks (₹1.4Cr). Bar charts thin out their x labels.
- Black bars replaced with brand/sage. The Outstanding tile now matches the other stat tiles.

## Declutter (shared first)
- inos-theme.css:
  - Stat-tile icons are quiet grey glyphs instead of coloured chips, leaving one accent colour.
  - Stat value line-height fixed and ellipsis added.
  - On phones: header actions take the full row and stats show 2 per row.
  - Card headers wrap. Segmented controls and tabs scroll inside their own box, so the page doesn't widen.
- Fixed horizontal page overflow at 390px: /build and site-ops dashboard header (110px→0), /command-center (67px→0).
- Quotations: legacy header replaced with PageHeader. The 8 stat tiles plus the 5-tile "Awaiting Action" box became 4 clickable StatTiles and one "Needs attention" row that only shows non-zero items. Borders and search box are calmer.
- Drawing register: the solid "Approve drawing" button on every card is now `soft`.

The page sweep (sweep.js, 24 routes at 1440 and 390) found no other horizontal overflow. Most pages already use Quiet Studio.

## Not done / notes
- LedgerOutstanding and some other widgets pass `onClick` to WidgetShell, which ignores it (it supports `href`), so those tiles aren't clickable. This is a behaviour bug, left for AUDIT.
- Still worth simplifying: the Command Center header (4 actions plus a dark banner), the CRM pipeline toolbar, Vendor DB (search and filters in separate cards), and Material Requirements (project picker in its own card).
- Final re-verification after the last small edits (Outstanding tile, line endings) couldn't run: the backend was down (restart lock held). Build passes, and lint error counts on touched files are unchanged from baseline.
- Screenshots: /tmp/inos3/scratch/ui/before, /tmp/inos3/scratch/ui/after (w-* = widgets per size, p-* = pages).
