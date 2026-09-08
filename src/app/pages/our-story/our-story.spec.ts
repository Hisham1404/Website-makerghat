import { TestBed } from '@angular/core/testing';
import { OurStoryPage } from './our-story';
import { HERO, INTRO_BLOCKS, ORIGIN, PAGE_TITLE } from '../../data/our-story';

describe('OurStoryPage', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OurStoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(OurStoryPage);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  describe('page title', () => {
    it('renders whatever the data module says', () => {
      expect(el.querySelector('h1')?.textContent?.trim()).toBe(PAGE_TITLE);
    });

    /*
     * Pinned as a literal on purpose. The assertion above only proves the
     * template reads the data file; this one proves the data file still says
     * what the Figma says.
     */
    it('is the exact headline drawn in the Figma', () => {
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('The story that built MakerGhat');
    });

    it('is the only h1, so the outline has a single root', () => {
      expect(el.querySelectorAll('h1')).toHaveLength(1);
    });
  });

  describe('hero', () => {
    const hero = () => el.querySelector<HTMLImageElement>('.story-hero img');

    it('is rendered with descriptive alt text', () => {
      expect(hero()?.getAttribute('alt')).toBe(HERO.alt);
    });

    it('declares its intrinsic size so it cannot shift the layout while loading', () => {
      expect(hero()?.getAttribute('width')).toBe(String(HERO.width));
      expect(hero()?.getAttribute('height')).toBe(String(HERO.height));
    });

    it('is full-bleed — outside the centred container, as the Figma draws it', () => {
      expect(el.querySelector('.container .story-hero')).toBeNull();
      expect(el.querySelector('.story-hero')).not.toBeNull();
    });

    it('loads eagerly, being above the fold', () => {
      expect(hero()?.getAttribute('loading')).not.toBe('lazy');
    });
  });

  describe('intro', () => {
    const blocks = () => [...el.querySelectorAll('.intro__block')];

    it('renders both blocks in the Figma\'s order', () => {
      expect(blocks().map((b) => b.querySelector('h2')?.textContent?.trim())).toEqual([
        'Our mission',
        'Why making?',
      ]);
    });

    it.each(INTRO_BLOCKS.map((b) => [b.heading, b.body] as const))(
      'renders the %s copy verbatim',
      (heading, body) => {
        const block = blocks().find((b) => b.querySelector('h2')?.textContent?.trim() === heading);
        expect(block?.querySelector('p')?.textContent?.trim()).toBe(body);
      },
    );
  });

  describe('origin story', () => {
    it('uses the Figma heading', () => {
      expect(el.querySelector('.origin h2')?.textContent?.trim()).toBe(ORIGIN.heading);
    });

    /*
     * Deliberate: the Figma's own body copy here is placeholder text. Shipping it
     * unchanged is the documented decision, so the test pins it rather than
     * letting someone "helpfully" rewrite it without updating the README.
     */
    it('ships the Figma placeholder copy, lorem ipsum and all', () => {
      const body = el.querySelector('.origin p')?.textContent?.trim();
      expect(body).toBe(ORIGIN.body);
      expect(body).toContain('Lorem ipsum');
    });

    it('renders the group photograph with alt text', () => {
      // Specific selector: the block also holds a decorative cluster with alt="".
      const photo = el.querySelector<HTMLImageElement>('img.origin__photo');
      expect(photo?.getAttribute('alt')).toBe(ORIGIN.photo.alt);
      expect(photo?.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('decorative artwork', () => {
    it('hides every decorative image from assistive tech', () => {
      const decor = [...el.querySelectorAll('.intro__decor, .origin__decor')];
      expect(decor.length).toBeGreaterThan(0);

      for (const img of decor) {
        expect(img.getAttribute('alt')).toBe('');
        expect(img.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('keeps meaningful photographs out of the decorative set', () => {
      for (const img of el.querySelectorAll<HTMLImageElement>('img.intro__media, img.origin__photo')) {
        expect(img.getAttribute('alt')?.trim().length ?? 0).toBeGreaterThan(8);
        expect(img.getAttribute('aria-hidden')).toBeNull();
      }
    });
  });

  describe('document outline', () => {
    it('uses h2 for every section beneath the page title', () => {
      const levels = [...el.querySelectorAll('h1, h2, h3, h4')].map((h) => h.tagName);
      expect(levels[0]).toBe('H1');
      expect(new Set(levels.slice(1))).toEqual(new Set(['H2']));
    });

    it('names each section region for assistive tech', () => {
      for (const section of el.querySelectorAll('section')) {
        const labelledBy = section.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
        expect(el.querySelector(`#${labelledBy}`)).not.toBeNull();
      }
    });
  });
});
