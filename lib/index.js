const isObject = require('lodash/isObject');
const debug = require('debug');
const uuid = require('uuid');

const {
  logBatch,
  logSingle,
} = require('./loggly-wrapper');

/**
 * @type {Array<import('../typings').LevelEnum>}
 */
const levels = ['trace', 'info', 'warn', 'error', 'fatal', 'security'];
const errorLevel = levels.indexOf('error');

const getInitialLogLevel = () => {
  /** @type {import('../typings').LevelEnum} */
  // @ts-ignore Type 'string' is not assignable to type 'LevelEnum'
  const laLogLevel = process.env.LALOG_LEVEL;
  if (levels.includes(laLogLevel)) {
    return levels.indexOf(laLogLevel);
  }
  return levels.indexOf('error');
};

let currentLevelIndex = getInitialLogLevel();

/**
 * @type {import('../typings')}
 */
class Logger {
  /**
   * Create an instance of Logger
   * @param {import('../typings').LogOptions} options
   */
  constructor(options) {
    const {
      addTrackId,
      moduleName,
      presets,
      serviceName,
      isTransient,
    } = options;

    this.isTransient = !!isTransient;

    /**
     * @type {Array|null}
     */
    this.logCollector = isTransient ? [] : null;

    this.presets = {
      module: moduleName,
      ...(isObject(presets) ? presets : {}),
    };

    // @ts-ignore
    if (addTrackId && !this.presets.trackId) {
    // @ts-ignore
      this.presets.trackId = uuid.v4();
    }

    this.debug = debug(`${serviceName}:${moduleName}`);
    this.tag = `${serviceName}-${process.env.NODE_ENV}`;

    // Setup timeEnd so that it can be called without a level and when that happens the
    // level will default to info:
    const defaultTimeEndLevel = levels.indexOf('info');
    this.timeEnd = this.writeTimeEnd.bind(this, defaultTimeEndLevel);

    // Listed like this so that Typescript can type each log level.
    // Previously this was setup using a loop but Typescript couldn't type it
    this.trace = this.write.bind(this, levels.indexOf('trace'));
    this.info = this.write.bind(this, levels.indexOf('info'));
    this.warn = this.write.bind(this, levels.indexOf('warn'));
    this.error = this.write.bind(this, levels.indexOf('error'));
    this.fatal = this.write.bind(this, levels.indexOf('fatal'));
    this.security = this.write.bind(this, levels.indexOf('security'));

    // @ts-ignore
    this.timeEnd.trace = this.writeTimeEnd.bind(this, levels.indexOf('trace'));
    // @ts-ignore
    this.timeEnd.info = this.writeTimeEnd.bind(this, levels.indexOf('info'));
    // @ts-ignore
    this.timeEnd.warn = this.writeTimeEnd.bind(this, levels.indexOf('warn'));
    // @ts-ignore
    this.timeEnd.error = this.writeTimeEnd.bind(this, levels.indexOf('error'));
    // @ts-ignore
    this.timeEnd.fatal = this.writeTimeEnd.bind(this, levels.indexOf('fatal'));
    // @ts-ignore
    this.timeEnd.security = this.writeTimeEnd.bind(this, levels.indexOf('security'));

    this.timers = {};
    /**
     * Start a timer log - same as console.time()
     * @param {string} label - label to use when calling timeEnd()
     */
    this.time = (label) => {
    // @ts-ignore
      this.timers[label] = Date.now();
    };
  }

  /**
    * Create an instance of Logger
    * @static
    * @param {import('../typings').LogOptions} options
    * @returns {import('../typings')}
    * @memberof Logger
    */
  static create(options) {
    // @ts-ignore Type 'Logger' is not assignable to type 'LaLog'.
    // Property 'create' is missing in type 'Logger'.
    return new Logger(options);
  }

  /**
   * Get an array of all available log levels
   * @static
   * @returns {Array<import('../typings').LevelEnum>}
   * @memberof Logger
   */
  static allLevels() {
    return levels;
  }

  /**
   * Get the current log level
   * @static
   * @returns {import('../typings').LevelEnum}
   * @memberof Logger
   */
  static getLevel() {
    return levels[currentLevelIndex];
  }

  /**
   * Change the minimum level to write logs
   * @static
   * @param {import('../typings').LevelEnum} newLevelName
   * @returns {import('../typings').LevelEnum}
   * @memberof Logger
   */
  static setLevel(newLevelName) {
    const previousLevel = Logger.getLevel();
    const newLevelIndex = levels.indexOf(newLevelName);
    if (newLevelIndex >= 0) {
      currentLevelIndex = newLevelIndex;
    }
    return previousLevel;
  }

