import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { OurStoryPage } from './our-story';
import { INTRO_MEDIA } from '../../data/our-story';
import { groupedRule, rule as cssRule, stripComments } from '../../../testing/css-rules';

/*
 * The intro band, measured off design/ourstory-figma.jpg.
 *
 * Everything asserted here came out of a pixel scan of the export, not off a
 * screenshot — reading screenshots is what produced the wrong numbers the first
 * time round. The measurements, in the 1440 frame (panel x=80..1360, hero
 * bottom y=783):
 *
 *   "Our mission"      ink x=134..348  y=858..886   (215px wide -> 36px type)
 *   mission paragraph  ink x=134..528  lines at 920/948/976/1004/1032
 *   green hexagons     x=658..719   y=888..937
 *   coral star         x=1265..1295 y=822..850
 *   coral bar          x=1063..1069 y=905..1027
 *   tower photograph   ink x=1069..1360, box bottom on the road at y=1026
 *   "Why making?"      ink x=871..1120 y=1123..1161
 *   why paragraph      ink x=871..1231 lines at 1185/1213/1241/1269/1298
 *   girls photograph   ink x=146..489, box bottom on the origin top at y=1330
 *   road top stroke    y=1026..1035, running x=785 out to the panel edge 1360
 *   road vertical      x=781..789, y=1030..1334
 *   origin top stroke  y=1330..1338, x=135..785
 */

const root = join(__dirname, '../../../..');
const pageCss = stripComments(readFileSync(join(root, 'src/app/pages/our-story/our-story.css'), 'utf8'));
const rule = (selector: string) => cssRule(pageCss, selector);

describe('intro typography — measured', () => {
  /*
   * 36px, and pinned here because a previous pass changed it to 44px off a cap
   * height reading. Text width is the measurement that settles it: the export
   * draws "Our mission" 216px wide and "Why making?" 251px, which is 36px
   * Parkinsans — at 44px the browser renders 267px and 309px.
   */
  it('sets the section headings at 36px', () => {
    expect(rule('.intro__block h2')).toMatch(/font-size:\s*var\(--font-size-36\)/);
  });

  /* Baselines 28px apart, five lines from y=920 to y=1032. */
  it('leads the body copy at 28px', () => {
    expect(rule('.intro__block p')).toMatch(/line-height:\s*var\(--line-height-28\)/);
  });

  /*
   * Both columns are narrow: the mission text wraps inside 396px and the
   * why-making text inside 362px. `max-width: 46ch` rendered them at 462px and
   * 502px, which is why the line breaks never matched the Figma.
   */
  it('wraps the mission column at the measured 400px', () => {
    expect(rule(".intro__block[data-block='mission']")).toMatch(/max-width:\s*400px/);
  });

  it('wraps the why-making column at the measured 365px without narrowing the lane', () => {
    /* The block itself is the road lane and must stay full width. */
    expect(rule(".intro__block[data-block='why']")).toMatch(/max-width:\s*none/);
    const text = groupedRule(pageCss, [
      ".intro__block[data-block='why'] > h2",
      ".intro__block[data-block='why'] > p",
    ]);
    expect(text).toMatch(/max-width:\s*365px/);
  });
});

