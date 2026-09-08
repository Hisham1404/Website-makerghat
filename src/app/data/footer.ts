/**
 * Site footer content, transcribed from the Figma.
 *
 * The Figma's footer is simpler than the one on makerghat.org today: two link
 * columns ("Resources", "FAQs") rather than the live site's four, and no
 * Partner/Careers/Volunteer/Donate row. Figma wins, per the README assumptions.
 *
 * External destinations (Substack, the social accounts) are the real ones,
 * measured from the live footer, so the links work rather than going nowhere.
 */
export interface FooterLink {
  readonly label: string;
  readonly href: string;
}

export interface FooterColumn {
  readonly heading: string;
  readonly links: readonly FooterLink[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'Resources',
    links: [
      { label: 'Blueprint to our makerspaces', href: '/space/makerspace' },
      { label: 'IGNITE Incubator Program', href: '/programs/ignite-incubator' },
      { label: 'MakerGaon Fellowship', href: '/programs/makerghat-fellowship' },
      { label: 'Curriculum Resources', href: '/curriculum/resources' },
      { label: 'Dashboard', href: '/evidence/dashboard' },
      { label: 'Reports', href: '/evidence/reports' },
    ],
  },
  {
    heading: 'FAQs',
    links: [
      { label: 'Space', href: '/space/makerspace' },
      { label: 'Curriculum', href: '/curriculum' },
      { label: 'Training', href: '/training' },
      { label: 'Evidence', href: '/evidence' },
    ],
  },
];

export const FOOTER_LEAD_LINK: FooterLink = {
  label: 'About Us',
  href: '/about-us/our-story',
};

export const CONTACT = {
  phone: { label: '+91 9447756484', href: 'tel:+919447756484', icon: 'assets/phone.svg' },
  email: { label: 'info@makerghat.org', href: 'mailto:info@makerghat.org', icon: 'assets/email.svg' },
} as const;

export const NEWSLETTER = {
  label: 'Subscribe to our newsletter',
  href: 'https://makerghat.substack.com/',
} as const;

/*
 * Icon files live in public/assets. instagram / youtube / linkedin are the
 * SVG Repo glyphs makerghat.org itself uses; substack is authored here because
 * their footer has no icon file for it.
 */
export const SOCIAL_LINKS = [
  { label: 'MakerGhat on Instagram', icon: 'assets/insta.svg', href: 'https://www.instagram.com/makerghat' },
  { label: 'MakerGhat on Substack', icon: 'assets/substack.svg', href: 'https://makerghat.substack.com/' },
  { label: 'MakerGhat on YouTube', icon: 'assets/youtube.svg', href: 'https://youtube.com/@makerghat9609' },
  { label: 'MakerGhat on LinkedIn', icon: 'assets/linkedin.svg', href: 'https://www.linkedin.com/company/makerghat' },
] as const;

export const LICENCE_LINES = [
  'MakerGhat and its assets are licensed',
  'under CC BY-SA4.0',
] as const;
