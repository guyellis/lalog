import { isObject } from '../../lib/utils';

describe('utils', () => {
  test('isObject', () => {
    expect(isObject({})).toBe(true);
    expect(isObject(1 as unknown as object)).toBe(false);
    expect(isObject(true as unknown as object)).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(() => {})).toBe(false);
    expect(isObject([1, 2])).toBe(false);
    expect(isObject([])).toBe(false);
  });
});
