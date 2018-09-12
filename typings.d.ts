// Type definitions for lalog 0.6.1
// Project: https://github.com/guyellis/lalog
// Definitions by: Guy Ellis <https://github.com/guyellis>

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = LaLog;

/*~ Write your module's methods and properties in this class */
declare class LaLog {
    constructor(options: LaLog.LogOptions);

    // Static methods
    create: (options: LaLog.LogOptions) => LaLog;
    setLevel: (level: LaLog.LevelEnum) => LaLog.LevelEnum;
    getLevel: () => LaLog.LevelEnum;
    allLevels: () => Array<LaLog.LevelEnum>;

    // Instance methods
    time: (label: string) => void;
    // TODO: timeEnd has all the log methods on it.
    timeEnd: (label: string, extraLogData?: object) => Promise<undefined>;
    trace: (logObj: object) => Promise<undefined>;
    info: (logObj: object) => Promise<undefined>;
    warn: (logObj: object) => Promise<undefined>;
    error: (logObj: object) => Promise<undefined>;
    fatal: (logObj: object) => Promise<undefined>;
    security: (logObj: object) => Promise<undefined>;
}

declare namespace LaLog {
    type LevelEnum =
      'trace'|
      'info'|
      'warn'|
      'error'|
      'fatal'|
      'security';

    export interface LogPresets {
      [key: string]: string;
    }
    
    export interface LogOptions {
        addTrackId?: boolean;
        moduleName?: string;
        presets?: LogPresets;
        serviceName?: string;
        isTransient?: boolean;
    }
}
