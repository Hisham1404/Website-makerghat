import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StoryTimeline } from './story-timeline';
import { MILESTONES } from '../../../data/milestones';
import { groupedRule, rule as cssRule, stripComments } from '../../../../testing/css-rules';

/*
 * The road below 768, measured off makerghat.org's own About Us at 375.
 *
 * The Figma ships a single 1440 artboard and no mobile frame, so this build had
 * been flattening the snake to one straight left rail — the honest reading of a
 * missing artboard, but the wrong one. Their live site answers the question the
 * Figma does not: at 375 the road still snakes, one card per turn.
 *
 * Read off the live DOM at a 375 viewport:
 *
 *   .border.bright   x=30    w=157.6  h=240  borders top+bottom+LEFT
 *                                            radius 20px 0 0 20px
 *   .border.bleft    x=187.6 w=157.6  h=240  borders top+bottom+RIGHT
 *                                            radius 0 20px 20px 0
 *   container width  315.2  →  each box is exactly half of it
 *   stroke           2.4px solid rgb(88,173,111)
 *   joint dot        25x25 rgb(74,58,128), centred on the seam
 *
 * The load-bearing trick is the vertical rhythm: consecutive boxes sit 237px
 * apart while being 240px tall, so each one's top stroke lands ON the previous
 * one's bottom stroke. A left box's bottom border spans the left half and the
 * right box's top border spans the right half, and together they read as ONE
 * full-width horizontal. That is the whole serpentine: half a horizontal from
 * each of two boxes, plus one vertical each, alternating.
 *
 * Reproduced here with our own stroke rather than theirs (10px, the Figma's
 * measured width, with the white dashed centre line the export draws), because
 * the page above 768 is the redesign and the two have to read as one road.
 *
 * Borders, not the drawn <svg> the artboard uses: below 768 a year chip is a
 * disclosure, so a lane's height changes when a panel opens, and a path with
 * baked-in geometry would need JS to re-measure on every toggle. Borders
 * reflow for free — which is exactly why the live site draws it this way too.
 */

const root = join(__dirname, '../../../../..');
const css = stripComments(
  readFileSync(join(root, 'src/app/pages/our-story/timeline/story-timeline.css'), 'utf8'),
);
const html = readFileSync(
  join(root, 'src/app/pages/our-story/timeline/story-timeline.html'),
  'utf8',
);

/* Everything before the first breakpoint is the mobile road. */
const mobile = css.slice(0, css.indexOf('@media (min-width: 768px)'));
/* The artboard block is the LAST min-width:768 block in the file. */
const artboard = css.slice(css.lastIndexOf('@media (min-width: 768px)'));

describe('mobile road — which side each milestone turns on', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StoryTimeline] }).compileComponents();
    const fixture = TestBed.createComponent(StoryTimeline);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const milestones = () => [...el.querySelectorAll('.milestone')];

  /*
   * Computed in the component from the milestone's index across the WHOLE
   * timeline, not from :nth-child. Within-row parity only equals global parity
   * while CHIPS_PER_ROW happens to be even — a coincidence, not a rule, and one
   * that would flip every side on the page the day the Figma puts three chips
   * in a lane.
   */
  it('alternates the side down the whole timeline, not within each row', () => {
    const sides = milestones().map((m) => m.getAttribute('data-road-side'));
    expect(sides).toEqual([
      'left',
      'right',
      'left',
      'right',
      'left',
      'right',
      'left',
      'right',
      'left',
    ]);
  });

  /*
   * The origin box above hands the road over down its own left stroke, so the
   * first turn has to be a left one or the road jumps the panel.
   */
  it('starts on the left, where the origin box leaves off', () => {
    expect(milestones()[0].getAttribute('data-road-side')).toBe('left');
  });

  it('has one milestone element per milestone in the data', () => {
    expect(milestones()).toHaveLength(MILESTONES.length);
  });
});

