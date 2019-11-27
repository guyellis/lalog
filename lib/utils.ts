export const isObject = (
  obj?: object | null,
): boolean => !!obj && obj.toString() === '[object Object]' && !Array.isArray(obj);