describe('intro photographs — measured', () => {
  /*
   * Both files are 2x node renders and the Figma draws them at exactly half.
   * That is the whole rule, and checking it against the export settles the two
   * things a previous pass got wrong.
   *
   *   tower  render 584x388 -> drawn 292x194. Its ink fills the render's width,
   *          so the drawn ink is 292 wide and the export's is x=1069..1360. Its
   *          box bottom lands on the road stroke at y=1026.
   *   girls  render 794x594 -> drawn 397x297. Its ink is inset 100px/158px in
   *          the render, so drawn it starts 50px/79px into the box: box left 96
   *          puts the ink at x=146, matching the export's x=146..489. Its box
   *          bottom lands on the origin box's top stroke at y=1330.
   *
   * Aspect ratios corroborate: the export's girls ink is 344x217 (1.585) and
   * the asset's own ink is 690x436 (1.583).
   */
  it.each([
    ['tower', INTRO_MEDIA.tower, 292, 194, 584 / 388],
    ['girls', INTRO_MEDIA.girls, 397, 297, 794 / 594],
  ])('draws %s at half its 2x render', (_n, media, width, height, aspect) => {
    expect(media.width).toBe(width);
    expect(media.height).toBe(height);
    expect(media.width / media.height).toBeCloseTo(aspect, 3);
  });

  /*
   * The regression this replaces: both cut-outs carried a negative bottom
   * margin (-23px and -39px) that pushed them PAST the stroke they stand on.
   * The tower then painted over the top lane for its whole width, so the road
   * appeared to stop dead at the photograph instead of running out to the panel
   * edge, and the girls photo sat across the origin box's top edge. In the
   * export neither overlaps its stroke by a pixel: the tower's ink ends at
   * y=1025 with the stroke starting at 1026, and the girls' at y=1329 with the
   * origin's stroke starting at 1330. They sit on the road; they do not cross
   * it.
   */
  it.each(['tower', 'girls'])('stands the %s photograph on the stroke, not over it', (slot) => {
    const body = rule(`.intro__media[data-slot='${slot}']`);
    expect(body).not.toMatch(/margin-bottom/);
  });

  it('drops both cut-outs to the foot of their row so the stroke is the floor', () => {
    expect(rule('.intro__media')).toMatch(/align-self:\s*end/);
  });

  /*
   * The tower's box runs y=832..1026 while the band's content starts at y=853,
   * so it hangs 21px above the top padding. Without that, it is the tallest
   * thing in row one - 194px against the mission block's 200 less its 27px
   * overhang - and IT sets where the row ends, which put the road, the lane,
   * both photographs and the origin box 21px low with everything else correct.
   */
  it('hangs the tower above the top padding so the copy still sets the row', () => {
    expect(rule(".intro__media[data-slot='tower']")).toMatch(/margin-top:\s*-21px/);
  });

  /*
   * Every one of those offsets is measured against a stroke that does not exist
   * in one column, and the girls' -32px would drag the photograph out past the
   * panel's left edge. The reset has to carry the attribute selectors: a plain
   * `.intro__media` is (0,1,0) and loses to the (0,2,0) rules above it however
   * late it appears.
   */
  it('clears the measured offsets on mobile at a specificity that wins', () => {
    const mobile = pageCss.slice(pageCss.indexOf('@media (max-width: 767px)'));
    const body = groupedRule(mobile, [
      ".intro__media[data-slot='tower']",
      ".intro__media[data-slot='girls']",
    ]);
    expect(body).toMatch(/margin:\s*0/);
    /*
     * The widths need the same treatment and for the same reason. A 397px image
     * in a `1fr` column sets that column's min-content to 397, so at 375 the
     * whole intro band — text blocks included — was laid out 397 wide and the
     * document scrolled to 774.
     */
    expect(body).toMatch(/width:\s*min\(100%, 320px\)/);
  });

  /* x=1069..1360: its right edge is the panel edge, 48px past the text inset. */
  it('bleeds the tower photograph out to the panel edge', () => {
    expect(rule(".intro__media[data-slot='tower']")).toMatch(/justify-self:\s*end/);
    expect(rule(".intro__media[data-slot='tower']")).toMatch(
      /margin-right:\s*calc\(var\(--panel-pad\) \* -1\)/,
    );
  });

  /*
   * The girls render carries 50px of transparent margin down its left side once
   * drawn, so its BOX starts at panel x=96 for its INK to start at x=146 — 32px
   * left of the 128px text inset, not 18px right of it as it was.
   */
  it('hangs the girls photograph left of the text inset by its own transparent margin', () => {
    const body = rule(".intro__media[data-slot='girls']");
    expect(body).toMatch(/justify-self:\s*start/);
    expect(body).toMatch(/margin-left:\s*-32px/);
  });
});

