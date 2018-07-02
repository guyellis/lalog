
const fetch = require('node-fetch');

module.exports = async (options) => {
  const {
    tag,
    logglyToken = process.env.LOGGLY_TOKEN,
    logObj,
  } = options;
  if (logglyToken) {
    let url;
    let fetchOptions;
    try {
      url = `https://logs-01.loggly.com/inputs/${logglyToken}/tag/${tag}/`;
      fetchOptions = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(logObj),
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
