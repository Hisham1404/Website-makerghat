import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CONTACT,
  FOOTER_COLUMNS,
  FOOTER_LEAD_LINK,
  LICENCE_LINES,
  NEWSLETTER,
  SOCIAL_LINKS,
} from '../../data/footer';

/**
 * Site footer, including the skyline silhouette that bridges the cream page and
 * the purple footer. Content comes from src/app/data/footer.ts.
 */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly columns = FOOTER_COLUMNS;
  protected readonly leadLink = FOOTER_LEAD_LINK;
  protected readonly contact = CONTACT;
  protected readonly newsletter = NEWSLETTER;
  protected readonly socials = SOCIAL_LINKS;
  protected readonly licence = LICENCE_LINES;
}
