import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteFooter } from './site-footer';
import { CONTACT, FOOTER_COLUMNS, NEWSLETTER, SOCIAL_LINKS } from '../../data/footer';

describe('SiteFooter', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('is a contentinfo landmark', () => {
    expect(el.querySelector('footer')).not.toBeNull();
  });

  it('leads with "Connect with Us"', () => {
    expect(el.querySelector('.site-footer__title')?.textContent).toContain('Connect');
    expect(el.querySelector('.site-footer__title')?.textContent).toContain('with Us');
  });

  it('renders the two Figma columns, not the live site\'s four', () => {
    const headings = [...el.querySelectorAll('.site-footer__column h2')].map((h) =>
      h.textContent!.trim(),
    );
    expect(headings).toEqual(['Resources', 'FAQs']);
  });

  it.each(FOOTER_COLUMNS.map((c) => [c.heading, c.links.map((l) => l.label)] as const))(
    'lists every link under %s',
    (heading, expected) => {
      const column = [...el.querySelectorAll('.site-footer__column')].find(
        (c) => c.querySelector('h2')?.textContent?.trim() === heading,
      );
      const labels = [...column!.querySelectorAll('a')].map((a) => a.textContent!.trim());
      expect(labels).toEqual([...expected]);
    },
  );

  it('makes the phone number dialable', () => {
    const phone = el.querySelector<HTMLAnchorElement>(`a[href="${CONTACT.phone.href}"]`);
    expect(phone?.textContent).toContain(CONTACT.phone.label);
  });

  it('makes the address mailable', () => {
    const email = el.querySelector<HTMLAnchorElement>(`a[href="${CONTACT.email.href}"]`);
    expect(email?.textContent).toContain(CONTACT.email.label);
  });

  it('offers the newsletter as a real link to Substack', () => {
    const cta = el.querySelector<HTMLAnchorElement>('.site-footer__newsletter');
    expect(cta?.getAttribute('href')).toBe(NEWSLETTER.href);
    expect(cta?.textContent?.trim()).toBe(NEWSLETTER.label);
  });

  it('gives every social icon an accessible name', () => {
    const socials = [...el.querySelectorAll('.site-footer__social a')];
    expect(socials).toHaveLength(SOCIAL_LINKS.length);

    for (const a of socials) {
      expect(a.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(3);
      // The glyph is decorative; the link's aria-label carries the name, so an
      // alt here would be read out twice.
      expect(a.querySelector('img')?.getAttribute('alt')).toBe('');
    }
  });

  it('opens external links safely in a new tab', () => {
    for (const a of el.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
  });

  it('carries the licence notice', () => {
    const text = el.querySelector('.site-footer__licence')?.textContent ?? '';
    expect(text).toContain('CC BY-SA4.0');
  });

  it('hides the decorative skyline from screen readers', () => {
    const skyline = el.querySelector('.site-footer__skyline');
    expect(skyline).not.toBeNull();
    expect(skyline?.getAttribute('aria-hidden')).toBe('true');
  });
});
