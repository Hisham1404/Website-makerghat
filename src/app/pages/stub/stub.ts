import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/**
 * Stands in for the three About Us tabs that were not part of the Figma.
 * Keeping the tab bar navigable is worth more than three invented pages, and
 * saying so on the page is more honest than a dead link.
 */
@Component({
  selector: 'app-stub-page',
  imports: [RouterLink],
  templateUrl: './stub.html',
  styleUrl: './stub.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StubPage {
  protected readonly heading = inject(ActivatedRoute).snapshot.data['heading'] as string;
}
