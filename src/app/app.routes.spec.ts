import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AboutTabsLayout } from './layout/about-tabs/about-tabs';

/**
 * The tab paths mirror makerghat.org's own About Us section so a deep link into
 * this recreation resolves the way it does on the real site. Only "our-story"
 * was designed in the Figma; the rest render an honest stub.
 */
describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  const currentUrl = () => TestBed.inject(Router).url;
  const routed = () => harness.routeNativeElement!;

  it('wraps every About Us route in the tab layout', async () => {
    const layout = await harness.navigateByUrl('/about-us/our-story', AboutTabsLayout);
    expect(layout).toBeInstanceOf(AboutTabsLayout);
  });

  it('serves the Our Story page at the same path the live site uses', async () => {
    await harness.navigateByUrl('/about-us/our-story');
    expect(routed().querySelector('.story-page')).not.toBeNull();
  });

  it.each([
    ['/about-us/team', 'MakerGhat Team'],
    ['/about-us/support-system', 'Support system'],
    ['/about-us/vol-alum', 'Volunteers & Alumni'],
    ['/about-us/awards', 'Awards'],
  ])('renders a stub for %s rather than inventing a page', async (url, heading) => {
    await harness.navigateByUrl(url);
    expect(routed().querySelector('.stub-page')).not.toBeNull();
    expect(routed().querySelector('.stub-page h1')?.textContent).toContain(heading);
  });

  it('keeps /about-us/awards resolvable even though the Figma drops the tab', async () => {
    await harness.navigateByUrl('/about-us/awards');
    expect(currentUrl()).toBe('/about-us/awards');
  });

  it.each([
    ['/', 'the site root'],
    ['/about-us', 'the bare section path'],
  ])('redirects %s to Our Story', async (url) => {
    await harness.navigateByUrl(url);
    expect(currentUrl()).toBe('/about-us/our-story');
  });

  it.each([
    ['/training', 'a nav section that was never designed'],
    ['/no/such/page', 'an unknown path'],
  ])('explains the scope at %s instead of quietly redirecting', async (url) => {
    await harness.navigateByUrl(url);
    expect(currentUrl()).toBe(url);
    expect(routed().querySelector('.stub-page')).not.toBeNull();
  });

  it('sets a document title per route', async () => {
    await harness.navigateByUrl('/about-us/our-story');
    expect(document.title).toContain('Our Story');

    await harness.navigateByUrl('/about-us/vol-alum');
    expect(document.title).toContain('Volunteers');
  });
});
