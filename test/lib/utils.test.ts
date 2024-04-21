import { logDataEnriched, LogDataOut } from '../../lib/local-types';
import {
  enrichError, getLoggerService, isObject, safeJsonStringify,
} from '../../lib/utils';

describe('utils', () => {
  test('isObject', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const emptyArrow = (): void => {};

    expect(isObject({})).toBe(true);
    expect(isObject(1 as unknown as Record<string, unknown>)).toBe(false);
    expect(isObject(true as unknown as Record<string, unknown>)).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(emptyArrow as unknown as Record<string, unknown>)).toBe(false);
    expect(isObject([1, 2] as unknown as Record<string, unknown>)).toBe(false);
    expect(isObject([] as unknown as Record<string, unknown>)).toBe(false);
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

    result = safeJsonStringify(null as unknown as Record<string, unknown>);
    expect(result).toMatchSnapshot();

    result = safeJsonStringify('i am string' as unknown as Record<string, unknown>);
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

  test('Missing err prop does nothing', () => {
    const body = {
      data: 'some-string',
      url: 'some-url',
    };
    expect(enrichError(body)).toMatchInlineSnapshot(`
{
  "data": "some-string",
  "url": "some-url",
}
`);
  });

  test('err prop that is not instanceof Error does nothing', () => {
    const logObj: LogDataOut = {
      data: 'some-string',
      err: 'not a real Error' as unknown as Error,
      url: 'some-url',
    };
    const body = enrichError(logObj) as logDataEnriched;
    delete body.err.fullStack;
    delete body.err.shortStack;
    expect(body).toMatchInlineSnapshot(`
{
  "data": "some-string",
  "err": {},
  "url": "some-url",
}
`);
  });

  test('Error err prop is enriched', () => {
    const err = new Error('Test error message');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    err.code = 'test_error_code';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    err.status = 500;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    err.url = undefined;

    const logObj = {
      data: 'some-string',
      err,
      url: 'some-url',
    };

    const body = enrichError(logObj) as logDataEnriched;
    delete body.err.fullStack;
    delete body.err.shortStack;
    expect(body).toMatchInlineSnapshot(`
{
  "data": "some-string",
  "err": {
    "code": "test_error_code",
    "message": "Test error message",
    "name": "Error",
    "status": 500,
    "url": undefined,
  },
  "url": "some-url",
}
`);
  });

  test('getLoggerService throw for unimplemented', async () => {
    expect(() => getLoggerService('gcp')).toThrowErrorMatchingInlineSnapshot('"gcp logger service not implemented"');
  });

  test('getLoggerService throws for invalid', async () => {
    expect(() => getLoggerService(('fake' as 'loggly'))).toThrowErrorMatchingInlineSnapshot('"invalid logger service"');
  });
});
