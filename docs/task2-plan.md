# Task 2 — "Our Story" page: frontend architecture

> Architecture notes for Task 2 of the MakerGhat pre-work assignment.
> Figma: `11QoixG96b31FhhVDYiteD` — frame **OurStory, 1440 × 4503**, desktop only.
> Live cross-reference: https://makerghat.org/about-us/our-story

---

## 0. What was measured (2026-09-06), not assumed

| Question | Answer | How it was established |
|---|---|---|
| What is makerghat.org built with? | **Create React App**, client-side routed SPA | `#root` present, `__NEXT_DATA__` absent, single bundle `static/js/main.bc5d4986.js` |
| Does the Figma have tablet/mobile frames? | **No — one 1440 frame only** | Zoom-to-fit on the whole canvas; only artboard is `OurStory 1440 × 4503` |
| Is the Figma the page that is live today? | **No. It is a redesign.** | See §1 delta table |
| Are there design tokens to inherit? | **Yes — 176 CSS custom properties** | Parsed `static/css/main.ec5aa4f4.css` |
| What breakpoints does their site use? | 768 (37 rules), 500 (35), then 1024 / 920 / 830 / 615 | Media-query histogram of the same file |
| Container width | `--container-width: 1280px` (100% below tablet) | token |

### Inherited tokens (copy these verbatim — this *is* "compatible with the existing structure")

```
--color-primary-500  : #4A3A80   /* headings, footer, nav */
--color-secondary-500: #F1805E   /* CTA buttons, accents  */
--color-green-500    : #66C67F   /* timeline path         */
--color-green-600    : #58AD6F   /* the 3px path stroke   */
--color-yellow       : #FFBD00
--color-neutral-50   : #F9F4E8   /* page cream background */
--color-neutral-200  : #EAD8B5   /* milestone card fill   */
--font-parkinsans / --font-outfit / --font-bungee   (+ Nunito loaded)
--font-size-8 … --font-size-90, --line-height-12 … --line-height-90
--header-video-desktop: 490px | -tablet: 320px | -mobile: 220px
```

Verified rendered values: `h1.title` = Parkinsans, **48px**, `#4A3A80`. Body font Parkinsans; tabs and
milestone cards use Outfit 18/24.

---

## 1. Figma vs. live — build the Figma, borrow from the live

The live page is a **simpler earlier cut** of the same content. This matters: cloning the live DOM would
lose marks, and ignoring the live CSS would throw away free compatibility.

| | Live today | Figma (build this) |
|---|---|---|
| Intro / mission | Text + **one flat `Desktop.png`** carrying every doodle | Composed collage: text, cutout photos, individual vector doodles |
| "How did MG start" | **absent** | Present — bordered card, text left / group photo right |
| Timeline | Serpentine rows of 3 plain cream cards | Serpentine **illustrated path**: year chips with a `▾` caret, photo collages and doodles along the route |
| Year node | Always-open card | **Collapsed chip → expands to a bullet list** (expanded states exist as separate Figma frames) |
| End of timeline | Green dot | Purple **city-skyline silhouette** bleeding into the footer |
| Tabs | MakerGhat Story / MakerGhat Team / Volunteers & Alumni / **Awards** | MakerGhat story / MakerGhat team / **Support system** / Volunteers & Alumni — *different third tab, no Awards, lower-case second word* |
| Header nav | Carets on six of seven items | Carets on **Space, Evidence, Get involved only**; casing is "About us", "Get involved" |
| Footer | Four link columns (MG Pillars / Programs / Resources) + a Partner/Careers/Volunteer/Donate row | **Two columns only** — Resources, FAQs — plus Connect with Us, contact, logo, subscribe, socials, licence |

**Assumption to record in the README:** the Figma is treated as the source of truth; the live site is used
only for tokens, header, footer and copy.

---

## 2. Stack

### Does the assignment mandate one? No — verified against the source PDF

Task 2's requirements, verbatim (p.4): *match the Figma closely · fully responsive for Desktop, Tablet and
Mobile · clean, maintainable, well-structured code · good coding standards and best practices · **ensure the
implementation is compatible with the existing MakerGhat.org website structure***.

**No framework is named anywhere in the document.** Task 1 lists six tools by name (Whisper, Faster-Whisper,
HF, SpeechBrain, PyAnnote, Google STT); Task 2 lists none. So Angular, Vue, or plain HTML are not forbidden
by the letter of the brief.

