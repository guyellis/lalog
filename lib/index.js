const isObject = require('lodash/isObject');
const debug = require('debug');
const uuid = require('uuid');
const {
  logBatch,
  logSingle,
} = require('./loggly-wrapper');

const levels = ['trace', 'info', 'warn', 'error', 'fatal', 'security'];
const errorLevel = levels.indexOf('error');

const getInitialLogLevel = () => {
  const { LALOG_LEVEL } = process.env;
  if (LALOG_LEVEL && levels.includes(LALOG_LEVEL)) {
    return levels.indexOf(LALOG_LEVEL);
  }
  return levels.indexOf('error');
};

let currentLevelIndex = getInitialLogLevel();

class Logger {
  /**
   * Create an instance of Logger
   * @param {Object} options - options for the Logger creation
   * @param {Boolean?} options.addTrackId - If true then create a trackId property with a UUID to
   *   log will all log actions
   * @param {String?} options.moduleName - Name of the module that this Logger was created in
   * @param {Object?} options.presets - An object to merge into the object that's logged with any
   *   log action
   * @param {String?} options.serviceName - Name of the service. Usually the app or api that is
   *   consuming lalog
   * @param {Boolean?} options.transient - If true then this is a transient logger that must store
   *   all log messages and log everything if a log action is triggered for it.
   * @returns {Logger} - an instance of a Logger
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

    if (isTransient) {
      this.logCollector = [];
    }

    this.presets = Object.assign(
      { module: moduleName },
      isObject(presets) ? presets : {},
    );

    if (addTrackId && !this.presets.trackId) {
      this.presets.trackId = uuid.v4();
    }

    this.debug = debug(`${serviceName}:${moduleName}`);
    this.tag = `${serviceName}-${process.env.NODE_ENV}`;

    // Setup timeEnd so that it can be called without a level and when that happens the
    // level will default to info:
    const defaultTimeEndLevel = levels.indexOf('info');
    this.timeEnd = this.writeTimeEnd.bind(this, defaultTimeEndLevel);

    levels.forEach((level, index) => {
      this[level] = this.write.bind(this, index);
      this.timeEnd[level] = this.writeTimeEnd.bind(this, index);
    });
    this.timers = {};
    this.time = (label) => {
      this.timers[label] = Date.now();
    };
  }

  static create(options) {
    return new Logger(options);
  }

  static allLevels() {
    return levels;
  }

  static getLevel() {
    return levels[currentLevelIndex];
  }

  static setLevel(newLevelName) {
    const previousLevel = Logger.getLevel();
    const newLevelIndex = levels.indexOf(newLevelName);
    if (newLevelIndex >= 0) {
      currentLevelIndex = newLevelIndex;
    }
    return previousLevel;
  }

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

  static formatMilliseconds(milliseconds) {
    const date = new Date(null);
    date.setMilliseconds(milliseconds);
    return date.toISOString().substr(11, 12);
  }

  writeTimeEnd(levelIndex, label, extraLogData = {}) {
    const time = this.timers[label];
    const duration = Object.prototype.hasOwnProperty.call(this.timers, label)
      ? Logger.formatMilliseconds(Date.now() - time)
      : `Missing label "${label}" in timeEnd()\n${(new Error()).stack}`;

    let { msg } = extraLogData;
    msg = msg ? `Timer - ${msg}` : 'Timer';

    const logData = Object.assign({}, extraLogData, {
      msg,
      timerLabel: label,
      duration,
    });
    return this.write(levelIndex, logData);
  }

  /**
   * Log to Loggly or other destination
   * @param {Number} levelIndex - severity of error
   * @param {Object} logObj - the object to log
   * @param {Object} response - the Express response object and status to send a canned error
   * @returns {Promise} - a promise
   */
  async write(levelIndex, logData, response) {
    if (!isObject(logData)) {
      // eslint-disable-next-line no-console
      console.error(`Expecting an object in logger write method but got "${typeof logData}"`);
      return Promise.resolve();
    }

    const logObj = Object.assign({}, this.presets, logData);

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
        logObj.shortStack = logObj.fullStack.filter(i => !i.includes('/node_modules/'));
        if (!logObj.msg) {
          logObj.msg = logObj.err.message;
        }
        delete logObj.err;
      }

      if (logObj.req) {
        logObj.req = Logger.parseReq(logObj.req);
      }

      if (this.isTransient && !this.isTransientTriggered) {
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
