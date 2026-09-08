import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { roundedPath } from '../../../shared/road-path';
import {
  markerPath,
  ROAD_MARKERS,
  ROAD_ORIGIN,
  ROAD_POINTS,
  ROAD_RADIUS,
  ROAD_TERMINUS,
} from '../../../data/road';
import { rule as cssRule, stripComments } from '../../../../testing/css-rules';

/*
 * The road as one path, traced off design/ourstory-figma.jpg.
 *
 * Why it stopped being row borders: scanning the export for rgb(88,172,110) and
 * grouping the runs recovers a path that stacked boxes cannot draw.
 *
 *   y=1946  x= 704..1297   lane 0 top, starting at the step out of the origin
 *   x=1297  y=1946..2228   right rail
 *   y=2228  x= 134..1297   lane 0 floor, full width
 *   x= 134  y=2228..2556   left rail
 *   y=2556  x= 134.. 866   lane 1 floor, LEFT PART ONLY
 *   y=2598  x= 876..1297   ...and the right part, 42px lower
 *   x=1297  y=2598..3030   a rail spanning lane 2 AND part of lane 3
 *   y=3030  x= 750..1297   lane 2 floor, right part
 *   x= 742  y=2766..3028   the meander: UP 268px
 *   x= 675  y=2759..2856   ...jog left, then down again
 *   y=2857  x= 142.. 668   lane 2 floor, left part
 *   x= 134  y=2860..3344   left rail
 *   y=3345  x= 137..1297   lane 3 floor, full width
 *   x=1297  y=3358..3678   right rail
 *   y=3685  x= 788..1297   the last floor
 *   y=3621  x= 592.. 784   a final 64px step up, ending at a dot
 */

const root = join(__dirname, '../../../../..');
const css = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.css'), 'utf8'),
);
const html = readFileSync(
  join(root, 'src/app/pages/our-story/timeline/story-timeline.html'),
  'utf8',
);
const artboard = css.slice(css.lastIndexOf('@media (min-width: 768px)'));

/** Back into frame coordinates, which is how the measurements were written down. */
const frame = ([x, y]: readonly [number, number]) => [x + ROAD_ORIGIN.x, y + ROAD_ORIGIN.y];

describe('roundedPath', () => {
  it('rounds a corner with a quadratic whose control point is the corner', () => {
    const d = roundedPath(
      [
        [0, 0],
        [100, 0],
        [100, 100],
      ],
      10,
    );
    expect(d).toBe('M0 0 L90 0 Q100 0 100 10 L100 100');
  });

  /*
   * The road has corners 42px apart at the first step and 67px at the meander.
   * An unclamped radius would run the two arcs into each other.
   */
  it('clamps the radius to half the shorter adjacent segment', () => {
    const d = roundedPath(
      [
        [0, 0],
        [20, 0],
        [20, 200],
      ],
      50,
    );
    expect(d).toBe('M0 0 L10 0 Q20 0 20 10 L20 200');
  });

  it('returns nothing for a degenerate polyline', () => {
    expect(roundedPath([[0, 0]], 10)).toBe('');
  });
});

