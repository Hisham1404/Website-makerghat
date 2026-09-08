import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rule as cssRule, stripComments } from '../../../testing/css-rules';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ABOUT_TABS } from '../../data/about-tabs';

describe('AboutTabs', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  async function tabsAfterNavigating(url: string): Promise<HTMLAnchorElement[]> {
    await harness.navigateByUrl(url);
    return [...harness.routeNativeElement!.querySelectorAll<HTMLAnchorElement>('.section-tabs a')];
  }

  it('renders the four tabs the Figma draws, in order', async () => {
    const tabs = await tabsAfterNavigating('/about-us/our-story');
    expect(tabs.map((a) => a.textContent!.trim())).toEqual([
      'MakerGhat story',
      'MakerGhat team',
      'Support system',
      'Volunteers & Alumni',
    ]);
  });

  it('links each tab to its route', async () => {
    const tabs = await tabsAfterNavigating('/about-us/our-story');
    expect(tabs.map((a) => a.getAttribute('href'))).toEqual(ABOUT_TABS.map((t) => t.path));
  });

  it('sits in a labelled navigation landmark', async () => {
    await harness.navigateByUrl('/about-us/our-story');
    const nav = harness.routeNativeElement!.querySelector('nav.section-tabs');
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
  });

  it.each([
    ['/about-us/our-story', 'MakerGhat story'],
    ['/about-us/team', 'MakerGhat team'],
    ['/about-us/support-system', 'Support system'],
    ['/about-us/vol-alum', 'Volunteers & Alumni'],
  ])('marks the tab for %s as the current page', async (url, label) => {
    const tabs = await tabsAfterNavigating(url);
    const current = tabs.filter((a) => a.getAttribute('aria-current') === 'page');

    expect(current).toHaveLength(1);
    expect(current[0].textContent!.trim()).toBe(label);
  });

  it('gives each tab its own colour tone, so no two share one', async () => {
    const tabs = await tabsAfterNavigating('/about-us/our-story');
    const tones = tabs.map((a) => a.getAttribute('data-tone'));

    expect(tones).toEqual(['cream', 'lavender', 'butter', 'blush']);
    expect(new Set(tones).size).toBe(tones.length);
  });

  it('gives the content panel the cream fill the reference measures', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/app/layout/about-tabs/about-tabs.css', 'utf8');
    expect(css).toMatch(/\.section-tabs__panel\s*\{[^}]*var\(--color-neutral-50\)/);
    expect(css).toMatch(/\.section-tabs__panel\s*\{[^}]*var\(--container-width\)/);
  });

  it('does not render a tab for Awards, which the Figma omits', async () => {
    const tabs = await tabsAfterNavigating('/about-us/our-story');
    expect(tabs.map((a) => a.textContent!.trim())).not.toContain('Awards');
  });
});

/*
 * The cream panel carries an edge shadow on makerghat.org, which this build
 * had missed. Their `.tab-content` is `class="shadow-inline tab-content"` and
 * computes:
 *
 *   rgba(0,0,0,0.15) 2px 0 2px 0, rgba(0,0,0,0.15) -2px 0 2px 0
 *
 * Two shadows, both with ZERO vertical offset — one thrown right, one thrown
 * left — so the panel gets a soft edge down each side and reads as a sheet
 * lifted off the white page, with nothing under its top or bottom. The tab
 * links carry the same pair, so a tab and the panel it sits on share an edge.
 */
describe('the cream panel is lifted off the page, as theirs is', () => {
  const tabsCss = readFileSync(
    join(__dirname, '../../../../src/app/layout/about-tabs/about-tabs.css'),
    'utf8',
  );

  const SHADOW =
    /box-shadow:\s*2px 0 2px 0 var\(--color-black-15\),\s*-2px 0 2px 0 var\(--color-black-15\)/;
  const clean = stripComments(tabsCss);

  /*
   * Scoped to each rule's own body. A first pass matched the whole stylesheet,
   * so deleting the PANEL's shadow still passed on the tab link's copy of it —
   * the mutation run caught that, which is what it is for.
   */
  it('lifts the panel off the page', () => {
    expect(cssRule(clean, '.section-tabs__panel')).toMatch(SHADOW);
  });

  it('gives the tabs the same pair, so tab and panel share an edge', () => {
    expect(cssRule(clean, '.section-tabs a')).toMatch(SHADOW);
  });

  /* A y-offset would darken the seam where the tab bar meets the panel, and
     theirs deliberately has none — both offsets are zero. */
  it('throws the shadow sideways only, never up or down', () => {
    expect(clean).not.toMatch(/box-shadow:[^;]*0 2px 2px/);
  });
});
