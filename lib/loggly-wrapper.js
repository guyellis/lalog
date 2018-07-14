const _ = require('lodash');
const fetch = require('node-fetch');

const log = async (options, bulk) => {
  const {
    tag,
    logglyToken = process.env.LOGGLY_TOKEN,
    logObj,
  } = options;

  const body = bulk
    ? logObj.map(obj => JSON.stringify(obj)).join('\n')
    : JSON.stringify(logObj);

  const pathPart = bulk ? 'bulk' : 'inputs';

  if (logglyToken) {
    let url;
    let fetchOptions;
    try {
      url = `https://logs-01.loggly.com/${pathPart}/${logglyToken}/tag/${tag}/`;
      fetchOptions = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        method: 'POST',
        body,
      };

      const result = await fetch(url, fetchOptions);

      if (result.status !== 200) {
        const { stack } = new Error();
        // eslint-disable-next-line no-console
        console.error(`fetch() call failed with ${result.status}\n${stack}`);
        return {};
      }

      return result.json();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`fetch() threw an error: ${err.message}
url: ${url}
options: ${JSON.stringify(fetchOptions, null, 2)}`);
      return {};
    }
  }
  // eslint-disable-next-line no-console
  console.warn('loggly token has not been defined');

  return {};
};

const logSingle = (options) => {
  const { logObj } = options;
  if (!_.isObject(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Object in logSingle but got ${typeof logObj}`);
  }
  return log(options, false);
};

// TODO: This is just a copy of logSingle and needs to be completed.
const logBatch = async (options) => {
  const { logObj } = options;
  if (!_.isArray(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Array in logBatch but got ${typeof logObj}`);
  }
  return log(options, true);
};

module.exports = {
  logBatch,
  logSingle,
};
