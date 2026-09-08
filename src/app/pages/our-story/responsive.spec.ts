import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { groupedRule, rule as cssRule, stripComments } from '../../../testing/css-rules';

/*
 * Tablet and mobile for the Our Story page.
 *
 * The Figma ships ONE 1440 artboard and no narrow ones, so nothing here is a
 * measurement — these are the reflow decisions, pinned so a later pass cannot
 * quietly undo them, each with the number that made it necessary.
 *
 * The two faults these replace, both found by resizing the real browser:
 *
 *   390px  the intro band was still a two-column grid. `grid-column: 2` on the
 *          tower cut-out is (0,2,0) and beat the mobile reset on `.intro__media`
 *          (0,1,0), so the grid kept an implicit second column and laid the band
 *          out in 161px + 109px tracks. "Our mission" wrapped onto two lines and
 *          the paragraph broke every four words.
 *
 *   768px  the why-making lane kept the desktop `padding: 82px 48px 12px 80px`
 *          and the measured 589/531 split, which left 168px of text inside a
 *          274px column — eleven lines where the export has five.
 */

const root = join(__dirname, '../../../..');
const pageCss = stripComments(readFileSync(join(root, 'src/app/pages/our-story/our-story.css'), 'utf8'));
const tablet = pageCss.slice(pageCss.indexOf('@media (max-width: 1023px)'));
const mobile = pageCss.slice(pageCss.indexOf('@media (max-width: 767px)'));
/* Mobile-first: the timeline's base rules are its narrow ones. */
const timelineCss = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.css'), 'utf8'),
);

const CUTOUTS = ["'.intro__media[data-slot=\\'tower\\']'", "'.intro__media[data-slot=\\'girls\\']'"];

describe('intro band — mobile', () => {
  /*
   * The reset has to carry the attribute selectors. `.intro__media` is (0,1,0)
   * and loses to the (0,2,0) desktop rules however late it appears — the same
   * specificity trap that left a radius clipping the mobile timeline rail and
   * that made the desktop margins survive into one column.
   */
  it('returns both cut-outs to the single column at a specificity that wins', () => {
    const body = groupedRule(mobile, [
      ".intro__block[data-block='mission']",
      ".intro__block[data-block='why']",
      ".intro__media[data-slot='tower']",
      ".intro__media[data-slot='girls']",
    ]);
    expect(body).toMatch(/grid-column:\s*1/);
    expect(body).toMatch(/grid-row:\s*auto/);
  });

  /*
   * Source order is decor, accents, tower, girls, mission, why — the two
   * photographs come before either block, because on desktop the grid places
   * them by coordinate and source order does not matter. In one column it does,
   * so `order` pairs each block with its own photograph: mission, tower, why,
   * girls. Visual order only; the DOM is untouched.
   */
  it.each([
    [".intro__block[data-block='mission']", 1],
    [".intro__media[data-slot='tower']", 2],
    [".intro__block[data-block='why']", 3],
    [".intro__media[data-slot='girls']", 4],
  ])('gives %s the reading order %i', (selector, order) => {
    expect(cssRule(mobile, selector)).toMatch(new RegExp(`order:\\s*${order}`));
  });

  /* 320px wide, less a 20px gutter each side, is 280px of column. */
  it('caps both photographs to the column', () => {
    const body = groupedRule(mobile, [
      ".intro__media[data-slot='tower']",
      ".intro__media[data-slot='girls']",
    ]);
    expect(body).toMatch(/width:\s*min\(100%, 320px\)/);
    expect(body).toMatch(/margin:\s*0/);
  });
});