describe('mobile road — markup', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StoryTimeline] }).compileComponents();
    const fixture = TestBed.createComponent(StoryTimeline);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const milestones = () => [...el.querySelectorAll('.milestone')];

  it('gives every milestone its own dashed centre line', () => {
    for (const m of milestones()) {
      expect(m.querySelector(':scope > .journey__track')).not.toBeNull();
    }
  });

  /*
   * A marker sits on the horizontal a milestone shares with the NEXT one, so
   * the last milestone has no joint to mark — it has a terminus instead.
   */
  it('puts a direction marker at every joint and none after the last', () => {
    const withMarker = milestones().filter((m) => m.querySelector(':scope > .journey__marker'));
    expect(withMarker).toHaveLength(MILESTONES.length - 1);
    expect(milestones().at(-1)!.querySelector(':scope > .journey__marker')).toBeNull();
  });

  it('hides every drawn part of the road from assistive tech', () => {
    for (const part of el.querySelectorAll('.journey__track, .journey__marker')) {
      expect(part.getAttribute('aria-hidden')).toBe('true');
    }
  });

  /* Rows drew the rail before; the milestones own it now, so the row must not
     carry a stray track or marker that would double the line. */
  it('leaves no track or marker on the row itself', () => {
    for (const row of el.querySelectorAll('.journey__row')) {
      expect(row.querySelector(':scope > .journey__track')).toBeNull();
      expect(row.querySelector(':scope > .journey__marker')).toBeNull();
    }
  });
});

describe('mobile road — the geometry, in the stylesheet', () => {
  it('draws the road as a border box on the milestone itself', () => {
    const body = cssRule(mobile, '.milestone::before');
    expect(body).toMatch(/position:\s*absolute/);
    expect(body).toMatch(/inset:\s*0/);
    expect(body).toMatch(/border:\s*var\(--road-width\) solid var\(--road-color\)/);
  });

  /*
   * Half the panel, open on the inside: the side it came in from is left open
   * so the next box's own horizontal continues the line. Closing all four
   * reads as a stack of boxes, which is the mistake the desktop road made too.
   */
  it('opens the left box on its right and rounds only its left corners', () => {
    const body = cssRule(mobile, ".milestone[data-road-side='left']::before");
    expect(body).toMatch(/right:\s*50%/);
    expect(body).toMatch(/border-right:\s*0/);
    expect(body).toMatch(/border-radius:\s*var\(--road-radius\) 0 0 var\(--road-radius\)/);
  });

  it('opens the right box on its left and rounds only its right corners', () => {
    const body = cssRule(mobile, ".milestone[data-road-side='right']::before");
    expect(body).toMatch(/left:\s*50%/);
    expect(body).toMatch(/border-left:\s*0/);
    expect(body).toMatch(/border-radius:\s*0 var\(--road-radius\) var\(--road-radius\) 0/);
  });

  /*
   * The joint is one line, not two stacked. Without the pull-up a box's top
   * stroke sits directly below the previous box's bottom stroke and the
   * horizontal renders 20px thick — the live site's boxes are 240px tall and
   * 237px apart for exactly this reason.
   */
  it('pulls each box up by one stroke so a joint is a single line', () => {
    const body = groupedRule(mobile, ['.milestone + .milestone', '.journey__row + .journey__row']);
    expect(body).toMatch(/margin-top:\s*calc\(var\(--road-width\) \* -1\)/);
  });

  /*
   * The pull-up has to span rows as well as milestones: the chips are chunked
   * two to a row for the desktop artboard, so four of the eight joints fall
   * across a row boundary where `.milestone + .milestone` cannot reach.
   */
  it('applies that pull-up across row boundaries too', () => {
    const body = groupedRule(mobile, ['.milestone + .milestone', '.journey__row + .journey__row']);
    expect(body).toBeTruthy();
  });

  it('no longer draws the straight left rail on the row', () => {
    const body = cssRule(mobile, '.journey__row');
    expect(body).not.toMatch(/border-left:\s*var\(--road-width\)/);
  });

  /*
   * The first box KEEPS its top edge now. The road drops out of the origin
   * card at the card's CENTRE, and this box spans 0..50%, so the right-hand
   * end of its top border is exactly where that drop lands. The road then runs
   * left along it, turns at the top-left corner and heads down the rail.
   *
   * It used to be removed, back when the drop came down at the far left and a
   * top edge would have crossed it.
   */
  it('keeps the first box’s top edge, which is what the drop lands on', () => {
    expect(mobile).not.toMatch(/\.milestone\[data-road-start\]::before\s*\{[^}]*border-top:\s*0/);
  });

  /*
   * The stroke runs 0..10px in from the box edge, so its centre is at 5px. A
   * 3px dashed border centred there needs its own box inset by (10-3)/2 = 3.5.
   */
  it('centres the dashed line on the stroke rather than on the box edge', () => {
    const body = cssRule(mobile, '.journey__track');
    expect(body).toMatch(
      /inset:\s*calc\(\(var\(--road-width\) - var\(--road-dash-width\)\) \/ 2\)/,
    );
    expect(body).toMatch(/border:\s*var\(--road-dash-width\) dashed var\(--road-dash\)/);
  });

  /* A centre line inside a 32px outer corner turns at 32 - 10/2 = 27px. */
  it('shrinks the dash radius by half a stroke so it tracks the centre line', () => {
    const body = cssRule(mobile, '.journey');
    expect(body).toMatch(
      /--road-centre-radius:\s*calc\(var\(--road-radius\) - var\(--road-width\) \/ 2\)/,
    );
    expect(cssRule(mobile, ".milestone[data-road-side='left'] .journey__track")).toMatch(
      /border-radius:\s*var\(--road-centre-radius\) 0 0 var\(--road-centre-radius\)/,
    );
  });

  /* Centred on the joint it marks, on both axes. */
  it('centres the marker on the joint', () => {
    const body = cssRule(mobile, '.journey__marker');
    expect(body).toMatch(/left:\s*50%/);
    expect(body).toMatch(/bottom:\s*calc\(var\(--road-width\) \/ 2\)/);
    expect(body).toMatch(/transform:\s*translate\(-50%, 50%\)/);
  });
});

