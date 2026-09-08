/**
 * Test-only CSS reading helpers.
 *
 * Every one of these exists because a plain `indexOf(selector)` is wrong in two
 * ways that both bit during the road rewrite:
 *
 *   - it matches inside a longer selector, so `.milestone__media` finds
 *     `.milestone[data-media-side='before'] .milestone__media`;
 *   - it matches one selector of a group, so `.origin__cut::after` finds the
 *     shared `.origin__cut::before, .origin__cut::after` rule.
 *
 * So rules are split apart and their selector lists compared exactly.
 */

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

interface Rule {
  readonly selectors: readonly string[];
  readonly body: string;
}

/** Every declaration block in source order, media queries flattened away. */
export function rules(css: string): readonly Rule[] {
  const out: Rule[] = [];
  const flat = stripComments(css).replace(/@media[^{]*\{/g, '');

  for (const match of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]
      .split(',')
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    if (selectors.length > 0) out.push({ selectors, body: match[2] });
  }
  return out;
}

/** The body of the first rule whose selector list is exactly `[selector]`. */
export function rule(css: string, selector: string): string {
  const found = rules(css).find((r) => r.selectors.length === 1 && r.selectors[0] === selector);
  if (!found) throw new Error(`no single-selector rule for ${selector}`);
  return found.body;
}

/** The body of the first rule whose selector list is exactly `selectors`. */
export function groupedRule(css: string, selectors: readonly string[]): string {
  const found = rules(css).find(
    (r) =>
      r.selectors.length === selectors.length && selectors.every((s, i) => r.selectors[i] === s),
  );
  if (!found) throw new Error(`no rule for ${selectors.join(', ')}`);
  return found.body;
}
