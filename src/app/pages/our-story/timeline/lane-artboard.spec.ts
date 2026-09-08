import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANE_HEIGHTS, LANE_WIDTH, MILESTONES } from '../../../data/milestones';
import { groupedRule, rule as cssRule, stripComments } from '../../../../testing/css-rules';

/*
 * The lane artboard, measured off design/ourstory-figma.jpg.
 *
 * A lane in the export is not a row of evenly spaced items — it is composed by
 * hand. Nothing shares a baseline: the 2018 chip sits 36px below its top stroke
 * and the 2019 chip 30px, the 2018 photograph starts at y=59 and the 2019 one
 * at y=121, and several photographs overhang their lane floor by 40px or more,
 * which is exactly why the road steps down where it does.
 *
 * The photographs were located by template-matching each asset against the
 * export rather than by reading colour bounding boxes, because the artwork
 * overlaps heavily. All nine matched at half their 2x render — the same rule
 * that settled the intro cut-outs and the origin group photograph — and seven
 * matched with an RMSE under 20 on a 0..255 scale.
 *
 * Coordinates are lane-relative: x from the OUTER edge of the lane's left
 * stroke (frame x=128), y from the outer edge of its top stroke.
 */

const root = join(__dirname, '../../../../..');
const css = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.css'), 'utf8'),
);
const html = readFileSync(
  join(root, 'src/app/pages/our-story/timeline/story-timeline.html'),
  'utf8',
);
/* The artboard block is the LAST min-width:768 block in the file. */
const artboard = css.slice(css.lastIndexOf('@media (min-width: 768px)'));
const rule = (selector: string) => cssRule(artboard, selector);

/* Frame coordinates straight off the export, before conversion. */
const FIGMA = {
  '2018': { chip: [458, 1978], media: [135, 2001, 331, 232], lane: 0 },
  '2019': { chip: [812, 1972], media: [967, 2063, 325, 161], lane: 0 },
  '2021': { chip: [486, 2288], media: [239, 2304, 216, 292], lane: 1 },
  '2020': { chip: [859, 2274], media: [999, 2367, 293, 228], lane: 1 },
  '2022': { chip: [140, 2610], media: [356, 2615, 317, 238], lane: 2 },
  '2023': { chip: [780, 2638], media: [975, 2815, 375, 211], lane: 2 },
  '2025': { chip: [234, 2902], media: [137, 2993, 411, 348], lane: 3 },
  '2024': { chip: [750, 3089], media: [954, 3100, 339, 260], lane: 3 },
  '2026': { chip: [665, 3383], media: [935, 3411, 333, 289], lane: 4 },
} as const;

/* Outer edge of each lane's top stroke, and the lane's left edge. */
const LANE_TOP = [1942, 2224, 2552, 2853, 3341];
const LANE_LEFT = 128;

describe('lane artboard — measured', () => {
  it('carries the measured lane width', () => {
    expect(LANE_WIDTH).toBe(1184);
  });

  /*
   * 282, 328, 301, 488, 341 — top stroke to top stroke, with the last floor at
   * y=3686. `min-height: 360px` was overriding all of them, which is why lane 0
   * rendered 370px against the export's 282.
   */
  it('sizes the lanes from the export, not from a floor', () => {
    expect(LANE_HEIGHTS).toEqual([282, 328, 301, 488, 341]);
    expect(rule('.journey__row')).toMatch(/height:\s*calc\(var\(--lane-h\) \/ 1184 \* 100cqw\)/);
    expect(rule('.journey__row')).toMatch(/min-height:\s*0/);
  });

  it.each(Object.entries(FIGMA))('places the %s chip where the Figma draws it', (id, want) => {
    const m = MILESTONES.find((x) => x.id === id);
    expect(m).toBeDefined();
    expect(m!.place.chip.x).toBe(want.chip[0] - LANE_LEFT);
    expect(m!.place.chip.y).toBe(want.chip[1] - LANE_TOP[want.lane]);
  });

  it.each(Object.entries(FIGMA))('places the %s photograph and sizes it at half its render', (id, want) => {
    const m = MILESTONES.find((x) => x.id === id)!;
    expect(m.place.media).toBeDefined();
    expect(m.place.media!.x).toBe(want.media[0] - LANE_LEFT);
    expect(m.place.media!.y).toBe(want.media[1] - LANE_TOP[want.lane]);
    expect(m.media!.width).toBe(want.media[2]);
    expect(m.media!.height).toBe(want.media[3]);
  });

  /*
   * The regression this replaces: `max-width: 340px` above 1024 stretched every
   * photograph to 340 regardless of its own size, and `justify-content:
   * space-between` on the flex row decided the x. That put the 2019 chip 74px
   * left of its measured position and the 2020 chip 116px left and 178px low.
   */
  it('lets each photograph keep its own width', () => {
    const body = groupedRule(artboard, ['.milestone__media', '.milestone__decor']);
    expect(body).toMatch(/width:\s*calc\(var\(--w\) \/ 1184 \* 100cqw\)/);
    expect(body).toMatch(/max-width:\s*none/);
    expect(artboard).not.toMatch(/max-width:\s*340px/);
  });

  /*
   * Placements are measured from the OUTER edge of the lane's strokes. Once the
   * road became one drawn path the rows stopped drawing borders, so their
   * padding box IS that edge and `inset: 0` is the origin. While the borders
   * existed this needed a 10px correction, and without it every piece sat 6px
   * low and 10px right on the reversed rows.
   */
  it('takes the row box itself as the placement origin', () => {
    expect(rule('.milestone')).toMatch(/inset:\s*0/);
    expect(rule('.milestone')).not.toMatch(/var\(--road-width\)/);
  });

  /*
   * Container queries, so 100cqw is the lane's own width and the whole artboard
   * scales with the panel rather than being pinned to 1280.
   */
  it('scales the artboard with the lane rather than pinning it', () => {
    expect(rule('.journey')).toMatch(/container-type:\s*inline-size/);
  });

  it('binds every placement onto the element that uses it', () => {
    expect(html).toMatch(/\[style\.--lane-h\]="row\.height"/);
    expect(html).toMatch(/\[style\.--x\]="milestone\.place\.chip\.x"/);
    expect(html).toMatch(/\[style\.--x\]="milestone\.place\.media\?\.x"/);
    expect(html).toMatch(/\[style\.--x\]="milestone\.place\.decor\?\.x"/);
  });

  /*
   * Measured 195x84 with 48px digits. All three have to scale with the lane:
   * at the 768 breakpoint the chip is 103px wide, and a fixed 48px numeral
   * spills straight out of it.
   */
  it('scales the chip and its digits with the lane', () => {
    const body = rule('.milestone__chip');
    expect(body).toMatch(/width:\s*calc\(195 \/ 1184 \* 100cqw\)/);
    expect(body).toMatch(/height:\s*calc\(84 \/ 1184 \* 100cqw\)/);
    expect(body).toMatch(/font-size:\s*calc\(48 \/ 1184 \* 100cqw\)/);
  });

  /* Overlapping full-lane boxes would otherwise swallow each other's clicks. */
  it('keeps the overlapping milestone boxes out of the way of the chips', () => {
    expect(rule('.milestone')).toMatch(/pointer-events:\s*none/);
    expect(rule('.milestone__disclosure')).toMatch(/pointer-events:\s*auto/);
  });
});
