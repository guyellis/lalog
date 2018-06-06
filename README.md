# lalog

[![Greenkeeper badge](https://badges.greenkeeper.io/guyellis/lalog.svg)](https://greenkeeper.io/)

Logging aggregation and distribution

## Installation

```shell
npm i lalog --save
```

## Usage

### Setup

If logging to Loggly then this environment variable needs to be set:

```javascript
process.env.LOGGLY_TOKEN
```

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
  presets: {}, // optional
  addTrackId: true, // options
});
```

Notes on create:

- `lalog` uses `debug` as one of its destinations. The `serviceName` and `moduleName` props allow
you to filter `debug` messages. A `debug` name of the form `serviceName:moduleName` will be created
which can be used for debugging.
- `presets` is an optional object that will have its contents merged with any object that's logged. Useful for putting in data that you want logged with every message.
- If `addTrackId` is truthy then a `trackId` (uuid) will be added to `presets`.
- The `moduleName` is added to `presets` as `module`.

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
