import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SiteHeader } from './site-header/site-header';
import { ABOUT_TABS } from '../data/about-tabs';
import { NAV_ITEMS } from '../data/navigation';
import { rule as cssRule, groupedRule, stripComments } from '../../testing/css-rules';

/*
 * The page chrome below 768, measured off makerghat.org rather than the Figma,
 * which ships a 1440 artboard and says nothing about phones.
 *
 * Three things were wrong, all found by measuring their live DOM at 375:
 *
 * 1. THE CREAM PANEL WAS INSET AT EVERY WIDTH.
 *
 *        viewport   makerghat.org        this build (before)
 *        1440       x=80   w=1280        x=80   w=1280   ok
 *        1024       x=0    w=1280        x=48   w=913    wrong
 *         768       x=0    w=768         x=32   w=689    wrong
 *         375       x=0    w=375         x=16   w=343    wrong
 *
 *    Their panel is a fixed 1280 that simply stops being inset once the
 *    viewport is narrower than it. Ours subtracted a gutter all the way down,
 *    which left white edging on every screen below about 1400. The fix is to
 *    drop the gutter from the WIDTH and let the panel's own padding carry the
 *    inset instead — the content then lands at 20px on a 375 screen, which is
 *    exactly where theirs sits, and still at 128px on a 1440 one, which is
 *    where the Figma draws it.
 *
 * 2. THE TAB BAR WAS STILL ON. `div.tabs` computes `display: none` at 768,
 *    600 and 375 on their site; ours scrolled four tabs off the right edge.
 *
 * 3. THE HAMBURGER WAS THE WRONG SHAPE. Theirs is hamburger_open.svg —
 *    20x18, three 2px lines at y=1.15/8.15/15.15, stroke #362C5F, square
 *    ends. Ours drew 24px pills in #4A3A80. #362C5F is already in the token
 *    file as --color-primary-700, so this is reproduced in CSS rather than
 *    shipped as an asset: same geometry, same colour, one less request.
 *
 * The consequence that is easy to miss, and the reason this is one change and
 * not three: navigation.ts justified having no caret on "About us" with the
 * words "nothing is unreachable as a result — the About Us section is served
 * by the tab bar directly beneath the header". Hide that tab bar and the
 * justification dies with it. Their drawer carries all four section links;
 * ours carried one, so three of the four sections would have become
 * unreachable on a phone.
 */

const root = join(__dirname, '../../..');
const read = (p: string) => stripComments(readFileSync(join(root, p), 'utf8'));

const tabsCss = read('src/app/layout/about-tabs/about-tabs.css');
const headerCss = read('src/app/layout/site-header/site-header.css');
const headerHtml = readFileSync(
  join(root, 'src/app/layout/site-header/site-header.html'),
  'utf8',
);

/* Everything from the first max-width:767 block on is the phone layout. */
const tabsMobile = tabsCss.slice(tabsCss.indexOf('@media (max-width: 767px)'));

describe('cream panel — full-bleed below the container width', () => {
  /*
   * The whole bug in one declaration. `min(100% - gutter*2, 1280)` is inset at
   * every width; `min(100%, 1280)` is inset only once the viewport exceeds
   * 1280, which is what their site does and what the Figma draws at 1440.
   */
  it('sizes the panel without subtracting a gutter', () => {
    const body = groupedRule(tabsCss, ['.section-tabs', '.section-tabs__panel']);
    expect(body).toMatch(/width:\s*min\(100%,\s*var\(--container-width\)\)/);
    expect(body).not.toMatch(/--gutter/);
  });

  /*
   * The inset has to survive somewhere or text sits on the screen edge — but
   * NOT as padding on the panel. `.panel-inset` already carries it per block,
   * deliberately, so that the hero can run the full panel width while the
   * copy does not. Padding here would inset the hero too and double every
   * block's margin. With the gutter gone the h1 lands at 20px on a 375 screen,
   * which is exactly where theirs sits.
   */
  it('leaves the inset to .panel-inset rather than padding the panel', () => {
    expect(cssRule(tabsCss, '.section-tabs__panel')).not.toMatch(/padding-inline/);
    expect(cssRule(read('src/styles/layout.css'), '.panel-inset')).toMatch(
      /padding-inline:\s*var\(--panel-pad\)/,
    );
  });

  /*
   * Above the breakpoint the first tab sits on the panel's top-left, so that
   * corner is square. With no tab bar there is nothing sitting on it, and
   * their panel rounds both top corners at 20px.
   */
  it('rounds only the top-right corner while the tabs are showing', () => {
    const body = cssRule(tabsCss, '.section-tabs__panel');
    expect(body).toMatch(/border-top-right-radius:\s*var\(--radius-lg\)/);
    expect(body).not.toMatch(/border-top-left-radius/);
  });

  it('rounds both top corners at 20px once the tabs are gone', () => {
    const body = cssRule(tabsMobile, '.section-tabs__panel');
    expect(body).toMatch(/border-top-left-radius:\s*var\(--radius-lg\)/);
    expect(body).toMatch(/border-top-right-radius:\s*var\(--radius-lg\)/);
  });
});