describe('the road — measured', () => {
  /* Outer radius 16 on a 10px stroke is 11 on the centre line it strokes. */
  it('rounds at the measured radius', () => {
    expect(ROAD_RADIUS).toBe(11);
  });

  it('starts under the origin box bottom stroke and ends at the terminus dot', () => {
    expect(frame(ROAD_POINTS[0])).toEqual([660, 1904]);
    expect(frame(ROAD_POINTS[ROAD_POINTS.length - 1])).toEqual([600, 3621]);
    expect(ROAD_TERMINUS.r).toBe(13);
  });

  /*
   * The lane 1/2 boundary is not one horizontal: it runs to x=871 at y=2556,
   * drops 42px, and picks up again at y=2598. The build drew it flat.
   */
  it('steps the lane 1 to lane 2 boundary down 42px', () => {
    const pts = ROAD_POINTS.map(frame);
    const i = pts.findIndex(([x, y]) => x === 871 && y === 2556);
    expect(i).toBeGreaterThan(0);
    expect(pts[i + 1]).toEqual([871, 2598]);
  });

  /*
   * The lane 2/3 boundary is a meander, not a step: coming left along y=3030
   * the road turns UP at x=742, climbs 268px, jogs left to x=675 and drops back
   * to y=2857. It is dodging the 2022 photograph, which hangs below its lane.
   */
  it('meanders around the 2022 photograph rather than cutting straight across', () => {
    const pts = ROAD_POINTS.map(frame);
    const i = pts.findIndex(([x, y]) => x === 742 && y === 3030);
    expect(i).toBeGreaterThan(0);
    expect(pts[i + 1]).toEqual([742, 2762]);
    expect(pts[i + 2]).toEqual([675, 2762]);
    expect(pts[i + 3]).toEqual([675, 2857]);
  });

  /* A rail from y=2598 to y=3030 crosses a lane boundary, so no row can own it. */
  it('runs a right rail across two lanes at once', () => {
    const pts = ROAD_POINTS.map(frame);
    const i = pts.findIndex(([x, y]) => x === 1297 && y === 2598);
    expect(pts[i + 1]).toEqual([1297, 3030]);
  });

  /*
   * Ten coral pairs, located by labelling the coral blobs in the export: five
   * along the horizontal runs and five pointing down the rails. The build drew
   * four, all at a flat `left: 46%`, and none of the rail ones.
   */
  it('carries all ten measured direction markers', () => {
    expect(ROAD_MARKERS).toHaveLength(10);
    expect(ROAD_MARKERS.filter((m) => m.dir === 'down')).toHaveLength(5);
    expect(ROAD_MARKERS.filter((m) => m.dir !== 'down')).toHaveLength(5);
  });

  it('draws each marker as a pair of triangles at the measured corner', () => {
    const first = ROAD_MARKERS[0];
    expect([first.x + ROAD_ORIGIN.x, first.y + ROAD_ORIGIN.y]).toEqual([644, 1928]);
    expect(markerPath(first, 0)).toContain(`M${first.x} ${first.y}`);
    /* The pair is offset 22px: a 14px triangle and the measured 8px gap. */
    expect(markerPath(first, 1)).toContain(`M${first.x + 22} ${first.y}`);
  });
});

describe('the drawn road replaces the border-drawn one', () => {
  it('paints stroke, dashed centre, terminus and markers', () => {
    expect(html).toContain('class="journey__road"');
    expect(html).toContain('data-road="stroke"');
    expect(html).toContain('data-road="dash"');
    expect(html).toContain('data-road="terminus"');
    expect(html).toContain('data-road="marker"');
  });

  /*
   * Left in place below the breakpoint, where the road really is one straight
   * left rail and a border draws it perfectly well.
   */
  it('is hidden until the artboard breakpoint', () => {
    expect(cssRule(css, '.journey__road')).toMatch(/display:\s*none/);
    expect(cssRule(artboard, '.journey__road')).toMatch(/display:\s*block/);
  });

  /*
   * The regression this catches, which I introduced and the browser found: the
   * lane-0 mask was still in the file, and editing the group that hid it turned
   * it back on — a 571x14 cream bar at z-index 2 painting straight over the
   * drawn road. It exists only to cut a border-drawn top edge back to the step,
   * and no border-drawn top edge survives at any width, so it is gone.
   */
  it('keeps no leftover mask that could paint over the drawn road', () => {
    expect(css).not.toMatch(/\.journey::before/);
  });

  it('takes every border off the lanes so the path owns the whole road', () => {
    const body = artboard.slice(artboard.indexOf('.journey__row,'));
    expect(body).toMatch(/border:\s*0/);
    expect(artboard).toMatch(/\.journey__track,/);
  });

  /* Sized in the same cqw as the artboard, so the two cannot drift apart. */
  it('scales with the lane like everything else on the artboard', () => {
    const body = cssRule(css, '.journey__road');
    expect(body).toMatch(/height:\s*calc\(1800 \/ 1184 \* 100cqw\)/);
    expect(body).toMatch(/top:\s*calc\(-10 \/ 1184 \* 100cqw\)/);
  });
});
