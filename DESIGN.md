# TalentHub México — Style Reference

> Design language for a job board in the Mexican IT sector. **Dark across the
> whole site, with glass as the signature**, one brand colour that is also the
> action colour, and no elevation shadows.
>
> Tokens map one-to-one to `frontend/tailwind.config.js`. A reference written
> as `{colors.accent}` is the Tailwind key `accent`; `{typography.h2}` is the
> `fontSize` key `h2`.

---

## Overview

TalentHub is a **dark-first job board**. Every page sits on near-black with
soft colour halos behind it, and the content lives on translucent glass panels
that let those halos through. The dark register is no longer an accent
reserved for a few places: it is the whole site, because it is what people
recognised and liked.

> **What changed in phase 8.** The site went fully dark. Phase 7 had already
> fixed what made it read as generated (a hand-written sample job card,
> invented figures, no logo, the brand blue hidden behind a black/white
> primary button, no search on the home page, every page opening the same
> way). Phase 8 kept those fixes and moved the whole canvas to dark glass.

**Token names were kept when the register flipped.** `canvas`, `surface` and
`ink` used to be the light values; their *values* changed and their *names*
did not, so every page turned dark without rewriting its classes. Read
`canvas` as "the surface of cards and fields", not as white.

**Key Characteristics:**
- Near-black page (`{colors.night}`) with fixed colour halos (`mesh-page`).
- Each page is recognisable on its own: the nav marks the current section,
  the browser tab names the page, and the header changes with the job of the
  page (see *Band Architecture*).