describe('intro band — tablet', () => {
  /*
   * 589/531 is a fact about a 1280 panel: it puts the lane's stroke on the
   * measured x=781. At 753 the same ratio leaves the lane 274px wide, and the
   * measured 80px text inset then eats a third of it. An even split plus a
   * proportionate inset gives the copy 254px instead of 168px.
   */
  it('splits the columns evenly where the measurement no longer applies', () => {
    expect(cssRule(tablet, '.intro')).toMatch(/grid-template-columns:\s*1fr 1fr/);
  });

  it('brings the lane insets down to the width actually available', () => {
    expect(cssRule(tablet, ".intro__block[data-block='why']")).toMatch(
      /padding:\s*var\(--space-48\) var\(--space-24\) var\(--space-16\) var\(--space-32\)/,
    );
  });

  /*
   * The overhang exists so the road lands on a measured y=1026. There is no
   * measured y at this width, so the copy should simply sit above the stroke.
   */
  it('drops the overhang, which only means anything against a measured stroke', () => {
    expect(cssRule(tablet, '.intro')).toMatch(/--intro-overhang:\s*0px/);
  });

  /*
   * Drawn at their measured widths the cut-outs collide: the girls photograph
   * is 397px inside a 288px column and its -32px pull would run it 61px into
   * the lane's left stroke.
   */
  it('shrinks both cut-outs so they stay inside their own column', () => {
    const tower = cssRule(tablet, ".intro__media[data-slot='tower']");
    const girls = cssRule(tablet, ".intro__media[data-slot='girls']");
    expect(tower).toMatch(/width:\s*min\(100%, 240px\)/);
    expect(tower).toMatch(/margin-top:\s*0/);
    expect(girls).toMatch(/width:\s*min\(100%, 260px\)/);
    expect(girls).toMatch(/margin-left:\s*0/);
  });
});

describe('the mobile road is one line', () => {
  /*
   * The invariant: the origin card's left stroke and the timeline's rail land
   * on the same x, or the road has a visible jog in it. Measured at 390 they
   * once sat at x=16..26 and x=36..46, 20px apart.
   *
   * This used to be enforced by pulling BOTH out to the panel edge — a zero
   * side margin on the card and `padding-inline: 0` on the journey wrapper —
   * which worked only while the panel was itself inset by a 16px gutter. The
   * panel is full-bleed now, so that left the stroke against the viewport edge.
   * They still have to agree; they now agree on `--panel-pad` instead of on 0.
   *
   * The card needs a MARGIN because its stroke is drawn on its own border box,
   * and the journey needs no rule at all — it keeps the `.panel-inset` padding
   * it already had.
   */
  it('insets the origin card by exactly what the rail is inset by', () => {
    expect(cssRule(mobile, '.origin')).toMatch(/margin:\s*var\(--space-32\) var\(--panel-pad\) 0/);
    expect(mobile).not.toMatch(/\.story-page__journey\s*\{[^}]*padding-inline:\s*0/);
    const layoutCss = stripComments(
      readFileSync(join(root, 'src/styles/layout.css'), 'utf8'),
    );
    expect(cssRule(layoutCss, '.panel-inset')).toMatch(/padding-inline:\s*var\(--panel-pad\)/);
  });

  /*
   * With all four corners rounded the card's left border curves away 16px above
   * its own bottom and the rail restarts below it, so the line reads as a box
   * that closes and a separate stroke that begins. Squaring the bottom-left
   * runs the left border straight into the rail.
   */
  it('squares the corner the rail continues through', () => {
    expect(cssRule(mobile, '.origin')).toMatch(
      /border-radius:\s*var\(--road-radius\) var\(--road-radius\) var\(--road-radius\) 0/,
    );
  });

  /*
   * The card grows a right border on mobile but `.origin::before` — the white
   * dashed centre line — still carries `border-right: 0` from the desktop rule,
   * so three sides of the card were dashed and the fourth was plain green.
   */
  it('carries the dashed centre line onto the border mobile adds', () => {
    const body = cssRule(mobile, '.origin::before');
    expect(body).toMatch(/border-right:\s*var\(--road-dash-width\) dashed var\(--road-dash\)/);
  });

  /*
   * Desktop ends the road at a filled dot; mobile just stopped mid-air at the
   * last lane's floor. Same 26px dot, centred on the rail.
   */
  it('ends the rail at the same terminus dot the drawn road uses', () => {
    /*
     * In the TIMELINE's stylesheet, not the page's: `.journey` belongs to that
     * component, so the same rule in our-story.css is scoped to the page's
     * _ngcontent attribute and never matches. It computed `content: none` on
     * the real page while a source-level test on the wrong file passed.
     */
    const body = cssRule(timelineCss, '.journey::after');
    expect(body).toMatch(/border-radius:\s*50%/);
    expect(body).toMatch(/background:\s*var\(--road-color\)/);
    expect(body).toMatch(/width:\s*26px/);
  });
});
