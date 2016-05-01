# simple-oracledb

[![NPM Version](http://img.shields.io/npm/v/simple-oracledb.svg?style=flat)](https://www.npmjs.org/package/simple-oracledb) [![Build Status](https://travis-ci.org/sagiegurari/simple-oracledb.svg)](http://travis-ci.org/sagiegurari/simple-oracledb) [![Coverage Status](https://coveralls.io/repos/sagiegurari/simple-oracledb/badge.svg)](https://coveralls.io/r/sagiegurari/simple-oracledb) [![Code Climate](https://codeclimate.com/github/sagiegurari/simple-oracledb/badges/gpa.svg)](https://codeclimate.com/github/sagiegurari/simple-oracledb) [![bitHound Code](https://www.bithound.io/github/sagiegurari/simple-oracledb/badges/code.svg)](https://www.bithound.io/github/sagiegurari/simple-oracledb) [![Inline docs](http://inch-ci.org/github/sagiegurari/simple-oracledb.svg?branch=master)](http://inch-ci.org/github/sagiegurari/simple-oracledb)<br>
[![License](https://img.shields.io/npm/l/simple-oracledb.svg?style=flat)](https://github.com/sagiegurari/simple-oracledb/blob/master/LICENSE) [![Total Downloads](https://img.shields.io/npm/dt/simple-oracledb.svg?style=flat)](https://www.npmjs.org/package/simple-oracledb) [![Dependency Status](https://david-dm.org/sagiegurari/simple-oracledb.svg)](https://david-dm.org/sagiegurari/simple-oracledb) [![devDependency Status](https://david-dm.org/sagiegurari/simple-oracledb/dev-status.svg)](https://david-dm.org/sagiegurari/simple-oracledb#info=devDependencies)<br>
[![Retire Status](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/simple-oracledb/master/package.json)](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/simple-oracledb/master/package.json)

> Extend capabilities of oracledb with simplified API for quicker development.

* [Overview](#overview)
* [Usage](#usage)
  * [OracleDB](#usage-oracledb)
    * [createPool](#usage-createpool)
  * [Pool](#usage-pool)
    * [Event: connection-created](#event-connection-created)
    * [Event: connection-released](#event-connection-released)
    * [Event: release](#event-pool-release)
    * [getConnection](#usage-getconnection)
    * [run](#usage-run)
    * [terminate](#usage-terminate)
    * [close](#usage-terminate)
  * [Connection](#usage-connection)
    * [Event: release](#event-connection-release)
    * [query](#usage-query)
    * [insert](#usage-insert)
    * [update](#usage-update)
    * [queryJSON](#usage-queryJSON)
    * [batchInsert](#usage-batchInsert)
    * [batchUpdate](#usage-batchUpdate)
    * [transaction](#usage-transaction)
    * [release](#usage-release)
    * [close](#usage-release)
    * [rollback](#usage-rollback)
  * [SimpleOracleDB](#usage-simple-oracledb)
    * [Event: pool-created](#event-pool-created-simpleoracledb)
    * [Event: connection-created](#event-connection-created-simpleoracledb)
    * [Event: connection-released](#event-connection-released-simpleoracledb)
    * [diagnosticInfo](#usage-diagnostic-info)
    * [enableDiagnosticInfo](#usage-enable-diagnostic-info)
  * [Extensions](#usage-extensions)
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
The new functionality aim is to be simpler and more strait forward to enable quicker development.

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

<a name="usage-createpool"></a>
### 'oracledb.createPool(poolAttributes, callback)'
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

<a name="usage-pool"></a>
## Class: Pool

<a name="event-connection-created"></a>
### Event: 'connection-created'
* connection - The connection instance

This events is triggered when a connection is created via pool.

<a name="event-connection-released"></a>
### Event: 'connection-released'
* connection - The connection instance

This events is triggered when a connection is released successfully.

<a name="event-pool-release"></a>
### Event: 'release'
* pool - The pool instance

This events is triggered after the pool is released successfully.

<a name="usage-getconnection"></a>
### 'pool.getConnection(callback)'
This function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
See https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool for official API details.<br>
See https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool for extended createPool API details.

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
```

<a name="usage-run"></a>
### 'pool.run(action, [options], callback)'
This function invokes the provided action (function) with a valid connection object and a callback.<br>
The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
must call the callback with an error (if any) and result.<br>
The pool will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.

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
  ignoreReleaseErrors: false //enable/disable ignoring any release error (default not to ignore
}, function onActionDone(error, result) {
  //do something with the result/error
});
```

<a name="usage-terminate"></a>
### 'pool.terminate([callback])'
### 'pool.close([callback])'
This function modifies the existing pool.terminate function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.<br>
The pool.terminate also has an alias pool.close for consistent close function naming to all relevant objects.

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

<a name="usage-connection"></a>
## Class: Connection

<a name="event-connection-release"></a>
### Event: 'release'
This events is triggered when the connection is released successfully.

<a name="usage-query"></a>
### 'connection.query(sql, [bindParams], [options], [callback]) ⇒ [ResultSetReadStream]'
Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
All LOBs will be read and all rows will be fetched.<br>
This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
The function arguments used to execute the 'query' are exactly as defined in the oracledb connection.execute function.

```js
connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], function onResults(error, results) {
  if (error) {
    //handle error...
  } else {
    //print the 4th row DEPARTMENT_ID column value
    console.log(results[3].DEPARTMENT_ID);
  }
});
```

In order to split results into bulks, you can provide the splitResults = true option.<br>
The callback will be called for each bulk with array of objects.<br>
Once all rows are read, the callback will be called with an empty array.

```js
connection.query('SELECT * FROM departments WHERE manager_id > :id', [110], {
  splitResults: true, //True to enable to split the results into bulks, each bulk will invoke the provided callback (last callback invocation will have empty results)
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
```

In order to stream results into a read stream, you can provide the streamResults = true option.<br>
The callback will be called with a read stream instance which can be used to fetch/pipe the data.<br>
Once all rows are read, the proper stream events will be called.

```js
//stream all rows (options.streamResults)
//if callback is provided, the stream is provided in the result as well
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

//listen to other events such as end/close/error....
```

<a name="usage-insert"></a>
### 'connection.insert(sql, [bindParams], [options], callback)'
Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

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
```

<a name="usage-update"></a>
### 'connection.update(sql, [bindParams], [options], callback)'
Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

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
```

<a name="usage-queryJSON"></a>
### 'connection.queryJSON(sql, [bindParams], [options], callback)'
This function will invoke the provided SQL SELECT and return a results object with the returned row count and the JSONs.<br>
The json property will hold a single JSON object in case the returned row count is 1, and an array of JSONs in case the row count is higher.<br>
The query expects that only 1 column is fetched and if more are detected in the results, this function will return an error in the callback.<br>
The function arguments used to execute the 'queryJSON' are exactly as defined in the oracledb connection.execute function.

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
```

<a name="usage-batchInsert"></a>
### 'connection.batchInsert(sql, bindParamsArray, options, callback)'
Enables to run an INSERT SQL statement multiple times for each of the provided bind params.<br>
This allows to insert to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

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

<a name="usage-batchUpdate"></a>
### 'connection.batchUpdate(sql, bindParamsArray, options, callback)'
Enables to run an UPDATE SQL statement multiple times for each of the provided bind params.<br>
This allows to update to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

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

<a name="usage-transaction"></a>
### 'connection.transaction(actions, [options], callback)'
Enables to run multiple oracle operations in a single transaction.<br>
This function basically allows to automatically commit or rollback once all your actions are done.<br>
Actions are basically javascript functions which get a callback when invoked, and must call that callback with error or result.<br>
All provided actions are executed in parallel unless options.sequence=true is provided.<br>
Once all actions are done, in case of any error in any action, a rollback will automatically get invoked, otherwise a commit will be invoked.<br>
Once the rollback/commit is done, the provided callback will be invoked with the error (if any) and results of all actions.<br>
When calling any connection operation (execute, insert, update, ...) the connection will automatically set the autoCommit=false and will ignore the value provided.<br>
This is done to prevent commits in the middle of the transaction.<br>
In addition, you can not start a transaction while another transaction is in progress.

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
], function onTransactionResults(error, output) {
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
```

<a name="usage-release"></a>
### 'connection.release([options], [callback])'
### 'connection.close([options], [callback])'
This function modifies the existing connection.release function by enabling the input callback to be an optional parameter and providing ability to auto retry in case of any errors during release.<br>
The connection.release also has an alias connection.close for consistent close function naming to all relevant objects.

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

<a name="usage-rollback"></a>
### 'connection.rollback([callback])'
This function modifies the existing connection.rollback function by enabling the input
callback to be an optional parameter.<br>
If rollback fails, you can't really rollback again the data, so the callback is not always needed.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

```js
connection.rollback(); //no callback needed

//still possible to call with a rollback callback function
connection.rollback(function onRollback(error) {
  if (error) {
    //now what?
  }
});
```

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

<a name="usage-extensions"></a>
### 'SimpleOracleDB.addExtension(type, name, extension)'
Adds an extension to all newly created objects of the requested type.<br>
An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
This function enables external libraries to further extend oracledb using a very simple API and without the need to wrap the pool/connection creation functions.

```js
//define a new function for all new connection objects called 'myConnFunc' which accepts 2 arguments
SimpleOracleDB.addExtension('connection', 'myConnFunc', function (myParam1, myParam2) {
  //implement some custom functionality
});

//get connection (via oracledb directly or via pool) and start using the new function
connection.myConnFunc('test', 123);

//define a new function for all new pool objects called 'myPoolFunc'
SimpleOracleDB.addExtension('pool', 'myPoolFunc', function () {
  //implement some custom functionality
});

//get pool and start using the new function
pool.myPoolFunc();
```

An example of an existing extension can be found at: [oracledb-upsert](https://github.com/sagiegurari/oracledb-upsert) which adds the connection.upsert (insert/update) functionality.

<a name="usage-extension-connection.upsert"></a>
### 'connection.upsert(sqls, bindParams, [options], callback)'
See [oracledb-upsert](https://github.com/sagiegurari/oracledb-upsert) for more info.

<br>
**The rest of the API is the same as defined in the oracledb library: https://github.com/oracle/node-oracledb/blob/master/doc/api.md**

<a name="debug"></a>
## Debug
In order to turn on debug messages, use the standard nodejs NODE_DEBUG environment variable.
````
NODE_DEBUG=simple-oracledb
````

<a name="installation"></a>
## Installation
In order to use this library, just run the following npm install command:

```sh
npm install --save simple-oracledb
```

This library doesn't define oracledb as a dependency and therefore it is not installed when installing simple-oracledb.<br>
You should define oracledb in your package.json and install it based on the oracledb installation instructions found at: https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

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
| 2016-05-01  | v0.1.56 | Added the new monitor (SimpleOracleDB.diagnosticInfo and SimpleOracleDB.enableDiagnosticInfo) and SimpleOracleDB is now an event emitter |
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