### React vs Angular — the real trade

The case for React is their compatibility bullet: makerghat.org is a measured CRA React SPA, so a React
component pastes into it and an Angular build does not.

The case against is that **the author has zero React experience.** A submission you cannot defend line by
line in an interview is worth less than a slightly less compatible one you can. That outweighs the
"close the React gap" argument — you do not close a gap by shipping code you cannot explain.

**Decision: Angular, with the compatibility bullet answered at the layer that actually transfers.**

Every technique in this document is framework-agnostic. Nothing in the design needs React. See §2b.

### §2b — Angular mapping (1:1, no compromises in the design)

| Plan element | React | Angular | Verdict |
|---|---|---|---|
| Component tree (§3) | function components | standalone components | identical |
| Content as data (§4) | `milestones.js` | `milestones.ts` + `interface Milestone` | **Angular better** — typed |
| `chunk(milestones, perRow)` | pure fn | same pure fn | identical |
| Serpentine layout (§5) | CSS | CSS | identical — it is all CSS |
| Accordion state | `useState` | `signal()` / class field | identical |
| `aria-expanded` binding | `aria-expanded={open}` | `[attr.aria-expanded]="open()"` | identical |
| Per-component styles (§6) | CSS Modules (extra config) | `styleUrl` + emulated encapsulation | **Angular better** — built in |
| Global tokens | import in `main.jsx` | `styles` array in `angular.json` | identical |
| Four `/about-us/*` routes | `react-router-dom` | Angular Router child routes | identical |
| Active tab styling | `NavLink` + `aria-current` | `routerLinkActive` + `[attr.aria-current]` | identical |
| Repeating rows/nodes | `.map()` | `@for` | identical |
| Conditional decor | `&&` | `@if` | identical |
| Responsive images | `<picture>`, `loading="lazy"` | same | identical |
| Inline SVG doodles | SVG components | SVG in template | identical |
| Unit tests | Vitest + RTL | **Vitest + jsdom** — the v22 CLI default | identical coverage |
| Static deploy | `vite build` → `dist/` | `ng build` → `dist/<app>/browser` | see gotchas |

**Three Angular-specific gotchas, all cheap:**
1. `ng new` offers SSR/SSG — **answer No.** This must be a static build for Netlify/Vercel.
2. The build output is `dist/<app-name>/**browser**/` in modern Angular. Point the host's publish
   directory there, not at `dist/`. Getting this wrong is the classic blank-page deploy.
   *(Confirmed in Phase 1.)*
3. Specs that read project files off disk need `@types/node` installed and `"node"` added to
   `tsconfig.spec.json` types. `?raw` imports do **not** work — the Angular builder resolves `.css`
   through its own pipeline and hands back an object, not a string.

**How the compatibility bullet is then satisfied** — and this is the README's most important paragraph:

> The page is built in Angular, but compatibility with makerghat.org was designed for at the layer that
> actually transfers between frameworks: it reuses MakerGhat's own 176 CSS custom properties, their
> breakpoints (768 / 500), their container width (1280px) and their webfonts. Class names are this
> project's own — the tokens carry the compatibility, and copying their internal selector names would
> add coupling without adding value. The markup is semantic and framework-neutral, so porting a
> component into their React app is a copy of the template and stylesheet plus a `.map()` — the design
> system, not the framework binding, is the expensive part to reproduce, and that part is already
> theirs.

That is a defensible engineering answer, not a dodge — it shows the constraint was understood and traded
deliberately. Say it plainly in the interview too: *"I built it in Angular because that is where I am
production-fluent, and I made the CSS and markup layer portable rather than pretending to a React
fluency I do not have yet."*

| Layer | Choice | Why |
|---|---|---|
| Framework | **Angular 22** — standalone components, signals, **zoneless** (all v22 defaults) | Where the author is production-fluent; every technique here maps 1:1 (§2b). |
| Routing | Angular Router, child routes under `/about-us` | Their tabs are real routes (`/our-story`, `/team`, `/vol-alum`, `/awards`). Keep the same paths. |
| Styling | **Plain CSS on their token file**, per-component `styleUrl` | *Deliberately not Tailwind or Angular Material.* Their codebase is hand-written CSS driven by custom properties; Material would fight it. |
| State | None. One `signal` for the accordion. | There is no server state on this page. |
| Content | Typed data modules | §4 |
| Tests | Vitest + jsdom (the v22 CLI default) | Two things are worth testing: the accordion and the row-chunking maths. |
| Host | Netlify or Vercel, **with an SPA rewrite** | §9 |

