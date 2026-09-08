/**
 * The About Us tab bar.
 *
 * Labels and order come from the Figma, which differs from the live site: the
 * Figma's third tab is "Support system" and there is no "Awards" tab. The Figma
 * is the artefact being recreated, so it wins. /about-us/awards still resolves
 * as a route, because it is a real path on makerghat.org — it is simply not one
 * of the four tabs this design draws.
 *
 * Each tab is the -50 step of a different colour ramp, measured off the live
 * tab bar. The active tab takes the page background so it reads as continuous
 * with the content beneath it.
 */
export interface AboutTab {
  readonly label: string;
  readonly path: string;
  /** Maps to a --tab-<tone> custom property in about-tabs.css. */
  readonly tone: 'cream' | 'lavender' | 'butter' | 'blush';
}

export const ABOUT_TABS: readonly AboutTab[] = [
  { label: 'MakerGhat story', path: '/about-us/our-story', tone: 'cream' },
  { label: 'MakerGhat team', path: '/about-us/team', tone: 'lavender' },
  { label: 'Support system', path: '/about-us/support-system', tone: 'butter' },
  { label: 'Volunteers & Alumni', path: '/about-us/vol-alum', tone: 'blush' },
];
