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
const pageCss = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/our-story.css'), 'utf8'),
);
const tablet = pageCss.slice(pageCss.indexOf('@media (max-width: 1023px)'));
const mobile = pageCss.slice(pageCss.indexOf('@media (max-width: 767px)'));
/* Mobile-first: the timeline's base rules are its narrow ones. */
const timelineCss = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.css'), 'utf8'),
);

const CUTOUTS = [
  "'.intro__media[data-slot=\\'tower\\']'",
  "'.intro__media[data-slot=\\'girls\\']'",
];

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
    const layoutCss = stripComments(readFileSync(join(root, 'src/styles/layout.css'), 'utf8'));
    expect(cssRule(layoutCss, '.panel-inset')).toMatch(/padding-inline:\s*var\(--panel-pad\)/);
  });

  /*
   * On a phone this card is a complete enclosure — all four sides, all four
   * corners — and the road leaves it from the CENTRE of the bottom edge rather
   * than from a corner. So no corner needs squaring: nothing continues out of
   * one. On the desktop artboard the same card's horizontal edges are partial
   * instead, because there the road runs along part of each.
   */
  it('encloses the card and rounds every corner', () => {
    const body = cssRule(mobile, '.origin');
    expect(body).toMatch(/border-radius:\s*var\(--road-radius\)\s*;/);
    expect(body).toMatch(/border-right:\s*var\(--road-width\) solid var\(--road-color\)/);
    expect(body).toMatch(/border-bottom:\s*var\(--road-width\) solid var\(--road-color\)/);
  });

  /*
   * The dashed centre line has to mirror whichever sides the stroke draws, or
   * some edges read dashed and others plain green — the desktop rule leaves
   * `border-right: 0` on it, which is right up there and wrong down here.
   * The card is closed on a phone, so the dash goes all the way round with it.
   */
  it('mirrors the dashed centre line to the sides the stroke actually draws', () => {
    const body = cssRule(mobile, '.origin::before');
    expect(body).toMatch(/border:\s*var\(--road-dash-width\) dashed var\(--road-dash\)/);
    expect(body).not.toMatch(/border-right:\s*0/);
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
    expect(body).toMatch(/width:\s*var\(--road-dot\)/);
  });
});

/*
 * The decorative overhang must not become a horizontal scrollbar.
 *
 * Found on the deployed site at a 768px viewport. Media queries are evaluated
 * against the viewport INCLUDING the classic scrollbar, but the content box is
 * 15px narrower - so at 768 the desktop rules apply while only 753px is usable.
 * `.origin__cut::before/::after` deliberately sit at `right: -10px` to bury the
 * square end of the stroke they cut, which is invisible while the cream panel
 * is inset, and 10px of horizontal scroll once the panel goes full-bleed below
 * 1280.
 *
 * `clip`, not `hidden`: `overflow: hidden` would make the page a scroll
 * container, which breaks position: sticky and changes what `100vh` means
 * inside it. `clip` just clips.
 */
describe('horizontal overflow', () => {
  const layoutCss = stripComments(readFileSync(join(root, 'src/styles/layout.css'), 'utf8'));

  it('clips decorative overhang at the page wrapper', () => {
    expect(cssRule(layoutCss, '.site-main')).toMatch(/overflow-x:\s*clip/);
  });

  it('clips rather than scrolls, so sticky and vh still work', () => {
    expect(cssRule(layoutCss, '.site-main')).not.toMatch(/overflow-x:\s*(hidden|auto|scroll)/);
  });

  it('still lets the origin masks overhang, because that is what buries the stroke end', () => {
    // The fix must clip the symptom, not delete the technique.
    expect(groupedRule(pageCss, ['.origin__cut::before', '.origin__cut::after'])).toMatch(
      /right:\s*calc\(var\(--road-width\) \* -1\)/,
    );
  });
});