describe('intro band rhythm — measured', () => {
  /*
   * Two rows, and every edge of them is a measured absolute:
   *
   *   mission heading ink   y=858  -> 75px below the hero (box top 69.5 -> 70)
   *   road top stroke       y=1026 -> 243px below the hero, so row 1 must end
   *                                   there: 70 + 200 (the block) - 27
   *   why heading ink       y=1123 -> 97px below the road's top edge
   *   origin top stroke     y=1330 -> row 2 is 304px: 10 + 82 + 200 + 12
   */
  it('starts the band 70px under the hero', () => {
    expect(rule('.intro')).toMatch(/padding-block:\s*70px 0/);
  });

  it('gives back the mission block overhang so the road lands at y=1026', () => {
    expect(rule('.intro')).toMatch(/--intro-overhang:\s*27px/);
  });

  /*
   * The girls photograph no longer overhangs anything, so the second overhang
   * token has no reader left. Pinned as absent: leaving a stale 39px in the file
   * is how the wrong margin survived a read-through.
   */
  it('keeps no overhang token for the girls photograph', () => {
    expect(pageCss).not.toMatch(/--origin-overhang/);
  });

  /*
   * The road's vertical is at x=781, i.e. 701px into the panel. With the 48px
   * text inset and a 64px gutter that puts the column split at 589/531, not
   * 593/527 — which drew it 4px right.
   */
  it('splits the columns so the lane comes down at panel x=701', () => {
    expect(rule('.intro')).toMatch(/grid-template-columns:\s*589fr 531fr/);
  });

  /*
   * Inside the lane, measured off its own strokes: the heading ink sits 97px
   * below the top stroke's outer edge (10px of it is border, so 82px of
   * padding plus 5px of half-leading), the text starts 80px right of the left
   * stroke's inner edge, and the last line clears the foot by 12px.
   */
  it('insets the lane text from the strokes it is measured against', () => {
    expect(rule(".intro__block[data-block='why']")).toMatch(
      /padding:\s*82px var\(--space-48\) 12px 80px/,
    );
  });
});

describe('junction elbow', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OurStoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(OurStoryPage);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  /*
   * The why-making lane's left border comes down at x=770 and the origin's top
   * stroke runs left from x=738; the 32px between them is the elbow zone the
   * Figma rounds at 32px. An SVG owns the turn because the two strokes belong
   * to different grid items — no single box can round a corner it does not own
   * both sides of.
   */
  it('draws the turn inside the why-making block so it anchors to the lane', () => {
    const lane = el.querySelector(".intro__block[data-block='why']");
    expect(lane?.querySelector('svg.intro__elbow')).not.toBeNull();
  });

  it('paints the road stroke plus its white dashed centre, like every lane', () => {
    const elbow = el.querySelector('.intro__elbow');
    const paths = [...(elbow?.querySelectorAll('path') ?? [])];
    expect(paths).toHaveLength(2);
    expect(elbow?.querySelector('[data-road="stroke"]')).not.toBeNull();
    expect(elbow?.querySelector('[data-road="dash"]')).not.toBeNull();
  });

  it('keeps the elbow out of the accessibility tree', () => {
    const elbow = el.querySelector('.intro__elbow');
    expect(elbow?.getAttribute('aria-hidden')).toBe('true');
    expect(elbow?.getAttribute('focusable')).toBe('false');
  });
});

describe('intro accents', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OurStoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(OurStoryPage);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  /*
   * Three shapes sit outside the exported intro cluster and were missing
   * entirely: the hexagon trio, the star above the tower photograph and the
   * short coral rule beside it. Drawn inline rather than fetched, because they
   * are three primitives and the Figma token used for the other assets is
   * single-use and now revoked.
   */
  it.each(['hexes', 'star', 'bar'])('draws the %s accent', (id) => {
    expect(el.querySelector(`.intro__accents [data-accent='${id}']`)).not.toBeNull();
  });

  it('keeps the accents out of the accessibility tree', () => {
    const svg = el.querySelector('.intro__accents');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  /*
   * The accent layer is positioned in the panel's own coordinates, so its
   * viewBox has to be the panel width — otherwise every measured x is wrong.
   */
  it('uses the 1280 panel as its coordinate system', () => {
    expect(el.querySelector('.intro__accents')?.getAttribute('viewBox')).toBe('0 0 1280 300');
  });
});
