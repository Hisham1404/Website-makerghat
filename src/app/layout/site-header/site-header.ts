import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
  },
})
export class SiteHeader {
  protected readonly navItems = NAV_ITEMS;
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
