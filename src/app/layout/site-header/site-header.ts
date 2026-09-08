import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_ITEMS } from '../../data/navigation';

/**
 * Site header: logo, the seven-item main nav, and the mobile drawer.
 *
 * Desktop dropdowns are opened with CSS (:hover / :focus-within) rather than
 * component state — that keeps them keyboard-reachable without a roving
 * tabindex implementation, and it is how makerghat.org does it too. Only the
 * mobile drawer needs real state, because it has to survive a click.
 */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMenu()',
    '(keydown)': 'trapTab($event)',
  },
})
export class SiteHeader {
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly navItems = NAV_ITEMS;
  protected readonly menuOpen = signal(false);

  constructor() {
    /*
     * The drawer is `position: fixed; inset: 0`, so when it is open everything
     * behind it is hidden — but it was all still tabbable, and tabbing past the
     * last link walked into a <main> the user cannot see. That is WCAG 2.2's
     * 2.4.11 Focus Not Obscured.
     *
     * Focus moves in on open and back to the toggle on close, which is what
     * anything that covers the page has to do. Runs after render so the panel
     * is actually in the layout when we reach for it.
     */
    afterRenderEffect(() => {
      const open = this.menuOpen();
      const el = this.host.nativeElement as HTMLElement;
      const target = open
        ? el.querySelector<HTMLElement>('.site-header__close')
        : el.querySelector<HTMLElement>('.site-header__toggle');

      /* Only pull focus back to the toggle if it is still inside the drawer —
         clicking a link navigates away and should not yank focus backwards. */
      if (!open && !el.contains(document.activeElement)) return;
      target?.focus();
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Tab wraps inside the open drawer rather than escaping behind it. */
  protected trapTab(event: KeyboardEvent): void {
    if (!this.menuOpen() || event.key !== 'Tab') return;

    const nav = (this.host.nativeElement as HTMLElement).querySelector('.site-header__nav');
    if (!nav) return;

    const focusable = [...nav.querySelectorAll<HTMLElement>('a[href], button')];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