  /**
   * Parse the Express request (req) object for logging
   * @static
   * @param {Object} req
   * @returns {Object}
   * @memberof Logger
   */
  static parseReq(req) {
    return {
      body: req.body,
      headers: req.headers,
      method: req.method,
      params: req.params,
      path: req.path,
      query: req.query,
      url: req.url,
      user: req.user,
    };
  }

  /**
   * Format milliseconds to a string for logging
   * @static
   * @param {number} milliseconds
   * @returns {string}
   * @memberof Logger
   */
  static formatMilliseconds(milliseconds) {
    const date = new Date(0);
    date.setMilliseconds(milliseconds);
    return date.toISOString().substr(11, 12);
  }

  /**
   * [Private] Write the timer label end
   * @param {number} levelIndex
   * @param {string} label
   * @param {object} [extraLogData={}]
   * @returns {Promise}
   * @memberof Logger
   */
  writeTimeEnd(levelIndex, label, extraLogData = {}) {
    // @ts-ignore
    const time = this.timers[label];
    const duration = Object.prototype.hasOwnProperty.call(this.timers, label)
      ? Logger.formatMilliseconds(Date.now() - time)
      : `Missing label "${label}" in timeEnd()\n${(new Error()).stack}`;

    let { msg } = extraLogData;
    msg = msg ? `Timer - ${msg}` : 'Timer';

    const logData = {
      ...extraLogData,
      msg,
      timerLabel: label,
      duration,
    };
    return this.write(levelIndex, logData);
  }

  /**
   * Write log to destination
   * @param {number} levelIndex
   * @param {object} logData
   * @param {object=} response
   * @returns {Promise}
   * @memberof Logger
   */
  async write(levelIndex, logData, response) {
    if (!isObject(logData)) {
      // eslint-disable-next-line no-console
      console.error(`Expecting an object in logger write method but got "${typeof logData}"`);
      return Promise.resolve();
    }

    /**
     * @type {object}
     */
    const logObj = { ...this.presets, ...logData };

    if (response) {
      // If the response object has been included with the call then it means we need to
      // send an error message with an errorId.
      // Prima facie this seems like a terrible idea but it seems to work well as
      // a response can be immediately sent to the client which includes a code
      // that can be provided to the user and links back to the error log.
      const errorId = logObj.errorId || uuid.v4();
      logObj.errorId = errorId;
      const { res, code } = response;
      res.status(code).send({ success: false, errorId });
    }

    // When do we log?
    // - If !isTransient and levelIndex >= currentLevelIndex
    //   - normal logging - current logic
    // - If isTransient and levelIndex < currentLevelIndex
    //   - push this log item onto the array
    // - If isTransient and levelIndex >= currentLevelIndex and !isTransientTriggered
    //   - set isTransientTriggered to true
    //   - push this log item onto the array
    //   - bulk log everything in array
    //   - empty array (for early GC)
    // - If isTransientTriggered
    //   - log everything


    if (levelIndex >= currentLevelIndex || this.isTransient) {
      logObj.level = levels[levelIndex];

      if (levelIndex >= errorLevel && !logObj.err) {
        logObj.err = new Error();
      }

      if (logObj.err) {
        if (!logObj.err.stack) {
          // This will happen if we manually created an err prop - it might not have a stack prop
          logObj.err.stack = new Error().stack;
        }
        logObj.fullStack = logObj.err.stack.split('\n').slice(1);
        /**
         * Checks if string includes node_modules
         * @param {string} i
         */
        const hasNodeModules = (i) => !i.includes('/node_modules/');
        logObj.shortStack = logObj.fullStack.filter(hasNodeModules);
        if (!logObj.msg) {
          logObj.msg = logObj.err.message;
        }
        delete logObj.err;
      }

      if (logObj.req) {
        logObj.req = Logger.parseReq(logObj.req);
      }

      if (this.logCollector !== null && !this.isTransientTriggered) {
        this.logCollector.push(logObj);
        if (levelIndex >= currentLevelIndex) {
          // Need to batch log here
          this.isTransientTriggered = true;
          await logBatch({ tag: this.tag, logObj: this.logCollector });
          this.logCollector = null; // Can GC right away now that this array is no longer needed
        }
      } else {
        this.debug(logObj);
        return logSingle({ tag: this.tag, logObj });
      }
    }
    return Promise.resolve();
  }
}

module.exports = Logger;
