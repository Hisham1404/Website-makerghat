import { Routes } from '@angular/router';
import { AboutTabsLayout } from './layout/about-tabs/about-tabs';

/**
 * Paths mirror makerghat.org's own structure so a deep link into this
 * recreation resolves the way it does on the real site.
 *
 * Only "our-story" was designed in the Figma. Everything else — the other tabs
 * and the six other top-level nav sections — resolves to a stub that says so.
 * Deliberately not a redirect home: a nav link that quietly lands you somewhere
 * else reads as a bug, where a page that explains the scope reads as a decision.
 */
const stub = () => import('./pages/stub/stub').then((m) => m.StubPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'about-us/our-story' },
  {
    path: 'about-us',
    component: AboutTabsLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'our-story' },
      {
        path: 'our-story',
        title: 'Our Story | MakerGhat',
        loadComponent: () => import('./pages/our-story/our-story').then((m) => m.OurStoryPage),
      },
      {
        path: 'team',
        title: 'Team | MakerGhat',
        data: { heading: 'MakerGhat Team' },
        loadComponent: stub,
      },
      {
        path: 'support-system',
        title: 'Support system | MakerGhat',
        data: { heading: 'Support system' },
        loadComponent: stub,
      },
      {
        path: 'vol-alum',
        title: 'Volunteers & Alumni | MakerGhat',
        data: { heading: 'Volunteers & Alumni' },
        loadComponent: stub,
      },
      /*
       * Not one of the Figma's four tabs, but it is a real makerghat.org path
       * and their header links to it — so it stays resolvable.
       */
      {
        path: 'awards',
        title: 'Awards | MakerGhat',
        data: { heading: 'Awards' },
        loadComponent: stub,
      },
    ],
  },
  {
    path: '**',
    title: 'Not in scope | MakerGhat',
    data: { heading: 'Page not available' },
    loadComponent: stub,
  },
];
