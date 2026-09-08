/**
 * Turn a polyline into an SVG path with rounded corners.
 *
 * The road is one continuous stroke in the Figma, so it is one path here. Each
 * corner is a quadratic whose control point is the corner itself, which for a
 * right angle is indistinguishable from a circular arc and needs no sweep
 * flags. The radius is clamped to half of the shorter adjacent segment, because
 * the road has two corners only 42px apart at the first step and 67px at the
 * meander — an unclamped radius would overshoot and cross itself there.
 */
export function roundedPath(
  points: readonly (readonly [number, number])[],
  radius: number,
): string {
  if (points.length < 2) return '';

  const n = (value: number) => Math.round(value * 100) / 100;
  const out: string[] = [`M${n(points[0][0])} ${n(points[0][1])}`];

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];

    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    if (inLen === 0 || outLen === 0) continue;

    const r = Math.min(radius, inLen / 2, outLen / 2);
    const ax = cx + ((px - cx) / inLen) * r;
    const ay = cy + ((py - cy) / inLen) * r;
    const bx = cx + ((nx - cx) / outLen) * r;
    const by = cy + ((ny - cy) / outLen) * r;

    out.push(`L${n(ax)} ${n(ay)}`, `Q${n(cx)} ${n(cy)} ${n(bx)} ${n(by)}`);
  }

  const [lx, ly] = points[points.length - 1];
  out.push(`L${n(lx)} ${n(ly)}`);
  return out.join(' ');
}
