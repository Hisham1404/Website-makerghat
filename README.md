# MakerGhat — "Our Story"

A recreation of the MakerGhat **Our Story** page from its Figma design, built with Angular 22.

- **Live demo:** <https://makerghatdemo.vercel.app/about-us/our-story>
- **Design source:** [Figma — MG Our Story](https://www.figma.com/design/11QoixG96b31FhhVDYiteD/MG-Our-Story-?node-id=7278-16487)
- **Live reference site:** <https://makerghat.org/about-us/our-story>

---

## Requirements → where they are met

| Requirement | How |
|---|---|
| Match the Figma design closely | Every coordinate is **measured** off the 1440×4503 export, not eyeballed — see [Development approach](#development-approach) |
| Fully responsive: desktop, tablet, mobile | Three strategies, one per range — [Responsive strategy](#responsive-strategy) |
| Clean, maintainable, well-structured code | Data-driven components, no magic numbers without a cited measurement, 267 tests |
| Good coding standards and best practices | Standalone zoneless components, `OnPush`, typed data modules, semantic landmarks, WCAG-sized touch targets |
| Compatible with the existing makerghat.org structure | Their own design tokens are inherited verbatim — [Compatibility](#compatibility-with-makerghatorg) |

---

## Running locally

Requires **Node 22.22+** (developed on 24.20).

```bash
npm install
npm start      # dev server on http://localhost:4200
npm test       # 267 unit tests (Vitest)
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
half. That one rule fixed both the size *and* the position of all thirteen
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
floor by 40px or more, which is *why* the road steps where it does. A flex row
cannot produce that, so each chip, photograph and decor piece carries its own
measured lane coordinate and `.journey` is a `container-type: inline-size`, which
lets every placement be a fraction of the lane's own width (`n / 1184 * 100cqw`).
The whole composition then scales with the panel instead of being pinned to 1280.

### Testing

267 tests, run with `npm test`. They are not coverage theatre — they pin the
**measurements** so a later tidy-up cannot quietly undo them, and each one cites
the number it protects. A representative example:

> `it('steps the lane 1 to lane 2 boundary down 42px')` — because the first build
> drew it flat.

Several were written *after* a bug reached the browser, to stop it coming back:
the mask that painted over the drawn road, the specificity trap that kept a
two-column grid alive on a 390px screen, the negative margin that made a
photograph erase the road behind it.

---

## Responsive strategy

The Figma ships **one 1440 artboard and no narrow ones**, so only the desktop
layout is a reproduction — tablet and mobile are design decisions, made to keep
the page readable rather than to shrink a fixed picture.

| Range | Approach |
|---|---|
| **≥1024** | The measured layout. Every edge lands within 1px of the export. |
| **768–1023** | The two-column stagger survives, but the numbers that are *facts about a 1280 panel* do not: columns split evenly rather than 589/531, the road lane's inset drops from 80px to 32px, and the cut-outs shrink so they stay inside their own column. Without this the copy wrapped onto eleven lines where the design has five. |
| **<768** | One column. The road flattens to a single left rail that runs unbroken from the origin card through every year to a terminus dot, and each text block is paired with its own photograph. |

Verified with real viewport resizes at 320, 375, 390, 414, 600, 768, 819, 1009,
1280 and 1440: no horizontal page overflow, no touch target under 24×24, no text
under 12px.

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
