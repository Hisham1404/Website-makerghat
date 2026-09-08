/**
 * Split a list into fixed-size rows, preserving order.
 *
 * The timeline's serpentine is a pure function of this: row parity decides
 * which way the row reads and which side its connector turns on, so the whole
 * layout follows from the milestone array plus one number.
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, received ${size}`);
  }

  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}
