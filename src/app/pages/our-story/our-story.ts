import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DECOR, HERO, INTRO_BLOCKS, INTRO_MEDIA, ORIGIN, PAGE_TITLE } from '../../data/our-story';
import { StoryTimeline } from './timeline/story-timeline';

/**
 * The Our Story page.
 *
 * Phase 3 builds the content spine: title, full-bleed hero, the staggered
 * mission / why-making pair, and the origin story block. The illustrated decor
 * layer (lightbulb, cut-out photographs, dashed arcs) and the green path that
 * links these sections into the timeline belong to the decor pass; the timeline
 * itself lands in Phase 4.
 */
@Component({
  selector: 'app-our-story-page',
  imports: [StoryTimeline],
  templateUrl: './our-story.html',
  styleUrl: './our-story.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OurStoryPage {
  protected readonly title = PAGE_TITLE;
  protected readonly hero = HERO;
  protected readonly introBlocks = INTRO_BLOCKS;
  protected readonly introMedia = INTRO_MEDIA;
  protected readonly decor = DECOR;
  protected readonly origin = ORIGIN;
}
