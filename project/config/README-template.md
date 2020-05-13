# {"gitdown": "gitinfo", "name": "name"}

[![NPM Version](http://img.shields.io/npm/v/{"gitdown": "gitinfo", "name": "name"}.svg?style=flat)](https://www.npmjs.org/package/{"gitdown": "gitinfo", "name": "name"}) [![CI](https://github.com/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/workflows/CI/badge.svg?branch=master)](https://github.com/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/actions) [![Coverage Status](https://coveralls.io/repos/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/badge.svg)](https://coveralls.io/r/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}) [![Known Vulnerabilities](https://snyk.io/test/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/badge.svg)](https://snyk.io/test/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}) [![Inline docs](http://inch-ci.org/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}.svg?branch=master)](http://inch-ci.org/github/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}) [![License](https://img.shields.io/npm/l/{"gitdown": "gitinfo", "name": "name"}.svg?style=flat)](https://github.com/{"gitdown": "gitinfo", "name": "username"}/{"gitdown": "gitinfo", "name": "name"}/blob/master/LICENSE) [![Total Downloads](https://img.shields.io/npm/dt/{"gitdown": "gitinfo", "name": "name"}.svg?style=flat)](https://www.npmjs.org/package/{"gitdown": "gitinfo", "name": "name"})

> Extend capabilities of oracledb with simplified API for quicker development.

* [Overview](#overview)
* [Usage](#usage)
  * [OracleDB](#usage-oracledb)
    * [Event: pool-created](#event-pool-created-oracledb)
    * [Event: pool-released](#event-pool-released-oracledb)
    * [Event: connection-created](#event-connection-created-oracledb)
    * [Event: connection-released](#event-connection-released-oracledb)
    * [createPool](#OracleDB-createpool)
    * [run](#OracleDB+run)
  * [Pool](#usage-pool)
    * [Event: connection-created](#Pool+Event+connection-created)
    * [Event: connection-released](#Pool+Event+connection-released)
    * [Event: release](#Pool+Event+Pool-released)
    * [getConnection](#Pool+getConnection)
    * [run](#Pool+run)
    * [parallelQuery](#Pool+parallelQuery)
    * [terminate](#Pool+terminate)
    * [close](#Pool+terminate)
  * [Connection](#usage-connection)
    * [Event: release](#event-connection-release)
    * [query](#Connection+query)
    * [insert](#Connection+insert)
    * [update](#Connection+update)
    * [queryJSON](#Connection+queryJSON)
    * [batchInsert](#Connection+batchInsert)
    * [batchUpdate](#Connection+batchUpdate)
    * [transaction](#Connection+transaction)
    * [run](#Connection+run)
    * [executeFile](#Connection+executeFile)
    * [release](#Connection+release)
    * [close](#Connection+release)
    * [rollback](#Connection+rollback)
  * [SimpleOracleDB](#usage-simple-oracledb)
    * [Event: pool-created](#event-pool-created-simpleoracledb)
    * [Event: pool-released](#event-pool-released-simpleoracledb)
    * [Event: connection-created](#event-connection-created-simpleoracledb)
    * [Event: connection-released](#event-connection-released-simpleoracledb)
    * [diagnosticInfo](#usage-diagnostic-info)
    * [enableDiagnosticInfo](#usage-enable-diagnostic-info)
  * [Extensions](#SimpleOracleDB+addExtension)
    * [connection.upsert](#usage-extension-connection.upsert)
* [Debug](#debug)
* [Installation](#installation)
* [Known Issues](#issues)
* [API Documentation](docs/api.md)
* [Contributing](.github/CONTRIBUTING.md)
* [Release History](#history)
* [License](#license)

<a name="overview"></a>
## Overview
This library enables to modify the oracledb main object, oracledb pool and oracledb connection of the [official oracle node.js driver](https://github.com/oracle/node-oracledb).<br>
The main goal is to provide an extended oracledb connection which provides more functionality for most use cases.<br>
The new functionality aim is to be simpler and more straightforward to enable quicker development.

<a name="usage"></a>
## Usage
In order to use this library, you need to either extend the main oracledb object as follows:

```js
//load the oracledb library
var oracledb = require('oracledb');

//load the simple oracledb
var SimpleOracleDB = require('simple-oracledb');

//modify the original oracledb library
SimpleOracleDB.extend(oracledb);

//from this point connections fetched via oracledb.getConnection(...) or pool.getConnection(...)
//have access to additional functionality.
oracledb.getConnection(function onConnection(error, connection) {
    if (error) {
        //handle error
    } else {
        //work with new capabilities or original oracledb capabilities
        connection.query(...);
    }
});
```

Another option is to modify your oracledb pool instance (in case the pool was created outside your code and
out of your control), as follows:

```js
//load the simple oracledb
var SimpleOracleDB = require('simple-oracledb');

function myFunction(pool) {
    //modify the original oracledb pool instance
    SimpleOracleDB.extend(pool);

    //from this point connections fetched via pool.getConnection(...)
    //have access to additional functionality.
    pool.getConnection(function onConnection(error, connection) {
        if (error) {
          //handle error
        } else {
          //work with new capabilities or original oracledb capabilities
          connection.query(...);
        }
    });
}
```

One last option is to modify your oracledb connection instance (in case the connection was created outside your code
and out of your control), as follows:

```js
//load the simple oracledb
var SimpleOracleDB = require('simple-oracledb');

function doSomething(connection, callback) {
    //modify the original oracledb connection instance
    SimpleOracleDB.extend(connection);

    //from this point the connection has access to additional functionality as well as the original oracledb capabilities.
    connection.query(...);
}
```

<a name="usage-oracledb"></a>
## Class: OracleDB

<a name="event-pool-created-oracledb"></a>
### Event: 'pool-created'

* pool - The pool instance

This events is triggered when a pool is created.

<a name="event-pool-released-oracledb"></a>
### Event: 'pool-released'

* pool - The pool instance

This events is triggered after a pool is released.

<a name="event-connection-created-oracledb"></a>
### Event: 'connection-created'

* connection - The connection instance

This events is triggered when a connection is created via oracledb.

<a name="event-connection-released-oracledb"></a>
### Event: 'connection-released'

* connection - The connection instance

This events is triggered when a connection is released successfully.

<a name="OracleDB-createpool"></a>
### 'oracledb.createPool(poolAttributes, [callback]) ⇒ [Promise]'
This function modifies the existing oracledb.createPool function by enhancing the returned pool to support retry in the getConnection function.<br>
The pool.getConnection will retry configurable amount of times with configurable interval between attempts to return a connection in the getConnection function.<br>
In case all attempts fail, the getConnection callback will receive the error object of the last attempt.

```js
oracledb.createPool({
  retryCount: 5, //The max amount of retries to get a connection from the pool in case of any error (default to 10 if not provided)
  retryInterval: 500, //The interval in millies between get connection retry attempts (defaults to 250 millies if not provided)
  runValidationSQL: true, //True to ensure the connection returned is valid by running a test validation SQL (defaults to true)
  validationSQL: 'SELECT 1 FROM DUAL', //The test SQL to invoke before returning a connection to validate the connection is open (defaults to 'SELECT 1 FROM DUAL')
  //any other oracledb pool attributes
}, function onPoolCreated(error, pool) {
  //continue flow
});
```

<a name="OracleDB+run"></a>

<a name="usage-pool"></a>
## Class: Pool

<a name="Pool+Event+connection-created"></a>
### Event: 'connection-created'

* connection - The connection instance

This events is triggered when a connection is created via pool.

<a name="Pool+Event+connection-released"></a>
### Event: 'connection-released'

* connection - The connection instance

This events is triggered when a connection is released successfully.

<a name="Pool+Event+Pool-released"></a>
### Event: 'release'

* pool - The pool instance

This events is triggered after the pool is released successfully.

<a name="Pool+getConnection"></a>

<a name="Pool+run"></a>

<a name="Pool+parallelQuery"></a>

<a name="Pool+terminate"></a>
### 'pool.terminate([callback]) ⇒ [Promise]'
### 'pool.close([callback]) ⇒ [Promise]'

<a name="usage-connection"></a>
## Class: Connection

<a name="event-connection-release"></a>
### Event: 'release'
This events is triggered when the connection is released successfully.

<a name="Connection+query"></a>

<a name="Connection+insert"></a>

<a name="Connection+update"></a>

<a name="Connection+queryJSON"></a>

<a name="Connection+batchInsert"></a>

<a name="Connection+batchUpdate"></a>

<a name="Connection+transaction"></a>

<a name="Connection+run"></a>

<a name="Connection+executeFile"></a>

<a name="Connection+release"></a>
### 'connection.release([options], [callback]) ⇒ [Promise]'
### 'connection.close([options], [callback]) ⇒ [Promise]'

<a name="Connection+rollback"></a>

<a name="usage-simple-oracledb"></a>
## Class: SimpleOracleDB

<a name="event-pool-created-simpleoracledb"></a>
### Event: 'pool-created'

* pool - The pool instance

This events is triggered when a pool is created.

<a name="event-pool-released-simpleoracledb"></a>
### Event: 'pool-released'

* pool - The pool instance

This events is triggered after a pool is released.

<a name="event-connection-created-simpleoracledb"></a>
### Event: 'connection-created'

* connection - The connection instance

This events is triggered when a connection is created via oracledb.

<a name="event-connection-released-simpleoracledb"></a>
### Event: 'connection-released'

* connection - The connection instance

This events is triggered when a connection is released successfully.

<a name="usage-diagnostic-info"></a>
### 'SimpleOracleDB.diagnosticInfo'
The pool/connection diagnostics info.<br>
This includes info of all live pools (including live time and create time) and all live connections (including parent pool if any, live time, create time and last SQL)

<a name="usage-enable-diagnostic-info"></a>
### 'SimpleOracleDB.enableDiagnosticInfo'
True if the monitoring is enabled and it will listen and store pool/connection diagnostics information.<br>
By default this is set to false.

<a name="SimpleOracleDB+addExtension"></a>

An example of an existing extension can be found at: [oracledb-upsert](https://github.com/{"gitdown": "gitinfo", "name": "username"}/oracledb-upsert) which adds the connection.upsert (insert/update) functionality.

<a name="usage-extension-connection.upsert"></a>
### 'connection.upsert(sqls, bindParams, [options], [callback]) ⇒ [Promise]'
See [oracledb-upsert](https://github.com/{"gitdown": "gitinfo", "name": "username"}/oracledb-upsert) for more info.

<br>
**The rest of the API is the same as defined in the oracledb library: https://github.com/oracle/node-oracledb/blob/master/doc/api.md**

<a name="debug"></a>
## Debug
In order to turn on debug messages, use the standard nodejs NODE_DEBUG environment variable.

````ini
NODE_DEBUG={"gitdown": "gitinfo", "name": "name"}
````

<a name="installation"></a>
## Installation
In order to use this library, just run the following npm install command:

```sh
npm install --save {"gitdown": "gitinfo", "name": "name"}
```

This library doesn't define oracledb as a dependency and therefore it is not installed when installing {"gitdown": "gitinfo", "name": "name"}.<br>
You should define oracledb in your package.json and install it based on the oracledb installation instructions found at: [installation guide](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md)

<a name="issues"></a>
## Known Issues

* oracledb version 1.7.0 breaks the API and prevents the library from being extended. This was fixed in oracledb 1.7.1 ([oracledb case](https://github.com/oracle/node-oracledb/issues/369))

{"gitdown": "include", "file": "./README-footer-template.md"}
