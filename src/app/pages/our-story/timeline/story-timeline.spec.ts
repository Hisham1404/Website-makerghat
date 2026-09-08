import { TestBed } from '@angular/core/testing';
import { StoryTimeline } from './story-timeline';
import { CHIPS_PER_ROW, MILESTONES } from '../../../data/milestones';
import { chunk } from '../../../shared/chunk';

describe('StoryTimeline', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StoryTimeline] }).compileComponents();
    const fixture = TestBed.createComponent(StoryTimeline);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const rows = () => [...el.querySelectorAll('.journey__row')];
  const chips = () => [...el.querySelectorAll('.milestone__chip')];

  describe('milestone data', () => {
    it('covers every year from 2018 to 2026 with no gaps', () => {
      expect(MILESTONES.map((m) => m.year)).toEqual([
        '2018',
        '2019',
        '2020',
        '2021',
        '2022',
        '2023',
        '2024',
        '2025',
        '2026',
      ]);
    });

    it('carries all eighteen milestones the live site lists', () => {
      expect(MILESTONES.flatMap((m) => m.items)).toHaveLength(18);
    });

    it('has no empty year and no blank milestone', () => {
      for (const m of MILESTONES) {
        expect(m.items.length).toBeGreaterThan(0);
        for (const item of m.items) {
          expect(item.trim().length).toBeGreaterThan(0);
        }
      }
    });

    /* Anchors the wording at both ends, so silent data corruption in between
       has a decent chance of showing up as a diff rather than a surprise. */
    it('pins the first and last milestone wording', () => {
      expect(MILESTONES[0].items[0]).toBe(
        'MakerGhat launches its first makerspace in Powai, Mumbai',
      );
      expect(MILESTONES.at(-1)!.items[0]).toContain('Discovery Diary');
    });

    it('uses unique ids, so DOM ids cannot collide', () => {
      const ids = MILESTONES.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('serpentine rows', () => {
    it('lays the chips out in rows of the configured width', () => {
      expect(rows()).toHaveLength(chunk(MILESTONES, CHIPS_PER_ROW).length);
    });

    /*
     * Pinned as literals. The assertion above derives the expected row count
     * from the same constant the component uses, so it would happily agree with
     * a wrong number. These two say what the Figma actually draws.
     */
    it('puts two chips in a row, as the Figma lays them out', () => {
      expect(CHIPS_PER_ROW).toBe(2);
    });

    it('turns nine years into five rows', () => {
      expect(rows()).toHaveLength(5);
      expect(rows()[4].querySelectorAll('.milestone__chip')).toHaveLength(1);
    });

    it('renders one chip per milestone, in chronological DOM order', () => {
      expect(chips().map((c) => c.textContent!.trim())).toEqual(MILESTONES.map((m) => m.year));
    });

    /*
     * The visual right-to-left rows are produced by CSS (flex-direction), not by
     * reversing the markup. Keeping DOM order chronological is what makes the
     * keyboard and screen-reader journey read 2018 → 2026 regardless of layout.
     */
    it('alternates row direction with a class, leaving DOM order alone', () => {
      rows().forEach((row, i) => {
        const expected = i % 2 === 0 ? 'ltr' : 'rtl';
        expect(row.getAttribute('data-direction')).toBe(expected);
      });
    });

    it('gives every row a connector to draw the turn', () => {
      for (const row of rows()) {
        expect(row.querySelector('.journey__track')).not.toBeNull();
      }
    });

    it('marks the final row so its connector can stop instead of turning', () => {
      const all = rows();
      expect(all.at(-1)?.hasAttribute('data-last')).toBe(true);
      expect(all.slice(0, -1).some((r) => r.hasAttribute('data-last'))).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('is a labelled region', () => {
      const section = el.querySelector('section.journey');
      const labelledBy = section?.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(el.querySelector(`#${labelledBy}`)).not.toBeNull();
    });

    it('hides the decorative connectors from assistive tech', () => {
      for (const track of el.querySelectorAll('.journey__track')) {
        expect(track.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('exposes the chips as an ordered list, not loose divs', () => {
      expect(el.querySelectorAll('.journey__row ol, .journey__row ul').length).toBeGreaterThan(0);
    });
  });
});

describe('StoryTimeline — year chips as disclosures', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<StoryTimeline>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StoryTimeline] }).compileComponents();
    fixture = TestBed.createComponent(StoryTimeline);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const chip = (year: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('.milestone__chip')].find(
      (b) => b.textContent!.trim() === year,
    )!;
  const panelOf = (year: string) =>
    el.querySelector<HTMLElement>(`#${chip(year).getAttribute('aria-controls')}`)!;
  const open = async (year: string) => {
    chip(year).click();
    await fixture.whenStable();
  };

  it('makes every chip a real button, not a clickable div', () => {
    for (const b of el.querySelectorAll('.milestone__chip')) {
      expect(b.tagName).toBe('BUTTON');
      expect(b.getAttribute('type')).toBe('button');
    }
  });

  it('starts with every year collapsed', () => {
    for (const b of el.querySelectorAll('.milestone__chip')) {
      expect(b.getAttribute('aria-expanded')).toBe('false');
    }
    expect(el.querySelectorAll('.milestone__panel:not([hidden])')).toHaveLength(0);
  });

  it('wires each chip to a panel that exists', () => {
    for (const b of el.querySelectorAll('.milestone__chip')) {
      const id = b.getAttribute('aria-controls');
      expect(id).toBeTruthy();
      expect(el.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it('labels each panel by its chip', () => {
    for (const p of el.querySelectorAll('.milestone__panel')) {
      const id = p.getAttribute('aria-labelledby');
      expect(el.querySelector(`#${id}`)?.classList.contains('milestone__chip')).toBe(true);
    }
  });

  it('opens a year and lists exactly that year\'s milestones', async () => {
    await open('2020');

    expect(chip('2020').getAttribute('aria-expanded')).toBe('true');
    expect(panelOf('2020').hidden).toBe(false);

    const items = [...panelOf('2020').querySelectorAll('li')].map((li) => li.textContent!.trim());
    expect(items).toEqual([
      'We respond to COVID with recovery-focused education initiatives',
      'We launched virtual programs with VIDYA and Agastya Foundations',
      'We opened a second makerspace in Thane',
    ]);
  });

  it('closes again on a second click', async () => {
    await open('2020');
    await open('2020');
    expect(chip('2020').getAttribute('aria-expanded')).toBe('false');
    expect(panelOf('2020').hidden).toBe(true);
  });

  /* One at a time: on a snaking layout, several open panels would collide. */
  it('closes the previous year when another opens', async () => {
    await open('2020');
    await open('2023');

    expect(chip('2020').getAttribute('aria-expanded')).toBe('false');
    expect(chip('2023').getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('.milestone__panel:not([hidden])')).toHaveLength(1);
  });

  it('closes on Escape', async () => {
    await open('2019');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(chip('2019').getAttribute('aria-expanded')).toBe('false');
  });

  it('hides the caret from assistive tech — aria-expanded already says it', () => {
    for (const caret of el.querySelectorAll('.milestone__caret')) {
      expect(caret.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('renders every milestone across the nine panels', () => {
    const rendered = [...el.querySelectorAll('.milestone__panel li')];
    expect(rendered).toHaveLength(18);
  });
});

describe('StoryTimeline — panel alignment', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StoryTimeline] }).compileComponents();
    const fixture = TestBed.createComponent(StoryTimeline);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  /*
   * Regression: the panel used to hang leftwards from every chip, so the chip at
   * the row's right edge pushed its panel off the container. Which chip that is
   * flips with the row direction, because 'rtl' rows are reversed by CSS — so
   * :last-child gets it wrong on half the rows.
   */
  it('hangs the panel inward from whichever chip sits at the right edge', () => {
    const aligns = [...el.querySelectorAll('.journey__row')].map((row) =>
      [...row.querySelectorAll('.milestone')].map((m) => m.getAttribute('data-panel-align')),
    );

    expect(aligns[0]).toEqual(['left', 'right']); // ltr: second chip is rightmost
    expect(aligns[1]).toEqual(['right', 'left']); // rtl: first chip is rightmost
    expect(aligns[2]).toEqual(['left', 'right']);
    expect(aligns[3]).toEqual(['right', 'left']);
  });

  it('leaves a lone chip hanging left — it cannot overflow', () => {
    const last = [...el.querySelectorAll('.journey__row')].at(-1)!;
    expect([...last.querySelectorAll('.milestone')].map((m) => m.getAttribute('data-panel-align'))).toEqual([
      'left',
    ]);
  });
});

describe('StoryTimeline — milestone photography', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StoryTimeline] }).compileComponents();
    const fixture = TestBed.createComponent(StoryTimeline);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('gives every year a photograph with real alt text', () => {
    const imgs = [...el.querySelectorAll<HTMLImageElement>('.milestone__media')];
    expect(imgs).toHaveLength(MILESTONES.length);

    for (const img of imgs) {
      expect(img.getAttribute('alt')?.trim().length ?? 0).toBeGreaterThan(8);
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('width')).toBeTruthy();
      expect(img.getAttribute('height')).toBeTruthy();
    }
  });

  /*
   * Sides come from the Figma's own coordinates: the photo is 'before' when its
   * x is left of the chip's. Pinned because a wrong side is invisible in jsdom
   * and easy to regress.
   */
  it('places each photograph on the side the Figma draws it', () => {
    const sides = Object.fromEntries(
      [...el.querySelectorAll('.milestone')].map((m) => [
        m.querySelector('.milestone__chip')!.textContent!.trim(),
        m.getAttribute('data-media-side'),
      ]),
    );
    expect(sides).toEqual({
      '2018': 'before',
      '2019': 'after',
      '2020': 'after',
      '2021': 'before',
      '2022': 'after',
      '2023': 'after',
      '2024': 'after',
      '2025': 'before',
      '2026': 'after',
    });
  });
});