describe('mobile road — the artboard above 768 is untouched', () => {
  /*
   * Every border-drawn piece has to come off above the breakpoint or it paints
   * over the drawn path. `.milestone` is `inset: 0` on the artboard, so its
   * ::before would stretch a half-panel border box across the whole lane.
   */
  it('hides every border-drawn piece of the mobile road', () => {
    const hidden = groupedRule(artboard, [
      '.journey__track',
      '.journey__lead-road',
      '.journey::after',
      '.journey__marker',
      '.milestone::before',
    ]);
    expect(hidden).toMatch(/display:\s*none/);
  });

  it('still hides the marker now that it hangs off the milestone, not the row', () => {
    expect(artboard).not.toMatch(/\.journey__row > \.journey__marker/);
  });
});

describe('mobile road — the template carries the parts the CSS needs', () => {
  /*
   * Only the side is bound now. The start and end attributes drove the first
   * box's missing top edge and the last box's missing floor; the road keeps
   * both edges since it enters at the centre and leaves at the centre, so
   * neither attribute has any CSS behind it any more.
   */
  it('binds the road side onto each milestone', () => {
    expect(html).toMatch(/\[attr\.data-road-side\]="node\.roadSide"/);
  });
});

/*
 * Mobile road polish, all five asked for directly:
 *
 *   1. content centred in each lane, not hugging the left;
 *   2. a thinner stroke, because 10px is a desktop measurement and reads heavy
 *      on a phone — 6px with a 2px dash keeps the same 3:1 proportion;
 *   3. the coral direction chevrons replaced by solid circles;
 *   4. the road ending at the HORIZONTAL CENTRE rather than on the left rail;
 *   5. the same solid circle at the terminus and at every joint.
 *
 * (4) falls out of the geometry rather than needing new drawing. A left-side
 * box spans 0..50% and a right-side box 50%..100%, so whichever side the last
 * milestone is on, its bottom border already ENDS at the centre. The road just
 * has to stop removing that border — it was being dropped so the rail could
 * run to a dot at the bottom of the vertical instead.
 *
 * Which also retires `data-road-end-side`: the terminus is at 50% whatever the
 * milestone count, so nothing needs to know which rail it finished on.
 */