Zero runtime dependencies beyond Angular itself. No UI kit, no animation library, no Angular Material.

---

## 3. Component tree

```
App
└─ Layout
   ├─ SiteHeader
   │    ├─ Logo
   │    ├─ DesktopNav      (7 dropdown menus — data-driven, §4)
   │    └─ MobileNav       (hamburger → drawer, <768)
   ├─ <main>
   │   └─ AboutTabs        (the pill tab bar + <Outlet/>)
   │      └─ OurStoryPage
   │         ├─ PageTitle             "The story that built MakerGhat"
   │         ├─ HeroMedia             full-bleed, 490 / 320 / 220
   │         ├─ IntroSection
   │         │    ├─ TextBlock  ×2    ("Our mission", "Why making?")
   │         │    └─ Decor            doodles + cutout photos
   │         ├─ HowWeStarted          bordered card: copy left, photo right
   │         ├─ StoryTimeline   ◀── the whole task lives here
   │         │    ├─ TimelineRow ×N
   │         │    │    ├─ TimelineConnector   (CSS U-turn, not SVG)
   │         │    │    ├─ MilestoneNode ×n
   │         │    │    │    ├─ YearChip       <button aria-expanded>
   │         │    │    │    └─ MilestoneCard  bullet list
   │         │    │    └─ TimelineDecor       photos/doodles for that row
   │         │    └─ TimelineEndCap
   │         └─ SkylineDivider
   └─ SiteFooter
        ├─ FooterNavColumns
        ├─ NewsletterForm
        ├─ SocialLinks
        └─ LicenseNote     "CC BY-SA 4.0"
```

Rule of thumb applied throughout: **a component exists when it has its own state, its own responsive
rule, or repeats.** `PageTitle` is an `<h1>` with a class, not a component.

---

## 4. Data model — the single most important decision

Nothing hard-codes copy into templates. Seventeen milestones inline would be unreviewable and impossible
to re-order responsively.

```
src/app/data/
  navigation.ts   // header menus + dropdown children
  about-tabs.ts   // [{ label, path }] — drives tab bar AND routes
  our-story.ts    // hero, mission, whyMaking, howWeStarted copy
  milestones.ts   // the timeline
  footer.ts
```

```ts
// milestones.ts
export interface Milestone {
  id: string;
  year: string;
  items: string[];
  media?: { src: string; alt: string };
  decor?: string[];            // hidden below tablet
}

export const MILESTONES: Milestone[] = [
  {
    id: '2018-12',
    year: 'Dec, 2018',
    items: ['MakerGhat launches its first makerspace in Powai, Mumbai'],
    media: { src: 'assets/powai.webp', alt: 'The Powai makerspace on opening day' },
    decor: ['doodle-arrows-orange'],
  },
  // …17 entries, chronological
];
```

Consequences, all of them good:
- The serpentine layout becomes a **pure function of the array** — no per-year CSS.
- Re-flowing 3-per-row → 2 → 1 is one number, not a rewrite.
- Adding 2027 later is a one-line diff. Say this in the README; it is the "maintainable" box ticked.

---

## 5. The timeline — the only genuinely hard part

### Reject: export the green path as one SVG

It would be pixel-perfect at 1440 and broken everywhere else, because the path length depends on how
many cards fit per row. Non-starter for a responsive brief.

### Use: serpentine rows drawn in CSS

This is also, usefully, **exactly how makerghat.org already does it** — their `.timeline.left` /
`.timeline.right` rows each carry a `.border` element that is a 3px `--color-green-600` box with two
corners rounded, drawing the U-turn between rows. Same technique, richer skin.

```
chunk(milestones, perRow)  →  rows

row i even → flex-direction: row          (left → right)
row i odd  → flex-direction: row-reverse  (right → left)

TimelineConnector = absolutely-positioned box,
  3px solid var(--color-green-600),
  border-radius on the outer two corners,
  side chosen by row parity
```

`perRow` comes from a media-query-driven custom property, so **one variable rewires the layout**:

