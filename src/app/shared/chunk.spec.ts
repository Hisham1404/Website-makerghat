import { chunk } from './chunk';

describe('chunk', () => {
  it('splits evenly when the list divides', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('leaves the remainder in a short final row', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('preserves order — the timeline is chronological', () => {
    expect(chunk(['a', 'b', 'c', 'd', 'e'], 3).flat()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('gives one row per item at size 1', () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('returns a single row when the size exceeds the list', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('returns no rows for an empty list', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('does not alias the input array', () => {
    const input = [1, 2, 3, 4];
    const rows = chunk(input, 2);
    rows[0][0] = 99;
    expect(input[0]).toBe(1);
  });

  it.each([0, -1, 1.5, NaN])('rejects %s as a row size rather than looping forever', (size) => {
    expect(() => chunk([1, 2, 3], size)).toThrow(RangeError);
  });
});
