/**
 * Site header navigation.
 *
 * Labels, casing and — importantly — which items carry a caret are taken from
 * the Figma, not from the live site. The Figma draws a dropdown caret on Space,
 * Evidence and Get involved only; About us, Curriculum, Training and Programs
 * are plain links there. makerghat.org has dropdowns on six of the seven, so
 * this is a real difference, and it is deliberate: a caret is the affordance for
 * a dropdown, so caret and dropdown are kept in lockstep rather than drawing one
 * without the other.
 *
 * That used to come with the note "nothing is unreachable as a result — the
 * About Us section is served by the tab bar directly beneath the header". Below
 * 768 that tab bar is now hidden, as it is on makerghat.org, and the
 * justification went with it: three of the four sections would have had no
 * route in from a phone. Hence `drawerChildren` — links that appear in the
 * mobile drawer only, drawing no caret and no desktop dropdown, so the header
 * above the breakpoint stays exactly as the Figma draws it. Their own mobile
 * menu carries the same four links.
 *
 * Child link paths are the real makerghat.org paths, measured from their nav.
 */
import { ABOUT_TABS } from './about-tabs';

export interface NavLinkItem {
  readonly label: string;
  readonly href: string;
}

export interface NavItem extends NavLinkItem {
  /** Rendered as a caret + dropdown on desktop, and in the drawer. */
  readonly children?: readonly NavLinkItem[];
  /**
   * Rendered in the mobile drawer only. Deliberately separate from `children`
   * so the caret stays tied to the thing it is an affordance for.
   */
  readonly drawerChildren?: readonly NavLinkItem[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'About us',
    href: '/about-us/our-story',
    /* The tab bar's own destinations, so hiding it costs nothing. */
    drawerChildren: ABOUT_TABS.map((tab) => ({ label: tab.label, href: tab.path })),
  },
  {
    label: 'Space',
    href: '/space/makerspace',
    children: [
      { label: 'Makerspace', href: '/space/makerspace' },
      { label: 'Makerkit', href: '/space/makerkits' },
    ],
  },
  { label: 'Curriculum', href: '/curriculum' },
  { label: 'Training', href: '/training' },
  {
    label: 'Evidence',
    href: '/evidence',
    children: [
      { label: 'Framework', href: '/evidence/framework' },
      { label: 'Dashboard', href: '/evidence/dashboard' },
      { label: 'Reports', href: '/evidence/reports' },
    ],
  },
  { label: 'Programs', href: '/programs' },
  {
    label: 'Get involved',
    href: '/get-involved',
    children: [
      { label: 'Careers', href: '/get-involved/careers' },
      { label: 'Volunteer', href: '/get-involved/volunteer' },
      { label: 'Donate', href: '/get-involved/donate' },
      { label: 'Partner', href: '/get-involved/partner' },
    ],
  },
];
