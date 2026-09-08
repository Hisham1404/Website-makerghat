/**
 * Copy for the Our Story page, transcribed from the Figma at 100% zoom.
 *
 * The mission and why-making paragraphs are real copy and match the live site
 * word for word. The origin paragraph is the Figma's own placeholder — it reads
 * "MG origin story featuring founders, Lorem ipsum dolor sit amet…" — and is
 * reproduced verbatim rather than quietly rewritten, per the README assumption
 * that all copy comes from the Figma as-is.
 */

export const PAGE_TITLE = 'The story that built MakerGhat';

export interface Media {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Hero beneath the title. Spans the cream panel (1281x393 in the 1440 frame),
 * measured from the reference and confirmed by the Figma node's own bounding
 * box. Rendered from the file via the Figma API and converted to WebP.
 */
export const HERO: Media = {
  src: 'assets/photos/hero.webp',
  alt: 'A 3D printer laying down the first layer of a yellow print',
  width: 1281,
  height: 393,
};

/*
 * The two cut-out photographs in the intro.
 *
 * Both are 2x node renders and the Figma draws them at exactly half — that one
 * rule fixes the size AND the placement, and checking it against the export is
 * what caught the earlier numbers.
 *
 *   tower  render 584x388 -> 292x194. Its ink fills the render's width, so the
 *          drawn ink is the export's x=1069..1360, and the box bottom lands on
 *          the road stroke at y=1026.
 *   girls  render 794x594 -> 397x297. Its ink is inset 100px/158px inside the
 *          render, so drawn it starts 50px/79px into the box: a box left edge
 *          of x=96 puts the ink at x=146, which is the export's x=146..489.
 *          The box bottom lands on the origin box's top stroke at y=1330.
 *
 * The aspect ratios agree: the export draws the girls ink 344x217 (1.585) and
 * the asset's own ink is 690x436 (1.583) — i.e. the render at half size, with
 * nothing clipped. Neither photograph is cropped by the road; each simply
 * stands on it.
 */
export const INTRO_MEDIA = {
  tower: {
    src: 'assets/photos/intro-tower.webp',
    alt: 'Young people celebrating a structure they built together',
    width: 292,
    height: 194,
  } satisfies Media,
  girls: {
    src: 'assets/photos/intro-girls.webp',
    alt: 'Students gathered around a project they are building',
    width: 397,
    height: 297,
  } satisfies Media,
} as const;

export interface IntroBlock {
  readonly id: string;
  readonly heading: string;
  readonly body: string;
}

export const INTRO_BLOCKS: readonly IntroBlock[] = [
  {
    id: 'mission',
    heading: 'Our mission',
    body:
      'Our mission is to make hands-on, maker-centered learning accessible across India, ' +
      'empowering young people to think critically, build confidently, and solve real-world ' +
      'problems beyond traditional classrooms.',
  },
  {
    id: 'why',
    heading: 'Why making?',
    body:
      'Making bridges the gap between knowledge and application through experiential learning. ' +
      'It builds 21st-century skills that empowers our youth to become confident job-seekers ' +
      'and entrepreneurs.',
  },
];

/*
 * The two illustrated clusters, rendered straight from the Figma: the intro's
 * lightbulb / dashed arc / paper plane / scissors, and the origin block's
 * arrows, question marks and magnifying glass. Decorative only.
 */
export const DECOR = {
  intro: { src: 'assets/decor/intro-cluster.webp', width: 899, height: 414 },
  origin: { src: 'assets/decor/origin-cluster.svg', width: 480, height: 199 },
} as const;

export const ORIGIN = {
  heading: 'How did MG start',
  /* Verbatim from the Figma, lorem ipsum included. */
  body:
    'MG origin story featuring founders, Lorem ipsum dolor sit amet, consectetur adipiscing ' +
    'elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad ' +
    'minim veniam, quis.',
  photo: {
    src: 'assets/photos/origin-team.webp',
    alt: 'The MakerGhat team gathered for a group photograph',
    width: 592,
    height: 403,
  } satisfies Media,
} as const;
