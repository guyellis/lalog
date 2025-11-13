export {}; // To get around: Cannot redeclare block-scoped variable ts(2451)

// NODE_ENV is used in the Logger constructor to generate the tag
process.env.NODE_ENV = 'development';

// Node 25 exposes a global localStorage that now requires a --localstorage-file path.
// We don't use it, so we stub it before Jest environments or code access it.

if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    clear: jest.fn(),
    getItem: () => null,
    key: () => null,
    get length() {
      return 0;
    },
    removeItem: jest.fn(),
    setItem: jest.fn(),
  };
}