describe('tab bar — hidden on phones, as on their site', () => {
  it('takes the tab bar off below the breakpoint', () => {
    expect(cssRule(tabsMobile, '.section-tabs')).toMatch(/display:\s*none/);
  });

  /*
   * Pinned as a literal. Their site switches at 768; this build's breakpoint
   * convention is min-width:768 for the desktop side, so the phone side is
   * max-width:767 and the two differ only on the single pixel at 768.
   */
  it('uses this build’s own breakpoint, not a second one', () => {
    expect(tabsCss).toMatch(/@media \(max-width: 767px\)/);
    expect(tabsCss).not.toMatch(/@media \(max-width: 768px\)/);
  });
});

describe('About Us stays reachable once the tab bar is hidden', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const about = () => NAV_ITEMS.find((i) => i.label === 'About us')!;

  it('carries every About Us section as a drawer link', () => {
    expect(about().drawerChildren?.map((c) => c.label)).toEqual(
      ABOUT_TABS.map((t) => t.label),
    );
    expect(about().drawerChildren?.map((c) => c.href)).toEqual(ABOUT_TABS.map((t) => t.path));
  });

  /*
   * The point of the whole exercise: every destination the tab bar offered is
   * still reachable from the header once the bar is gone.
   */
  it('renders all four section links in the DOM', () => {
    const hrefs = [...el.querySelectorAll('.site-header__subnav a')].map((a) =>
      a.getAttribute('href'),
    );
    for (const tab of ABOUT_TABS) {
      expect(hrefs).toContain(tab.path);
    }
  });

  /*
   * Desktop is untouched. The Figma draws no caret on About us and no dropdown
   * under it, so drawerChildren must not become one — it is a separate field
   * precisely so the caret stays tied to `children`.
   */
  it('adds no caret and no desktop dropdown to About us', () => {
    expect(about().children).toBeUndefined();
    const aboutLi = el.querySelector('li');
    expect(aboutLi?.querySelector('.site-header__caret')).toBeNull();
    expect(aboutLi?.querySelector('.site-header__dropdown')).toBeNull();
  });

  it('hides the drawer sub-nav above the breakpoint', () => {
    expect(cssRule(headerCss, '.site-header__subnav')).toMatch(/display:\s*none/);
    const mobile = headerCss.slice(headerCss.indexOf('@media (max-width: 767px)'));
    expect(cssRule(mobile, '.site-header__subnav')).toMatch(/display:\s*block/);
  });

  it('keeps the sub-nav a real list inside the About us item', () => {
    expect(headerHtml).toMatch(/site-header__subnav/);
    expect(el.querySelectorAll('.site-header__subnav').length).toBe(1);
  });
});

describe('hamburger — their geometry exactly', () => {
  const bars = () =>
    groupedRule(headerCss, [
      '.site-header__bars',
      '.site-header__bars::before',
      '.site-header__bars::after',
    ]);

  /* hamburger_open.svg is 20 wide with 2px strokes and butt line caps. */
  it('draws a 20px bar, not 24', () => {
    expect(bars()).toMatch(/width:\s*20px/);
    expect(bars()).toMatch(/height:\s*2px/);
  });

  it('squares the ends, because theirs are not rounded', () => {
    expect(bars()).not.toMatch(/border-radius/);
  });

  /* Their stroke is #362C5F, which this build already has as primary-700. */
  it('uses their darker purple rather than the brand mid-tone', () => {
    expect(bars()).toMatch(/background:\s*var\(--color-primary-700\)/);
  });

  /* Lines at y=1.15, 8.15, 15.15 — 7px apart, which the offsets already match. */
  it('keeps the 7px spacing the SVG measures', () => {
    expect(cssRule(headerCss, '.site-header__bars::before')).toMatch(/top:\s*-7px/);
    expect(cssRule(headerCss, '.site-header__bars::after')).toMatch(/top:\s*7px/);
  });
});
