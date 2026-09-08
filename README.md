# MakerGhat — "Our Story"

A recreation of the MakerGhat **Our Story** page from its Figma design, built with Angular 22.

- **Live demo:** <https://makerghatdemo.vercel.app/about-us/our-story>
- **Design source:** [Figma — MG Our Story](https://www.figma.com/design/11QoixG96b31FhhVDYiteD/MG-Our-Story-?node-id=7278-16487)
- **Live reference site:** <https://makerghat.org/about-us/our-story>

---

## Requirements → where they are met

| Requirement                                          | How                                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Match the Figma design closely                       | Every coordinate is **measured** off the 1440×4503 export, not eyeballed — see [Development approach](#development-approach) |
| Fully responsive: desktop, tablet, mobile            | Three strategies, one per range — [Responsive strategy](#responsive-strategy)                                                |
| Clean, maintainable, well-structured code            | Data-driven components, no magic numbers without a cited measurement, 350 tests                                              |
| Good coding standards and best practices             | Standalone zoneless components, `OnPush`, typed data modules, semantic landmarks, WCAG-sized touch targets                   |
| Compatible with the existing makerghat.org structure | Their own design tokens are inherited verbatim — [Compatibility](#compatibility-with-makerghatorg)                           |

---

## Running locally

Requires **Node 22.22+** (developed on 24.20).

```bash
npm install
npm start      # dev server on http://localhost:4200
npm test       # 350 unit tests (Vitest)
npm run build  # production bundle into dist/our-story/browser
```

---

## Project structure

```
src/
├─ app/
│  ├─ app.ts / app.html / app.css      Shell: skip link, <main id="main-content">
│  ├─ app.routes.ts                    /about-us/{our-story,team,support-system,vol-alum}
│  │
│  ├─ data/                            Content and measurements — no markup, no styling
│  │  ├─ our-story.ts                  Hero, intro copy, origin block, photo sizes
│  │  ├─ milestones.ts                 The nine year chips, their media, and their
│  │  │                                measured lane coordinates
│  │  ├─ road.ts                       The green road: 22 traced points + 10 markers
│  │  ├─ navigation.ts / about-tabs.ts / footer.ts
│  │
│  ├─ layout/                          Chrome shared by every tab
│  │  ├─ site-header/                  7-item nav, CSS-only dropdowns, mobile drawer
│  │  ├─ about-tabs/                   The four pastel section tabs
│  │  └─ site-footer/                  Skyline, link columns, contact, socials
│  │
│  ├─ pages/
│  │  ├─ our-story/                    The page itself
│  │  │  ├─ our-story.*                Title, hero, intro band, origin box
│  │  │  └─ timeline/                  The serpentine year timeline and its road
│  │  └─ stub/                         Honest placeholder for the three tabs the
│  │                                   Figma does not design
│  └─ shared/
│     ├─ chunk.ts                      Group milestones into rows
│     └─ road-path.ts                  Polyline → SVG path with rounded corners
│
├─ styles/
│  ├─ tokens.css                       MakerGhat's palette, type scale, spacing
│  └─ layout.css                       Panel, container, breakpoints
└─ testing/css-rules.ts                Test-only exact CSS rule reader

design/ourstory-figma.jpg              The 1440×4503 export every number came from
docs/task2-plan.md                     Architecture notes and the measured token audit
```

---

## Development approach

### Measure, don't eyeball

The single most useful decision was to stop reading screenshots and start scanning
the export with a pixel script. Reading screenshots produced three confident,
wrong conclusions early on — that the page ground was cream, that the hero was
490px and full-bleed, and that the section headings were 44px. Scanning
`design/ourstory-figma.jpg` overturned all three.

Every number in the CSS therefore carries the measurement it came from, in a
comment beside it. For example the green road's stroke:

> Sampled inside the stroke: `rgb(88, 172, 110)`, eleven rows of solid colour at
> y=2228 — ten CSS pixels, not the 5px hairline it was first built as.

### The 2×-render-at-half rule

Every photograph is a 2× Figma node render, and the design draws each at exactly
half. That one rule fixed both the size _and_ the position of all thirteen
images, because several have transparent margins baked in — the girls cut-out
carries 100px of empty space down its left edge, so its **box** starts at panel
x=96 for its **ink** to start at the measured x=146.

The nine timeline photographs were located by **template-matching each asset
against the export** (FFT cross-correlation masked to the asset's own alpha)
rather than by reading colour bounding boxes, because the artwork overlaps too
heavily for that. All nine matched at half their render.

### The road is one path

The green road is a single continuous stroke in the design, and it does four
things that stacked box-borders cannot express:

- the lane 1→2 boundary **steps down 42px** at x=871;
- the lane 2→3 boundary **meanders** — it climbs 268px, jogs left, and drops
  again, dodging the 2022 photograph that hangs below its lane;
- one rail runs y=2598→3030, spanning **two lanes at once**;
- it **ends**, at a filled dot, rather than closing.

So above the tablet breakpoint the lanes draw no borders at all: `data/road.ts`
holds 22 traced centre-line points and `shared/road-path.ts` turns them into one
SVG path with 11px corners. Below it, the road is genuinely one straight rail and
a CSS border draws it perfectly well.

### The lanes are an artboard, not a row

Nothing in a timeline lane shares a baseline in the design — the 2018 chip sits
36px below its top stroke and the 2019 chip 30px; photographs overhang their lane
floor by 40px or more, which is _why_ the road steps where it does. A flex row
cannot produce that, so each chip, photograph and decor piece carries its own
measured lane coordinate and `.journey` is a `container-type: inline-size`, which
lets every placement be a fraction of the lane's own width (`n / 1184 * 100cqw`).
The whole composition then scales with the panel instead of being pinned to 1280.

### Testing

350 tests, run with `npm test`. They are not coverage theatre — they pin the
**measurements** so a later tidy-up cannot quietly undo them, and each one cites
the number it protects. A representative example:

> `it('steps the lane 1 to lane 2 boundary down 42px')` — because the first build
> drew it flat.

Several were written _after_ a bug reached the browser, to stop it coming back:
the mask that painted over the drawn road, the specificity trap that kept a
two-column grid alive on a 390px screen, the negative margin that made a
photograph erase the road behind it.

---

## Responsive strategy

The Figma ships **one 1440 artboard and no narrow ones**, so only the desktop
layout is a reproduction — tablet and mobile are design decisions, made to keep
the page readable rather than to shrink a fixed picture.

| Range        | Approach                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **≥1024**    | The measured layout. Every edge lands within 1px of the export.                                                                                                                                                                                                                                                                                                                                |
| **768–1023** | The two-column stagger survives, but the numbers that are _facts about a 1280 panel_ do not: columns split evenly rather than 589/531, the road lane's inset drops from 80px to 32px, and the cut-outs shrink so they stay inside their own column. Without this the copy wrapped onto eleven lines where the design has five.                                                                 |
| **<768**     | One column, and the page chrome follows makerghat.org rather than the Figma, which has nothing to say about phones. The cream panel goes full-bleed, the About Us tab bar is hidden and its four destinations move into the drawer, and the road **still snakes** — one turn per milestone, drawn from alternating half-width border boxes. Each text block is paired with its own photograph. |

Below 768 the reference is **their live site, measured**, not a guess. Their
`.tab-content` is x=0 and viewport-wide at 375, 600 and 768 but x=80 w=1280 at
1440; their `div.tabs` computes `display: none` on phones; and their About Us
page runs the same serpentine road, one card per turn, out of a 157.6px box in a
315.2px container. The mobile road is built the same way for a reason that is
not fidelity: a year chip is a disclosure, so opening one changes a lane's
height — opening 2023 grows it from 256px to 540px — and every joint still
measures 10.00px, where a drawn path with baked geometry would need JS to
re-measure on each toggle.

Verified with real viewport resizes at 320, 375, 390, 414, 600, 768, 819, 1009,
1280 and 1440: no horizontal page overflow, no touch target under 24×24, no text
under 12px.

---

## Accessibility

Audited with **axe-core 4.10.2** run against the real page — not the test DOM —
at 375 and 1440, in four states: closed, accordion open, drawer open, and on a
second route. Ruleset `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa,
best-practice`.

**Result: 0 violations, 44–45 checks passing per state.**

The audit found three things, and two of them axe could not have caught:

| Found                                          | Why it mattered                                                                                                                                                                                                                  | Fix                                                                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Muted text on purple was 4.11:1**            | AA wants 4.5 for text this size. 17 nodes — the footer's licence line and every sub-link in the drawer.                                                                                                                          | `--color-on-primary-muted: #b6afcc`, the first tone up the ramp that clears it at **4.53:1**, and only 12% lighter so it still reads a step quieter than its parent. |
| **The focus ring was invisible on the drawer** | `:focus-visible` draws `3px solid var(--color-primary-500)` and the drawer's background _is_ that colour — a **1:1** ring. A keyboard user in the mobile menu could not see where they were. axe does not evaluate focus styles. | White ring inside the panel: **9.51:1**.                                                                                                                             |
| **The drawer did not contain focus**           | It is `position: fixed; inset: 0`, so everything behind it is hidden — but it was all still tabbable, and Tab past the last link walked into a `<main>` the user cannot see. That is WCAG 2.2 **2.4.11 Focus Not Obscured**.     | Focus moves in on open, returns to the toggle on close, and Tab wraps inside the panel.                                                                              |

Contrast, computed from the tokens rather than eyeballed:

| Pair                                          | Ratio |                                          |
| --------------------------------------------- | ----- | ---------------------------------------- |
| purple `#4A3A80` on cream `#F9F4E8`           | 8.67  | ✅                                       |
| black on cream                                | 19.13 | ✅                                       |
| white on purple                               | 9.51  | ✅                                       |
| `--color-on-primary-muted` on purple          | 4.53  | ✅                                       |
| _(was)_ `--color-primary-100` on purple       | 4.11  | ❌ fixed                                 |
| newsletter label `#4D2117` on coral `#F1805E` | 5.17  | ✅                                       |
| _white_ on coral                              | 2.63  | ❌ — which is why the label is not white |

That last row is worth keeping: the build plan predicted the coral button would
be this palette's one contrast failure. It is not — the label was already dark
brown. A test now pins that, so nobody "tidies" it to white.

Also in place, and covered by tests rather than asserted here: one `<h1>` with
`<h2>`s under it, `header`/`main`/`footer` landmarks, a skip link that is the
first tab stop and lands on a focusable `main`, `aria-current="page"` on the
active tab, `aria-expanded` disclosures that work from the keyboard with Escape
to close, decorative artwork at `aria-hidden` / `alt=""`, and
`prefers-reduced-motion` honoured.

**One deliberate divergence from makerghat.org:** their drawer's menu rows are
about 21px tall. That is below the 24×24 minimum this build holds itself to, so
ours are 40–48px and all 20 links cannot fit one screen the way their 25 do.

Their layout still dictates the structure, though. Their `.menu` is a fixed
522px box with `overflow: hidden` that never scrolls, and the artwork sits
immediately under it, always on screen. So here the **panel does not scroll and
neither does its chrome** — the logo, the close button and the illustration stay
put, and the **link list alone** is the scroll container. Scrolling the whole
panel instead, as this first did, pushed the artwork ~480px below the fold and
took the close button with it.

The illustration is capped at `32vh`. Its height follows the panel's _width_, so
on a phone in landscape (667×375) it rendered **569px tall inside a 375px panel
and squeezed the link list to zero** — the menu could not be used at all. A
height media query would not have caught that, because the trigger is the width.
It now crops from the top, which keeps the hands sitting on the panel floor.

**Known limitation:** `:focus` styles could not be verified at runtime in the
automation used here — the browser pane never holds document focus, so `:focus`
never matches and any such check reports a false negative. The focus rules are
verified at source level instead, and confirmed by reasoning about the token
values. Worth a manual keyboard pass on a real browser before submission.

---

## Compatibility with makerghat.org

The live site is a Create React App SPA. Rather than guess at what "compatible"
means across two different frameworks, the answer is taken at the layer that
actually transfers: **their own design system.** `src/styles/tokens.css` inherits
the values parsed out of the live site's stylesheet — the palette
(`--color-primary-500: #4A3A80`, `--color-secondary-500: #F1805E`), the type
scale, the `1280px` container and the `768 / 500` breakpoints — so this page
drops into their token set without a visual seam.

Class names are this project's own rather than copies of theirs, to avoid
colliding with a stylesheet this repo does not control.

---

## Assumptions

1. **The Figma is a redesign, not the live page,** and where they disagree the
   Figma wins. It has no "Awards" tab, draws carets on only three nav items, and
   gives the footer two link columns where the live site has four. All three are
   reproduced as drawn.
2. **The origin story copy really is lorem ipsum** in the design
   ("MG origin story featuring founders, Lorem ipsum dolor sit amet…") and ships
   verbatim rather than being invented.
3. **Tablet and mobile are unspecified** — see [Responsive strategy](#responsive-strategy).
4. **Angular, though the brief names no framework.** The live site is React, but
   shipping code I could not explain in an interview seemed the worse trade;
   every technique here maps one-to-one onto React, and the compatibility promise
   is kept at the token layer, which is framework-neutral.
5. **Three of the four section tabs have no design.** They route to a labelled
   placeholder rather than redirecting, so the tab bar behaves as drawn.
6. **Seven small decorative glyphs are absent** — a wrench, a temple, covid
   marks, a purple rule, a stair-step and two coral sparks. They are separate
   Figma nodes that were not in the asset export, and are noted rather than
   approximated. Everything structural is present.
7. **`y2019-coin.webp` appears to be the wrong node export** (106×66 against a
   declared 117×122 that is not even its own aspect ratio), so its decor glyph is
   placed but does not match the design.

---

## Deployment

**Live:** <https://makerghatdemo.vercel.app/about-us/our-story> (Vercel)

The production build is a fully static bundle:

```bash
npm run build          # → dist/our-story/browser
```

It needs a host with a **single-page-app rewrite**, so that deep links like
`/about-us/our-story` serve `index.html` and resolve client-side rather than
404ing. On Vercel that is one rule in `vercel.json`; the Netlify equivalent is a
single line in `_redirects`:

```
/*  /index.html  200
```

---

## Licence and attribution

Brand assets (logos, photographs, illustrations) belong to MakerGhat and are used
here solely for this recreation exercise. The MakerGhat site publishes its
content under **CC BY-SA 4.0**, as declared in its own footer.
