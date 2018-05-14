// The winston-loggly-bulk module has a dependency on the appropriate
// winston module so don't need to explicitly include it as a
// dependency in package.json

module.exports = (serviceName) => {
  if (process.env.LOGGLY_TOKEN) {
    // winston is not in dependencies in package.json because the compatible version
    // for loggly is a dependency on that.
    // Including the modules in here so they don't get loaded if not needed.
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const winston = require('winston');
    // eslint-disable-next-line global-require
    require('winston-loggly-bulk');

    winston.add(winston.transports.Loggly, {
      level: 'silly',
      inputToken: process.env.LOGGLY_TOKEN,
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      // This is a comma separated list of tags used for filtering in reporting.
      tags: [`${serviceName}-${process.env.NODE_ENV}`],
      // When the json flag is enabled, objects will be converted to JSON using
      // JSON.stringify before being transmitted to Loggly.
      json: true,
    });

    return (level, json) => new Promise((resolve) => {
      winston.log(level, json, (error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
        resolve(error);
      });
    });
  }
  return () => Promise.resolve();
};
