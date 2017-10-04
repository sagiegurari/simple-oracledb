# simple-oracledb

[![NPM Version](http://img.shields.io/npm/v/simple-oracledb.svg?style=flat)](https://www.npmjs.org/package/simple-oracledb) [![Build Status](https://travis-ci.org/sagiegurari/simple-oracledb.svg)](http://travis-ci.org/sagiegurari/simple-oracledb) [![Coverage Status](https://coveralls.io/repos/sagiegurari/simple-oracledb/badge.svg)](https://coveralls.io/r/sagiegurari/simple-oracledb) [![bitHound Code](https://www.bithound.io/github/sagiegurari/simple-oracledb/badges/code.svg)](https://www.bithound.io/github/sagiegurari/simple-oracledb) [![Inline docs](http://inch-ci.org/github/sagiegurari/simple-oracledb.svg?branch=master)](http://inch-ci.org/github/sagiegurari/simple-oracledb)<br>
[![License](https://img.shields.io/npm/l/simple-oracledb.svg?style=flat)](https://github.com/sagiegurari/simple-oracledb/blob/master/LICENSE) [![Total Downloads](https://img.shields.io/npm/dt/simple-oracledb.svg?style=flat)](https://www.npmjs.org/package/simple-oracledb) [![Dependency Status](https://david-dm.org/sagiegurari/simple-oracledb.svg)](https://david-dm.org/sagiegurari/simple-oracledb) [![devDependency Status](https://david-dm.org/sagiegurari/simple-oracledb/dev-status.svg)](https://david-dm.org/sagiegurari/simple-oracledb?type=dev)<br>
[![Known Vulnerabilities](https://snyk.io/test/github/sagiegurari/simple-oracledb/badge.svg)](https://snyk.io/test/github/sagiegurari/simple-oracledb) [![Retire Status](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/simple-oracledb/master/package.json)](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/simple-oracledb/master/package.json)

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
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'oracledb.run(connectionAttributes, action, [callback]) ⇒ [Promise]'
This function invokes the provided action (function) with a valid connection object and a callback.<br>
The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
must call the callback with an error (if any) and result.<br>
For promise support, the action can simply return a promise instead of calling the provided callback.<br>
This function will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.<br>
It is recommanded to create a pool and use the pool.run instead of oracledb.run as this function will create a new connection (and release it) for each invocation,
on the other hand, pool.run will reuse pool managed connections which will result in improved performance.

**Example**  
```js
oracledb.run({
 user: process.env.ORACLE_USER,
 password: process.env.ORACLE_PASSWORD,
 connectString: process.env.ORACLE_CONNECTION_STRING
}, function onConnection(connection, callback) {
  //run some query and the output will be available in the 'run' callback
  connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], callback);
}, function onActionDone(error, result) {
  //do something with the result/error
});

oracledb.run({
 user: process.env.ORACLE_USER,
 password: process.env.ORACLE_PASSWORD,
 connectString: process.env.ORACLE_CONNECTION_STRING
}, function (connection, callback) {
  //run some database operations in a transaction
  connection.transaction([
    function firstAction(callback) {
      connection.insert(...., callback);
    },
    function secondAction(callback) {
      connection.update(...., callback);
    }
  ], {
    sequence: true
  }, callback); //at end of transaction, call the oracledb provided callback
}, function onActionDone(error, result) {
  //do something with the result/error
});

//full promise support for both oracledb.run and the action
oracledb.run({
 user: process.env.ORACLE_USER,
 password: process.env.ORACLE_PASSWORD,
 connectString: process.env.ORACLE_CONNECTION_STRING
}, function (connection) {
  //run some database operations in a transaction and return a promise
  return connection.transaction([
    function firstAction() {
      return connection.insert(....); //returns a promise
    },
    function secondAction() {
      return connection.update(....); //returns a promise
    }
  ]);
}).then(function (result) {
  //do something with the result
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

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
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'pool.getConnection([callback]) ⇒ [Promise]'
Wraps the original oracledb getConnection in order to provide an extended connection object.<br>
In addition, this function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
See [getConnection](https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool) for official API details.<br>
See [createPool](https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool) for extended createPool API details.

**Example**  
```js
oracledb.createPool({
  retryCount: 5, //The max amount of retries to get a connection from the pool in case of any error (default to 10 if not provided)
  retryInterval: 500, //The interval in millies between get connection retry attempts (defaults to 250 millies if not provided)
  runValidationSQL: true, //True to ensure the connection returned is valid by running a test validation SQL (defaults to true)
  validationSQL: 'SELECT 1 FROM DUAL', //The test SQL to invoke before returning a connection to validate the connection is open (defaults to 'SELECT 1 FROM DUAL')
  //any other oracledb pool attributes
}, function onPoolCreated(error, pool) {
  pool.getConnection(function onConnection(poolError, connection) {
    //continue flow (connection, if provided, has been tested to ensure it is valid)
  });
});

//another example but with promise support
oracledb.createPool({
  retryCount: 5, //The max amount of retries to get a connection from the pool in case of any error (default to 10 if not provided)
  retryInterval: 500, //The interval in millies between get connection retry attempts (defaults to 250 millies if not provided)
  runValidationSQL: true, //True to ensure the connection returned is valid by running a test validation SQL (defaults to true)
  validationSQL: 'SELECT 1 FROM DUAL', //The test SQL to invoke before returning a connection to validate the connection is open (defaults to 'SELECT 1 FROM DUAL')
  //any other oracledb pool attributes
}).then(function onPoolCreated(pool) {
  pool.getConnection(function onConnection(poolError, connection) {
    //continue flow (connection, if provided, has been tested to ensure it is valid)
  });
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Pool+run"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'pool.run(action, [options], [callback]) ⇒ [Promise]'
This function invokes the provided action (function) with a valid connection object and a callback.<br>
The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
must call the callback with an error (if any) and result.<br>
For promise support, the action can simply return a promise instead of calling the provided callback.<br>
The pool will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.<br>
For extended promise support, the action provided can return a promise instead of calling the provided callback (see examples).

**Example**  
```js
pool.run(function (connection, callback) {
  //run some query and the output will be available in the 'run' callback
  connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], callback);
}, function onActionDone(error, result) {
  //do something with the result/error
});

pool.run(function (connection, callback) {
  //run some database operations in a transaction
  connection.transaction([
    function firstAction(callback) {
      connection.insert(...., callback);
    },
    function secondAction(callback) {
      connection.update(...., callback);
    }
  ], {
    sequence: true
  }, callback); //at end of transaction, call the pool provided callback
}, {
  ignoreReleaseErrors: false //enable/disable ignoring any release error (default not to ignore)
}, function onActionDone(error, result) {
  //do something with the result/error
});

//another example but with promise support
pool.run(function (connection, callback) {
  //run some query and the output will be available in the 'run' promise 'then'
  connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], callback);
}).then(function onActionDone(result) {
  //do something with the result
});

//extended promise support (action is returning a promise instead of using the callback)
pool.run(function (connection) {
  //run some query and the output will be available in the 'run' promise 'then'
  return connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110]); //no need for a callback, instead return a promise
}).then(function onActionDone(result) {
  //do something with the result
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Pool+parallelQuery"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'pool.parallelQuery(querySpec, [options], [callback]) ⇒ [Promise]'
This function invokes the requested queries in parallel (limiting it based on the amount of node.js thread pool size).<br>
In order for the queries to run in parallel, multiple connections will be used so use this with caution.

**Example**  
```js
pool.parallelQuery([
  {
    sql: 'SELECT department_id, department_name FROM departments WHERE manager_id = :id',
    bindParams: [100],
    options: {
      //any options here
    }
  },
  {
    sql: 'SELECT * FROM employees WHERE manager_id = :id',
    bindParams: {
      id: 100
    }
  }
], function onQueriesDone(error, results) {
  //do something with the result/error
  var query1Results = results[0];
  var query2Results = results[1];
});

//another example but with promise support
pool.parallelQuery([
  {
    sql: 'SELECT department_id, department_name FROM departments WHERE manager_id = :id',
    bindParams: [100],
    options: {
      //any options here
    }
  },
  {
    sql: 'SELECT * FROM employees WHERE manager_id = :id',
    bindParams: {
      id: 100
    }
  }
]).then(function onQueriesDone(results) {
  //do something with the result
  var query1Results = results[0];
  var query2Results = results[1];
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Pool+terminate"></a>
### 'pool.terminate([callback]) ⇒ [Promise]'
### 'pool.close([callback]) ⇒ [Promise]'
<!-- markdownlint-disable MD009 MD031 MD036 -->
This function modifies the existing pool.terminate function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.<br>
The pool.terminate also has an alias pool.close for consistent close function naming to all relevant objects.

**Example**  
```js
pool.terminate(); //no callback needed

//still possible to call with a terminate callback function
pool.terminate(function onTerminate(error) {
  if (error) {
    //now what?
  }
});

//can also use close
pool.close();
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="usage-connection"></a>
## Class: Connection

<a name="event-connection-release"></a>
### Event: 'release'
This events is triggered when the connection is released successfully.

<a name="Connection+query"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.query(sql, [bindParams], [options], [callback]) ⇒ [ResultSetReadStream] \| [Promise]'
Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
All LOBs will be read and all rows will be fetched.<br>
This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
The function arguments used to execute the 'query' are exactly as defined in the oracledb connection.execute function.

**Example**  
```js
//read all rows and get an array of objects with all data
connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], function onResults(error, results) {
  if (error) {
    //handle error...
  } else {
    //print the 4th row DEPARTMENT_ID column value
    console.log(results[3].DEPARTMENT_ID);
  }
});

//same as previous example but with promise support
connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110]).then(function (results) {
  //print the 4th row DEPARTMENT_ID column value
  console.log(results[3].DEPARTMENT_ID);
});

//In order to split results into bulks, you can provide the splitResults = true option.
//The callback will be called for each bulk with array of objects.
//Once all rows are read, the callback will be called with an empty array.
connection.query('SELECT * FROM departments WHERE manager_id > :id', [110], {
  splitResults: true,
  bulkRowsAmount: 100 //The amount of rows to fetch (for splitting results, that is the max rows that the callback will get for each callback invocation)
}, function onResults(error, results) {
  if (error) {
    //handle error...
  } else if (results.length) {
    //handle next bulk of results
  } else {
    //all rows read
  }
});

//In order to stream results into a read stream, you can provide the streamResults = true option.
//The optional callback will be called with a read stream instance which can be used to fetch/pipe the data.
//Once all rows are read, the proper stream events will be called.
var stream = connection.query('SELECT * FROM departments WHERE manager_id > :id', [110], {
  streamResults: true
});

//listen to fetched rows via data event or just pipe to another handler
stream.on('data', function (row) {
  //use row object

  if (row.MY_ID === 800) {
    stream.close(); //optionally call the close function to prevent any more 'data' events and free the connection to execute other operations
  }
});

//optionally listen also to metadata of query
stream.on('metadata', function (metaData) {
  console.log(metaData);
});

//listen to other events such as end/close/error....
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+insert"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.insert(sql, [bindParams], [options], [callback]) ⇒ [Promise]'
Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Example**  
```js
connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
  id: 110,
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}, function onResults(error, output) {
  //continue flow...
});

//add few more items to the RETURNING clause (only used if lobMetaInfo is provided)
connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:myid, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
  myid: {
    type: oracledb.NUMBER,
    dir: oracledb.BIND_INOUT,
    val: 1234
  },
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  },
  returningInfo: { //all items in this column/bind variable object will be added to the generated RETURNING clause
    id: 'myid'
  }
}, function onResults(error, output) {
  //continue flow...
});

//another example but with promise support
connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
  id: 110,
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}).then(function (results) {
  console.log(results.rowsAffected);
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+update"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.update(sql, [bindParams], [options], [callback]) ⇒ [Promise]'
Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Example**  
```js
connection.update('UPDATE mylobs SET name = :name, clob_column1 = EMPTY_CLOB(), blob_column2 = EMPTY_BLOB() WHERE id = :id', { //no need to specify the RETURNING clause in the SQL
  id: 110,
  name: 'My Name',
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}, function onResults(error, output) {
  //continue flow...
});

//another example but with promise support
connection.update('UPDATE mylobs SET name = :name, clob_column1 = EMPTY_CLOB(), blob_column2 = EMPTY_BLOB() WHERE id = :id', { //no need to specify the RETURNING clause in the SQL
  id: 110,
  name: 'My Name',
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}).then(function (results) {
  console.log(results.rowsAffected);
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+queryJSON"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.queryJSON(sql, [bindParams], [options], [callback]) ⇒ [Promise]'
This function will invoke the provided SQL SELECT and return a results object with the returned row count and the JSONs.<br>
The json property will hold a single JSON object in case the returned row count is 1, and an array of JSONs in case the row count is higher.<br>
The query expects that only 1 column is fetched and if more are detected in the results, this function will return an error in the callback.<br>
The function arguments used to execute the 'queryJSON' are exactly as defined in the oracledb connection.execute function.

**Example**  
```js
connection.queryJSON('SELECT JSON_DATA FROM APP_CONFIG WHERE ID > :id', [110], function onResults(error, results) {
  if (error) {
    //handle error...
  } else if (results.rowCount === 1) { //single JSON is returned
    //print the JSON
    console.log(results.json);
  } else if (results.rowCount > 1) { //multiple JSONs are returned
    //print the JSON
    results.json.forEach(function printJSON(json) {
      console.log(json);
    });
  } else {
    console.log('Did not find any results');
  }
});

//another example but with promise support
connection.queryJSON('SELECT JSON_DATA FROM APP_CONFIG WHERE ID > :id', [110]).then(function (results) {
  if (results.rowCount === 1) { //single JSON is returned
    //print the JSON
    console.log(results.json);
  } else if (results.rowCount > 1) { //multiple JSONs are returned
    //print the JSON
    results.json.forEach(function printJSON(json) {
      console.log(json);
    });
  }
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+batchInsert"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.batchInsert(sql, bindParamsArray, options, [callback]) ⇒ [Promise]'
Enables to run an INSERT SQL statement multiple times for each of the provided bind params.<br>
This allows to insert to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

**Example**  
```js
connection.batchInsert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', [ //no need to specify the RETURNING clause in the SQL
  { //first row values
    id: 110,
    clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
    blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
  },
  { //second row values
    id: 111,
    clobText1: 'second row',
    blobBuffer2: new Buffer('second rows')
  }
], {
  autoCommit: true, //must be set to true in options to support auto commit after insert is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}, function onResults(error, output) {
  //continue flow...
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+batchUpdate"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.batchUpdate(sql, bindParamsArray, options, [callback]) ⇒ [Promise]'
Enables to run an UPDATE SQL statement multiple times for each of the provided bind params.<br>
This allows to update to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

**Example**  
```js
connection.batchUpdate('UPDATE mylobs SET name = :name, clob_column1 = EMPTY_CLOB(), blob_column2 = EMPTY_BLOB() WHERE id = :id', [ //no need to specify the RETURNING clause in the SQL
  { //first row values
    id: 110,
    clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
    blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
  },
  { //second row values
    id: 111,
    clobText1: 'second row',
    blobBuffer2: new Buffer('second rows')
  }
], {
  autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}, function onResults(error, output) {
  //continue flow...
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+transaction"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.transaction(actions, [options], [callback]) ⇒ [Promise]'
Enables to run multiple oracle operations in a single transaction.<br>
This function basically allows to automatically commit or rollback once all your actions are done.<br>
Actions are basically javascript functions which get a callback when invoked, and must call that callback with error or result.<br>
For promise support, actions can simply return a promise instead of using the provided callback.<br>
All provided actions are executed in sequence unless options.sequence=false is provided (parallel invocation is only for IO operations apart of the oracle driver as the driver will queue operations on same connection).<br>
Once all actions are done, in case of any error in any action, a rollback will automatically get invoked, otherwise a commit will be invoked.<br>
Once the rollback/commit is done, the provided callback will be invoked with the error (if any) and results of all actions.<br>
When calling any connection operation (execute, insert, update, ...) the connection will automatically set the autoCommit=false and will ignore the value provided.<br>
This is done to prevent commits in the middle of the transaction.<br>
In addition, you can not start a transaction while another transaction is in progress.

**Example**  
```js
//run all actions in parallel
connection.transaction([
  function insertSomeRows(callback) {
    connection.insert(...., function (error, results) {
      //some more inserts....
      connection.insert(...., callback);
    });
  },
  function insertSomeMoreRows(callback) {
    connection.insert(...., callback);
  },
  function doSomeUpdates(callback) {
    connection.update(...., callback);
  },
  function runBatchUpdates(callback) {
    connection.batchUpdate(...., callback);
  }
], {
  sequence: false
}, function onTransactionResults(error, output) {
  //continue flow...
});

//run all actions in sequence
connection.transaction([
  function firstAction(callback) {
    connection.insert(...., callback);
  },
  function secondAction(callback) {
    connection.update(...., callback);
  }
], {
  sequence: true
}, function onTransactionResults(error, output) {
  //continue flow...
});

//another example but with promise support
connection.transaction([
  function firstAction(callback) {
    connection.insert(...., callback);
  },
  function secondAction(callback) {
    connection.update(...., callback);
  }
], {
  sequence: true
}).then(function onTransactionResults(output) {
  //continue flow...
});

//actions can return a promise instead of using callback (you can mix actions to either use callback or return a promise)
connection.transaction([
  function firstAction() {
    return connection.insert(....); //return a promise
  },
  function secondAction() {
    return connection.update(....); //return a promise
  }
], {
  sequence: true
}).then(function onTransactionResults(output) {
  //continue flow...
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+run"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.run(actions, [options], [callback]) ⇒ [Promise]'
Enables to run multiple oracle operations in sequence or parallel.<br>
Actions are basically javascript functions which get a callback when invoked, and must call that callback with error or result.<br>
For promise support, actions can simply return a promise instead of using the provided callback.<br>
All provided actions are executed in sequence unless options.sequence=false is provided (parallel invocation is only for IO operations apart of the oracle driver as the driver will queue operations on same connection).<br>
This function is basically the same as connection.transaction with few exceptions<br>
<ul>
  <li>This function will <b>not</b> auto commit/rollback or disable any commits/rollbacks done by the user</li>
  <li>You can invoke connection.run inside connection.run as many times as needed (for example if you execute connection.run with option.sequence=false meaning parallel and inside invoke connection.run with option.sequence=true for a subset of operations)</li>
</ul>

**Example**  
```js
//run all actions in parallel
connection.run([
  function insertSomeRows(callback) {
    connection.insert(...., function (error, results) {
      //some more inserts....
      connection.insert(...., callback);
    });
  },
  function insertSomeMoreRows(callback) {
    connection.insert(...., callback);
  },
  function doSomeUpdates(callback) {
    connection.update(...., callback);
  },
  function runBatchUpdates(callback) {
    connection.batchUpdate(...., callback);
  }
], {
  sequence: false
}, function onActionsResults(error, output) {
  //continue flow...
});

//run all actions in sequence
connection.run([
  function firstAction(callback) {
    connection.insert(...., callback);
  },
  function secondAction(callback) {
    connection.update(...., callback);
  }
], {
  sequence: true
}, function onActionsResults(error, output) {
  //continue flow...
});

//run some actions in sequence and a subset in parallel
connection.run([
  function firstAction(callback) {
    connection.insert(...., callback);
  },
  function secondAction(callback) {
    connection.update(...., callback);
  },
  function subsetInParallel(callback) {
    //run all actions in parallel
    connection.run([
      function insertSomeRows(subsetCallback) {
        connection.insert(...., function (error, results) {
          //some more inserts....
          connection.insert(...., subsetCallback);
        });
      },
      function insertSomeMoreRows(subsetCallback) {
        connection.insert(...., subsetCallback);
      },
      function doSomeUpdates(subsetCallback) {
        connection.update(...., subsetCallback);
      },
      function runBatchUpdates(subsetCallback) {
        connection.batchUpdate(...., subsetCallback);
      }
    ], {
      sequence: false
    }, callback); //all parallel actions done, call main callback
  }
], {
  sequence: true
}, function onActionsResults(error, output) {
  //continue flow...
});

//another example but with promise support
connection.run([
  function firstAction(callback) {
    connection.insert(...., callback);
  },
  function secondAction(callback) {
    connection.update(...., callback);
  }
], {
  sequence: true
}).then(function onActionsResults(output) {
  //continue flow...
});

//actions can return a promise instead of using callback (you can mix actions to either use callback or return a promise)
connection.run([
  function firstAction() {
    return connection.insert(....); //return a promise
  },
  function secondAction() {
    return connection.update(....); //return a promise
  }
], {
  sequence: true
}).then(function onActionsResults(output) {
  //continue flow...
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+executeFile"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.executeFile(file, [options], [callback]) ⇒ [Promise]'
Reads the sql string from the provided file and executes it.<br>
The file content must be a single valid SQL command string.<br>
This function is basically a quick helper to reduce the coding needed to read the sql file.

**Example**  
```js
connection.executeFile('./populate_table.sql', function onResults(error, results) {
  if (error) {
    //handle error...
  } else {
    //continue
  }
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+release"></a>
### 'connection.release([options], [callback]) ⇒ [Promise]'
### 'connection.close([options], [callback]) ⇒ [Promise]'
<!-- markdownlint-disable MD009 MD031 MD036 -->
This function modifies the existing connection.release function by enabling the input
callback to be an optional parameter and providing ability to auto retry in case of any errors during release.<br>
The connection.release also has an alias connection.close for consistent close function naming to all relevant objects.

**Example**  
```js
connection.release(); //no callback needed

//still possible to call with a release callback function
connection.release(function onRelease(error) {
  if (error) {
    //now what?
  }
});

//retry release in case of errors is enabled if options are provided
connection.release({
  retryCount: 20, //retry max 20 times in case of errors (default is 10 if not provided)
  retryInterval: 1000 //retry every 1 second (default is 250 millies if not provided)
});

//you can provide both retry options and callback (callback will be called only after all retries are done or in case connection was released)
connection.release({
  retryCount: 10,
  retryInterval: 250,
  force: true //break any running operation before running release
}, function onRelease(error) {
  if (error) {
    //now what?
  }
});

//can also use close instead of release
connection.close({
  retryCount: 10,
  retryInterval: 250
}, function onRelease(error) {
  if (error) {
    //now what?
  }
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

<a name="Connection+rollback"></a>
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'connection.rollback([callback]) ⇒ [Promise]'
This function modifies the existing connection.rollback function by enabling the input
callback to be an optional parameter.<br>
If rollback fails, you can't really rollback again the data, so the callback is not always needed.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

**Example**  
```js
connection.rollback(); //no callback needed

//still possible to call with a rollback callback function
connection.rollback(function onRollback(error) {
  if (error) {
    //now what?
  }
});
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

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
<!-- markdownlint-disable MD009 MD031 MD036 -->
### 'SimpleOracleDB.addExtension(type, name, extension, [options]) ⇒ Boolean'
Adds an extension to all newly created objects of the requested type.<br>
An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
This function enables external libraries to further extend oracledb using a very simple API and without the need to wrap the pool/connection creation functions.<br>
Extension functions automatically get promisified unless specified differently in the optional options.

**Example**  
```js
//define a new function for all new connection objects called 'myConnFunc' which accepts 2 arguments
SimpleOracleDB.addExtension('connection', 'myConnFunc', function (myParam1, myParam2, callback) {
  //implement some custom functionality...

  callback();
});

//get connection (via oracledb directly or via pool) and start using the new function
connection.myConnFunc('test', 123, function () {
  //continue flow...
});

//extensions are automatically promisified (can be disabled) so you can also run extension functions without callback
var promise = connection.myConnFunc('test', 123);
promise.then(function () {
  //continue flow...
}).catch(function (error) {
  //got some error...
});

//define a new function for all new pool objects called 'myPoolFunc'
SimpleOracleDB.addExtension('pool', 'myPoolFunc', function () {
  //implement some custom functionality
});

//get pool and start using the new function
pool.myPoolFunc();
```
<!-- markdownlint-enable MD009 MD031 MD036 -->

An example of an existing extension can be found at: [oracledb-upsert](https://github.com/sagiegurari/oracledb-upsert) which adds the connection.upsert (insert/update) functionality.

<a name="usage-extension-connection.upsert"></a>
### 'connection.upsert(sqls, bindParams, [options], [callback]) ⇒ [Promise]'
See [oracledb-upsert](https://github.com/sagiegurari/oracledb-upsert) for more info.

<br>
**The rest of the API is the same as defined in the oracledb library: https://github.com/oracle/node-oracledb/blob/master/doc/api.md**

<a name="debug"></a>
## Debug
In order to turn on debug messages, use the standard nodejs NODE_DEBUG environment variable.

````ini
NODE_DEBUG=simple-oracledb
````

<a name="installation"></a>
## Installation
In order to use this library, just run the following npm install command:

```sh
npm install --save simple-oracledb
```

This library doesn't define oracledb as a dependency and therefore it is not installed when installing simple-oracledb.<br>
You should define oracledb in your package.json and install it based on the oracledb installation instructions found at: [installation guide](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md)

<a name="issues"></a>
## Known Issues

* oracledb version 1.7.0 breaks the API and prevents the library from being extended. This was fixed in oracledb 1.7.1 ([oracledb case](https://github.com/oracle/node-oracledb/issues/369))

## API Documentation
See full docs at: [API Docs](docs/api.md)

## Contributing
See [contributing guide](.github/CONTRIBUTING.md)

<a name="history"></a>
## Release History

| Date        | Version | Description |
| ----------- | ------- | ----------- |
| 2017-10-04  | v1.1.86 | Maintenance |
| 2017-01-20  | v1.1.57 | connection.run, connection.transaction and oracledb.run actions can now return a promise instead of using a callback |
| 2017-01-14  | v1.1.56 | pool.run actions now can return a promise instead of using a callback |
| 2017-01-13  | v1.1.55 | Maintenance |
| 2016-12-28  | v1.1.50 | Added pool.parallelQuery which enables parallel queries using multiple connections |
| 2016-12-20  | v1.1.49 | Maintenance |
| 2016-11-15  | v1.1.41 | Added connection.executeFile to read SQL statement from file and execute it |
| 2016-11-05  | v1.1.40 | Maintenance |
| 2016-10-07  | v1.1.26 | Added oracledb.run |
| 2016-10-06  | v1.1.25 | Maintenance |
| 2016-08-15  | v1.1.2  | Added 'metadata' event for connection.query with streaming |
| 2016-08-15  | v1.1.1  | Maintenance |
| 2016-08-10  | v1.1.0  | Breaking change connection.run and connection.transaction default is now sequence instead of parallel |
| 2016-08-09  | v1.0.2  | Added connection.run |
| 2016-08-09  | v1.0.1  | Maintenance |
| 2016-08-07  | v0.1.98 | NODE_DEBUG=simple-oracledb will now also log all SQL statements and bind params for the connection.execute function |
| 2016-08-05  | v0.1.97 | Maintenance |
| 2016-08-05  | v0.1.96 | Extensions are now automatically promisified |
| 2016-08-05  | v0.1.95 | Added promise support for all library APIs |
| 2016-08-03  | v0.1.94 | Maintenance |
| 2016-07-26  | v0.1.84 | Add integration test via docker |
| 2016-07-24  | v0.1.83 | Add support for node-oracledb promise |
| 2016-07-23  | v0.1.82 | Maintenance |
| 2016-07-17  | v0.1.80 | Add support for node-oracledb promise |
| 2016-07-14  | v0.1.79 | Fixed possible max stack size error |
| 2016-07-13  | v0.1.78 | Maintenance |
| 2016-05-01  | v0.1.57 | Added the new monitor (SimpleOracleDB.diagnosticInfo and SimpleOracleDB.enableDiagnosticInfo) and SimpleOracleDB is now an event emitter |
| 2016-04-27  | v0.1.54 | Maintenance |
| 2016-03-31  | v0.1.51 | Added new stream.close function to stop streaming data and free the connection for more operations |
| 2016-03-09  | v0.1.50 | Maintenance |
| 2016-03-03  | v0.1.40 | Connection and Pool are now event emitters |
| 2016-03-02  | v0.1.39 | Maintenance |
| 2016-03-02  | v0.1.38 | Added new force option for connection.release/close |
| 2016-02-28  | v0.1.37 | Added SimpleOracleDB.addExtension which allows to further extend oracledb |
| 2016-02-28  | v0.1.36 | Maintenance |
| 2016-02-22  | v0.1.32 | Added new pool.run operation |
| 2016-02-21  | v0.1.31 | Maintenance |
| 2016-02-16  | v0.1.29 | new optional options.returningInfo to insert/update/batch to enable to modify the returning/into clause when using LOBs |
| 2016-02-16  | v0.1.28 | Maintenance |
| 2016-02-12  | v0.1.26 | Added sequence option for connection.transaction and added pool.close=pool.terminate, connection.close=connection.release aliases |
| 2016-02-11  | v0.1.25 | Maintenance |
| 2016-02-10  | v0.1.23 | Adding debug logs via NODE_DEBUG=simple-oracledb |
| 2016-02-09  | v0.1.22 | Maintenance |
| 2016-02-09  | v0.1.20 | connection.release now supports retry options |
| 2016-02-02  | v0.1.19 | Maintenance |
| 2016-01-22  | v0.1.18 | Fixed missing call to resultset.close after done reading |
| 2016-01-20  | v0.1.17 | Maintenance |
| 2016-01-12  | v0.1.8  | Avoid issues with oracledb stream option which is based on this library |
| 2016-01-07  | v0.1.7  | connection.query with streamResults=true returns a readable stream |
| 2015-12-30  | v0.1.6  | connection.transaction disables commit/rollback while running |
| 2015-12-29  | v0.1.5  | Maintenance |
| 2015-12-29  | v0.1.4  | Added connection.transaction |
| 2015-12-29  | v0.1.3  | Added connection.batchUpdate |
| 2015-12-22  | v0.1.2  | Added streaming of query results with new option streamResults=true |
| 2015-12-21  | v0.1.1  | Rename streamResults to splitResults |
| 2015-12-21  | v0.0.36 | Maintenance |
| 2015-12-21  | v0.0.35 | New bulkRowsAmount option to manage query resultset behaviour |
| 2015-12-21  | v0.0.34 | Added splitting of query results into bulks with new option splitResults=true |
| 2015-12-17  | v0.0.33 | Maintenance |
| 2015-12-08  | v0.0.24 | Added pool.getConnection connection validation via running SQL test command |
| 2015-11-30  | v0.0.23 | Maintenance |
| 2015-11-17  | v0.0.17 | Added pool.getConnection automatic retry |
| 2015-11-15  | v0.0.16 | Added connection.batchInsert and connection.rollback |
| 2015-11-05  | v0.0.15 | Maintenance |
| 2015-10-20  | v0.0.10 | Added connection.queryJSON |
| 2015-10-19  | v0.0.9  | autoCommit support when doing INSERT/UPDATE with LOBs |
| 2015-10-19  | v0.0.7  | Added pool.terminate |
| 2015-10-19  | v0.0.6  | Maintenance |
| 2015-10-18  | v0.0.5  | Added connection.update |
| 2015-10-18  | v0.0.4  | Added connection.insert |
| 2015-10-16  | v0.0.3  | Maintenance |
| 2015-10-15  | v0.0.1  | Initial release. |

<a name="license"></a>
## License
Developed by Sagie Gur-Ari and licensed under the Apache 2 open source license.