**Measured in Phase 4: the Figma uses two chips per row, not three.** Rows read 2018/2019, then
2021/2020 right-to-left, then 2022/2023, then 2025/2024, then 2026 — nine year chips in five rows.

| Breakpoint | Layout | Decor |
|---|---|---|
| ≥768 | serpentine, 2 chips per row, direction alternating | shown |
| <768 | straight vertical rail, chips stacked beside it | hidden |

**The component does not re-chunk per breakpoint.** It always emits five rows in chronological DOM
order; CSS decides whether a row reads left-to-right, right-to-left, or top-to-bottom. That keeps the
keyboard and screen-reader journey at 2018 → 2026 whatever the layout is doing, and means no JS
listens to the viewport.

Below 768 the serpentine is abandoned entirely for a straight vertical rail — the honest responsive
answer, and what their site already does.

> **Write this component's CSS mobile-first.** The desktop path needs `[data-direction='ltr'] …`
> rules, which outrank a plain `.journey__track` selector — so a "mobile override" placed later in the
> file loses silently, and a stray `border-top-left-radius` eats the rail at every odd row. Putting the
> desktop rules inside `min-width` removes the fight. Cost an hour to diagnose in Phase 4, because the
> geometry measured as correct while the paint was wrong.

### The year chip is a disclosure widget

```html
<button class="chip"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="'m-' + milestone.id"
        (click)="toggle()">
  {{ milestone.year }}
  <svg class="caret" aria-hidden="true">…</svg>
</button>

<div [id]="'m-' + milestone.id" role="region" [hidden]="!open()">
  <ul>@for (item of milestone.items; track item) { <li>{{ item }}</li> }</ul>
</div>
```

One open at a time on desktop (accordion), all expanded on mobile. `prefers-reduced-motion: reduce`
kills the height transition — their stylesheet already declares that query, so match it.

---

## 6. Styling architecture

```
src/styles/
  tokens.css       ← the 176 custom properties, lifted from their build
  reset.css
  typography.css   ← .title, .sub-heading, .intro-text — their class names
  layout.css       ← .container { max-width: var(--container-width) }
```
plus a co-located `component-name.css` per component, wired through `styleUrl` — Angular's emulated view
encapsulation scopes it automatically, so no CSS-Modules tooling is needed.

Hard rules:
- **No raw hex, px font-size, or px line-height in component CSS.** Tokens only. A reviewer grepping for
  `#` outside `tokens.css` should find nothing — enforced by a test in `design-tokens.spec.ts`.
- **Do not reuse makerghat.org's class names.** Their selectors (`.story-container`, `.tabs`,
  `.timeline`, `.story-card`, `.intro-section`, `.quadrant`, `.border`, `.end-line`, `.overflow-container`,
  `.shadow-inline`, `.footer_design`, …) stay out of this codebase. Angular scopes component styles
  anyway, so reusing them buys nothing and reads as copied markup. This project uses its own BEM-ish
  vocabulary:

  | Region | Block |
  |---|---|
  | Page wrapper | `.story-page` |
  | Intro / mission / why-making | `.intro`, `.intro__block` |
  | How MakerGhat started | `.origin` |
  | The timeline | `.journey`, `.journey__row`, `.journey__track` |
  | A year node | `.milestone`, `.milestone__chip`, `.milestone__panel` |
  | Tab bar | `.section-tabs`, `.section-tabs__link` |
  | Chrome | `.site-header`, `.site-footer`, `.site-main`, `.skip-link`, `.container` |
- Spacing on a 4px scale; add `--space-*` tokens (their file has no spacing scale — note it as an addition).
- Breakpoints as three named constants, never magic numbers scattered around.

---

## 7. Assets

| Kind | Handling |
|---|---|
| Photographs | Export @2x from Figma → WebP + PNG fallback via `<picture>`. Explicit `width`/`height` to kill CLS. `loading="lazy"` below the fold. |
| Vector doodles (arrows, lightbulb, stars, scissors) | **Inline SVG components**, `aria-hidden`, `fill: currentColor` where mono so tokens can recolour them |
| Skyline divider | One wide SVG, `preserveAspectRatio="none"`, full-bleed |
| Logos / social icons | Reuse the live SVGs (`Logo.svg`, `insta.svg`, …) |

`src/assets/` declared in `angular.json` so the CLI copies and fingerprints them on production builds.

---

## 8. Accessibility & quality gates

