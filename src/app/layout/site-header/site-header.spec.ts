import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteHeader } from './site-header';
import { NAV_ITEMS } from '../../data/navigation';

describe('SiteHeader', () => {
  let fixture: ComponentFixture<SiteHeader>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      // A catch-all so routerLink clicks in the drawer test resolve to
      // something instead of throwing NG04002.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const topLevelLinks = () => [...el.querySelectorAll('.site-header__nav > ul > li > a')];

  it('is a banner landmark', () => {
    expect(el.querySelector('header')).not.toBeNull();
  });

  it('links the logo home', () => {
    expect(el.querySelector<HTMLAnchorElement>('a.site-header__home')?.getAttribute('href')).toBe(
      '/',
    );
  });

  /*
   * The logo is a single image lockup, so the link's accessible name comes from
   * the image's alt text — there is no visible text to fall back on.
   */
  it('names the logo link through the image alt text', () => {
    const logo = el.querySelector<HTMLImageElement>('a.site-header__home img');
    expect(logo?.getAttribute('alt')?.trim().length ?? 0).toBeGreaterThan(0);
    expect(logo?.getAttribute('width')).toBeTruthy();
    expect(logo?.getAttribute('height')).toBeTruthy();
  });

  it('renders the seven top-level items from the Figma, in order', () => {
    expect(topLevelLinks().map((a) => a.textContent!.trim())).toEqual([
      'About us',
      'Space',
      'Curriculum',
      'Training',
      'Evidence',
      'Programs',
      'Get involved',
    ]);
  });

  it('points each top-level item at its real makerghat.org path', () => {
    expect(topLevelLinks().map((a) => a.getAttribute('href'))).toEqual(
      NAV_ITEMS.map((item) => item.href),
    );
  });

  it('draws a caret only where there is a dropdown to open', () => {
    const items = [...el.querySelectorAll('.site-header__nav > ul > li')];
    expect(items).toHaveLength(NAV_ITEMS.length);

    items.forEach((li, i) => {
      const hasChildren = Boolean(NAV_ITEMS[i].children?.length);
      expect(Boolean(li.querySelector('.site-header__caret'))).toBe(hasChildren);
      expect(Boolean(li.querySelector('ul.site-header__dropdown'))).toBe(hasChildren);
    });
  });

  it('lists every child link of a dropdown', () => {
    const evidence = [...el.querySelectorAll('.site-header__nav > ul > li')][4];
    const labels = [...evidence.querySelectorAll('ul.site-header__dropdown a')].map((a) =>
      a.textContent!.trim(),
    );
    expect(labels).toEqual(['Framework', 'Dashboard', 'Reports']);
  });

  describe('mobile menu', () => {
    const toggle = () => el.querySelector<HTMLButtonElement>('button.site-header__toggle')!;

    it('starts closed', () => {
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('names the region it controls', () => {
      const controls = toggle().getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(el.querySelector(`#${controls}`)).not.toBeNull();
    });

    it('opens on click and closes again', async () => {
      toggle().click();
      await fixture.whenStable();
      expect(toggle().getAttribute('aria-expanded')).toBe('true');

      toggle().click();
      await fixture.whenStable();
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when Escape is pressed', async () => {
      toggle().click();
      await fixture.whenStable();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await fixture.whenStable();

      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when a link inside it is followed', async () => {
      toggle().click();
      await fixture.whenStable();

      el.querySelector<HTMLAnchorElement>('.site-header__drawer a')!.click();
      await fixture.whenStable();

      expect(toggle().getAttribute('aria-expanded')).toBe('false');
    });

    it('has an accessible name rather than a bare icon', () => {
      const name = toggle().getAttribute('aria-label') ?? toggle().textContent?.trim() ?? '';
      expect(name.length).toBeGreaterThan(3);
    });
  });
});

describe('SiteHeader — dropdown alignment', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  /*
   * Regression: the nav is right-aligned in the header, so a left-anchored
   * dropdown on the final item ran past the viewport and gave the whole page a
   * horizontal scrollbar. Same shape of bug as the timeline panel — an overlay
   * near a container edge has to hang inward.
   */
  it('hangs the final menu from the right so it cannot run off screen', () => {
    const items = [...el.querySelectorAll('.site-header__nav > ul > li')];
    expect(items.at(-1)?.getAttribute('data-menu-align')).toBe('right');
    expect(items.slice(0, -1).every((li) => li.getAttribute('data-menu-align') === 'left')).toBe(
      true,
    );
  });
});
