const _ = require('lodash');
const debug = require('debug');
const loggly = require('./loggly-wrapper');
const uuid = require('uuid');

/*
Winston Errors:

{
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}
*/

const levels = ['trace', 'info', 'warn', 'error', 'fatal', 'security'];
const winstonLevels = ['silly', 'info', 'warn', 'error', 'error', 'error'];
const errorLevel = levels.indexOf('error');

let currentLevelIndex = levels.indexOf('error');

class Logger {
  constructor(serviceName, logName) {
    this.debug = debug(`${serviceName}:${logName}`);
    this.name = logName;

    // Setup timeEnd so that it can be called without a level and when that happens the
    // level will default to info:
    const defaultTimeEndLevel = levels.indexOf('info');
    this.timeEnd = this.writeTimeEnd.bind(this, defaultTimeEndLevel);

    levels.forEach((level, index) => {
      this[level] = this.write.bind(this, index);
      this.timeEnd[level] = this.writeTimeEnd.bind(this, index);
    });
    this.loggly = loggly(serviceName);
    this.timers = {};
    this.time = (label) => {
      this.timers[label] = Date.now();
    };
  }

  static create(serviceName, logName) {
    return new Logger(serviceName, logName);
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

    const logData = Object.assign({}, extraLogData, {
      msg: 'Timer',
      timerLabel: label,
      duration,
    });
    return this.write(levelIndex, logData);
  }

  /**
   * Log to loggly or other destination via Winston
   * @param {Number} levelIndex - severity of error
   * @param {Object} logObj - the object to log
   * @param {Object} response - the Express response object and status to send a canned error
   * @returns {Promise} - a promise
   */
  write(levelIndex, logData, response) {
    if (!_.isObject(logData)) {
      // eslint-disable-next-line no-console
      console.error(`Expecting an object in logger write method but got "${typeof logData}"`);
      return Promise.resolve();
    }

    const logObj = Object.assign({}, logData);
    if (response) {
      // If the response object has been included with the call then it means we need to
      // send an error message with an errorId.
      // Prima facie this seems like a terrible idea but it seems to work well as
      // a response can be immediately sent to the client which includes a code
      // that can be provided to the user and links back to the error log.
      const errorId = uuid.v4();
      logObj.errorId = errorId;
      const { res, code } = response;
      res.status(code).send({ success: false, errorId });
    }

    if (levelIndex >= currentLevelIndex) {
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

      this.debug(logObj);
      return this.loggly(winstonLevels[levelIndex], logObj);
    }
    return Promise.resolve();
  }
}

module.exports = Logger;
