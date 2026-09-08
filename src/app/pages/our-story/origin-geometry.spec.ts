import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ORIGIN, DECOR } from '../../data/our-story';
import { rule as cssRule, stripComments } from '../../../testing/css-rules';

/*
 * The origin box ("How did MG start"), measured off design/ourstory-figma.jpg
 * in the 1440 frame. Panel x=80..1360, so panel-relative x is these minus 80.
 *
 *   border box        x=130, y=1330..1909 (579 tall), open on the right
 *   left stroke       x=130..139  — the same rail lane 1 uses 300px lower
 *   top stroke        y=1330..1338, x=135..785 (stops under the incoming lane)
 *   bottom stroke     y=1900..1909, x=135..704 (stops at the step down)
 *   "How did MG"      ink x=221..431  y=1443..1471
 *   "start"           ink x=220..305  y=1491..1515   (baselines 44 apart)
 *   paragraph         ink x=219..562, five lines from y=1546 on a 28px lead
 *   decor cluster     x=219..699  y=1703..1901  (480x199)
 *   group photograph  x=700..1293 y=1430..1837
 *
 * Two of those are the 2x-render-at-half rule again: the photograph's file is
 * 1184x806 and the decor SVG is declared 480x199.
 */

const root = join(__dirname, '../../../..');
const pageCss = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/our-story.css'), 'utf8'),
);
const rule = (selector: string) => cssRule(pageCss, selector);

describe('origin box — measured', () => {
  /*
   * The box was 537px tall against the export's 579, with its content 17px
   * high and its photograph 40px right of where the Figma puts it, because the
   * columns were fractional and the photograph was stretched to fill one of
   * them by `width: 100%`.
   */
  it('sets the columns to the sizes the Figma draws, not fractions of the box', () => {
    const body = rule('.origin');
    expect(body).toMatch(/grid-template-columns:\s*minmax\(0, 350px\) minmax\(0, 592px\)/);
    expect(body).toMatch(/justify-content:\s*space-between/);
  });

  /*
   * Neither column is centred in the export — the heading ink sits 113px below
   * the box's top edge and the photograph 100px — so `align-items: center`,
   * which the box had, cannot reproduce either.
   */
  it('starts both columns at the top', () => {
    expect(rule('.origin')).toMatch(/align-items:\s*start/);
  });

  /*
   * Heading ink x=221 y=1443 against a padding box starting at x=60,y=1340
   * (panel-relative), and the photograph's right edge at x=1212.
   */
  it('insets the content by the measured padding', () => {
    expect(rule('.origin')).toMatch(/padding:\s*98px 68px 0 80px/);
  });

  /*
   * Measured at y=1546/1575/1602/1630/1659 — a 28px lead, the same as the intro
   * copy. This paragraph was inheriting the 24px body default, and over five
   * lines that 20px pulled the decor cluster, the bottom stroke, the step down
   * and every lane of the timeline below it up by exactly 20px.
   */
  it('leads the origin copy at the measured 28px', () => {
    expect(rule('.origin__body p')).toMatch(/line-height:\s*var\(--line-height-28\)/);
  });

  it('draws the group photograph at half its 2x render', () => {
    expect(ORIGIN.photo.width).toBe(592);
    expect(ORIGIN.photo.height).toBe(403);
    expect(ORIGIN.photo.width / ORIGIN.photo.height).toBeCloseTo(1184 / 806, 3);
    expect(rule('.origin__photo')).toMatch(/width:\s*592px/);
  });

  it('draws the decor cluster at the size the Figma places it', () => {
    expect(DECOR.origin.width).toBe(480);
    expect(DECOR.origin.height).toBe(199);
    expect(rule('.origin__decor')).toMatch(/width:\s*480px/);
  });

  /*
   * The cluster is wider than its own column (480 against 350) and runs on
   * under the photograph, where the green stair-step disappears behind it. It
   * also crosses the bottom stroke by 3px — the yellow wedge sits on the road.
   */
  it('lets the cluster cross its column and the bottom stroke', () => {
    const body = rule('.origin__decor');
    expect(body).toMatch(/margin:\s*21px 0 -3px/);
    expect(body).not.toMatch(/min\(100%, 320px\)/);
  });

  /* Tablet has neither the width for 592px of photograph nor for 480 of decor. */
  it('hands the columns back to fractions below 1024', () => {
    const tablet = pageCss.slice(pageCss.indexOf('@media (max-width: 1023px)'));
    expect(cssRule(tablet, '.origin')).toMatch(
      /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1\.2fr\)/,
    );
    expect(cssRule(tablet, '.origin__photo')).toMatch(/width:\s*100%/);
    expect(cssRule(tablet, '.origin__decor')).toMatch(/width:\s*min\(100%, 320px\)/);
  });
});
