# lalog

[![Greenkeeper badge](https://badges.greenkeeper.io/guyellis/lalog.svg)](https://greenkeeper.io/)

Logging aggregation and distribution

## Installation

```
npm i lalog --save
```

## Usage

### Setup

If logging to Loggly then these environment variables need to be set:

```
process.env.LOGGLY_TOKEN
process.env.LOGGLY_SUBDOMAIN
```

### Create a Logger

Require the `Logger` class:

```
const Logger = require('lalog');
```

Create a logger:

```
const logger = Logger.create({
  serviceName: 'service-name',
  moduleName: 'module-name',
});
```

or

```
const logger = new Logger({
  serviceName: 'service-name',
  moduleName: 'module-name',
});
```

`lalog` uses `debug` as one of its destinations. The `serviceName` and `moduleName` props allow
you to filter `debug` messages.

### Write Log Messages

```
logger.trace({
  message: 'I am a message'
});
```


