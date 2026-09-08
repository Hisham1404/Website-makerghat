import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SiteHeader } from './site-header/site-header';
import { rule as cssRule, stripComments } from '../../testing/css-rules';

/*
 * Phase 7's accessibility pass, and every number in it is measured rather than
 * asserted from memory: axe-core 4.10.2 was run against the real page at 375
 * and at desktop, in three states — closed, accordion open, drawer open — and
 * contrast ratios were computed from the token values.
 *
 * axe came back with 44 passing checks and exactly ONE rule violated,
 * `color-contrast`, in three places. What it could not test is the other two
 * findings here, because both need a keyboard and a rendered overlay.
 *
 * 1. MUTED TEXT ON PURPLE MISSED AA. #AEA6C6 on #4A3A80 is 4.11:1 where normal
 *    text needs 4.5. Two places used it — the footer's licence line and, as of
 *    this session, the drawer's sub-links, which is 15 of the 17 failing nodes.
 *    Walking the ramp from #AEA6C6 toward #F1EEF9, the first tone to clear the
 *    bar is #B6AFCC at 4.53:1 — 12% of the way, so it stays visually quiet.
 *    The measured palette token keeps its measured value; the fix is a separate
 *    semantic token that says what it is for.
 *
 * 2. THE FOCUS RING WAS INVISIBLE ON THE DRAWER. `:focus-visible` draws
 *    `3px solid var(--color-primary-500)` and the drawer's background IS
 *    --color-primary-500. Ring against background: 1:1. A keyboard user in the
 *    mobile menu could not see where they were. axe cannot catch this; it does
 *    not evaluate focus styles.
 *
 * 3. THE DRAWER DID NOT CONTAIN FOCUS. It is `position: fixed; inset: 0`, so
 *    everything behind it is hidden — but it was all still tabbable. Tabbing
 *    past the last link walked into a <main> the user cannot see, which is
 *    WCAG 2.2's 2.4.11 Focus Not Obscured. A modal overlay has to trap focus,
 *    take it on open and hand it back on close.
 *
 * Checked and already correct, recorded so the next audit does not redo it:
 * the newsletter button is #4D2117 on coral #F1805E = 5.17:1, which is the
 * failure task2-plan.md predicted for this palette and it is not one. Purple on
 * cream is 8.67:1, black on cream 19.13:1, white on purple 9.51:1.
 */

const root = join(__dirname, '../../..');
const read = (p: string) => stripComments(readFileSync(join(root, p), 'utf8'));
const tokens = read('src/styles/tokens.css');
const headerCss = read('src/app/layout/site-header/site-header.css');
const footerCss = read('src/app/layout/site-footer/site-footer.css');

