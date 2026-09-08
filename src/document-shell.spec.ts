import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * index.html is outside Angular's component tree, so nothing else would catch a
 * regression here. The three font requests are copied from makerghat.org's own
 * <head> so the recreation renders in the same typefaces.
 */
const html = readFileSync(join(resolve(process.cwd()), 'src/index.html'), 'utf8');

describe('document shell', () => {
  it('declares the document language', () => {
    expect(html).toContain('<html lang="en">');
  });

  it('is responsive-ready', () => {
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1"/);
  });

  it('has a real title, not the CLI default', () => {
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    expect(title).toBe('Our Story | MakerGhat');
  });

  it.each([
    ['Parkinsans', 'family=Parkinsans:wght@300..800'],
    ['Outfit', 'family=Outfit:wght@100..900'],
    ['Bungee and Nunito', 'family=Bungee&family=Nunito:wght@200..1000'],
  ])('requests the %s webfont', (_name, query) => {
    expect(html).toContain(query);
  });

  it('preconnects to the font host so the faces are not render-blocking', () => {
    expect(html).toMatch(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
  });

  it('asks the browser to swap in the webfont rather than hide text', () => {
    expect(html).toContain('display=swap');
  });
});
