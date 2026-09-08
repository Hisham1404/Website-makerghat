/**
 * Site header navigation.
 *
 * Labels, casing and — importantly — which items carry a caret are taken from
 * the Figma, not from the live site. The Figma draws a dropdown caret on Space,
 * Evidence and Get involved only; About us, Curriculum, Training and Programs
 * are plain links there. makerghat.org has dropdowns on six of the seven, so
 * this is a real difference, and it is deliberate: a caret is the affordance for
 * a dropdown, so caret and dropdown are kept in lockstep rather than drawing one
 * without the other. Nothing is unreachable as a result — the About Us section
 * is served by the tab bar directly beneath the header.
 *
 * Child link paths are the real makerghat.org paths, measured from their nav.
 */
export interface NavLinkItem {
  readonly label: string;
  readonly href: string;
}

export interface NavItem extends NavLinkItem {
  readonly children?: readonly NavLinkItem[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'About us', href: '/about-us/our-story' },
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
