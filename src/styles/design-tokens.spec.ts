import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * These values were measured from makerghat.org's own production stylesheet
 * (static/css/main.ec5aa4f4.css) on 2026-09-06. Inheriting them verbatim is how
 * this recreation stays compatible with the existing site: the design system is
 * the expensive part to reproduce, and it is theirs.
 *
 * If one of these assertions ever fails, the token file drifted from the source
 * of truth — fix the token, not the test.
 */

const root = resolve(process.cwd());
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

function parseTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

const tokens = parseTokens(read('src/styles/tokens.css'));

describe('design tokens inherited from makerghat.org', () => {
  it.each([
    ['--color-primary-500', '#4a3a80'],
    ['--color-secondary-500', '#f1805e'],
    ['--color-green-500', '#66c67f'],
    ['--color-green-600', '#58ad6f'],
    ['--color-yellow', '#ffbd00'],
    ['--color-neutral-50', '#f9f4e8'],
    ['--color-neutral-200', '#ead8b5'],
    ['--color-white', '#fff'],
    ['--color-black', '#000'],
  ])('%s is %s, exactly as measured', (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it.each([
    ['--font-parkinsans', 'Parkinsans'],
    ['--font-outfit', 'Outfit'],
    ['--font-bungee', 'Bungee'],
  ])('%s names the %s family', (name, family) => {
    expect(tokens.get(name)).toContain(family);
  });

  it('keeps the 1280px content container', () => {
    expect(tokens.get('--container-width')).toBe('1280px');
  });

  it('carries the full type scale, not a hand-picked subset', () => {
    for (const size of [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 64, 80, 90]) {
      expect(tokens.get(`--font-size-${size}`)).toBe(`${size}px`);
    }
  });

  it('carries the full line-height scale', () => {
    for (const lh of [12, 14, 16, 18, 20, 24, 28, 30, 32, 36, 44, 56, 80, 90]) {
      expect(tokens.get(`--line-height-${lh}`)).toBe(`${lh}px`);
    }
  });

  it('defines every step of each colour ramp it claims to have', () => {
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(tokens.has(`--color-primary-${step}`)).toBe(true);
      expect(tokens.has(`--color-secondary-${step}`)).toBe(true);
      expect(tokens.has(`--color-green-${step}`)).toBe(true);
    }
  });
});

describe('tokens added by this project', () => {
  it('adds a 4px spacing scale, which their stylesheet does not have', () => {
    for (const step of [4, 8, 12, 16, 24, 32, 48, 64, 96, 160]) {
      expect(tokens.get(`--space-${step}`)).toBe(`${step}px`);
    }
  });
});

describe('stylesheet wiring', () => {
  const globalCss = read('src/styles.css');

  it.each(['tokens.css', 'reset.css', 'typography.css', 'layout.css'])(
    'imports %s',
    (partial) => {
      expect(globalCss).toContain(partial);
    },
  );

  /*
   * The page ground is white and the cream belongs to the content panel — this
   * used to assert the opposite, because the design was read from a screenshot
   * rather than the 1440x4503 export. The reference settles it: white margins
   * at x<80 and x>1360, cream between.
   */
  it('paints the page ground with the white token, not a literal', () => {
    expect(globalCss).toMatch(/background:\s*var\(--color-white\)/);
  });

  it('sets the body typeface from the token', () => {
    expect(globalCss).toMatch(/font-family[^;]*var\(--font-parkinsans\)/);
  });
});

describe('skip link reveal', () => {
  const layoutCss = read('src/styles/layout.css');

  /*
   * Source-level guard, not a rendering test: jsdom does not resolve the global
   * stylesheet in component specs. Verified in a real browser at
   * http://localhost:4300 during Phase 1.
   */
  it('reveals on :focus, since programmatic focus never sets :focus-visible', () => {
    expect(layoutCss).toMatch(/\.skip-link:focus\s*\{/);
  });

  it('is hidden off-screen until then', () => {
    expect(layoutCss).toMatch(/\.skip-link\s*\{[^}]*translateY\(-200%\)/);
  });
});

describe('no colour literals outside the token file', () => {
  function cssFilesUnder(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(join(root, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(root, rel)).isDirectory()) {
        out.push(...cssFilesUnder(rel));
      } else if (entry.endsWith('.css') && entry !== 'tokens.css') {
        out.push(rel);
      }
    }
    return out;
  }

  /* Comments are stripped first: the rule bans hex *values*, not a comment that
     documents where a colour came from. */
  const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('keeps every hex value in tokens.css so the palette has one home', () => {
    const offenders = cssFilesUnder('src')
      .map((file) => ({ file, hits: withoutComments(read(file)).match(/#[0-9a-fA-F]{3,8}\b/g) ?? [] }))
      .filter(({ hits }) => hits.length > 0);

    expect(offenders).toEqual([]);
  });

  it('still catches a hex value in a real declaration', () => {
    const sample = '/* was #ffffff */\n.x { color: #ff0000; }';
    expect(withoutComments(sample).match(/#[0-9a-fA-F]{3,8}\b/g)).toEqual(['#ff0000']);
  });
});
