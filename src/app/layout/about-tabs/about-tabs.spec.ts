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
