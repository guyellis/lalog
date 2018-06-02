
const fetch = require('node-fetch');

module.exports = async (options) => {
  const {
    tag,
    logglyToken = process.env.LOGGLY_TOKEN,
    logObj,
  } = options;
  if (logglyToken) {
    const url = `https://logs-01.loggly.com/inputs/${logglyToken}/tag/${tag}/`;
    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(logObj),
    };

    let result;
    try {
      result = await fetch(url, fetchOptions);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`fetch() threw an error: ${err.message}
url: ${url}
options: ${JSON.stringify(fetchOptions, null, 2)}`);
      return {};
    }

    if (result.status !== 200) {
      // eslint-disable-next-line no-console
      console.error(`fetch() call failed with ${result.status}`);
      return {};
    }

    return result.json();
  }
  // eslint-disable-next-line no-console
  console.warn('loggly token has not been defined');

  return {};
};
