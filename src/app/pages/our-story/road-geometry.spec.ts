import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { groupedRule, rule, stripComments } from '../../../testing/css-rules';

/*
 * Source-level guards for the green road.
 *
 * jsdom computes no borders and no layout, so a rendering test here would pass
 * on any CSS at all. Instead these pin the numbers that were *measured* off
 * design/ourstory-figma.jpg with PIL, so a later "tidy-up" cannot quietly undo
 * them. Every expectation below cites the measurement it came from.
 */

const root = join(__dirname, '../../../..');
const read = (rel: string) => stripComments(readFileSync(join(root, rel), 'utf8'));

const timelineCss = read('src/app/pages/our-story/timeline/story-timeline.css');
const pageCss = read('src/app/pages/our-story/our-story.css');

describe('road stroke — measured from the Figma export', () => {
  /*
   * The stroke at y=2228 runs from row 2223 to row 2233 inclusive: eleven rows
   * of #58ac6e with one antialiased row either side. Ten CSS pixels.
   */
  it.each([
    ['story-timeline.css', timelineCss],
    ['our-story.css', pageCss],
  ])('is 10px wide in %s, not the 5px hairline it was', (_file, css) => {
    expect(css).toMatch(/--road-width:\s*10px/);
  });

  /*
   * Sampled inside the stroke: rgb(88, 172, 110). --color-green-500 (#66c67f)
   * is the lighter fill their live site uses for other things.
   */
  it.each([
    ['story-timeline.css', timelineCss],
    ['our-story.css', pageCss],
  ])('uses the darker green-600 token in %s', (_file, css) => {
    expect(css).toMatch(/--road-color:\s*var\(--color-green-600\)/);
  });

  /*
   * Re-measured on all three corners of the intro/origin road, and 32px was
   * twice the truth. Taking the outer edge of each turn:
   *
   *   lane top    outer corner (781, 1026): the horizontal picks up at x=797
   *               and the vertical at y=1042 -> r=16
   *   lane foot   outer corner (789, 1338): horizontal ends x=771, vertical
   *               ends y=1326 -> r~15
   *   origin top  outer corner (130, 1330): horizontal starts x=143, vertical
   *               starts y=1345 -> r~14
   *
   * The timeline's own corners have not been re-measured yet, so it keeps 32
   * rather than being changed on this page's evidence.
   */
  it('rounds the intro and origin corners at the measured 16px', () => {
    expect(pageCss).toMatch(/--road-radius:\s*16px/);
    expect(pageCss).not.toMatch(/--road-radius:\s*32px/);
  });

  it('leaves the timeline radius alone until its corners are measured', () => {
    expect(timelineCss).toMatch(/--road-radius:\s*32px/);
  });

  /*
   * The centre line is white dots ~4px wide and 3px tall on an 8px period,
   * sitting in the middle of the stroke — not a 1.5px hairline.
   */
  it('draws a 3px white dashed centre line', () => {
    expect(timelineCss).toMatch(/--road-dash-width:\s*3px/);
    expect(timelineCss).toMatch(/--road-dash:\s*var\(--color-white\)/);
  });
});

describe('the left rail is one line', () => {
  /*
   * The rail is a single vertical in the export: the origin box's left stroke
   * measures x=130..139 and lane 1's, 300px further down, measures x=130..139
   * too. The build had the origin at margin-left 55 (stroke 135..145, centre
   * 140) against the timeline's rows at x=128 (centre 133) — a 7px jog at the
   * joint. 50 puts the origin's centre on 135, within 2px of the rows.
   */
  it('sets the origin box on the measured rail at panel x=130', () => {
    expect(rule(pageCss, '.origin')).toMatch(/margin:\s*0 0 0 50px/);
  });
});

