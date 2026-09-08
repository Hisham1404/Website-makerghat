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
const headerHtml = readFileSync(join(root, 'src/app/layout/site-header/site-header.html'), 'utf8');

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
    expect(about().drawerChildren?.map((c) => c.label)).toEqual(ABOUT_TABS.map((t) => t.label));
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

/*
 * Round two, both raised by Mohammed looking at the phone build next to
 * makerghat.org.
 *
 * A. THE ROAD WAS LEFT ON THE SCREEN EDGE. Taking the cream full-bleed removed
 *    the 16px the panel's gutter used to supply, and two rules were relying on
 *    it: `.story-page__journey { padding-inline: 0 }` and `.origin`'s zero side
 *    margin. Both existed to stop a 20px jog between the origin card's stroke
 *    and the rail below it — they aligned the two by pulling BOTH out to the
 *    panel edge. With the panel now at x=0 that put the green stroke hard
 *    against the viewport, so the line read as clipped. They still have to move
 *    together; they just have to move together 20px in.
 *
 * B. THE DRAWER WAS A PLAIN WHITE SHEET. Theirs is a full-height purple panel
 *    with the orange lockup, an X, right-aligned links and an illustration
 *    anchored at the bottom. Measured off their opened menu at 375:
 *
 *      panel        .mobile-menu   #4A3A80        = --color-primary-500
 *      parent link  16px           #F1EEF9        = --color-primary-50
 *      child link   14px           #AEA6C6        = --color-primary-100
 *      logo         Logo_2.svg     96.8x45 at x=35 y=25
 *      close        hamburger_close.svg 25x25 at x=330 y=35
 *      artwork      mobile_footer.svg 360x290 + bottom_right_1.svg 334x146
 *
 *    Every one of those three colours was already in the token file, which is
 *    a decent check on the palette having been read off their stylesheet
 *    correctly in the first place.
 */

describe('the road keeps its margin now the cream is full-bleed', () => {
  const storyCss = read('src/app/pages/our-story/our-story.css');
  const phone = storyCss.slice(storyCss.indexOf('@media (max-width: 767px)'));

  /*
   * The rail is a `.panel-inset` child, so deleting the override is what gives
   * it the inset back — 20px on a phone, the same figure the copy above it uses.
   */
  it('stops zeroing the journey’s inset', () => {
    expect(phone).not.toMatch(/\.story-page__journey\s*\{[^}]*padding-inline:\s*0/);
  });

  /*
   * The card's stroke is drawn on its own border box, so padding cannot move
   * it — only a margin can. Same value as the rail's padding, or the joint
   * between the two jogs, which is the bug the old rule was written to fix.
   */
  it('moves the origin card in by the same amount, so the joint stays straight', () => {
    const body = cssRule(phone, '.origin');
    expect(body).toMatch(/margin:\s*var\(--space-32\) var\(--panel-pad\) 0/);
  });
});

describe('mobile drawer — their panel, not a white sheet', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<SiteHeader>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const drawerMobile = headerCss.slice(headerCss.indexOf('@media (max-width: 1023px)'));

  it('carries the orange lockup, not the header’s purple one', () => {
    const logo = el.querySelector('.site-header__drawer-logo');
    expect(logo?.getAttribute('src')).toBe('assets/logo-footer.svg');
  });

  it('has its own close control, because the panel covers the toggle', () => {
    const close = el.querySelector('.site-header__close');
    expect(close).not.toBeNull();
    expect(close?.getAttribute('aria-label')).toBeTruthy();
    expect(close?.querySelector('img')?.getAttribute('src')).toBe('assets/menu-close.svg');
  });

  it('closes the drawer when that control is used', () => {
    const toggle = el.querySelector<HTMLButtonElement>('.site-header__toggle')!;
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    el.querySelector<HTMLButtonElement>('.site-header__close')!.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('anchors both illustrations at the bottom, decorative only', () => {
    const art = el.querySelector('.site-header__drawer-art')!;
    expect(art.getAttribute('aria-hidden')).toBe('true');
    const srcs = [...art.querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(srcs).toEqual(['assets/drawer-art.svg', 'assets/drawer-hand.svg']);
  });

  /* 149 kB of traced illustration has no business blocking anything. */
  it('loads the artwork lazily', () => {
    for (const img of el.querySelectorAll('.site-header__drawer-art img')) {
      expect(img.getAttribute('loading')).toBe('lazy');
    }
  });

  it('hides the drawer furniture on desktop, where the nav is a menu bar', () => {
    const body = groupedRule(headerCss, ['.site-header__drawer-top', '.site-header__drawer-art']);
    expect(body).toMatch(/display:\s*none/);
  });

  it('fills the screen in their purple once open', () => {
    const body = cssRule(drawerMobile, '.site-header__nav');
    expect(body).toMatch(/position:\s*fixed/);
    expect(body).toMatch(/inset:\s*0/);
    expect(body).toMatch(/background:\s*var\(--color-primary-500\)/);
  });

  it('right-aligns the links, as theirs does', () => {
    expect(cssRule(drawerMobile, '.site-header__nav > ul')).toMatch(/align-items:\s*flex-end/);
  });

  /*
   * Parent links take their measured #F1EEF9 unchanged. The children do NOT
   * take their measured #AEA6C6: at 14px on this panel that is 4.11:1 and AA
   * needs 4.5, which axe flagged across all 13 of them. --color-on-primary-muted
   * is the first tone up the ramp that clears it, at 4.53:1, so it still reads
   * a step quieter than its parent. See accessibility.spec.ts.
   */
  it('uses their parent tone, and a corrected one for the children', () => {
    expect(cssRule(drawerMobile, '.site-header__nav a')).toMatch(
      /color:\s*var\(--color-primary-50\)/,
    );
    const child = groupedRule(drawerMobile, ['.site-header__dropdown a', '.site-header__subnav a']);
    expect(child).toMatch(/color:\s*var\(--color-on-primary-muted\)/);
    expect(child).toMatch(/font-size:\s*var\(--font-size-14\)/);
  });
});

describe('drawer assets are actually in the repo', () => {
  it('ships the close icon and both illustrations', () => {
    for (const file of ['menu-close.svg', 'drawer-art.svg', 'drawer-hand.svg']) {
      expect(() => readFileSync(join(root, 'public/assets', file))).not.toThrow();
    }
  });
});
