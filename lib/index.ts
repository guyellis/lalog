import { v4 } from 'uuid';
import { enrichError, isObject } from './utils';

import {
  logBatch,
  logSingle,
} from './loggly-wrapper';
import {
  LaLogOptions, levels, LevelType, LogData, logDataEnriched, LogDataOut, LogFunction,
  LogPresets, ParseReqIn, ParseReqOut, ResponseWrapper, TimeLogFunction,
} from './local-types';

const errorLevel = levels.indexOf('error');

const getInitialLogLevel = (): number => {
  const laLogLevel = process.env.LALOG_LEVEL as LevelType;
  if (levels.includes(laLogLevel)) {
    return levels.indexOf(laLogLevel);
  }
  return errorLevel;
};

let currentLevelIndex = getInitialLogLevel();

export default class Logger {
  isTransient: boolean;

  logCollector: any[] | null;

  presets: LogPresets;

  tag: string;

  timeEnd: TimeLogFunction;

  trace: LogFunction;

  info: LogFunction;

  warn: LogFunction;

  error: LogFunction;

  fatal: LogFunction;

  security: LogFunction;

  time: (label: string) => void;

  timers: Record<string, number>;

  isTransientTriggered?: boolean;

  constructor(options: LaLogOptions) {
    const {
      addTrackId,
      moduleName,
      presets,
      serviceName,
      isTransient,
    } = options;

    this.isTransient = !!isTransient;

    this.logCollector = isTransient ? [] : null;

    this.presets = {
      module: moduleName,
      ...(isObject(presets) ? presets : {}),
    };

    if (addTrackId && !this.presets.trackId) {
      this.presets.trackId = v4();
    }

    this.tag = `${serviceName}-${process.env.NODE_ENV}`;

    this.timeEnd = this.writeTimeEnd.bind(this);

    // Listed like this so that Typescript can type each log level.
    // Previously this was setup using a loop but Typescript couldn't type it
    this.trace = this.write.bind(this, levels.indexOf('trace'));
    this.info = this.write.bind(this, levels.indexOf('info'));
    this.warn = this.write.bind(this, levels.indexOf('warn'));
    this.error = this.write.bind(this, levels.indexOf('error'));
    this.fatal = this.write.bind(this, levels.indexOf('fatal'));
    this.security = this.write.bind(this, levels.indexOf('security'));

    this.timers = {};
    /**
     * Start a timer log - same as console.time()
     * @param label - label to use when calling timeEnd()
     */
    this.time = (label: string): void => {
      this.timers[label] = Date.now();
    };
  }

  /**
    * Create an instance of Logger
    */
  static create(options: LaLogOptions): Logger {
    return new Logger(options);
  }

  /**
   * Get an array of all available log levels
   */
  static allLevels(): ReadonlyArray<LevelType> {
    return levels;
  }

  /**
   * Get the current log level
   */
  static getLevel(): LevelType {
    return levels[currentLevelIndex];
  }

  /**
   * Change the minimum level to write logs.
   * @param newLevelName - If falsy it will just return the current level
   * @returns The previous level
   */
  static setLevel(newLevelName?: LevelType): LevelType {
    const previousLevel = Logger.getLevel();
    if (!newLevelName) {
      return previousLevel;
    }
    const newLevelIndex = levels.indexOf(newLevelName);
    if (newLevelIndex >= 0) {
      currentLevelIndex = newLevelIndex;
    }
    return previousLevel;
  }

  /**
   * Parse the Express request (req) object for logging
   */
  static parseReq(req: ParseReqIn): ParseReqOut {
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
   */
  static formatMilliseconds(milliseconds: number): string {
    const date = new Date(0);
    date.setMilliseconds(milliseconds);
    return date.toISOString().substr(11, 12);
  }

  /**
   * Write the timer label end
   */
  writeTimeEnd(label: string, level: LevelType, extraLogDat?: LogData): Promise<any> {
    const levelIndex = levels.indexOf(level);
    const extraLogData = extraLogDat || {};
    const time = this.timers[label];
    const duration = Object.prototype.hasOwnProperty.call(this.timers, label)
      ? Logger.formatMilliseconds(Date.now() - time)
      : `Missing label "${label}" in timeEnd()\n${(new Error()).stack}`;

    let { msg } = extraLogData;
    msg = msg ? `Timer - ${msg}` : 'Timer';

    const logData = {
      ...extraLogData,
      duration,
      msg,
      timerLabel: label,
    };
    return this.write(levelIndex, logData);
  }

  /**
   * Write log to destination
   */
  async write(levelIndex: number, logData: LogData, response?: ResponseWrapper): Promise<any> {
    if (!isObject(logData)) {
      // eslint-disable-next-line no-console
      console.error(`Expecting an object in logger write method but got "${typeof logData}"`);
      return Promise.resolve();
    }

    const { req, ...rest } = logData;
    let logObj: logDataEnriched | LogDataOut = { ...this.presets, ...rest };

    if (response) {
      // If the response object has been included with the call then it means we need to
      // send an error message with an errorId.
      // Prima facie this seems like a terrible idea but it seems to work well as
      // a response can be immediately sent to the client which includes a code
      // that can be provided to the user and links back to the error log.
      const errorId = logObj.errorId || v4();
      logObj.errorId = errorId;
      const { res, code } = response;
      res.status(code).send({ errorId, success: false });
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

      logObj = enrichError(logObj);

      if (req) {
        logObj.req = Logger.parseReq(req);
      }

      if (this.logCollector !== null && !this.isTransientTriggered) {
        this.logCollector.push(logObj);
        if (levelIndex >= currentLevelIndex) {
          // Need to batch log here
          this.isTransientTriggered = true;
          await logBatch({ logObj: this.logCollector, tag: this.tag });
          this.logCollector = null; // Can GC right away now that this array is no longer needed
        }
      } else {
        return logSingle({ logObj, tag: this.tag });
      }
    }
    return Promise.resolve();
  }
}
