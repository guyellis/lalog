export {}; // To get around: Cannot redeclare block-scoped variable ts(2451)

// NODE_ENV is used in the Logger constructor to generate the tag
process.env.NODE_ENV = 'development';
