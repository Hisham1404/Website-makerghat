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

  it('marks the first milestone as the start of the road, and only that one', () => {
    const marked = milestones().filter((m) => m.hasAttribute('data-road-start'));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toBe(milestones()[0]);
  });

  it('marks the last milestone as the end of the road, and only that one', () => {
    const marked = milestones().filter((m) => m.hasAttribute('data-road-end'));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toBe(milestones().at(-1));
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
   * The road arrives down the origin box's left stroke and continues into the
   * first vertical, so the first box must not draw a top edge or the corner
   * radius curves away from the line coming into it.
   */
  it('drops the top edge where the road arrives', () => {
    const body = cssRule(mobile, '.milestone[data-road-start]::before');
    expect(body).toMatch(/border-top:\s*0/);
    expect(body).toMatch(/border-top-left-radius:\s*0/);
    expect(body).toMatch(/border-top-right-radius:\s*0/);
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
  it('binds the side, the start and the end onto each milestone', () => {
    expect(html).toMatch(/\[attr\.data-road-side\]="node\.roadSide"/);
    expect(html).toMatch(/\[attr\.data-road-start\]/);
    expect(html).toMatch(/\[attr\.data-road-end\]/);
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
