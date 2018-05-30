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
const logger = Logger.create('service-name', 'module-name');
```

or

```
const logger = new Logger('service-name', 'module-name');
```

`lalog` uses `debug` as one of its destinations. The `service-name` and `module-name` allow you
to filter `debug` messages.

### Write Log Messages

```
logger.trace({
  message: 'I am a message'
});
```


