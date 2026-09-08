import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ABOUT_TABS } from '../../data/about-tabs';

/**
 * Layout route for the About Us section: the pill tab bar, plus the panel every
 * child page renders into.
 *
 * The tabs are real routes, not tabpanels, so this is a <nav> of links with
 * aria-current rather than an ARIA tab widget — matching how the live site and
 * the browser's own history behave.
 */
@Component({
  selector: 'app-about-tabs',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './about-tabs.html',
  styleUrl: './about-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutTabsLayout {
  protected readonly tabs = ABOUT_TABS;
}
