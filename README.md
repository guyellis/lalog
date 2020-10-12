# lalog

Logging aggregation and distribution

## Installation

```shell
npm i lalog --save
```

## Usage

### Setup

If logging to Loggly then your Loggly token needs to be set in the `LOGGLY_TOKEN` 
environment variable.

If you want to specify a different initial logging level for your application than
the default `error` levels you can set the `LALOG_LEVEL` environment variable.

### Create a Logger

Require the `Logger` class:

```javascript
const Logger = require('lalog');
```

### Set the logging level

```javascript
Logger.setLevel('info');
```

There are 6 levels:

```javascript
trace, info, warn, error, fatal, security
```

If you do not call `setLevel(...)` then it will default to `error` and above.

`setLevel` can be used to change the log level at anytime while your app is running and it
will immediately change the level for any loggers that have been created.

### Create a logger

```javascript
const logger = Logger.create({
  serviceName: 'service-name',
  moduleName: 'module-name',
  presets: {}, // optional
  addTrackId: true, // options
});
```

or

```javascript
const logger = new Logger({
  serviceName: 'service-name',
  moduleName: 'module-name',
  presets: {}, // optional - defaults to empty object if missing or not a valid object
  addTrackId: true, // optional - defaults to false
  isTransient: true, // optional - defaults to false
});
```

Notes on create:

- `presets` is an optional object that will have its contents merged with any object that's logged. Useful for putting in data that you want logged with every message.
- If `addTrackId` is truthy then a `trackId` (uuid) will be added to `presets`.
- The `moduleName` is added to `presets` as `module`.
- If `isTransient` is set to true then all calls to logger will be saved and written in batch mode, in
sequence, to the destination if any of the log calls triggers a write. This flag is called `isTransient`
because typically you will only use it for short lived transient loggers. The typical use case is when
you attach a logger to the `req`/`request` object in a web request. You would then probably call the
logger with trace, info and warn calls that would not be written if your level is set to `error`. If
`error()` is called you would also want all the previous logs to be written so that you can see what
happened before the `error()` was called. The `isTransient` flag causes the logger to store all of 
those logs and write then in this scenario.
  - More notes on `isTransient`
  - You would almost always want to also set `trackId` to `true` when you set `isTransient` to `true`
  so that you can easily find/filter the associated log messages.
  - You don't want to use this for long lived loggers as they may accumulate too many logs (local
  memory issues) and if the log messages are too big then they may error when writing to the
  destination.
  - Possible future feature is to provide a maximum number of log messages to
  accumulate if `isTransient` is set.

### Write Log Messages

```javascript
logger.trace({
  message: 'I am a message'
});
```

There are 6 levels at which to write log messages:

```javascript
trace, info, warn, error, fatal, security
```

The log will only be written to the destination if the log level has be set at this or above.
It defaults to `error` if not set.

The only parameter you can pass to `logger.<level>()` is an object which will be written to
the destination after some modifications have been made to it:

- If the log is `error` or above then the object will be written to the destination.

### time(label) and timeEnd(label, [logObject])

`time()` and `timeEnd()` work pretty much the same as `console.time()` and `console.timeEnd()`.

`time('label')` starts the timer and `timeEnd('label')` stops the timer and writes the log.

`timeEnd()` operates at the `info` level. i.e. it will only write to the destination if the level
is set to `info` or `trace`.

`timeEnd` has the same modifiers that a created logger has inasmuch as it can be called as:

```javascript
time('label');
// do some stuff
timeEnd.warn('label');
// or
timeEnd.error('label');
```

`timeEnd()` and `timeEnd.<level>()` take an optional log object.

This allows you to do:

```javascript
try {
  logger.time('write-to-db');
  await writeToDb();
  logger.timeEnd('write-to-db');
} catch(err) {
  logger.timeEnd.error('write-to-db', { err });
}
```

This saves you from having to do a `logger.error()` and a `logger.timeEnd()` if an error is caught.
Also if the level is set to error then the timing will be captured in the event of an error 
(in addition to any extra logging data) but not in the event of normal operation because the
default level for `logger.timeEnd()` is `info`.
