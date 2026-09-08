/**
 * The green road, traced off design/ourstory-figma.jpg.
 *
 * It is ONE stroke in the export and it is not a stack of rectangles. Scanning
 * the export for rgb(88,172,110) and grouping the runs recovers the whole path,
 * and three things fall out of it that a row-of-boxes construction cannot say:
 *
 *   - the lane 1 -> lane 2 boundary STEPS DOWN 42px at x=871;
 *   - the lane 2 -> lane 3 boundary is a MEANDER, not a step: coming left along
 *     y=3030 the road turns up at x=742, climbs 268px, jogs left to x=675 and
 *     drops again to y=2857 before carrying on left. It is dodging the 2022
 *     photograph, which hangs below its lane;
 *   - the right rail runs y=2598..3030, which spans lane 2's box AND part of
 *     lane 3's, so no single row can own it;
 *   - and the road ENDS, at a filled dot at (600, 3621), rather than closing.
 *
 * Coordinates are the stroke's CENTRE LINE in the 1440 frame, translated into
 * the SVG's own box by ORIGIN below: x=128 (the lane's left edge) and y=1899
 * (the top of the origin box's bottom stroke, where this path picks up).
 */

/** Frame coordinate of the SVG's top-left corner. */
export const ROAD_ORIGIN = { x: 128, y: 1899 } as const;

/** The lane width the whole artboard is a fraction of, and the road's extent. */
export const ROAD_VIEWBOX = { width: 1184, height: 1800 } as const;

/** Outer corner radius 16 on a 10px stroke, so 11 on the centre line. */
export const ROAD_RADIUS = 11;

/** Where the road stops, with the dot the export draws there. */
export const ROAD_TERMINUS = { x: 472, y: 1722, r: 13 } as const;

/* Frame coordinates, before translation — kept as written so they can be read
   straight against the measurements in the log. */
const FRAME_POINTS: readonly (readonly [number, number])[] = [
  [660, 1904], // buried under the origin box's bottom stroke
  [704, 1904],
  [704, 1946], // the step down into lane 0
  [1297, 1946],
  [1297, 2228],
  [134, 2228], // lane 0 floor, full width
  [134, 2556],
  [871, 2556], // lane 1 floor, left part
  [871, 2598], // the 42px step
  [1297, 2598],
  [1297, 3030],
  [742, 3030], // lane 2 floor, right part
  [742, 2762], // the meander: up...
  [675, 2762], // ...left...
  [675, 2857], // ...and down again
  [134, 2857], // lane 2 floor, left part
  [134, 3345],
  [1297, 3345], // lane 3 floor, full width
  [1297, 3685],
  [788, 3685], // the last floor, right part
  [788, 3621], // a final 64px step up
  [600, 3621], // terminus
];

export const ROAD_POINTS: readonly (readonly [number, number])[] = FRAME_POINTS.map(
  ([x, y]) => [x - ROAD_ORIGIN.x, y - ROAD_ORIGIN.y] as const,
);

/**
 * The coral direction markers. Ten of them, each a pair of triangles: 14x24
 * pointing along a horizontal run, or 25x14 stacked pointing down a rail. Every
 * one was located by labelling the coral blobs in the export, so these are the
 * measured top-left corners rather than a percentage of the lane.
 */
export interface RoadMarker {
  readonly x: number;
  readonly y: number;
  readonly dir: 'right' | 'left' | 'down';
}

const FRAME_MARKERS: readonly RoadMarker[] = [
  { x: 644, y: 1928, dir: 'right' }, // out of the origin box
  { x: 1253, y: 2027, dir: 'down' }, // right rail, lane 0
  { x: 773, y: 2248, dir: 'left' }, // lane 0 floor
  { x: 148, y: 2392, dir: 'down' }, // left rail, lane 1
  { x: 702, y: 2575, dir: 'right' }, // lane 1 floor, at the step
  { x: 1246, y: 2660, dir: 'down' }, // right rail, lane 2
  { x: 990, y: 3050, dir: 'left' }, // lane 2 floor
  { x: 151, y: 2932, dir: 'down' }, // left rail, lane 3
  { x: 538, y: 3371, dir: 'right' }, // lane 3 floor
  { x: 1246, y: 3403, dir: 'down' }, // right rail, lane 4
];

export const ROAD_MARKERS: readonly RoadMarker[] = FRAME_MARKERS.map((m) => ({
  ...m,
  x: m.x - ROAD_ORIGIN.x,
  y: m.y - ROAD_ORIGIN.y,
}));

/** One triangle of a marker pair, at the pair's own origin. */
export function markerPath({ x, y, dir }: RoadMarker, index: number): string {
  if (dir === 'down') {
    const top = y + index * 22;
    return `M${x} ${top} L${x + 25} ${top} L${x + 12.5} ${top + 14} Z`;
  }
  const left = x + index * 22;
  return dir === 'right'
    ? `M${left} ${y} L${left + 14} ${y + 12} L${left} ${y + 24} Z`
    : `M${left + 14} ${y} L${left} ${y + 12} L${left + 14} ${y + 24} Z`;
}
