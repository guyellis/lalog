// Type definitions for lalog 0.7.0
// Project: https://github.com/guyellis/lalog
// Definitions by: Guy Ellis <https://github.com/guyellis>
// Definitions: https://github.com/guyellis/lalog/typings.d.ts

export = lalog;

declare namespace lalog {
    type LevelEnum =
      'trace'|
      'info'|
      'warn'|
      'error'|
      'fatal'|
      'security';

    export interface LogPresets {
    //   trackId?: string;
      [key: string]: string;
    }
    export interface LogOptions {
        addTrackId?: boolean;
        moduleName?: string;
        presets?: LogPresets;
        serviceName?: string;
        isTransient?: boolean;
    }

    interface LoggerMethods {
        trace: (logObj: object) => Promise<undefined>;
        info: (logObj: object) => Promise<undefined>;
        warn: (logObj: object) => Promise<undefined>;
        error: (logObj: object) => Promise<undefined>;
        fatal: (logObj: object) => Promise<undefined>;
        security: (logObj: object) => Promise<undefined>;
    }

    interface LoggerTimeEnd extends LoggerMethods {
        (label: string, extraLogData?: object): Promise<undefined>;
    }

    export interface Logger extends LoggerMethods {
        time: (label: string) => void;
        timeEnd: LoggerTimeEnd;
    }
}
