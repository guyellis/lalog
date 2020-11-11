export const isObject = (
  obj?: object | null,
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

export const safeJsonStringify = (obj: any): string => JSON.stringify(obj, getCircularReplacer());
