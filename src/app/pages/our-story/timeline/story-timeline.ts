import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CHIPS_PER_ROW, LANE_HEIGHTS, MILESTONES, Milestone } from '../../../data/milestones';
import { chunk } from '../../../shared/chunk';
import { roundedPath } from '../../../shared/road-path';
import {
  markerPath,
  ROAD_MARKERS,
  ROAD_POINTS,
  ROAD_RADIUS,
  ROAD_TERMINUS,
  ROAD_VIEWBOX,
} from '../../../data/road';

interface TimelineNode {
  readonly milestone: Milestone;
  /**
   * Which edge the open panel hangs from. The chip that sits at the row's right
   * edge must drop its panel leftwards or it overflows the container — and
   * which chip that is depends on the row's direction, because 'rtl' rows are
   * reversed by CSS. Computed here rather than guessed at with :last-child,
   * which gets it wrong on reversed rows.
   */
  readonly panelAlign: 'left' | 'right';
}

interface TimelineRow {
  readonly nodes: readonly TimelineNode[];
  /** 'ltr' rows read left to right; 'rtl' rows are reversed by CSS. */
  readonly direction: 'ltr' | 'rtl';
  readonly isLast: boolean;
  /**
   * The lane's measured height in lane units. Above the artboard breakpoint the
   * row is sized from this rather than from its contents, because in the export
   * the road's strokes are absolutes and the artwork hangs off them — several
   * photographs overhang their lane floor by 40px or more.
   */
  readonly height: number;
}

/**
 * The serpentine timeline, with each year chip acting as a disclosure.
 *
 * The whole layout is a function of the milestone array and one number: chunk
 * into rows, then let row parity decide which way each row reads and which side
 * its connector turns on. Adding 2027 later is a one-line change to the data.
 *
 * Reversal is done in CSS, never in the markup — DOM order stays chronological
 * so keyboard and screen-reader users travel 2018 → 2026 whatever the layout is
 * doing. Below the tablet breakpoint the rows flatten to a single column, which
 * is why the component does not re-chunk per breakpoint: the DOM never changes
 * shape, only its presentation does.
 *
 * Only one year is open at a time. On a snaking layout several open panels
 * would collide with each other and with the path, and the Figma draws each
 * expanded year as its own state rather than showing two at once.
 */
@Component({
  selector: 'app-story-timeline',
  templateUrl: './story-timeline.html',
  styleUrl: './story-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class StoryTimeline {
  protected readonly rows: readonly TimelineRow[] = chunk(MILESTONES, CHIPS_PER_ROW).map(
    (milestones, index, all) => {
      const direction = index % 2 === 0 ? 'ltr' : 'rtl';

      /* Visually right-most chip: the last one on an ltr row, the first on rtl. */
      const rightMost = direction === 'ltr' ? milestones.length - 1 : 0;

      return {
        direction,
        isLast: index === all.length - 1,
        height: LANE_HEIGHTS[index] ?? LANE_HEIGHTS[LANE_HEIGHTS.length - 1],
        nodes: milestones.map((milestone, i) => ({
          milestone,
          panelAlign: (i === rightMost && milestones.length > 1 ? 'right' : 'left') as
            | 'left'
            | 'right',
        })),
      };
    },
  );

  /**
   * The road, as one path. Above the artboard breakpoint the lanes draw no
   * borders at all — this replaces them, because the export's road steps at one
   * boundary, meanders around a photograph at another, runs a rail across two
   * lanes at once and then simply stops. None of that is expressible as the
   * borders of stacked boxes, which is why the build had five flat rectangles
   * where the Figma has a path.
   */
  protected readonly road = {
    viewBox: `0 0 ${ROAD_VIEWBOX.width} ${ROAD_VIEWBOX.height}`,
    d: roundedPath(ROAD_POINTS, ROAD_RADIUS),
    terminus: ROAD_TERMINUS,
    markers: ROAD_MARKERS.flatMap((marker) => [markerPath(marker, 0), markerPath(marker, 1)]),
  };

  protected readonly openId = signal<string | null>(null);

  protected toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  protected close(): void {
    this.openId.set(null);
  }
}
