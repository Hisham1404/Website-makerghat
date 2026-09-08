/**
 * The MakerGhat timeline.
 *
 * The Figma groups the story into **nine year chips**, each expanding to that
 * year's milestones — not the eighteen flat cards the live site renders. The
 * chip label is the bare year, as drawn.
 *
 * Milestone wording is taken from makerghat.org, where it matches the Figma's
 * expanded-state frames word for word.
 */
export interface MilestoneMedia {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  /**
   * Which side of the chip the photograph sits on, taken from the Figma's own
   * coordinates: 'before' when the artwork is left of its chip, 'after' when
   * right. On reversed rows CSS mirrors the pair along with everything else.
   */
  readonly side: 'before' | 'after';
}

/**
 * Purely decorative artwork that sits behind a year's photograph — the Tamil
 * Nadu map, the STEM circles, the Discovery Diary puzzle pieces. Never given
 * alt text: it carries no information the milestone text does not.
 */
export interface MilestoneDecor {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Where the Figma actually puts this year's pieces, in LANE coordinates: x from
 * the OUTER edge of the lane's left stroke and y from the OUTER edge of its top
 * stroke — the two edges the eye reads as the lane's corner. The strokes are
 * drawn as borders, so the CSS gives the border width back before applying
 * these; measuring from the padding box instead would bake a 10px offset into
 * every number and hide it. The
 * export composes each lane by hand — chips and photographs sit at their own
 * coordinates, not on a shared baseline — so a flex row can approximate it but
 * never match it. Every number below was read off design/ourstory-figma.jpg:
 * the photographs by template-matching each asset against the export (all nine
 * matched at half their 2x render), the chips and decor by colour bbox.
 */
export interface MilestonePlace {
  readonly chip: { readonly x: number; readonly y: number };
  readonly media?: { readonly x: number; readonly y: number };
  readonly decor?: { readonly x: number; readonly y: number };
}

export interface Milestone {
  /** Stable key and DOM id fragment. */
  readonly id: string;
  /** Chip label, exactly as the Figma draws it. */
  readonly year: string;
  readonly items: readonly string[];
  readonly media?: MilestoneMedia;
  readonly decor?: MilestoneDecor;
  readonly place: MilestonePlace;
}

/**
 * The lane's own width in the 1440 frame: the panel is 1280 wide at x=80 and
 * the timeline is inset 48px, so the lane runs x=128..1312. Every placement
 * above is a fraction of this, which is what lets the whole artboard scale.
 */
export const LANE_WIDTH = 1184;

/**
 * Measured lane heights, top stroke to top stroke: y=1946, 2228, 2556, 2857,
 * 3345 and the last floor at 3686. Lanes 2 and 3 are stepped — their top edge
 * is 42px and 173px lower on the right-hand side — so these are the heights of
 * their LEFT edges, which is where each row's box begins.
 */
export const LANE_HEIGHTS: readonly number[] = [282, 328, 301, 488, 341];

export const MILESTONES: readonly Milestone[] = [
  {
    id: '2018',
    year: '2018',
    place: { chip: { x: 330, y: 36 }, media: { x: 7, y: 59 }, decor: { x: 15, y: 38 } },
    decor: { src: 'assets/decor/y2018-arrows.svg', width: 84, height: 142 },
    media: {
      src: 'assets/photos/y2018-powai.webp',
      alt: 'Children at the first makerspace in Powai',
      width: 331,
      height: 232,
      side: 'before',
    },
    items: ['MakerGhat launches its first makerspace in Powai, Mumbai'],
  },
  {
    id: '2019',
    year: '2019',
    place: { chip: { x: 684, y: 30 }, media: { x: 839, y: 121 }, decor: { x: 749, y: 177 } },
    decor: { src: 'assets/decor/y2019-coin.webp', width: 117, height: 122 },
    media: {
      src: 'assets/photos/y2019-printer.webp',
      alt: 'A 3D printer running in a makerspace',
      width: 325,
      height: 161,
      side: 'after',
    },
    items: [
      'We secure our first institutional grant to expand maker-education',
      'We receive our first individual grant to grow the program to 3 schools',
    ],
  },
  {
    id: '2020',
    year: '2020',
    place: { chip: { x: 731, y: 50 }, media: { x: 871, y: 143 } },
    media: {
      src: 'assets/photos/y2020-tel.webp',
      alt: 'Students joining a virtual programme session',
      width: 293,
      height: 228,
      side: 'after',
    },
    items: [
      'We respond to COVID with recovery-focused education initiatives',
      'We launched virtual programs with VIDYA and Agastya Foundations',
      'We opened a second makerspace in Thane',
    ],
  },
  {
    id: '2021',
    year: '2021',
    place: { chip: { x: 358, y: 64 }, media: { x: 111, y: 80 }, decor: { x: 85, y: 77 } },
    decor: { src: 'assets/decor/y2021-map-tn.svg', width: 146, height: 196 },
    media: {
      src: 'assets/photos/y2021-student.webp',
      alt: 'A student building at a Tamil Nadu makerspace',
      width: 216,
      height: 292,
      side: 'before',
    },
    items: [
      'We expanded maker-education programs to Tamil Nadu',
      'We partnered with the JSW Foundation for our first CSR-led programs (Museum of Solutions, Mumbai)',
    ],
  },
  {
    id: '2022',
    year: '2022',
    place: { chip: { x: 12, y: 58 }, media: { x: 228, y: 63 }, decor: { x: 231, y: 85 } },
    decor: { src: 'assets/decor/y2022-map-india.svg', width: 235, height: 183 },
    media: {
      src: 'assets/photos/y2022-part.webp',
      alt: 'Children working together on a build',
      width: 317,
      height: 238,
      side: 'after',
    },
    items: ['We launched statewide programs in Odisha'],
  },
  {
    id: '2023',
    year: '2023',
    place: { chip: { x: 652, y: 86 }, media: { x: 847, y: 263 }, decor: { x: 835, y: 212 } },
    decor: { src: 'assets/decor/y2023-arcs.svg', width: 215, height: 215 },
    media: {
      src: 'assets/photos/y2023-pbl.webp',
      alt: 'A project-based learning session in progress',
      width: 375,
      height: 211,
      side: 'after',
    },
    items: [
      "We became official curriculum partner for NITI Aayog's Atal Tinkering Labs (ATLs)",
      'We opened makerspaces across districts in Tamil Nadu & Karnataka',
      'We launched a new program with the Piramal Foundation in Jhunjhunu, Rajasthan',
      'We developed & launched our 3-levels tinkering curriculum & EdApp LMS across all 10,000+ ATLs in India',
    ],
  },
  {
    id: '2024',
    year: '2024',
    place: { chip: { x: 622, y: 236 }, media: { x: 826, y: 247 } },
    media: {
      src: 'assets/photos/y2024-ignite.webp',
      alt: 'Participants in the first IGNITE incubator cohort',
      width: 339,
      height: 260,
      side: 'after',
    },
    items: ['We launched our first IGNITE incubator cohort for young innovators across rural Tamil Nadu'],
  },
  {
    id: '2025',
    year: '2025',
    place: { chip: { x: 106, y: 49 }, media: { x: 9, y: 140 }, decor: { x: 395, y: 167 } },
    decor: { src: 'assets/decor/y2025-stem.svg', width: 70, height: 64 },
    media: {
      src: 'assets/photos/y2025-storytelling.webp',
      alt: 'A storytelling session with students',
      width: 411,
      height: 348,
      side: 'before',
    },
    items: [
      'We became anchors for the pan-India STEM initiative under the Shikshagraha movement',
      'We launched the MakerGaon Fellowship in rural Maharashtra',
      'We launched a district-wide Nashik program with 12 high-end makerspaces',
    ],
  },
  {
    id: '2026',
    year: '2026',
    place: { chip: { x: 537, y: 42 }, media: { x: 807, y: 70 }, decor: { x: 730, y: 102 } },
    decor: { src: 'assets/decor/y2026-puzzle.svg', width: 189, height: 168 },
    media: {
      src: 'assets/photos/y2026-diary.webp',
      alt: 'Copies of the Discovery Diary',
      width: 333,
      height: 289,
      side: 'after',
    },
    items: ['We published the Discovery Diary, our first at-home intervention for hands-on learning for children'],
  },
];

/**
 * Chips per serpentine row at desktop and tablet, measured off the Figma: rows
 * read 2018/2019, then 2021/2020 (right to left), then 2022/2023, and so on.
 *
 * Below the tablet breakpoint the rows flatten to a single column in CSS — the
 * component does not re-chunk, so the DOM never changes shape at a breakpoint.
 */
export const CHIPS_PER_ROW = 2;
