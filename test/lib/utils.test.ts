import { isObject, safeJsonStringify } from '../../lib/utils';

describe('utils', () => {
  test('isObject', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const emptyArrow = (): void => {};

    expect(isObject({})).toBe(true);
    expect(isObject(1 as unknown as object)).toBe(false);
    expect(isObject(true as unknown as object)).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(emptyArrow)).toBe(false);
    expect(isObject([1, 2])).toBe(false);
    expect(isObject([])).toBe(false);
  });

  test('safeJsonStringify', () => {
    const obj1 = {
      one: 'one',
      two: {
        three: 3,
      },
    };
    let result = safeJsonStringify(obj1);
    expect(result).toMatchSnapshot();

    result = safeJsonStringify(null);
    expect(result).toMatchSnapshot();

    result = safeJsonStringify('i am string');
    expect(result).toMatchSnapshot();
  });

  test('safeJsonStringify circular', () => {
    const circular: Record<string, unknown> = {
      one: 'one',
      two: {
        three: 3,
      },
    };
    circular.four = circular;
    const result = safeJsonStringify(circular);
    expect(result).toMatchSnapshot();
  });
});
