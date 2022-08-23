import { logDataEnriched, LogDataOut } from './local-types';

export const isObject = (
  obj?: Record<string, unknown> | null,
): boolean => !!obj && obj.toString() === '[object Object]' && !Array.isArray(obj);

type CircularReplacer = (key: any, value: any) => any;

// From MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
const getCircularReplacer = (): CircularReplacer => {
  const seen = new WeakSet();
  return (key, value): any => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[CIRCULAR]';
      }
      seen.add(value);
    }
    return value;
  };
};

export const safeJsonStringify = (
  obj: Record<string, unknown>,
): string => JSON.stringify(obj, getCircularReplacer());

const hasNodeModules = (i: string): boolean => !i.includes('/node_modules/');

/**
 * If the body has an err prop and its type is Error then find all properties in it
 * and spread them out.
 */
export const enrichError = (body: LogDataOut): logDataEnriched | LogDataOut => {
  const { err } = body;
  if (err) {
    const stack = err.stack
      ? err.stack
      : /* istanbul ignore next */ new Error().stack ?? '<no error stack>';
    const fullStack = stack.split('\n').slice(1);
    const shortStack = fullStack.filter(hasNodeModules);

    let err2: Record<string, unknown> = {};
    if (err instanceof Error) {
      err2 = Object.entries(err).reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {} as Record<string, unknown>);
      /* istanbul ignore next */
      err2.name = err.name ?? '<none>';
      err2.message = err.message;
    }

    return {
      ...body,
      err: {
        fullStack,
        shortStack,
        ...err2,
      },
    };
  }

  return body;
};
