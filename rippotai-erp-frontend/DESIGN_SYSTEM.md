# INOS Design System — "Quiet Studio"

Clean, minimal, aligned. Brand ink-green on a soft green-grey canvas, white surfaces with
hairline borders, and **pastel colour only when it carries meaning** (status, category).

Source of truth:
- `src/styles/inos-theme.css` — tokens + all `.inos-*` classes
- `src/components/inos/index.jsx` — React primitives (use these first)
- `src/components/icons/ModuleIcons.jsx` — frosted-duotone app icons (`MODULE_ICONS[appKey]`)

## Colour rules

| Use | Token |
|---|---|
| Primary action, active state, links | `var(--brand)` #1F453B |
| Tinted brand wash (selected rows, soft buttons) | `var(--brand-50)` |
| Secondary brand | `var(--sage)` #B5C4B6, `--sage-100`, `--sage-50` |
| Sparing highlight | `var(--gold)` #D9AF61 |
| Page ground / cards / inset | `--canvas`, `--surface`, `--surface-2` |
| Borders | `--line` (hairline), `--line-strong` (inputs) |
| Text | `--text`, `--text-2` (secondary), `--text-3` (captions) |
| Status — ONLY these pastels | ok (mint), warn (butter), bad (blush), info (sky), lilac, peach, mute — each has `-bg`, `-fg`, `-dot` |

Never introduce saturated reds/blues/oranges. No raw hex in new code — use the CSS variables
(Tailwind arbitrary values work: `text-[var(--text-2)]`, `bg-[var(--surface)]`).

## Type
One family (Plus Jakarta Sans, bundled; legacy "Poppins"/"Nunito Sans" names alias to it).
Scale: caption 11.5 · small 13 · body 14 · lead 15.5 · h3 16 · h2 20 · h1 26 · display 32.
Sentence case everywhere. Uppercase only for the tiny eyebrow/table-head style (`.inos-eyebrow`, table `th`).
Numbers in tables/stats: `tabular` class.

## Page anatomy (every page)
```jsx
import { Page, PageHeader, Card, Button, Stats, StatTile, Toolbar, SearchInput, Segmented, Tabs,
         Pill, StatusPill, EmptyState, Avatar, Progress, FolderCard, folderToneFor,
         FormSection, Field, TextInput, SelectInput, TextArea, ChoiceGroup, FormActions } from "@/components/inos";

<Page>                                   // centred column, max 1360px ("form" width = 880px)
  <PageHeader crumbs={[{label:"Admin Console", to:"/console"}, {label:"Users"}]}
              title="Users" subtitle="One sentence on what this page is for."
              actions={<Button variant="primary" icon={Plus}>Invite user</Button>} />
  <Stats> <StatTile label="Active" value={12} icon={<Users/>} tone="ok"/> … </Stats>   // only when figures matter
  <Card title="…" actions={…} flush> <div className="inos-table-wrap"><table className="inos-table">…</table></div> </Card>
</Page>
```
- One primary button per page (top-right). Everything else secondary/ghost.
- Buttons: `variant` = primary | secondary | ghost | soft | danger; `size` = sm | lg; pass a lucide icon via `icon`.
- Toolbar row above lists: `SearchInput` + `Segmented` filters + spacer + view toggles.
- Tables: `.inos-table` inside `Card flush`. Row height 56, header 40, clickable rows get `className="is-clickable"`.
  Right-align numbers (`className="num"`), actions column `className="actions"` with ghost icon buttons (sm).
- Status: `<StatusPill status={row.status}/>` (auto maps words to pastel tones) or `<Pill tone="ok|warn|bad|info|lilac|peach|brand">`.
- Empty: `<EmptyState icon={FolderOpen} title="No projects yet" text="…" action={<Button …/>}/>`. Never a lone grey sentence.
- Icons inside UI: lucide-react, size 16–18, inherit colour. In coloured squares use `.inos-icon-tile` (+ `--ok/--warn/--info…`, `--sm/--lg`).
- Cards: don't nest cards in cards. Use `Card inset` or dividers for sub-areas. Gap between blocks: 16–24px.
- Folder cards (`FolderCard`) for collections that behave like folders: projects, document folders, phases.
  `tone={folderToneFor(id)}` gives a stable pastel per item.

## Forms (make creating things easy)
- Full-page forms: `<Page width="form">` + `PageHeader` + `<form className="inos-form">` of `FormSection`s + `FormActions` (sticky bottom bar).
- Group fields into 2–4 numbered sections (`step={1}`) with a one-line description.
- Labels above fields. Mark required with `required`, never with placeholder text. Put examples in `placeholder`, rules in `hint`.
- 2-column grid; long fields `full`. Small option sets (≤6) → `ChoiceGroup` instead of a select.
- Sensible defaults pre-filled (today's date, current user, current project from URL).
- Inline validation on blur/submit with `error` on the Field; disable submit only while submitting.
- Modals: same `Field`/inputs, max 1 section, footer = ghost Cancel + primary action.

## Don'ts
No gradients on buttons, no heavy shadows, no uppercase headings, no emoji, no coloured page backgrounds
(except `--canvas`), no per-page custom colour palettes, no hard-coded widths that break under 1024px.