describe('mobile road — the polish pass', () => {
  it('thins the stroke and its dash, keeping the proportion', () => {
    const journey = cssRule(mobile, '.journey');
    expect(journey).toMatch(/--road-width:\s*6px/);
    expect(journey).toMatch(/--road-dash-width:\s*2px/);
  });

  /*
   * The origin card draws the same road with its OWN tokens, so thinning only
   * the timeline would put a 10px stroke above a 6px one at the joint.
   */
  it('thins the origin card’s stroke to match, so the joint has no step', () => {
    const storyCss = stripComments(
      readFileSync(join(root, 'src/app/pages/our-story/our-story.css'), 'utf8'),
    );
    const phone = storyCss.slice(storyCss.indexOf('@media (max-width: 767px)'));
    expect(cssRule(phone, '.origin')).toMatch(/--road-width:\s*6px/);
  });

  it('centres what sits inside a lane', () => {
    expect(cssRule(mobile, '.milestone')).toMatch(/align-items:\s*center/);
  });

  /* One size for the joint dots and the terminus — "the same solid circle". */
  it('uses one dot size for both the joints and the end of the road', () => {
    expect(cssRule(mobile, '.journey')).toMatch(/--road-dot:\s*18px/);
    expect(cssRule(mobile, '.journey__marker')).toMatch(/width:\s*var\(--road-dot\)/);
    expect(cssRule(mobile, '.journey::after')).toMatch(/width:\s*var\(--road-dot\)/);
  });

  it('draws the joint marker as a solid circle, not the coral chevron', () => {
    const body = cssRule(mobile, '.journey__marker');
    expect(body).toMatch(/border-radius:\s*50%/);
    expect(body).toMatch(/background:\s*var\(--road-color\)/);
  });

  /*
   * A circle has no direction, so the 180° flip has nothing left to do. Scoped
   * to the marker — the accordion caret still legitimately rotates.
   */
  it('drops the rotation the chevron needed', () => {
    expect(mobile).not.toMatch(/\.journey__marker\s*\{[^}]*rotate/);
    expect(mobile).not.toMatch(/data-road-side='right'\] \.journey__marker/);
  });

  /*
   * The last box keeps its floor now. That border already stops at 50% — the
   * centre — because the box is half the panel wide, so the road runs out to
   * the middle and stops there.
   */
  it('keeps the last box’s floor, so the road reaches the centre', () => {
    expect(mobile).not.toMatch(/\.milestone\[data-road-end\]::before\s*\{[^}]*border-bottom:\s*0/);
    expect(mobile).not.toMatch(
      /\.milestone\[data-road-end\] \.journey__track\s*\{[^}]*border-bottom:\s*0/,
    );
  });

  it('parks the terminus on the centre line, whichever rail came last', () => {
    const body = cssRule(mobile, '.journey::after');
    expect(body).toMatch(/left:\s*50%/);
  });

  it('retires the end-side attribute, which nothing needs any more', () => {
    expect(css).not.toMatch(/data-road-end-side/);
    expect(html).not.toMatch(/data-road-end-side/);
  });
});

/*
 * Two corrections after looking at the phone build.
 *
 * A. OPENING A YEAR KNOCKED THE CHIP OFF CENTRE. `.milestone` centres its
 *    children, but the chip and its panel share a `.milestone__disclosure`
 *    wrapper, and that wrapper is a plain block. Closed it is 156px wide and
 *    the chip fills it; open it grows to the panel's 287px and the chip, being
 *    narrower, sits at its left edge — measured drifting from x=187.5 to 122
 *    while everything around it stayed centred.
 *
 * B. THE ORIGIN CARD HAD BECOME A CLOSED BOX. All four borders drawn, which is
 *    the exact mistake the desktop road was rebuilt to avoid: "a lane is never
 *    closed on both sides... stacking closed rectangles reads as a list of
 *    boxes, not a path." On a phone it should read as the START of the road —
 *    beginning at the centre of its top edge, turning down the left side and
 *    running on into the timeline.
 *
 *    The cut machinery for this already exists. `.origin__cut::before` is what
 *    stops the top stroke partway on the desktop artboard; it was simply
 *    switched off below 768.
 */
