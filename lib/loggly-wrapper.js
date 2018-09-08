const _ = require('lodash');
const fetch = require('node-fetch');

/**
 * Write log to Loggly
 * @param {object} options
 * @param {string} options.tag
 * @param {string=} options.logglyToken
 * @param {string} options.logObj
 * @param {boolean} bulk
 */
const log = async (options, bulk) => {
  const {
    tag,
    logglyToken = process.env.LOGGLY_TOKEN,
    logObj: body,
  } = options;


  const pathPart = bulk ? 'bulk' : 'inputs';

  if (logglyToken) {
    /**
     * @type {string}
     */
    let url = '';
    /**
     * @type {import('node-fetch').RequestInit}
     */
    let fetchOptions = {};
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

      /**
       * @type {import('node-fetch').Response}
       */
      // @ts-ignore Cannot invoke an expression whose type lacks a call signature...
      // ts-ignore seems to be needed because of a bug in the node-fetch typing file.
      // Try and remove the ignore if this typing file is updated
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

/**
 * Log a single log object
 * @param {object} options
 * @param {string} options.tag
 * @param {string=} options.logglyToken
 * @param {object} options.logObj
 */
const logSingle = (options) => {
  const { logObj } = options;
  if (!_.isObject(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Object in logSingle but got ${typeof logObj}`);
    return Promise.resolve();
  }

  const body = JSON.stringify(logObj);
  return log({
    ...options,
    logObj: body,
  }, false);
};

/**
 * Log an array of logs
 * @param {object} options
 * @param {string} options.tag
 * @param {string=} options.logglyToken
 * @param {Array<object>} options.logObj
 */
const logBatch = async (options) => {
  const { logObj } = options;
  if (!_.isArray(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Array in logBatch but got ${typeof logObj}`);
    return Promise.resolve();
  }

  // https://stackoverflow.com/questions/52248377/typescript-array-map-with-json-stringify-produces-error
  // @ts-ignore - no idea why typescript can't handle this .map()
  const body = logObj.map(JSON.stringify).join('\n');
  return log({
    ...options,
    logObj: body,
  }, true);
};

module.exports = {
  logBatch,
  logSingle,
};