describe('the step from the origin box into lane 0', () => {
  /*
   * Measured: the origin's bottom stroke is y=1900..1909, the step's vertical
   * runs x=700..708 between them, and lane 0's top stroke is y=1942..1950. So
   * the stub between the two boxes is 33px, not the 41px centre-to-centre
   * distance it was carrying, and the step stands at x=704 — 576px into the
   * journey's 1184px content box.
   */
  it('drops the measured 33px between the two strokes', () => {
    expect(rule(timelineCss, '.journey__lead')).toMatch(/--road-step-drop|height:\s*33px/);
    expect(timelineCss).toMatch(/--road-step-drop:\s*33px/);
  });

  it('stands the step at the measured 576/1184 of the journey', () => {
    expect(timelineCss).toMatch(/--road-step-x:\s*calc\(100% \* 576 \/ 1184\)/);
    const desktop = timelineCss.slice(timelineCss.indexOf('@media (min-width: 768px)'));
    expect(rule(desktop, '.journey__lead')).toMatch(/margin-left:\s*calc\(var\(--road-step-x\)/);
  });

  /*
   * There is no mask here any more, and that is the point. It used to cut lane
   * 0's border-drawn top edge back to the step, and it carried a bug worth
   * remembering: it sat on `.journey__row:first-child::before` at `z-index:
   * auto`, and `.journey__track` — the white dashed centre line — comes later in
   * the row's DOM. Equal z-index means paint order, so the mask erased the green
   * stroke and the dashes were painted straight back over it. What showed on the
   * page was a dashed line running the full width of the panel with no road
   * under it.
   *
   * Once the road became one drawn path the lanes stopped drawing borders, so
   * there is no top edge to cut and the mask is dead. Leaving it in the file was
   * not harmless: editing the group that hid it turned it back on as a 571x14
   * cream bar at z-index 2, painting over the drawn road.
   */
  it('keeps no mask over lane 0, because there is no border there to cut', () => {
    expect(timelineCss).not.toMatch(/\.journey::before/);
    expect(timelineCss).not.toMatch(/\.journey__row:first-child::before/);
  });

  it('leaves no mask on the row, where it was painted under the track', () => {
    expect(timelineCss).not.toMatch(/\.journey__row:first-child::before/);
  });

  it('needs a positioned journey for the mask to hang off', () => {
    expect(rule(timelineCss, '.journey')).toMatch(/position:\s*relative/);
  });

  /* Below 768 the road is one straight left rail, so the stub joins it there. */
  it('puts the stub on the left rail on mobile', () => {
    expect(rule(timelineCss, '.journey__lead')).toMatch(/margin-left:\s*0/);
  });

  /*
   * The stub is a 10px rectangle butted into two horizontals, which reads as a
   * tee; the export rounds this corner at 16px like every other one on the
   * road. Same technique as .intro__elbow, and for the same reason — the stroke
   * it comes from belongs to the origin box and the one it leaves into belongs
   * to lane 0, so no single box owns both sides of the turn.
   *
   * Local coordinates in a 10x33 box: centre line x=5, the origin's stroke on
   * y=-5, lane 0's on y=38, 11px of curve on the centre line.
   */
  it('draws the turn instead of butting a rectangle into it', () => {
    const body = rule(timelineCss, '.journey__lead-road');
    expect(body).toMatch(/overflow:\s*visible/);
    const desktop = timelineCss.slice(timelineCss.indexOf('@media (min-width: 768px)'));
    expect(rule(desktop, '.journey__lead')).toMatch(/background:\s*none/);
    expect(rule(desktop, '.journey__lead-road')).toMatch(/display:\s*block/);
  });

  it('paints the step as stroke plus white dashed centre, like every lane', () => {
    const html = readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.html'), 'utf8');
    const svg = html.slice(html.indexOf('journey__lead-road'), html.indexOf('</svg>'));
    expect(svg).toContain('viewBox="0 0 10 33"');
    expect(svg.match(/d="M-12 -5 H-6 Q5 -5 5 6 V27 Q5 38 16 38 H22"/g)).toHaveLength(2);
    expect(svg).toContain('data-road="stroke"');
    expect(svg).toContain('data-road="dash"');
  });

  /*
   * The export draws ONE coral pair at this joint. The lead span carried a
   * second, and its own 10px box squashed the 26px glyph to 10px wide.
   */
  it('leaves the joint marker to the row, not the stub', () => {
    const html = readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.html'), 'utf8');
    const lead = html.slice(html.indexOf('<span class="journey__lead"'), html.indexOf('</span>'));
    expect(lead).not.toContain('journey__marker');
    expect(timelineCss).not.toMatch(/\.journey__lead \.journey__marker/);
  });
});

describe('lanes are open on one side', () => {
  /*
   * The measured path never closes a lane. Lane 0 draws x=1298 y=1946..2228 on
   * its right and nothing on its left; lane 1 draws x=135 y=2228..2556 on its
   * left and nothing on its right. Drawing all four sides — which is what the
   * first build did — turns a road into a stack of boxes.
   */
  it('never gives a lane a four-sided border', () => {
    const body = rule(timelineCss, '.journey__row');
    expect(body).not.toMatch(/border:\s*var\(--road-width\)/);
  });

  it('closes left-to-right lanes on the right only', () => {
    const body = rule(timelineCss, ".journey__row[data-direction='ltr']");
    expect(body).toMatch(/border-right:\s*var\(--road-width\)/);
    expect(body).not.toMatch(/border-left:\s*var\(--road-width\)/);
  });

  it('closes right-to-left lanes on the left only', () => {
    const body = rule(timelineCss, ".journey__row[data-direction='rtl']");
    expect(body).toMatch(/border-left:\s*var\(--road-width\)/);
    expect(body).not.toMatch(/border-right:\s*var\(--road-width\)/);
  });

  /*
   * A lane's own top border is the previous lane's bottom edge, so only the
   * final lane may draw one of its own — otherwise the road grows a spare rung.
   */
  it('draws a bottom edge on the last lane only', () => {
    expect(timelineCss).toMatch(/\.journey__row\[data-last\][^{]*\{[^}]*border-bottom:\s*var\(--road-width\)/);
    expect(rule(timelineCss, '.journey__row')).not.toMatch(/border-bottom:\s*var\(--road-width\)/);
  });
});

describe('lane contents — measured positions', () => {
  /*
   * Every one of the nine chips measures exactly 195x84 with 48px digits
   * (cap height 35px at y=2002..2036 for the 2018 chip). The first build drew
   * them at 28px, which is why the page read as a list rather than a map.
   */
  it('sets the chip type at 48px on desktop', () => {
    const desktop = timelineCss.slice(timelineCss.indexOf('@media (min-width: 768px)'));
    expect(rule(desktop, '.milestone__chip')).toMatch(/font-size:\s*var\(--font-size-48\)/);
  });

  /* Chip fill sampled at #f5ead6 — lighter than the live site's #ead8b5. */
  it('fills the chip with the Figma chip token', () => {
    expect(rule(timelineCss, '.milestone__chip')).toMatch(/background:\s*var\(--color-neutral-100\)/);
  });

  /*
   * Chips sit 30-60px below their lane's top edge; photographs sit flush with
   * its bottom edge (the 2018 photo ends at y=2222, the lane at y=2228).
   */
  it('pins chips to the lane top and photographs to the lane floor', () => {
    const desktop = timelineCss.slice(timelineCss.indexOf('@media (min-width: 768px)'));
    expect(rule(desktop, '.milestone__media')).toMatch(/align-self:\s*flex-end/);
    expect(rule(desktop, '.milestone__disclosure')).toMatch(/align-self:\s*flex-start/);
  });

  /* Measured lane heights: 282, 328, 431, 488, 341. */
  it('gives a lane room for a full-height photograph', () => {
    const desktop = timelineCss.slice(timelineCss.indexOf('@media (min-width: 768px)'));
    expect(rule(desktop, '.journey__row')).toMatch(/min-height:\s*3\d\dpx/);
  });
});

describe('the road is continuous through the intro and origin blocks', () => {
  /*
   * The path enters at the lightbulb (y=1030, x=786..1361), turns down at
   * x=785, left along y=1335, down the origin box's left edge at x=135, and
   * out along y=1905 — so the origin box's top and bottom edges are both
   * partial, stopping where the lane above comes down to meet them.
   */
  /*
   * Asserted on the rule bodies, not on the selector strings: an earlier
   * version of these two only checked that the text appeared somewhere in the
   * file, and a mutation that renamed the desktop selector survived because the
   * mobile override still carried the name.
   */
  /*
   * The bug this catches: .origin__cut had no rule of its own, so the span was
   * a static GRID ITEM and took cell 1/1 of the origin box. That pushed the
   * heading and copy into column two and dropped the group photograph onto a
   * second row — the origin box rendered 862px tall with the text on the right,
   * where the Figma has the heading at x=220 on the left and the photograph
   * beside it. Only the pseudo-elements were ever meant to exist.
   */
  it('keeps the cut out of the origin grid flow', () => {
    const body = rule(pageCss, '.origin__cut');
    expect(body).toMatch(/position:\s*absolute/);
    expect(body).toMatch(/inset:\s*0/);
  });

  it('paints both cuts in the panel background so they erase the stroke', () => {
    const body = groupedRule(pageCss, ['.origin__cut::before', '.origin__cut::after']);
    expect(body).toMatch(/background:\s*var\(--color-neutral-50\)/);
    expect(body).toMatch(/position:\s*absolute/);
  });

  /*
   * `left: 50%` put the end of the top stroke at panel x=672 while the lane
   * comes down at x=701, leaving 16px of cream between the stroke and the
   * elbow. The cut has to track the intro's column split instead, so the two
   * cannot drift apart at other widths: the origin's padding box is the panel
   * minus 65px, the lane starts at 48 + col1 + gap, and col1 is 589/1120 of
   * the intro's content minus the gutter. Hence the 589 and 1120 here — the
   * same numbers as .intro's grid-template-columns.
   */
  it('stops the origin box top edge exactly where the lane comes down', () => {
    const body = rule(pageCss, '.origin__cut::before');
    expect(body).toMatch(/top:\s*calc\(var\(--road-width\)/);
    expect(body).toMatch(/left:\s*calc\(/);
    expect(body).toMatch(/589/);
    expect(body).toMatch(/1120/);
    expect(body).not.toMatch(/left:\s*\d\d%/);
  });

  /* The split is stated twice — pinned together so a change to one is caught. */
  it('states the same column split in the grid and in the cut', () => {
    expect(rule(pageCss, '.intro')).toMatch(/grid-template-columns:\s*589fr 531fr/);
    expect(rule(pageCss, '.origin__cut::before')).toMatch(/589/);
  });

  /*
   * Same failure as the top cut, at the other end. `left: 49%` ran the bottom
   * stroke to panel x=740 while the road steps down at x=704, so 36px of it
   * carried on past the corner. The step's x is owned by .journey__lead, which
   * sits 576/1184 of the way across the journey's content box — so the cut is
   * written from those same two numbers.
   */
  it('stops the origin box bottom edge exactly where the road steps down', () => {
    const body = rule(pageCss, '.origin__cut::after');
    expect(body).toMatch(/bottom:\s*calc\(var\(--road-width\)/);
    expect(body).toMatch(/left:\s*calc\(/);
    expect(body).toMatch(/576/);
    expect(body).toMatch(/1184/);
    expect(body).not.toMatch(/left:\s*\d\d%/);
  });

  /* The corner at (785, 1335) turns the why-making lane into the origin's top. */
  it('does not curl the why-making lane with an orphan radius', () => {
    /*
     * A bottom-left radius on a box that draws no bottom border renders as an
     * inward hook, not a corner — that hook dangled ~33px above the origin's
     * top stroke with cream between them. The turn is drawn by .intro__elbow
     * instead, so the lane's own end stays square and hides underneath it.
     */
    expect(rule(pageCss, ".intro__block[data-block='why']")).not.toMatch(
      /border-bottom-left-radius/,
    );
    expect(rule(pageCss, ".intro__block[data-block='why']::before")).not.toMatch(
      /border-bottom-left-radius/,
    );
  });

  it('anchors a fixed-size elbow SVG to the why-making lane corner', () => {
    /*
     * The lane's vertical (x=770) and the origin's top stroke meet across grid
     * columns, so no single box owns both sides of the turn. The elbow is a
     * third piece: fixed px size, offset from the lane's own corner, so it
     * cannot drift when the columns go fluid. It spans 32px either side of the
     * corner (the 32px curve zone) plus the 10px stroke it overlaps.
     */
    const body = rule(pageCss, '.intro__elbow');
    expect(body).toMatch(/width:\s*32px/);
    expect(body).toMatch(/height:\s*36px/);
    expect(body).toMatch(/left:\s*-21px/);
    expect(body).toMatch(/bottom:\s*-10px/);
    expect(body).toMatch(/position:\s*absolute/);
  });

  it('hides the elbow on mobile with the rest of the road', () => {
    const mobile = pageCss.slice(pageCss.indexOf('@media (max-width: 767px)'));
    expect(
      groupedRule(mobile, [".intro__block[data-block='why']::before", '.intro__elbow']),
    ).toMatch(/display:\s*none/);
  });
});
