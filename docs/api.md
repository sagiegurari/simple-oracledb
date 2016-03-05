## Classes

<dl>
<dt><a href="#Connection">Connection</a></dt>
<dd></dd>
<dt><a href="#Pool">Pool</a></dt>
<dd></dd>
<dt><a href="#SimpleOracleDB">SimpleOracleDB</a></dt>
<dd></dd>
</dl>

## Events

<dl>
<dt><a href="#event_release">"release"</a></dt>
<dd><p>This events is triggered when the connection is released successfully.</p>
</dd>
<dt><a href="#event_connection-created">"connection-created" (connection)</a></dt>
<dd><p>This events is triggered when a connection is created via pool.</p>
</dd>
<dt><a href="#event_connection-released">"connection-released" (connection)</a></dt>
<dd><p>This events is triggered when a connection is released successfully.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ConnectionAction">ConnectionAction</a> : <code>function</code></dt>
<dd><p>An action requested by the pool to be invoked.</p>
</dd>
<dt><a href="#AsyncCallback">AsyncCallback</a> : <code>function</code></dt>
<dd><p>Invoked when an async operation has finished.</p>
</dd>
</dl>

<a name="Connection"></a>
## Connection
**Kind**: global class  
**Emits**: <code>[release](#event_release)</code>  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [Connection](#Connection)
    * [new Connection()](#new_Connection_new)
    * [.simplified](#Connection.simplified) : <code>boolean</code>
    * [#execute(sql, [bindParams], [options], callback)](#Connection+execute)
    * [#query(sql, [bindParams], [options], [callback])](#Connection+query) ⇒ <code>[ResultSetReadStream](#new_ResultSetReadStream_new)</code>
    * [#insert(sql, [bindParams], [options], callback)](#Connection+insert)
    * [#update(sql, [bindParams], [options], callback)](#Connection+update)
    * [#release([options], [callback])](#Connection+release)
    * [#close([options], [callback])](#Connection+close)
    * [#commit(callback)](#Connection+commit)
    * [#rollback([callback])](#Connection+rollback)
    * [#queryJSON(sql, [bindParams], [options], callback)](#Connection+queryJSON)
    * [#batchInsert(sql, bindParamsArray, options, callback)](#Connection+batchInsert)
    * [#batchUpdate(sql, bindParamsArray, options, callback)](#Connection+batchUpdate)
    * [#transaction(actions, [options], callback)](#Connection+transaction)
    * _static_
        * [.wrapOnConnection(callback)](#Connection.wrapOnConnection) ⇒ <code>function</code>
        * [.extend(connection)](#Connection.extend)

<a name="new_Connection_new"></a>
### new Connection()
This class holds all the extended capabilities added the oracledb connection.

<a name="Connection.simplified"></a>
### Connection.simplified : <code>boolean</code>
Marker property.

**Access:** public  
<a name="Connection+execute"></a>
### Connection#execute(sql, [bindParams], [options], callback)
Extends the original oracledb connection.execute to provide additional behavior.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| [bindParams] | <code>object</code> | Optional bind parameters |
| [options] | <code>object</code> | Optional execute options |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Callback function with the execution results |

<a name="Connection+query"></a>
### Connection#query(sql, [bindParams], [options], [callback]) ⇒ <code>[ResultSetReadStream](#new_ResultSetReadStream_new)</code>
Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
All LOBs will be read and all rows will be fetched.<br>
This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
The function arguments used to execute the 'query' are exactly as defined in the oracledb connection.execute function.

**Returns**: <code>[ResultSetReadStream](#new_ResultSetReadStream_new)</code> - The stream to read the results from (if streamResults=true in options)  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sql | <code>string</code> |  | The SQL to execute |
| [bindParams] | <code>object</code> |  | Optional bind parameters |
| [options] | <code>object</code> |  | Optional execute options |
| [options.splitResults] | <code>object</code> | <code>false</code> | True to enable to split the results into bulks, each bulk will invoke the provided callback (last callback invocation will have empty results). See also bulkRowsAmount option. |
| [options.streamResults] | <code>object</code> | <code>false</code> | True to enable to stream the results, the callback will receive a read stream object which can be piped or used with standard stream events (ignored if splitResults=true). |
| [options.bulkRowsAmount] | <code>number</code> | <code>100</code> | The amount of rows to fetch (for splitting results, that is the max rows that the callback will get for each callback invocation) |
| [callback] | <code>[AsyncCallback](#AsyncCallback)</code> |  | Invoked with an error or the query results object holding all data including LOBs (optional if streamResults=true) |

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

//read all rows in bulks (split results via option.splitResults)
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

//stream all rows (options.streamResults)
//if callback is provided, the stream is provided in the result as well
var stream = connection.query('SELECT * FROM departments WHERE manager_id > :id', [110], {
  streamResults: true
});

//listen to fetched rows via data event or just pipe to another handler
stream.on('data', function (row) {
  //use row object
});
```
<a name="Connection+insert"></a>
### Connection#insert(sql, [bindParams], [options], callback)
Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| [bindParams] | <code>object</code> | The bind parameters used to specify the values for the columns |
| [options] | <code>object</code> | Any execute options |
| [options.autoCommit] | <code>object</code> | If you wish to commit after the insert, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided) |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
```
<a name="Connection+update"></a>
### Connection#update(sql, [bindParams], [options], callback)
Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| [bindParams] | <code>object</code> | The bind parameters used to specify the values for the columns |
| [options] | <code>object</code> | Any execute options |
| [options.autoCommit] | <code>object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
```
<a name="Connection+release"></a>
### Connection#release([options], [callback])
This function modifies the existing connection.release function by enabling the input
callback to be an optional parameter and providing ability to auto retry in case of any errors during release.<br>
The connection.release also has an alias connection.close for consistent close function naming to all relevant objects.

**Emits**: <code>[release](#event_release)</code>  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Optional options used to define error handling (retry is enabled only if options are provided) |
| [options.retryCount] | <code>number</code> | <code>10</code> | Optional number of retries in case of any error during the release |
| [options.retryInterval] | <code>number</code> | <code>250</code> | Optional interval in millies between retries |
| [options.force] | <code>boolean</code> | <code>false</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
| [callback] | <code>function</code> |  | An optional release callback function (see oracledb docs) |

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
<a name="Connection+close"></a>
### Connection#close([options], [callback])
Alias for connection.release, see connection.release for more info.

**Emits**: <code>[release](#event_release)</code>  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Optional options used to define error handling (retry is enabled only if options are provided) |
| [options.retryCount] | <code>number</code> | <code>10</code> | Optional number of retries in case of any error during the release |
| [options.retryInterval] | <code>number</code> | <code>250</code> | Optional interval in millies between retries |
| [options.force] | <code>boolean</code> | <code>false</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
| [callback] | <code>function</code> |  | An optional release callback function (see oracledb docs) |

<a name="Connection+commit"></a>
### Connection#commit(callback)
Extends the connection.commit to prevent commit being invoked while in the middle of a transaction.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The commit callback function (see oracledb docs) |

<a name="Connection+rollback"></a>
### Connection#rollback([callback])
This function modifies the existing connection.rollback function by enabling the input
callback to be an optional parameter.<br>
If rollback fails, you can't really rollback again the data, so the callback is not always needed.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | An optional rollback callback function (see oracledb docs) |

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
<a name="Connection+queryJSON"></a>
### Connection#queryJSON(sql, [bindParams], [options], callback)
This function will invoke the provided SQL SELECT and return a results object with the returned row count and the JSONs.<br>
The json property will hold a single JSON object in case the returned row count is 1, and an array of JSONs in case the row count is higher.<br>
The query expects that only 1 column is fetched and if more are detected in the results, this function will return an error in the callback.<br>
The function arguments used to execute the 'queryJSON' are exactly as defined in the oracledb connection.execute function.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| [bindParams] | <code>object</code> | Optional bind parameters |
| [options] | <code>object</code> | Optional execute options |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or the query results object holding the row count and JSONs |

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
```
<a name="Connection+batchInsert"></a>
### Connection#batchInsert(sql, bindParamsArray, options, callback)
Enables to run an INSERT SQL statement multiple times for each of the provided bind params.<br>
This allows to insert to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| bindParamsArray | <code>Array</code> | An array of instances of object/Array bind parameters used to specify the values for the columns per row |
| options | <code>object</code> | Any execute options |
| [options.autoCommit] | <code>object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
<a name="Connection+batchUpdate"></a>
### Connection#batchUpdate(sql, bindParamsArray, options, callback)
Enables to run an UPDATE SQL statement multiple times for each of the provided bind params.<br>
This allows to update to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| bindParamsArray | <code>object</code> | An array of instances of object/Array bind parameters used to specify the values for the columns per row |
| options | <code>object</code> | Any execute options |
| [options.autoCommit] | <code>object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
<a name="Connection+transaction"></a>
### Connection#transaction(actions, [options], callback)
Enables to run multiple oracle operations in a single transaction.<br>
This function basically allows to automatically commit or rollback once all your actions are done.<br>
Actions are basically javascript functions which get a callback when invoked, and must call that callback with error or result.<br>
All provided actions are executed in parallel unless options.sequence=true is provided.<br>
Once all actions are done, in case of any error in any action, a rollback will automatically get invoked, otherwise a commit will be invoked.<br>
Once the rollback/commit is done, the provided callback will be invoked with the error (if any) and results of all actions.<br>
When calling any connection operation (execute, insert, update, ...) the connection will automatically set the autoCommit=false and will ignore the value provided.<br>
This is done to prevent commits in the middle of the transaction.<br>
In addition, you can not start a transaction while another transaction is in progress.

**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| actions | <code>Array</code> &#124; <code>function</code> |  | A single action function or an array of action functions. |
| [options] | <code>object</code> |  | Any transaction options |
| [options.sequence] | <code>boolean</code> | <code>false</code> | True to run all actions in sequence, false to run them in parallel (default) |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> |  | Invoked with an error or the transaction results |

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
<a name="Connection.wrapOnConnection"></a>
### Connection.wrapOnConnection(callback) ⇒ <code>function</code>
Returns a getConnection callback wrapper which extends the connection and
calls the original callback.

**Kind**: static method of <code>[Connection](#Connection)</code>  
**Returns**: <code>function</code> - The getConnection callback wrapper.  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The getConnection callback |

<a name="Connection.extend"></a>
### Connection.extend(connection)
Extends the provided oracledb connection instance.

**Kind**: static method of <code>[Connection](#Connection)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>object</code> | The oracledb connection instance |

<a name="Pool"></a>
## Pool
**Kind**: global class  
**Emits**: <code>[connection-created](#event_connection-created)</code>, <code>[connection-released](#event_connection-released)</code>  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [Pool](#Pool)
    * [new Pool()](#new_Pool_new)
    * [.simplified](#Pool.simplified) : <code>boolean</code>
    * [#getConnection(callback)](#Pool+getConnection)
    * [#run(action, [options], callback)](#Pool+run)
    * [#terminate([callback])](#Pool+terminate)
    * [#close([callback])](#Pool+close)
    * _static_
        * [.extend(pool, [poolAttributes])](#Pool.extend)

<a name="new_Pool_new"></a>
### new Pool()
This class holds all the extended capabilities added the oracledb pool.

<a name="Pool.simplified"></a>
### Pool.simplified : <code>boolean</code>
Marker property.

**Access:** public  
<a name="Pool+getConnection"></a>
### Pool#getConnection(callback)
Wraps the original oracledb getConnection in order to provide an extended connection object.<br>
In addition, this function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
See https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool for official API details.<br>
See https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool for extended createPool API details.<br>

**Emits**: <code>[connection-created](#event_connection-created)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or an extended connection object |

<a name="Pool+run"></a>
### Pool#run(action, [options], callback)
This function invokes the provided action (function) with a valid connection object and a callback.<br>
The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
must call the callback with an error (if any) and result.<br>
The pool will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.

**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| action | <code>[ConnectionAction](#ConnectionAction)</code> |  | An action requested by the pool to be invoked. |
| [options] | <code>object</code> |  | Optional runtime options |
| [options.ignoreReleaseErrors] | <code>boolean</code> | <code>false</code> | If true, errors during connection.release() invoked by the pool will be ignored |
| [options.releaseOptions] | <code>object</code> | <code>{force: true}</code> | The connection.release options (see connection.release for more info) |
| [options.releaseOptions.force] | <code>boolean</code> | <code>true</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> |  | Invoked with an error or the result of the action after the connection was released by the pool |

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
```
<a name="Pool+terminate"></a>
### Pool#terminate([callback])
This function modifies the existing pool.terminate function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.<br>
The pool.terminate also has an alias pool.close for consistent close function naming to all relevant objects.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | An optional terminate callback function (see oracledb docs) |

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
<a name="Pool+close"></a>
### Pool#close([callback])
Alias for pool.terminate, see pool.terminate for more info.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | An optional terminate callback function (see oracledb docs) |

<a name="Pool.extend"></a>
### Pool.extend(pool, [poolAttributes])
Extends the provided oracledb pool instance.

**Kind**: static method of <code>[Pool](#Pool)</code>  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pool | <code>object</code> |  | The oracledb pool instance |
| [poolAttributes] | <code>object</code> |  | The connection pool attributes object |
| [poolAttributes.retryCount] | <code>number</code> | <code>10</code> | The max amount of retries to get a connection from the pool in case of any error |
| [poolAttributes.retryInterval] | <code>number</code> | <code>250</code> | The interval in millies between get connection retry attempts |
| [poolAttributes.runValidationSQL] | <code>boolean</code> | <code>true</code> | True to ensure the connection returned is valid by running a test validation SQL |
| [poolAttributes.validationSQL] | <code>string</code> | <code>&quot;SELECT 1 FROM DUAL&quot;</code> | The test SQL to invoke before returning a connection to validate the connection is open |

<a name="SimpleOracleDB"></a>
## SimpleOracleDB
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [SimpleOracleDB](#SimpleOracleDB)
    * [new SimpleOracleDB()](#new_SimpleOracleDB_new)
    * [#extend(oracledb)](#SimpleOracleDB+extend)
    * [#extend(pool)](#SimpleOracleDB+extend)
    * [#extend(connection)](#SimpleOracleDB+extend)
    * [#addExtension(type, name, extension)](#SimpleOracleDB+addExtension) ⇒ <code>boolean</code>
    * _static_
        * [.oracle.getConnection(connectionAttributes, callback)](#SimpleOracleDB.oracle.getConnection)
        * [.oracle.createPool(poolAttributes, callback)](#SimpleOracleDB.oracle.createPool)

<a name="new_SimpleOracleDB_new"></a>
### new SimpleOracleDB()
Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
See extend function for more info.

<a name="SimpleOracleDB+extend"></a>
### SimpleOracleDB#extend(oracledb)
Extends the oracledb library which from that point will allow fetching the modified
connection objects via oracledb.getConnection or via pool.getConnection

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| oracledb | <code>oracledb</code> | The oracledb library |

<a name="SimpleOracleDB+extend"></a>
### SimpleOracleDB#extend(pool)
Extends the oracledb pool instance which from that point will allow fetching the modified
connection objects via pool.getConnection

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| pool | <code>[Pool](#Pool)</code> | The oracledb pool instance |

<a name="SimpleOracleDB+extend"></a>
### SimpleOracleDB#extend(connection)
Extends the oracledb connection instance which from that point will allow access to all
the extended capabilities of this library.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>[Connection](#Connection)</code> | The oracledb connection instance |

<a name="SimpleOracleDB+addExtension"></a>
### SimpleOracleDB#addExtension(type, name, extension) ⇒ <code>boolean</code>
Adds an extension to all newly created objects of the requested type.<br>
An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
This function enables external libraries to further extend oracledb using a very simple API and without the need to wrap the pool/connection creation functions.

**Returns**: <code>boolean</code> - True if added, false if ignored  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | Either 'connection' or 'pool' |
| name | <code>string</code> | The function name which will be added to the object |
| extension | <code>function</code> | The function to be added |

**Example**  
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
<a name="SimpleOracleDB.oracle.getConnection"></a>
### SimpleOracleDB.oracle.getConnection(connectionAttributes, callback)
Wraps the original oracledb getConnection in order to provide an extended connection object.

**Kind**: static method of <code>[SimpleOracleDB](#SimpleOracleDB)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| connectionAttributes | <code>object</code> | The connection attributes object |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or the oracle connection instance |

<a name="SimpleOracleDB.oracle.createPool"></a>
### SimpleOracleDB.oracle.createPool(poolAttributes, callback)
Wraps the original oracledb createPool in order to provide an extended pool object.

**Kind**: static method of <code>[SimpleOracleDB](#SimpleOracleDB)</code>  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| poolAttributes | <code>object</code> |  | The connection pool attributes object (see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpool for more attributes) |
| [poolAttributes.retryCount] | <code>number</code> | <code>10</code> | The max amount of retries to get a connection from the pool in case of any error |
| [poolAttributes.retryInterval] | <code>number</code> | <code>250</code> | The interval in millies between get connection retry attempts |
| [poolAttributes.runValidationSQL] | <code>boolean</code> | <code>true</code> | True to ensure the connection returned is valid by running a test validation SQL |
| [poolAttributes.validationSQL] | <code>string</code> | <code>&quot;SELECT 1 FROM DUAL&quot;</code> | The test SQL to invoke before returning a connection to validate the connection is open |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> |  | Invoked with an error or the oracle connection pool instance |

<a name="event_release"></a>
## "release"
This events is triggered when the connection is released successfully.

**Kind**: event emitted  
<a name="event_connection-created"></a>
## "connection-created" (connection)
This events is triggered when a connection is created via pool.

**Kind**: event emitted  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>[Connection](#Connection)</code> | The connection instance |

<a name="event_connection-released"></a>
## "connection-released" (connection)
This events is triggered when a connection is released successfully.

**Kind**: event emitted  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>[Connection](#Connection)</code> | The connection instance |

<a name="ConnectionAction"></a>
## ConnectionAction : <code>function</code>
An action requested by the pool to be invoked.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>[Connection](#Connection)</code> | A valid connection to be used by the action |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | The callback to invoke at the end of the action |

<a name="AsyncCallback"></a>
## AsyncCallback : <code>function</code>
Invoked when an async operation has finished.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>error</code> | Any possible error |
| [output] | <code>object</code> | The operation output |