/** WCAG relative luminance, straight from the spec. */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const v = [0, 2, 4]
    .map((i) => parseInt(c.substr(i, 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Read a hex custom property straight out of the token file. */
function token(name: string): string {
  const match = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) throw new Error(`no token ${name}`);
  return match[1];
}

describe('contrast — computed from the tokens, not eyeballed', () => {
  const PURPLE = '#4a3a80';
  const CREAM = '#f9f4e8';

  it('proves the ratio helper against a known pair', () => {
    /* Black on white is exactly 21:1 by definition. */
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('clears AA for muted text on the purple drawer', () => {
    expect(contrast(token('--color-on-primary-muted'), PURPLE)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * The regression this locks down: the measured palette value is 4.11:1 and
   * was in use for body-size text in two places.
   */
  it('does not put the measured --color-primary-100 back on purple text', () => {
    expect(contrast(token('--color-primary-100'), PURPLE)).toBeLessThan(4.5);
    expect(footerCss).not.toMatch(/color:\s*var\(--color-primary-100\)/);
    expect(headerCss).not.toMatch(/color:\s*var\(--color-primary-100\)/);
  });

  it('keeps the body pairs comfortably above AA', () => {
    expect(contrast(PURPLE, CREAM)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', PURPLE)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * task2-plan.md §8 predicted the coral button would be this palette's one
   * contrast failure. It is not — the label is dark brown, not white. White on
   * coral WOULD fail at 2.63:1, so this test also stops anyone "tidying" it.
   */
  it('keeps the coral button’s dark label, since white on coral fails', () => {
    expect(contrast('#4d2117', '#f1805e')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', '#f1805e')).toBeLessThan(4.5);
  });
});

describe('focus is visible everywhere, including on the drawer', () => {
  it('draws a ring that is not the drawer’s own background colour', () => {
    const drawer = headerCss.slice(headerCss.indexOf('@media (max-width: 879px)'));
    const body = cssRule(drawer, '.site-header__nav :focus-visible');
    expect(body).toMatch(/outline-color:\s*var\(--color-white\)/);
  });

  /* White on the purple panel is 9.51:1, well past the 3:1 an indicator needs. */
  it('gives that ring more than the 3:1 an indicator needs', () => {
    expect(contrast('#ffffff', '#4a3a80')).toBeGreaterThanOrEqual(3);
  });
});

describe('the drawer behaves like the overlay it is', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<SiteHeader>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SiteHeader);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
  });

  afterEach(() => el.remove());

  const toggle = () => el.querySelector<HTMLButtonElement>('.site-header__toggle')!;
  const close = () => el.querySelector<HTMLButtonElement>('.site-header__close')!;

  it('moves focus into the panel when it opens', async () => {
    toggle().click();
    await fixture.whenStable();
    expect(document.activeElement).toBe(close());
  });

  it('hands focus back to the toggle when it closes', async () => {
    toggle().click();
    await fixture.whenStable();
    close().click();
    await fixture.whenStable();
    expect(document.activeElement).toBe(toggle());
  });

  /*
   * The overlay covers the page, so Tab must not walk out of it into content
   * the user cannot see. Wrapping from the last focusable back to the first is
   * what keeps 2.4.11 satisfied without making the rest of the page inert.
   */
  it('wraps Tab from the last control back to the first', async () => {
    toggle().click();
    await fixture.whenStable();

    const nav = el.querySelector<HTMLElement>('.site-header__nav')!;
    const focusables = [...nav.querySelectorAll<HTMLElement>('a[href], button')];
    const last = focusables.at(-1)!;
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);
    await fixture.whenStable();

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusables[0]);
  });

  it('wraps Shift+Tab from the first control back to the last', async () => {
    toggle().click();
    await fixture.whenStable();

    const nav = el.querySelector<HTMLElement>('.site-header__nav')!;
    const focusables = [...nav.querySelectorAll<HTMLElement>('a[href], button')];
    const first = focusables[0];
    first.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(event);
    await fixture.whenStable();

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusables.at(-1));
  });

  it('does not trap anything while it is closed', async () => {
    const nav = el.querySelector<HTMLElement>('.site-header__nav')!;
    const first = nav.querySelector<HTMLElement>('a[href]')!;
    first.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    first.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

/*
 * The drawer scrolls in the wrong place.
 *
 * Their `.menu` is a fixed 522px box with `overflow: hidden` and it never
 * scrolls, because their rows are about 21px and all 25 links fit. The
 * artwork then sits immediately below it at y=542 and is always on screen.
 *
 * Ours cannot copy that. Rows here are 40-48px, for the touch-target reason
 * recorded in mobile-chrome.spec.ts, so the content is 1291px in an 812px
 * panel. With the whole panel scrolling, the artwork sat ~480px below the fold
 * and the top chrome scrolled away with it.
 *
 * So the structure their layout implies, rather than the numbers it uses: the
 * panel itself does not scroll, the logo and close stay put, the artwork stays
 * on the floor, and the LINK LIST is the one part that scrolls.
 */
describe('the drawer scrolls its links, not itself', () => {
  const drawer = headerCss.slice(headerCss.indexOf('@media (max-width: 879px)'));

  it('stops the panel itself from scrolling', () => {
    const body = cssRule(drawer, '.site-header__nav');
    expect(body).toMatch(/overflow:\s*hidden/);
    expect(body).not.toMatch(/overflow-y:\s*auto/);
  });

  it('makes the link list the scroll container', () => {
    const body = cssRule(drawer, '.site-header__nav > ul');
    expect(body).toMatch(/flex:\s*1/);
    expect(body).toMatch(/overflow-y:\s*auto/);
    expect(body).toMatch(/overscroll-behavior:\s*contain/);
  });

  /* Both must keep their height while the list takes the slack. */
  it('holds the top chrome and the artwork against the flex squeeze', () => {
    expect(cssRule(drawer, '.site-header__drawer-top')).toMatch(/flex-shrink:\s*0/);
    expect(cssRule(drawer, '.site-header__drawer-art')).toMatch(/flex-shrink:\s*0/);
  });

  /*
   * `margin-top: auto` was what pinned the artwork to the floor when the
   * content was short. The list flexing to fill does that job now, and leaving
   * the auto margin in would fight it.
   */
  it('drops the auto margin now the list fills the space', () => {
    expect(cssRule(drawer, '.site-header__drawer-art')).not.toMatch(/margin:\s*auto/);
  });
});

/*
 * ...and the artwork has to yield when there is no room for it.
 *
 * Its height follows the panel's WIDTH — it is `width: 100%` on a fixed
 * aspect — so a wide, short viewport makes it enormous. Measured at 667x375
 * (a phone in landscape) it rendered 569px tall in a 375px panel and the link
 * list collapsed to ZERO height: the menu could not be used at all.
 *
 * A height-only media query does not cover this, because the trigger is the
 * width. Capping the artwork in vh does, and clipping from the top keeps the
 * part that matters — the hands sit at its bottom edge.
 */
describe('the drawer stays usable on short screens', () => {
  const drawer = headerCss.slice(headerCss.indexOf('@media (max-width: 879px)'));

  it('caps the artwork against the viewport height', () => {
    const body = cssRule(drawer, '.site-header__drawer-art');
    expect(body).toMatch(/max-height:\s*\d+vh/);
    expect(body).toMatch(/overflow:\s*hidden/);
  });

  /* Clipped from the top, so the hands at the bottom survive the crop. */
  it('crops the illustration from the top, not the bottom', () => {
    const body = cssRule(drawer, '.site-header__drawer-art');
    expect(body).toMatch(/align-items:\s*flex-end/);
  });

  /* Belt and braces: the list keeps a floor even when the cap still bites. */
  it('guarantees the link list a minimum height', () => {
    expect(cssRule(drawer, '.site-header__nav > ul')).toMatch(/min-height:\s*\d+px/);
  });
});