- **Ultramarine `{colors.accent}` (#3355ff) is both the brand and the action
  colour.** Primary buttons and focus, nowhere else. On dark it is a *fill*
  with white text; as text it always resolves to `{colors.accent-on-dark}`.
- The "th" monogram (the same icon as the mobile app, Play Store and the
  favicon) next to the name in the navigation, the footer and the sign-in
  screens.
- **Glass as the signature:** translucent panels with blur and saturation
  over the halos, mounted across the edge of the dark band under the nav. No
  elevation shadows.
- **Icons over explanations:** a short label with an icon instead of a
  paragraph wherever the idea fits in three words.
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

> Contrast figures below were measured with the WCAG relative-luminance
> formula, not estimated. Glass backgrounds were measured at their effective
> colour: `rgba(255,255,255,0.06)` over `{colors.night}` paints #191919, and
> the 9% hover paints #1f1f1f.

### Brand & Accent

- **Ultramarine** (`{colors.accent}` — #3355ff): The single interactive
  colour. Fills primary actions and drives the focus border of fields.
  **5.41:1 with white on top.** As a 1px focus border it reaches 3.40:1 on
  `{colors.canvas}`, above the 3:1 that non-text indicators need. **Never as
  text on dark:** it measures 3.25–3.66:1 and fails AA. Deliberately not
  Tailwind's #2563EB, which sits at 221° and 83% saturation and is the default
  blue of half the web; this one is 230° at 100% and reads as pigment rather
  than hyperlink.
- **Ultramarine Pressed** (`{colors.accent-hover}` — #2544e6): Hover and
  active fill. 6.89:1 with white.
- **Ultramarine on Dark** (`{colors.accent-on-dark}` — #9db0ff): The accent
  whenever it is text, an icon tint or a focus ring. **9.51:1 on
  `{colors.night}`, 8.45:1 on glass.**

### Surface

| Token | Value | Use |
|---|---|---|
| `{colors.night}` | #0a0a0a | The page. Every body sits on it, with `mesh-page` halos on top. Not pure black; #0a0a0a keeps the glare down |
| `{colors.canvas}` | #141416 | Opaque cards, fields, tables |
| `{colors.surface}` | #0f0f11 | Alternate bands, segmented control troughs, disabled fields |
| `{colors.elevated}` | #161616 | Opaque cards inside a dark band |
| glass | `rgba(255,255,255,0.06)` | Glass panels and cards (effective #191919) |

`mesh-page` is the page substrate: `{colors.night}` plus four fixed radial
halos (blue, teal and a very low warm tone). Glass is a lens; without
something behind it, a translucent card looks identical to an opaque one.

### Text

| Token | Value | canvas | night | glass 6% | glass hover 9% | Use |
|---|---|---|---|---|---|---|
| `{colors.ink}` | #ededed | 15.72 | 16.91 | 15.02 | 13.92 | Primary text. **Never pure white** — it cuts glare |
| `{colors.ink-2}` | #c2c2c2 | 10.33 | 11.11 | 9.87 | 9.15 | Supporting text |
| `{colors.muted}` | #8f8f8f | 5.69 | 6.12 | 5.44 | 5.04 | Metadata, hints, timestamps, placeholders |
| `{colors.ink-d}` | #ededed | 15.72 | 16.91 | 15.02 | 13.92 | Same as `ink`; kept for components with a `tone="dark"` prop |
| `{colors.ink-2d}` | #c2c2c2 | 10.33 | 11.11 | 9.87 | 9.15 | Same as `ink-2` |
| `{colors.muted-d}` | #8a8a8a | 5.33 | 5.73 | 5.09 | 4.72 | Metadata inside dark bands |

Every text token passes AA on every surface, glass hover included. The old
rule "no `muted` in the dark third of a glass panel" belonged to the light
register and no longer applies.

### State

**Colour marks resolution, not activity.** There are exactly two.

| Token | Value | canvas | glass 6% | Use |
|---|---|---|---|---|
| `{colors.ok}` · `ok-d` | #5eead4 | 12.44 | 11.89 | Resolved in favour: accepted, published, remote, active account |
| `{colors.danger}` · `danger-d` | #f87171 | 6.65 | 6.36 | Resolved against: rejected, error, destructive action |
| `{colors.warn}` · `warn-d` | #fcd34d | 12.76 | 12.19 | Form-level notices only. **Never dresses a state** |

These are text and border colours for dark surfaces. **They are not fills:**
white on #f87171 measures 2.77:1 and fails. The destructive button fills with
its own tokens, `{colors.danger-fill}` (#dc2626, 4.83:1 with white) and
`{colors.danger-fill-hover}` (#b91c1c, 6.47:1).

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

All hairlines are white at low alpha, because every surface is dark.

- `{colors.hairline}` · `hairline-d` — rgba(255,255,255,0.10): 1px border.
- `{colors.hairline-strong}` · `hairline-d-strong` — rgba(255,255,255,0.18):
  hover, emphasised dividers.
- Glass edge (`edge-l` / `edge-d`, the same rule) — a 1px border at 8% plus a
  1px inner light line at the top (`inset 0 1px 0 rgba(255,255,255,0.14)`). An
  even border traces the whole rectangle and is read before the content.

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
- **One exception to the 52px cap: the "404" on the not-found page.** It is
  an illustration, not a headline — up to 240px, weight 540, filled with a
  white-to-transparent gradient and a 1px glass edge, and hidden from screen
  readers (`aria-hidden`). The real title of that page is its `h1`, which
  follows the normal scale. Nothing else may borrow this exception.

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
- **Navigation**: full-width bar; its content follows the 1200px page width.
- **Nav flow height**: `--nav-flow` — 64px (`h-16`) at every breakpoint. Dark
  bands mount under the navigation with a negative margin of exactly this
  value, so the page is seen passing beneath the glass bar. It is a CSS
  variable so that the bar and every band read the same number.
- **App notice column**: while the app notice card is open on desktop
  (`lg`), the page reserves a 340px right column for it and reflows with a
  padding transition when it is minimised.

### Band Architecture

Every page opens with a dark band under the nav (`PageHeader` with
`tono="oscuro"`), and what changes from page to page is what that band
carries and what crosses its edge:

- **Home** — the tallest band, with one headline, three icon claims and the
  search on a glass panel; quick searches derived from real data. Below it,
  the salary list on a glass container.
- **Listing (`/vacantes`)** — short band (`solapa={false}`) with title and
  count, then a search-and-filter toolbar on dark glass that sticks under the
  nav while scrolling.
- **Job detail** — letterhead band with the company initials tile, title,
  company and salary; the summary and the sticky action card are glass panels
  mounted across the band's edge (`glass-panel-overlap`).
- **Account pages** (profile, applications, company and validator panels) —
  band with breadcrumbs ("Mi cuenta › …") and tabs between sibling sections.
- **Closed screens** (sign-in, registration, password recovery) — `AuthShell`:
  a single dark glass card over slowly drifting auroras, with no nav and no
  footer.

The navigation marks the current section (white text and a 2px
`{colors.accent-on-dark}` line on the bar's bottom edge that slides between
items) and every page sets the browser tab title (`useTitulo`).

---

## Elevation & Depth

**There is no elevation shadow in this system.** Depth is built from:

1. Translucency plus `backdrop-filter` over the `mesh-page` halos
2. Surface steps (`{colors.night}` → glass → `{colors.canvas}`)
3. A 1px edge — `{colors.hairline}`, or `edge-l` / `edge-d` on glass
4. Overlap: panels mount ~96px (`glass-panel-overlap`) or ~52px
   (`glass-panel-overlap-sm`) over the dark band above them

The only shadows are the glass inset edge and the focus halos
(`{shadow.focus-accent}` / `{shadow.focus-accent-d}`).

**Glass rules:**
- `glass-panel` is `rgba(255,255,255,0.06)` with `blur(22px) saturate(1.6)`.
- Glass animates **position only** (`riseGlass`, `subeResorte`). A
  `backdrop-filter` element, or any ancestor of it, with `opacity < 1`
  becomes a backdrop root: the filter loses the page behind it and paints
  flat until the fade ends. See `lib/motion.ts`.
- No ancestor of a straddling panel may clip (`overflow: hidden`); a section
  that contains one needs `flow-root`.
- No `backdrop-filter` on table rows; tables stay opaque.

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

The full pill is not a style choice among others. Once the palette went
minimal, the silhouette became the thing carrying the system's identity.

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
- Lists enter with `subeResorte`: a short spring rise with a small settle,
  staggered — not a fade (glass panels must not animate opacity).
- Active indicators slide: the nav underline and the tab underline use a
  shared `layoutId`, so they travel between items instead of blinking.
- The app notice morphs: card and "Descarga la app" button are one element
  changing shape with a spring; while open, the page leaves its column free
  and reflows with a padding transition when it is minimised.
- Only two loops exist, both in the app notice: the phone floats, and a ring
  grows and fades around the app icon. Both animate `transform` and
  `opacity` only, never `box-shadow`, which repaints on every frame.

### Reduced motion

`prefers-reduced-motion` is honoured in both layers, and it removes
**displacement**, not feedback:

- **framer-motion:** the app is wrapped in `<MotionConfig reducedMotion="user">`,
  so springs, rises, `layoutId` slides and `whileTap` stop moving while
  opacity and colour changes remain.
- **CSS (`index.css`):**
  - the loops (`flotar`, `latido`) and the skeleton pulse stop;
  - hover lifts and press scales are cancelled;
  - smooth scrolling is turned off;
  - colour, border and opacity transitions stay, shortened to 0.12s;
  - loading spinners keep turning, because they are the only signal that
    work is still in progress.

A global `0.01ms` cut is deliberately not used: it also erased the cue that a
state had changed.

---

## Components

### Buttons

**`button-primary`** — Fill `{colors.accent}`, white text (5.41:1).
`{rounded.pill}`, padding 11px × 22px, `{weight.mid}`. **One per section.**
`accent` is kept as an alias of `primary` so older call sites keep working.

**`button-danger`** — Fill `{colors.danger-fill}`, white text (4.83:1); hover
`{colors.danger-fill-hover}` (6.47:1). Only to confirm a destructive action in
a dialog, and it stays the calmest button there: no effects that invite the
click.

**Links that look like buttons** use `clasesBoton()` on the `<Link>` itself.
Never a `<Button>` inside a `<Link>`: two nested interactive elements make a
screen reader announce two controls and keyboard focus land twice in the same
place.

**`button-ghost`** — Transparent, 1px `{colors.hairline}`, `{rounded.pill}`.
Secondary actions. The only button allowed coloured text — `!text-ok`,
`!text-danger` — because there the colour describes the *effect*, not the
fact that it is clickable; the silhouette already says that.

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

The names are the ones exported by `frontend/src/components/icons.tsx`, which
maps them to Phosphor duotone glyphs.

**Intentionally without an icon:** "Cancel" in forms and dialogs, and the nav
CTA. Cancel must be the quiet exit — a glyph puts it at the same visual weight
as the action it is avoiding.

**Sizing**: 14px on `sm`, 15px on `md`. `strokeWidth` 1.8, except `Check` at
2.0 — at 14px a thin check disappears.

### Cards & Surfaces

**`card`** — `{rounded.card}`, 28px padding, no shadow. Opaque by default
(`{colors.canvas}` with a hairline); with `glass`: `rgba(255,255,255,0.06)`
plus `backdrop-blur` and `backdrop-saturate`, with the glass edge.
`interactive` lifts by border, background and translation — never shadow.

**`glass-panel`** — the signature panel, mounted across the edge of the dark
band (home search, job detail summary and action card) or loose on
`mesh-page`.

**`vacante-card`** — the job card on the listing: glass card with the
company initials, the salary as the main figure (`tabular-nums`), modality,
location, up to three technologies and a relative date. The title link's
`after` covers the whole card, so a screen reader announces a single link,
and its focus ring outlines the whole card.

**`iniciales`** — the company tile: up to two initials on a low tint chosen
from the company name, so the same company always gets the same tone. Tints
are blue, teal, violet, rose and neutral; **no amber**, for the same
colour-blindness reason it is not a state colour.

### Inputs & Forms

**`input`** — 1px `{colors.hairline}` (**not 2px**), `{rounded.ui}`, padding
10px × 14px, on `{colors.canvas}`. Focus: `{colors.accent}` border plus
`{shadow.focus-accent}`. `tone="dark"` (inside dark bands and the
authentication screens) uses a 4% white fill and focuses with
`{colors.accent-on-dark}` at 55% plus `{shadow.focus-accent-d}`.

**Placeholder in `{colors.muted}`, never `{colors.ink-2}`** — it must be
distinguishable from a real value.

**Search fields without a border** (home search) mark focus on the whole
field: the same border and halo as `input` in dark tone, appearing on
`focus-within`.

**`field`** — label plus control plus help. Errors are announced with
`role="alert"`, not merely painted.

**`choice-cards`** — Replaces a native `<select>` when there are two or three
mutually exclusive options. With two options a select hides half the
decision behind a click, and when that decision **branches the form** it
deserves to be visible.

It remains a real `radiogroup` with `sr-only` radios, so arrow-key navigation
comes free and the form serialises as usual. **The selection frame travels**
between cards via `layoutId` — not two borders switching on and off, but one
object changing place, which is what makes the exclusivity legible.

### Navigation

**`navbar`** — Full-width dark glass bar, 64px tall (`--nav-flow`), sticky,
`bg-night/60` with `blur(28px)` and saturation and a 1px `{colors.hairline-d}`
bottom edge. 60% black is the floor: with links at 90% white it is the least
opacity that still passes AA (4.61:1) even when pure white passes beneath.
The current section is marked with a 2px `{colors.accent-on-dark}` line on the
bar's bottom edge.

**`brand`** — The "th" monogram (32px, 9px radius, hairline edge) plus
"TalentHub". The same mark as the app icon, Play Store and favicon.

**`footer`** — Closing band. Brand block plus role-aware link columns.
Hidden on closed surfaces — sign-in, registration, password recovery,
checkout — where the only useful exit is the one the page itself provides.

### Pills, Tags and Status

**`tag`** — Outline pill, no fill. Colour lives in the text and in the border
at ~35% alpha, never in a saturated background competing with content. Tones:
`neutro` · `curso` · `bien` · `mal`. **There is no blue tone:** a tag is not
pressable, and a blue tag reads as a button. Modality: "Remoto" in `bien`,
"Híbrido" and "Presencial" in `curso`.

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

**`auth-shell`** — The session screens. Dark glass card (`edge-d`) over slowly
drifting auroras — glass over flat black refracts nothing — and the brand
above it. The auroras stop under reduced motion. The whole document declares
`color-scheme: dark`, so native selects and date pickers open dark, and a
Chrome autofill patch keeps the dark field intact exactly where the browser
tries to help.

**`app-promo`** — The app notice, visible until the visitor signs in. On
desktop a floating card with a QR code and a drawn phone that turns into a
"Descarga la app" button when minimised; on mobile a bottom bar with
"Descargar".

---

## Do's and Don'ts

### Do

- Open every page with its dark band and let glass cross its edge.
- Keep the dark band short: title, count, breadcrumbs and tabs, and on the
  home page the search.
- Give every executing or navigating button an icon from the vocabulary above.
- Use `{colors.accent}` for the brand and for interaction, and nothing else.
- Use `{colors.accent-on-dark}` whenever the accent is text or an icon tint.
- **Blue icons are brand; blue text, borders and fills are action.** A blue
  icon next to a label may decorate anything. Blue text, a blue border or a
  blue container fill only goes on something that can be pressed, so icon
  circles on non-interactive content are neutral (hairline border, 4% white).
- Reserve colour for resolution; leave work-in-progress in full ink.
- Give every list a loading state, an empty state and an error state with a
  retry action.
- Show only real data. Derive anything shown from the API, and hide it when
  there is none.
- State the consequence in a confirmation dialog instead of asking "are you
  sure?".
- Measure every new colour pair against WCAG AA on the surface where it is
  painted, glass included.

### Don't

- No `box-shadow` for elevation. Ever.
- No `{colors.accent}` (#3355ff) as text on dark: 3.4:1 fails.
- No state colour as a button fill with white text (#f87171 gives 2.77:1).
- No opacity animation on glass or on any ancestor of glass.
- No `backdrop-filter` on table rows.
- No parallax, cursor-following glows or count-up numbers.
- No `font-bold` in a headline; nothing above 540, nothing above 52px.
- No state colour on a clickable control.
- No amber as a state colour.
- No emoji as icons. Everything comes from Phosphor (duotone) through `frontend/src/components/icons.tsx`, the same family as the mobile app; the duotone fill is tinted `{colors.accent-on-dark}`, grey on metadata and white on blue buttons.
- No announcement pill with a dot above the headline, no hand-written sample
  job card, no statistics row with small numbers.
- No claim the product cannot back ("market data", "verified profiles",
  review times).

---

## Responsive Behavior

| Breakpoint | Behaviour |
|---|---|
| **< 640px** | Single column. Navigation collapses to a menu button. Optional side panels are hidden rather than stacked. The app notice is a bottom bar. |
| **640–1024px** | Two-column grids. Tables scroll horizontally inside their own container; the page body never scrolls sideways. |
| **≥ 1024px** | Full composition: multi-column listings, side panels visible, sticky in-page indexes. The app notice floats in its own 340px column. |
| **≥ 1440px** | Content stops at 1200px; bands stay full-bleed. |

Headlines use `clamp()` throughout, so the display tier scales continuously
rather than stepping at breakpoints.

---

## Implementation Notes

Traps found while building this. Each cost real debugging time and none is
obvious from the rendered result.

**Chrome autofill ignores `background-color`.** On a dark input the only
override it honours is an inset `box-shadow` (`.input-dark` in `index.css`).
Without the patch the field turns pale yellow precisely when the browser is
being helpful.

**Native `<select>` dropdowns are drawn by the OS.** Without
`color-scheme: dark` the option list renders white over a dark card.

**Opacity flattens glass.** An element with `opacity < 1`, or any of its
ancestors, becomes a backdrop root and the `backdrop-filter` paints flat until
the fade reaches 1. That was the "the card takes a few seconds to pick up the
gradient" bug; entrances on glass animate position only.

**Measuring layout is not the same as seeing it.** `getBoundingClientRect`
reports where an element *is*, not what is *painted* there. Clipped glass
panels and collapsed margins passed every positional check while being
visibly wrong on screen.