describe('mobile road — the corrections', () => {
  const storyCss = stripComments(
    readFileSync(join(root, 'src/app/pages/our-story/our-story.css'), 'utf8'),
  );
  const phone = storyCss.slice(storyCss.indexOf('@media (max-width: 767px)'));

  /*
   * A. Opening a year knocked the chip off centre. `.milestone` centres its
   *    children, but the chip and its panel share a `.milestone__disclosure`
   *    wrapper and that wrapper was a plain block. Closed it is the chip's own
   *    156px; open it grows to the panel's 287px and the narrower chip sits at
   *    its left edge — measured drifting from x=187.5 to 122.
   */
  it('centres the chip inside its disclosure, so opening a year cannot shift it', () => {
    const body = cssRule(mobile, '.milestone__disclosure');
    expect(body).toMatch(/display:\s*flex/);
    expect(body).toMatch(/flex-direction:\s*column/);
    expect(body).toMatch(/align-items:\s*center/);
  });

  /*
   * B. The origin card is a CLOSED box on a phone — fully enclosed in green,
   *    all four sides, all four corners rounded. That is a deliberate departure
   *    from the desktop artboard, where its top and bottom edges are partial
   *    because the road runs along part of each and continues out of frame.
   *    On a phone the card is where the road begins, so it reads better as a
   *    complete enclosure with the road leaving it.
   */
  it('encloses the origin card completely', () => {
    const body = cssRule(phone, '.origin');
    expect(body).toMatch(/border-right:\s*var\(--road-width\) solid var\(--road-color\)/);
    expect(body).toMatch(/border-bottom:\s*var\(--road-width\) solid var\(--road-color\)/);
    expect(body).toMatch(/border-radius:\s*var\(--road-radius\)\s*;/);
  });

  /* Nothing is cut back, because no edge stops partway any more. */
  it('leaves both edge cuts off, since the box is whole', () => {
    const body = groupedRule(phone, ['.origin__cut::before', '.origin__cut::after']);
    expect(body).toMatch(/display:\s*none/);
  });

  /* The dashed centre line runs the whole way round with the stroke. */
  it('runs the dashed line round all four sides', () => {
    const body = cssRule(phone, '.origin::before');
    expect(body).toMatch(/border:\s*var\(--road-dash-width\) dashed var\(--road-dash\)/);
    expect(body).not.toMatch(/border-right:\s*0/);
    expect(body).not.toMatch(/border-bottom:\s*0/);
  });

  /*
   * C. The road leaves that box from the CENTRE of its bottom edge, not from
   *    the bottom-left corner.
   *
   *    Which is why the first milestone keeps its top edge: that box spans
   *    0..50%, so the right-hand end of its top border sits exactly under the
   *    drop. The road lands there, runs left, and turns down the rail.
   */
  it('drops the road out of the card’s centre, not its left corner', () => {
    expect(cssRule(mobile, '.journey__lead')).toMatch(
      /margin-left:\s*calc\(50% - var\(--road-width\) \/ 2\)/,
    );
  });

  /*
   * With the drop moved and the first box keeping its top edge, neither marker
   * attribute drives any CSS. Both come off rather than sitting in the DOM
   * meaning nothing.
   */
  it('retires the start and end attributes, which now drive nothing', () => {
    expect(css).not.toMatch(/data-road-start/);
    expect(css).not.toMatch(/data-road-end\b/);
    expect(html).not.toMatch(/data-road-start/);
    expect(html).not.toMatch(/data-road-end\b/);
  });
});
