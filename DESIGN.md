# TalentHub México — Style Reference

> Design language for a job board in the Mexican IT sector. Light by default,
> a short dark band at the top of every page, one brand colour that is also
> the action colour, and solid surfaces.
>
> Tokens map one-to-one to `frontend/tailwind.config.js`. A reference written
> as `{colors.accent}` is the Tailwind key `accent`; `{typography.h2}` is the
> `fontSize` key `h2`.

---

## Overview

TalentHub is a **light-first job board** with a short dark band at the top of
every page. The band carries the navigation, the page title and, on the home
page, the search; everything else lives on white or `{colors.surface}`. The
band and the light body meet at a hard edge, never a gradient.

> **Why this changed (phase 7).** The first version of this system was built
> around frosted glass panels mounted across the dark/light seam, colour halos
> behind the page, a cursor-following glow, parallax, animated auroras and
> count-up numbers. Together they made the site read as a generated landing
> page rather than a product, and the brand blue barely appeared because the
> primary button was black or white. All of that is gone. What stays is what
> was doing real work: the type, the pill silhouette, the contrast-checked
> palette and the state rules.

**Key Characteristics:**
- Light canvas with a short dark band at the top; the colour change is the
  divider.
- **Ultramarine `{colors.accent}` (#3355ff) is both the brand and the action
  colour.** Primary buttons, links and focus rings, nowhere else.
- The "th" monogram (the same icon as the mobile app, Play Store and the
  favicon) next to the name in the navigation, the footer and the sign-in
  screens.
- **Solid surfaces only:** cards are `{colors.canvas}` or `{colors.elevated}`
  with a 1px hairline. No translucency, no blur, no elevation shadows.
- State colour marks **resolution, not activity**: teal for resolved in
  favour, red for resolved against. Work in progress carries full ink.
- Full pill (`{rounded.pill}`) on every control.
- Display type at weight 500–540, capped at 52px.
- Every button that executes or navigates carries an icon; the ones that
  cancel do not.
- **Only real data.** No sample cards, invented figures or claims the product
  cannot back. If a number is small, it is not shown off.

---

## Colors

> Contrast figures below were measured, not estimated. Every pairing meets
> WCAG AA at minimum; the ratio is stated where it constrains use.

### Brand & Accent

- **Ultramarine** (`{colors.accent}` — #3355ff): The single interactive
  colour. Fills primary actions, colours links on light surfaces, and drives
  the focus ring. **5.41:1 with white on top.** Deliberately not Tailwind's
  #2563EB, which sits at 221° and 83% saturation and is the default blue of
  half the web; this one is 230° at 100% and reads as pigment rather than
  hyperlink.
- **Ultramarine Pressed** (`{colors.accent-hover}` — #2544e6): Hover and
  active fill. 6.89:1 with white.
- **Ultramarine on Dark** (`{colors.accent-on-dark}` — #9db0ff): The same
  accent resolved for dark bands. **9.51:1 on `{colors.night}`.** The accent
  needs two resolutions: #3355ff as text on black gives 3.4:1 and fails,
  #9db0ff on white gives 2.0:1 and fails. One semantic token, two values,
  never the other register's.
### Surface

- **Canvas** (`{colors.canvas}` — #ffffff): Content ground. The base plane of
  the light register.
- **Surface** (`{colors.surface}` — #f5f6f8): Off-white with a cool bias.
  Alternating bands, table row hover, segmented control troughs.
- **Night** (`{colors.night}` — #0a0a0a): Dark bands — hero, closing section,
  authentication, checkout. Not pure black; #0a0a0a keeps the glare down.
- **Elevated** (`{colors.elevated}` — #161616): Floating navigation and opaque
  cards sitting on a dark band.

There is no page substrate any more. Bodies sit on `{colors.canvas}` or
`{colors.surface}`; alternating them is how sections separate.

### Text

| Token | Value | Contrast | Use |
|---|---|---|---|
| `{colors.ink}` | #161616 | 18.1:1 on canvas · AAA | Primary text, light register |
| `{colors.ink-2}` | #3f4045 | AAA | Supporting text |
| `{colors.muted}` | #6b6b6b | 5.33:1 · AA | Metadata, hints, timestamps |
| `{colors.ink-d}` | #ededed | 16.9:1 on night · AAA | Primary text on dark. **Never pure white** — it cuts glare |
| `{colors.ink-2d}` | #c2c2c2 | AAA | Supporting text on dark |
| `{colors.muted-d}` | #8a8a8a | 5.4:1 · AA | Metadata on dark |

### State

**Colour marks resolution, not activity.** There are exactly two.

- **Resolved in favour** (`{colors.ok}` — #0f766e, `{colors.ok-d}` — #5eead4):
  Accepted, published, remote, active account.
- **Resolved against** (`{colors.danger}` — #dc2626, `{colors.danger-d}` —
  #f87171): Rejected, error, destructive action.
- **Form warning** (`{colors.warn}` — #a16207, `{colors.warn-d}` — #fcd34d):
  Reserved for form-level notices. **Never dresses a state.**

Anything still in progress carries full `{colors.ink}` and a reinforced
hairline instead of a hue; anything inactive goes grey.

> **Why amber is not a state colour.** It was originally assigned to "under
> review" while red marked "rejected" — opposite meanings. Simulated under
> deuteranopia the two sit **15 units apart on a 441-unit scale**:
> indistinguishable. Teal against red measures **171**, because they differ in
> hue *and* luminance. Confusing "still alive" with "you were rejected" is not
> an acceptable failure, so progress is carried by position in
> `{component.process-track}` rather than by tone.

### Hairlines & Borders

- `{colors.hairline}` — rgba(0,0,0,0.10): 1px border on light.
- `{colors.hairline-strong}` — rgba(0,0,0,0.20): hover, emphasised dividers.
- `{colors.hairline-d}` — rgba(255,255,255,0.10): 1px border on dark.
- `{colors.hairline-d-strong}` — rgba(255,255,255,0.18): hover on dark.

---

## Typography

### Font Family

- **Display**: `Bricolage Grotesque, DM Sans, system-ui, sans-serif` — carries
  `h1` and `h2` at page and section level, and nothing smaller. Deliberately
  irregular widths and a real optical axis (`opsz` 12–96), so a 72px headline
  and a 24px heading are two different drawings rather than one scaled letter.
- **Body / UI**: `DM Sans, system-ui, sans-serif` — everything from `h3` down,
  plus all interface text. Geometric, quiet, wide language coverage for
  Spanish diacritics.
- **Numerals**: `font-variant-numeric: tabular-nums` via the `.tabular` class
  on any figure that updates in place — salaries, counters, metrics.

### Hierarchy

| Token | Size | Line Height | Letter Spacing | Face | Use |
|---|---|---|---|---|---|
| `{typography.display}` | 52px | 1.05 | −0.02em | Display | Hero headline |
| `{typography.h1}` | 48px | 1.0 | −0.02em | Display | Page title |
| `{typography.h2}` | 36px | 1.11 | −0.015em | Display | Section title |
| `{typography.h3}` | 24px | 1.33 | −0.01em | Body | Card and panel headings |
| `{typography.sub}` | 18px | 1.5 | — | Body | Lead paragraph, list titles |
| `{typography.body}` | 16px | 1.5 | — | Body | Body copy, controls |
| `{typography.caption}` | 13px | 1.5 | +0.025em | Body | Eyebrows, labels, metadata |

Weights: `{weight.book}` 460 · `{weight.mid}` 500 · `{weight.demi}` 540.

### Principles

- **Display never exceeds 540.** Restraint is the signature, not a suggestion.
  No `font-bold` in a headline anywhere in the system.
- 460 and 540 are intentional intermediate weights. Do not round them to
  400/500/600 — they require the variable fonts to be loaded.
- Negative tracking on display and headings only. At 13–16px, tracking goes
  **positive**.
- Headline sizes use `clamp()`, so the display face rule is one of **role, not
  pixels**: on mobile a section title drops to 26px and is still the display
  tier of that screen.
- **The display face never touches figures.** The salary range on the job
  detail page reaches 32px and still uses the body face, because it carries
  `tabular-nums` — a typeface with irregular widths undoes exactly what that
  property exists to provide. It is data, not a headline.

### Note on Font Substitutes

Both faces load from Google Fonts with `display=swap`, which paints a system
fallback first and then swaps. If the two differ in width the headline
re-wraps on swap and everything below it jumps.

Fallback faces are therefore declared with measured `size-adjust`: DM Sans is
**7.0% narrower than Arial** (`size-adjust: 93%`) and Bricolage Grotesque
**2.5% wider** (`size-adjust: 102.51%`). This cuts the mismatch from roughly
8% to under 1%.

It cannot reach zero — the ratio between two typefaces is not constant and
varies with the glyphs in each phrase. To eliminate the shift entirely, either
self-host the fonts or switch to `font-display: optional`, which gives up the
real face on first visit.

`ascent-override` and `descent-override` are deliberately absent: the system
pins `line-height` everywhere, so line box height does not come from font
metrics and badly-computed overrides would break what currently works.

---

## Layout

### Spacing System

Base 4px. Scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80`.

| Context | Value |
|---|---|
| Section gap, marketing | 64–80px |
| Section gap, application | 32–40px |
| Card padding, marketing | 28px |
| Card padding, application | 16–20px |
| Element gap | 8–16px |

### Grid & Container

- **Page width**: `{layout.page}` — 1200px max, 24px gutters, 28px from `md`.
- **Document width**: 4xl (896px) on reading-heavy screens — profile, job
  detail, privacy notice.
- **Navigation width**: 940px. At 1200px on a 1280px viewport it left 40px
  margins and read as a bar rather than a floating pill.
- **Nav flow height**: `--nav-flow` — 58px on mobile, 75px from `md`. Dark
  bands mount under the navigation with a negative margin of exactly this
  value. It is a CSS variable rather than a literal precisely because a fixed
  number is wrong at one breakpoint or the other.

### Band Architecture

Every page starts with a **short dark band** directly under the navigation, in
the same `{colors.night}`, so bar and band read as one piece. The band holds
the eyebrow (optional), the page title and a count or one line of context; on
the home page it also holds the search. It is short: 40–64px of padding below
the content, not a stage.

Below the band the page continues on light surfaces. Summary panels, filters
and metrics are ordinary solid cards placed **below** the band with normal
spacing; nothing is mounted across the edge.

---

## Elevation & Depth

**There is no elevation shadow in this system, and no translucency.** Depth
comes from:

1. Surface contrast (`{colors.canvas}` → `{colors.surface}`,
   `{colors.night}` → `{colors.elevated}`)
2. A 1px `{colors.hairline}` / `{colors.hairline-d}` edge

The only two shadows are the focus halos (`{shadow.focus-accent}` —
`0 0 0 3px rgba(51,85,255,0.22)` and `{shadow.focus-accent-d}` —
`0 0 0 3px rgba(157,176,255,0.24)`). They signal state, not elevation.

No radial halos inside the dark band, no drifting auroras, no parallax.

---

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.pill}` | 9999px | Every button, tag, chip and avatar |
| `{rounded.ui}` | 10px | Inputs, selects, textareas, inline notices |
| `{rounded.icon}` | 4px | Icon containers |
| `{rounded.card}` | 24px | Cards and panels |
| `{rounded.cardlg}` | 40px | Large cards, mockups |
| `{rounded.panel}` | 42px | Full-width containers |

The full pill is not a style choice among others. Once the palette went light
and minimal, the silhouette became the thing carrying the system's identity.

---

## Motion

### Curves

- `{motion.ease-base}` — `cubic-bezier(0.22, 0.61, 0.36, 1)`. The only easing
  curve in CSS.
- `{motion.spring}` — spring, stiffness 420 / damping 32 / mass 0.9. Lives in
  `lib/motion.ts` and is applied by framer-motion only to things with physics.
- Durations: fast 0.18s · base 0.42s · slow 0.75s.

> A CSS `spring` easing was removed. A bounce curve in CSS applies to the
> entire transition list, so it overshot colours too — every hover pushed the
> fill past its target and came back.

### Rules

- All motion originates from `lib/motion.ts`. Twelve scattered effects read as
  a template; one orchestrated sequence reads as a product.
- Entrances stagger from a parent container rather than firing independently.
- Scroll reveals fire **once**. Repeating them is nauseating.
- Card hover lifts by border, background and translation — **never shadow**.
- Everything sits behind `prefers-reduced-motion`. This is not optional.

---

## Components

### Buttons

**`button-primary`** — Fill `{colors.accent}`, white text (5.41:1), in both
registers. `{rounded.pill}`, padding 11px × 22px, `{weight.mid}`. **One per
section.** `accent` is kept as an alias of `primary` so older call sites keep
working.

**`button-danger`** — Fill `{colors.danger}`, white text. Only to confirm a
destructive action in a dialog.

**`button-ghost`** — Transparent, 1px `{colors.hairline}` (or
`{colors.hairline-d}`), `{rounded.pill}`. Secondary actions. The only button
allowed coloured text — `!text-ok`, `!text-danger` — because there the colour
describes the *effect*, not the fact that it is clickable; the silhouette
already says that.

**Sizes**: `sm` 14px text, padding 8px × 18px · `md` 15px text, padding
11px × 22px. Press state `scale(0.96)`.

### Icons in Buttons — system rule

**Every button that executes or navigates carries an icon. The ones that
cancel do not.**

An action's identity comes from its shape, not its colour: a glyph is
recognisable without colour vision and does not spend the system's chromatic
budget. Five actions in five colours is noise; five actions in five glyphs is
a vocabulary.

| Icon | Meaning |
|---|---|
| `ArrowRight` | Advance to a listing or next step |
| `ExternalLink` | Open one specific record |
| `Plus` · `Pencil` · `Trash2` | Create · edit · destroy |
| `Check` · `Save` | Confirm · persist |
| `Send` | Send something to another person |
| `RotateCcw` · `EyeOff` | Repeat or revert · hide from public |
| `Ban` | Suspend an account |
| `LogIn` · `LogOut` · `UserPlus` | Session |

**Intentionally without an icon:** "Cancel" in forms and dialogs, and the nav
CTA. Cancel must be the quiet exit — a glyph puts it at the same visual weight
as the action it is avoiding.

**Sizing**: 14px on `sm`, 15px on `md`. `strokeWidth` 1.8, except `Check` at
2.0 — at 14px a thin check disappears.

### Cards & Surfaces

**`card`** — `{rounded.card}`, 28px padding, solid `{colors.canvas}` (light) or
`{colors.elevated}` (dark), 1px hairline, no shadow. `interactive` cards change
only the border on hover (`{colors.accent}` at 40% on light); they do not lift.
The old `glass` prop is accepted and ignored while the pages are cleaned up.

**`vacante-card`** — The job listing card, shared by the home page and the
listing. Title, company, **salary as the main figure** (`tabular-nums`),
modality tag, location, up to three technologies and a relative date.

### Inputs & Forms

**`input`** — 1px `{colors.hairline}` (**not 2px**), `{rounded.ui}`, padding
10px × 14px. Focus: `{colors.accent}` border plus `{shadow.focus-accent}`.
Accepts `tone="dark"` for the authentication register, which swaps surface,
text and focus halo.

**Placeholder in `{colors.muted}`, never `{colors.ink-2}`** — it must be
distinguishable from a real value.

**`field`** — label plus control plus help. Errors are announced with
`role="alert"`, not merely painted.

**`choice-cards`** — Replaces a native `<select>` when there are two or three
mutually exclusive options. The native dropdown is drawn by the operating
system and no amount of CSS gives it the dark register everywhere; more
importantly, with two options a select hides half the decision behind a click,
and when that decision **branches the form** it deserves to be visible.

It remains a real `radiogroup` with `sr-only` radios, so arrow-key navigation
comes free and the form serialises as usual. **The selection frame travels**
between cards via `layoutId` — not two borders switching on and off, but one
object changing place, which is what makes the exclusivity legible.

### Navigation

**`navbar`** — Full-width solid `{colors.night}` bar, 64px tall (`--nav-flow`),
sticky, with a 1px `{colors.hairline-d}` bottom edge. Brand on the left, links
in the middle, session controls on the right; the sign-up button is
`button-primary`. Hidden on the sign-in, registration and password screens,
which carry their own brand.

**`brand`** — The "th" monogram (32px, 9px radius, hairline edge) plus
"TalentHub". The same mark as the app icon, Play Store and favicon.

**`footer`** — Dark closing band. Brand block plus role-aware link columns.
Hidden on closed surfaces — sign-in, registration, password recovery,
checkout — where the only useful exit is the one the page itself provides.

### Pills, Tags and Status

**`tag`** — Outline pill, no fill. Colour lives in the text and in the border
at ~35% alpha, never in a saturated background competing with content. Tones:
`neutro` · `curso` · `bien` · `mal` · `marca`.

**`process-track`** — **Replaces the dot-and-label status badge**, which was
rejected as generic: that pattern appears on every AI-generated SaaS landing
page.

The four application states are a **sequence**, not loose categories:
Sent → Under review → Accepted / Rejected. The component renders three
segments filled to the position actually reached, and **only the last reached
segment carries colour**. It encodes the structure instead of decorating it,
and it works without colour vision because position already communicates
progress.

**`tabs`** — Segmented control with tab semantics. The indicator is a pill that
**travels** between segments rather than a border switching on and off.
Implements roving tabindex: only the active tab is reachable by Tab, arrows
move between tabs.

### Signature Components

**`auth-shell`** — The four session screens. Dark register throughout, with a
solid `{colors.elevated}` card and the brand above it. Adds
`[color-scheme:dark]` on selects so the native dropdown is not white, and a
Chrome autofill patch without which the dark card breaks exactly where the
browser tries to help.

---

## Do's and Don'ts

### Do

- Cut the dark band and the light body at a hard edge, always.
- Keep the dark band short: title, count, and on the home page the search.
- Give every executing or navigating button an icon from the vocabulary above.
- Use `{colors.accent}` for the brand and for interaction, and nothing else.
- Reserve colour for resolution; leave work-in-progress in full ink.
- Give every list a loading state, an empty state and an error state with a
  retry action.
- Show only real data. Derive anything shown from the API, and hide it when
  there is none.
- State the consequence in a confirmation dialog instead of asking "are you
  sure?".

### Don't

- No `box-shadow` for elevation, no `backdrop-filter`, no translucent panels.
- No radial halos, auroras, parallax, cursor-following glows or count-up
  numbers.
- No `font-bold` in a headline; nothing above 540, nothing above 52px.
- No state colour on a clickable control.
- No amber as a state colour.
- No emoji as icons. Everything comes from `lucide-react`.
- No announcement pill with a dot above the headline, no hand-written sample
  job card, no statistics row with small numbers.
- No claim the product cannot back ("market data", "verified profiles",
  review times).

---

## Responsive Behavior

| Breakpoint | Behaviour |
|---|---|
| **< 640px** | Single column. Navigation collapses to a menu button. Optional side panels are hidden rather than stacked. |
| **640–1024px** | Two-column grids. Tables scroll horizontally inside their own container; the page body never scrolls sideways. |
| **≥ 1024px** | Full composition: multi-column listings, side panels visible, sticky in-page indexes. |
| **≥ 1440px** | Content stops at 1200px; bands stay full-bleed. |

Headlines use `clamp()` throughout, so the display tier scales continuously
rather than stepping at breakpoints.

---

## Implementation Notes

Traps found while building this. Each cost real debugging time and none is
obvious from the rendered result.

**Chrome autofill ignores `background-color`.** On a dark input the only
override it honours is an inset `box-shadow`. Without the patch the dark band
breaks precisely when the browser is being helpful.

**Native `<select>` dropdowns are drawn by the OS.** Without
`[color-scheme:dark]` the option list renders white over a dark card.

**Measuring layout is not the same as seeing it.** `getBoundingClientRect`
reports where an element *is*, not what is *painted* there. Both the overflow
and margin-collapse bugs above passed every positional check while being
completely invisible on screen.