- One `<h1>`; sections in document order; `<header>/<main>/<footer>` landmarks; skip link.
- Decorative imagery `alt=""`; meaningful photos get real alt text.
- Tab bar = `<nav>` of `<NavLink>`s with `aria-current="page"` (they are routes, not tab-panels).
- Accordion keyboard-operable, visible `:focus-visible` ring.
- Contrast: `#4A3A80` on `#F9F4E8` passes AA comfortably; **check `#F1805E` button text** — it is the one
  likely failure in this palette.
- ESLint + Prettier committed; `npm run lint` clean before deploy.

---

## 9. Deployment — where these submissions actually die

Client-side routing means `/about-us/our-story` 404s on a static host unless rewritten.

- Netlify: `public/_redirects` → `/*  /index.html  200`
- Vercel: `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

**Test the deep link in a fresh incognito window before submitting.** A live URL that only works if you
land on `/` first is a failed mandatory deliverable.

---

## 10. Build order (test-first, one phase at a time)

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | `ng new` (**no SSR**) + router + `tokens.css` + fonts, Layout shell | `/about-us/our-story` renders an empty page with correct cream bg and fonts |
| 2 | SiteHeader + SiteFooter + AboutTabs | Header/footer match at 1440, hamburger works at 375 |
| 3 | PageTitle, HeroMedia, IntroSection, HowWeStarted | Matches Figma top ~1500px at 1440 |
| 4 | **StoryTimeline** — data + `chunk()` + rows + connectors | Unit tests on `chunk()` green; serpentine correct at 3/2/1 per row |
| 5 | YearChip accordion + decor layer | Component tests: expand/collapse, `aria-expanded`, one-at-a-time |
| 6 | Responsive pass at 1440 / 1024 / 768 / 375 | Side-by-side screenshots vs Figma |
| 7 | A11y + Lighthouse + deploy + README | Deep link works in incognito; Lighthouse a11y ≥ 95 |

---

## 11. README must answer (their words: structure, approach, assumptions)

1. **Structure** — the tree in §3 plus why content is data (§4).
2. **Approach** — "measured their live stylesheet and inherited their 176 design tokens, breakpoints,
   container width and class names, so the presentation layer drops straight into makerghat.org; rebuilt
   the timeline as a data-driven CSS serpentine rather than a fixed SVG so it survives reflow."
3. **Assumptions** — the ones that are real:
   - **Built in Angular.** The brief names no framework; it requires compatibility with the existing site.
     That compatibility is delivered through the shared token file, breakpoints and semantic class names
     rather than through a shared framework runtime — see §2b for the porting note.
   - Figma ships **desktop only**; tablet/mobile behaviour was designed by me, following the breakpoints
     already present in their stylesheet (768 / 500), not invented.
   - The Figma is a redesign of the live page; where they disagree, Figma wins.
   - Year chips carry a `▾` caret and expanded variants exist as separate frames → read as an accordion.
   - **Where the Figma and the live site disagree, the Figma wins** — its tab bar ("Support system", no
     "Awards"), its two-column footer, and its lower-case nav casing are all reproduced as drawn.
     `/about-us/awards` still resolves, because it is a real path on their site; it simply has no tab.
   - **Dropdown carets follow the data.** The Figma draws a caret on three of seven nav items but gives
     no dropdown states, so caret and dropdown are kept in lockstep rather than drawing one without the
     other. Nothing becomes unreachable: the About Us section is served by the tab bar directly below.
   - **Unimplemented routes render a labelled stub, not a redirect.** A nav link that quietly lands you
     on a different page reads as a bug; a page that names the scope reads as a decision.
   - **Logos are MakerGhat's own files**, fetched from makerghat.org under the CC BY-SA 4.0 licence
     their footer declares. Verified against the Figma before use: the header uses the purple-hand
     lockup (`Logo.svg`), the footer the orange-hand one (`Logo_2.svg`) — they are *different files*,
     not one asset recoloured. **Still placeholders:** the social glyphs, the contact icons, the footer
     skyline, and both photographs.
   - Fonts (Parkinsans / Outfit / Bungee) taken from their Google Fonts links, licence-clean.
   - **All copy is taken from the Figma as-is** — the live page is not used as a copy source. The one place
     this shows is the "How did MG start" body, which is lorem ipsum in the Figma; it ships as designed and
     is called out here rather than silently rewritten.
