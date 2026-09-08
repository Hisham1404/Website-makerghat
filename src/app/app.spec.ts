import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

/**
 * The application shell: the landmarks and skip link that wrap every route.
 * Header and footer content arrive in Phase 2; this phase fixes the structure
 * they will slot into.
 */
describe('App shell', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders exactly one main landmark', async () => {
    const el = await render();
    expect(el.querySelectorAll('main')).toHaveLength(1);
  });

  it('gives main an id so the skip link has somewhere to land', async () => {
    const el = await render();
    const main = el.querySelector('main');
    const skipLink = el.querySelector<HTMLAnchorElement>('a.skip-link');

    expect(main?.id).toBe('main-content');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });

  it('makes main programmatically focusable so the skip link moves focus', async () => {
    const el = await render();
    expect(el.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('puts the skip link first in the DOM so it is the first tab stop', async () => {
    const el = await render();
    const focusable = el.querySelectorAll('a, button, input, select, textarea');
    expect(focusable[0]?.classList.contains('skip-link')).toBe(true);
  });

  it('renders the routed page inside main, not beside it', async () => {
    const el = await render();
    expect(el.querySelector('main router-outlet')).not.toBeNull();
  });
});
