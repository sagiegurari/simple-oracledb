## Classes

<dl>
<dt><a href="#Connection">Connection</a></dt>
<dd></dd>
<dt><a href="#OracleDB">OracleDB</a></dt>
<dd></dd>
<dt><a href="#Pool">Pool</a></dt>
<dd></dd>
<dt><a href="#ResultSetReadStream">ResultSetReadStream</a></dt>
<dd></dd>
<dt><a href="#SimpleOracleDB">SimpleOracleDB</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ConnectionAction">ConnectionAction</a> : <code>function</code></dt>
<dd><p>An action requested by the pool to be invoked.</p>
</dd>
<dt><a href="#QuerySpec">QuerySpec</a> : <code>Object</code></dt>
<dd><p>Holds query invocation definitions.</p>
</dd>
<dt><a href="#AsyncCallback">AsyncCallback</a> : <code>function</code></dt>
<dd><p>Invoked when an async operation has finished.</p>
</dd>
</dl>

<a name="Connection"></a>

## Connection
**Kind**: global class  
**Emits**: <code>event:release</code>  
**Access**: public  
**Author**: Sagie Gur-Ari  

* [Connection](#Connection)
    * [new Connection()](#new_Connection_new)
    * [.simplified](#Connection.simplified) : <code>Boolean</code>
    * [#execute(sql, [bindParams], [options], [callback])](#Connection+execute) ⇒ <code>Promise</code>
    * [#query(sql, [bindParams], [options], [callback])](#Connection+query) ⇒ [<code>ResultSetReadStream</code>](#ResultSetReadStream) \| <code>Promise</code>
    * [#insert(sql, [bindParams], [options], [callback])](#Connection+insert) ⇒ <code>Promise</code>
    * [#update(sql, [bindParams], [options], [callback])](#Connection+update) ⇒ <code>Promise</code>
    * [#release([options], [callback])](#Connection+release) ⇒ <code>Promise</code>
    * [#close([options], [callback])](#Connection+close) ⇒ <code>Promise</code>
    * [#commit([callback])](#Connection+commit) ⇒ <code>Promise</code>
    * [#rollback([callback])](#Connection+rollback) ⇒ <code>Promise</code>
    * [#queryJSON(sql, [bindParams], [options], [callback])](#Connection+queryJSON) ⇒ <code>Promise</code>
    * [#batchInsert(sql, bindParamsArray, options, [callback])](#Connection+batchInsert) ⇒ <code>Promise</code>
    * [#batchUpdate(sql, bindParamsArray, options, [callback])](#Connection+batchUpdate) ⇒ <code>Promise</code>
    * [#run(actions, [options], [callback])](#Connection+run) ⇒ <code>Promise</code>
    * [#transaction(actions, [options], [callback])](#Connection+transaction) ⇒ <code>Promise</code>
    * [#executeFile(file, [options], [callback])](#Connection+executeFile) ⇒ <code>Promise</code>
    * _instance_
        * ["release"](#Connection+event_release)
    * _static_
        * [.wrapOnConnection(callback)](#Connection.wrapOnConnection) ⇒ <code>function</code>
        * [.extend(connection)](#Connection.extend)

<a name="new_Connection_new"></a>

### new Connection()
This class holds all the extended capabilities added the oracledb connection.

<a name="Connection.simplified"></a>

### Connection.simplified : <code>Boolean</code>
Marker property.

**Access**: public  
<a name="Connection+execute"></a>

### Connection#execute(sql, [bindParams], [options], [callback]) ⇒ <code>Promise</code>
Extends the original oracledb connection.execute to provide additional behavior.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| [bindParams] | <code>Object</code> | Optional bind parameters |
| [options] | <code>Object</code> | Optional execute options |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Callback function with the execution results |

**Example**  
```js
//see oracledb documentation for more examples
connection.execute('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], function onResults(error, results) {
  if (error) {
    //handle error...
  } else {
    //continue
  }
});
```
<a name="Connection+query"></a>

### Connection#query(sql, [bindParams], [options], [callback]) ⇒ [<code>ResultSetReadStream</code>](#ResultSetReadStream) \| <code>Promise</code>
Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
All LOBs will be read and all rows will be fetched.<br>
This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
The function arguments used to execute the 'query' are exactly as defined in the oracledb connection.execute function.

**Returns**: [<code>ResultSetReadStream</code>](#ResultSetReadStream) \| <code>Promise</code> - The stream to read the results from (if streamResults=true in options) or promise if callback not provided  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sql | <code>String</code> |  | The SQL to execute |
| [bindParams] | <code>Object</code> |  | Optional bind parameters |
| [options] | <code>Object</code> |  | Optional execute options |
| [options.splitResults] | <code>Object</code> | <code>false</code> | True to enable to split the results into bulks, each bulk will invoke the provided callback (last callback invocation will have empty results, promise not supported). See also bulkRowsAmount option. |
| [options.streamResults] | <code>Object</code> | <code>false</code> | True to enable to stream the results, the callback will receive a read stream object which can be piped or used with standard stream events (ignored if splitResults=true). |
| [options.bulkRowsAmount] | <code>Number</code> | <code>100</code> | The amount of rows to fetch (for splitting results, that is the max rows that the callback will get for each callback invocation) |
| [options.flattenStackEveryRows] | <code>Number</code> |  | The amount of rows after which the JS stack is flattened, low number can result in performance impact, high number can result in stack overflow error |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) |  | Invoked with an error or the query results object holding all data including LOBs |

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
<a name="Connection+insert"></a>

### Connection#insert(sql, [bindParams], [options], [callback]) ⇒ <code>Promise</code>
Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| [bindParams] | <code>Object</code> | The bind parameters used to specify the values for the columns |
| [options] | <code>Object</code> | Any execute options |
| [options.autoCommit] | <code>Object</code> | If you wish to commit after the insert, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>Object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>Object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided) |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
<a name="Connection+update"></a>

### Connection#update(sql, [bindParams], [options], [callback]) ⇒ <code>Promise</code>
Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
The callback output will be the same as oracledb connection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| [bindParams] | <code>Object</code> | The bind parameters used to specify the values for the columns |
| [options] | <code>Object</code> | Any execute options |
| [options.autoCommit] | <code>Object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>Object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>Object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
<a name="Connection+release"></a>

### Connection#release([options], [callback]) ⇒ <code>Promise</code>
This function modifies the existing connection.release function by enabling the input
callback to be an optional parameter and providing ability to auto retry in case of any errors during release.<br>
The connection.release also has an alias connection.close for consistent close function naming to all relevant objects.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Emits**: <code>event:release</code>  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Optional options used to define error handling (retry is enabled only if options are provided) |
| [options.retryCount] | <code>Number</code> | <code>10</code> | Optional number of retries in case of any error during the release |
| [options.retryInterval] | <code>Number</code> | <code>250</code> | Optional interval in millies between retries |
| [options.force] | <code>Boolean</code> | <code>false</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
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

### Connection#close([options], [callback]) ⇒ <code>Promise</code>
Alias for connection.release, see connection.release for more info.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Emits**: <code>event:release</code>  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Optional options used to define error handling (retry is enabled only if options are provided) |
| [options.retryCount] | <code>Number</code> | <code>10</code> | Optional number of retries in case of any error during the release |
| [options.retryInterval] | <code>Number</code> | <code>250</code> | Optional interval in millies between retries |
| [options.force] | <code>Boolean</code> | <code>false</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
| [callback] | <code>function</code> |  | An optional release callback function (see oracledb docs) |

<a name="Connection+commit"></a>

### Connection#commit([callback]) ⇒ <code>Promise</code>
Extends the connection.commit to prevent commit being invoked while in the middle of a transaction.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | The commit callback function (see oracledb docs) |

**Example**  
```js
//using callback
connection.commit(function onCommit(error) {
  //do something...
});

//or you can use a promise
connection.commit().then(function () {
  //commit done....
}).catch(function (error) {
  //commit failed...
});
```
<a name="Connection+rollback"></a>

### Connection#rollback([callback]) ⇒ <code>Promise</code>
This function modifies the existing connection.rollback function by enabling the input
callback to be an optional parameter.<br>
If rollback fails, you can't really rollback again the data, so the callback is not always needed.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

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

### Connection#queryJSON(sql, [bindParams], [options], [callback]) ⇒ <code>Promise</code>
This function will invoke the provided SQL SELECT and return a results object with the returned row count and the JSONs.<br>
The json property will hold a single JSON object in case the returned row count is 1, and an array of JSONs in case the row count is higher.<br>
The query expects that only 1 column is fetched and if more are detected in the results, this function will return an error in the callback.<br>
The function arguments used to execute the 'queryJSON' are exactly as defined in the oracledb connection.execute function.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| [bindParams] | <code>Object</code> | Optional bind parameters |
| [options] | <code>Object</code> | Optional execute options |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or the query results object holding the row count and JSONs |

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
<a name="Connection+batchInsert"></a>

### Connection#batchInsert(sql, bindParamsArray, options, [callback]) ⇒ <code>Promise</code>
Enables to run an INSERT SQL statement multiple times for each of the provided bind params.<br>
This allows to insert to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| bindParamsArray | <code>Array</code> | An array of instances of object/Array bind parameters used to specify the values for the columns per row |
| options | <code>Object</code> | Any execute options |
| [options.autoCommit] | <code>Object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>Object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>Object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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

### Connection#batchUpdate(sql, bindParamsArray, options, [callback]) ⇒ <code>Promise</code>
Enables to run an UPDATE SQL statement multiple times for each of the provided bind params.<br>
This allows to update to same table multiple different rows with one single call.<br>
The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
the bind params is now an array of bind params (one per row).

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| bindParamsArray | <code>Object</code> | An array of instances of object/Array bind parameters used to specify the values for the columns per row |
| options | <code>Object</code> | Any execute options |
| [options.autoCommit] | <code>Object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>Object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
| [options.returningInfo] | <code>Object</code> | columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB) |

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
<a name="Connection+run"></a>

### Connection#run(actions, [options], [callback]) ⇒ <code>Promise</code>
Enables to run multiple oracle operations in sequence or parallel.<br>
Actions are basically javascript functions which get a callback when invoked, and must call that callback with error or result.<br>
For promise support, actions can simply return a promise instead of using the provided callback.<br>
All provided actions are executed in sequence unless options.sequence=false is provided (parallel invocation is only for IO operations apart of the oracle driver as the driver will queue operations on same connection).<br>
This function is basically the same as connection.transaction with few exceptions<br>
<ul>
  <li>This function will <b>not</b> auto commit/rollback or disable any commits/rollbacks done by the user</li>
  <li>You can invoke connection.run inside connection.run as many times as needed (for example if you execute connection.run with option.sequence=false meaning parallel and inside invoke connection.run with option.sequence=true for a subset of operations)</li>
</ul>

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| actions | <code>Array.&lt;function()&gt;</code> \| <code>function</code> |  | A single action function or an array of action functions. |
| [options] | <code>Object</code> |  | Any run options |
| [options.sequence] | <code>Boolean</code> | <code>false</code> | True to run all actions in sequence, false to run them in parallel (default) |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) |  | Invoked with an error or the run actions results |

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
<a name="Connection+transaction"></a>

### Connection#transaction(actions, [options], [callback]) ⇒ <code>Promise</code>
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

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| actions | <code>Array.&lt;function()&gt;</code> \| <code>function</code> |  | A single action function or an array of action functions. |
| [options] | <code>Object</code> |  | Any transaction options |
| [options.sequence] | <code>Boolean</code> | <code>true</code> | True to run all actions in sequence, false to run them in parallel |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) |  | Invoked with an error or the transaction results |

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
<a name="Connection+executeFile"></a>

### Connection#executeFile(file, [options], [callback]) ⇒ <code>Promise</code>
Reads the sql string from the provided file and executes it.<br>
The file content must be a single valid SQL command string.<br>
This function is basically a quick helper to reduce the coding needed to read the sql file.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>String</code> | The file which contains the sql command |
| [options] | <code>Object</code> | Optional execute options |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Callback function with the execution results |

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
<a name="Connection+event_release"></a>

### "release"
This events is triggered when the connection is released successfully.

**Kind**: event emitted by [<code>Connection</code>](#Connection)  
<a name="Connection.wrapOnConnection"></a>

### Connection.wrapOnConnection(callback) ⇒ <code>function</code>
Returns a getConnection callback wrapper which extends the connection and
calls the original callback.

**Kind**: static method of [<code>Connection</code>](#Connection)  
**Returns**: <code>function</code> - The getConnection callback wrapper.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The getConnection callback |

<a name="Connection.extend"></a>

### Connection.extend(connection)
Extends the provided oracledb connection instance.

**Kind**: static method of [<code>Connection</code>](#Connection)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>Object</code> | The oracledb connection instance |

<a name="OracleDB"></a>

## OracleDB
**Kind**: global class  
**Access**: public  
**Author**: Sagie Gur-Ari  

* [OracleDB](#OracleDB)
    * [new OracleDB()](#new_OracleDB_new)
    * [.simplified](#OracleDB.simplified) : <code>Boolean</code>
    * [#getConnection(connectionAttributes, [callback])](#OracleDB+getConnection) ⇒ <code>Promise</code>
    * [#createPool(poolAttributes, [callback])](#OracleDB+createPool) ⇒ <code>Promise</code>
    * [#run(connectionAttributes, action, [callback])](#OracleDB+run) ⇒ <code>Promise</code>
    * _instance_
        * ["pool-created" (pool)](#OracleDB+event_pool-created)
        * ["pool-released" (pool)](#OracleDB+event_pool-released)
        * ["connection-created" (connection)](#OracleDB+event_connection-created)
        * ["connection-released" (connection)](#OracleDB+event_connection-released)
    * _static_
        * [.extend(oracledb)](#OracleDB.extend)

<a name="new_OracleDB_new"></a>

### new OracleDB()
This class holds all the extended capabilities added the oracledb.

<a name="OracleDB.simplified"></a>

### OracleDB.simplified : <code>Boolean</code>
Marker property.

**Access**: public  
<a name="OracleDB+getConnection"></a>

### OracleDB#getConnection(connectionAttributes, [callback]) ⇒ <code>Promise</code>
Wraps the original oracledb getConnection in order to provide an extended connection object.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| connectionAttributes | <code>Object</code> | The connection attributes object |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or the oracle connection instance |

<a name="OracleDB+createPool"></a>

### OracleDB#createPool(poolAttributes, [callback]) ⇒ <code>Promise</code>
Wraps the original oracledb createPool in order to provide an extended pool object.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| poolAttributes | <code>Object</code> |  | The connection pool attributes object (see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpool for more attributes) |
| [poolAttributes.retryCount] | <code>Number</code> | <code>10</code> | The max amount of retries to get a connection from the pool in case of any error |
| [poolAttributes.retryInterval] | <code>Number</code> | <code>250</code> | The interval in millies between get connection retry attempts |
| [poolAttributes.runValidationSQL] | <code>Boolean</code> | <code>true</code> | True to ensure the connection returned is valid by running a test validation SQL |
| [poolAttributes.validationSQL] | <code>String</code> | <code>SELECT 1 FROM DUAL</code> | The test SQL to invoke before returning a connection to validate the connection is open |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) |  | Invoked with an error or the oracle connection pool instance |

<a name="OracleDB+run"></a>

### OracleDB#run(connectionAttributes, action, [callback]) ⇒ <code>Promise</code>
This function invokes the provided action (function) with a valid connection object and a callback.<br>
The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
must call the callback with an error (if any) and result.<br>
For promise support, the action can simply return a promise instead of calling the provided callback.<br>
This function will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.<br>
It is recommanded to create a pool and use the pool.run instead of oracledb.run as this function will create a new connection (and release it) for each invocation,
on the other hand, pool.run will reuse pool managed connections which will result in improved performance.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| connectionAttributes | <code>Object</code> |  | The connection attributes object (see oracledb.getConnection for more details) |
| [connectionAttributes.ignoreReleaseErrors] | <code>Boolean</code> | <code>false</code> | If true, errors during connection.release() invoked internally will be ignored |
| [connectionAttributes.releaseOptions] | <code>Object</code> | <code>{force: true}</code> | The connection.release options (see connection.release for more info) |
| [connectionAttributes.releaseOptions.force] | <code>Boolean</code> | <code>true</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
| action | [<code>ConnectionAction</code>](#ConnectionAction) |  | An action requested to be invoked. |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) |  | Invoked with an error or the oracle connection instance |

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
<a name="OracleDB+event_pool-created"></a>

### "pool-created" (pool)
This events is triggered when a pool is created.

**Kind**: event emitted by [<code>OracleDB</code>](#OracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| pool | [<code>Pool</code>](#Pool) | The pool instance |

<a name="OracleDB+event_pool-released"></a>

### "pool-released" (pool)
This events is triggered after a pool is released.

**Kind**: event emitted by [<code>OracleDB</code>](#OracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| pool | [<code>Pool</code>](#Pool) | The pool instance |

<a name="OracleDB+event_connection-created"></a>

### "connection-created" (connection)
This events is triggered when a connection is created via oracledb.

**Kind**: event emitted by [<code>OracleDB</code>](#OracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The connection instance |

<a name="OracleDB+event_connection-released"></a>

### "connection-released" (connection)
This events is triggered when a connection is released successfully.

**Kind**: event emitted by [<code>OracleDB</code>](#OracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The connection instance |

<a name="OracleDB.extend"></a>

### OracleDB.extend(oracledb)
Extends the provided oracledb instance.

**Kind**: static method of [<code>OracleDB</code>](#OracleDB)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| oracledb | <code>Object</code> | The oracledb instance |

<a name="Pool"></a>

## Pool
**Kind**: global class  
**Emits**: <code>event:connection-created</code>, <code>event:connection-released</code>, <code>event:release</code>  
**Access**: public  
**Author**: Sagie Gur-Ari  

* [Pool](#Pool)
    * [new Pool()](#new_Pool_new)
    * [.simplified](#Pool.simplified) : <code>Boolean</code>
    * [#getConnection([callback])](#Pool+getConnection) ⇒ <code>Promise</code>
    * [#run(action, [options], [callback])](#Pool+run) ⇒ <code>Promise</code>
    * [#parallelQuery(querySpec, [options], [callback])](#Pool+parallelQuery) ⇒ <code>Promise</code>
    * [#terminate([callback])](#Pool+terminate) ⇒ <code>Promise</code>
    * [#close([callback])](#Pool+close) ⇒ <code>Promise</code>
    * _instance_
        * ["connection-created" (connection)](#Pool+event_connection-created)
        * ["connection-released" (connection)](#Pool+event_connection-released)
        * ["release"](#Pool+event_release)
    * _static_
        * [.extend(pool, [poolAttributes])](#Pool.extend)

<a name="new_Pool_new"></a>

### new Pool()
This class holds all the extended capabilities added the oracledb pool.

<a name="Pool.simplified"></a>

### Pool.simplified : <code>Boolean</code>
Marker property.

**Access**: public  
<a name="Pool+getConnection"></a>

### Pool#getConnection([callback]) ⇒ <code>Promise</code>
Wraps the original oracledb getConnection in order to provide an extended connection object.<br>
In addition, this function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
See [getConnection](https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool) for official API details.<br>
See [createPool](https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool) for extended createPool API details.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Emits**: <code>event:connection-created</code>  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or an extended connection object |

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
<a name="Pool+run"></a>

### Pool#run(action, [options], [callback]) ⇒ <code>Promise</code>
This function invokes the provided action (function) with a valid connection object and a callback.<br>
The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
must call the callback with an error (if any) and result.<br>
For promise support, the action can simply return a promise instead of calling the provided callback.<br>
The pool will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.<br>
For extended promise support, the action provided can return a promise instead of calling the provided callback (see examples).

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| action | [<code>ConnectionAction</code>](#ConnectionAction) |  | An action requested by the pool to be invoked. |
| [options] | <code>Object</code> |  | Optional runtime options |
| [options.ignoreReleaseErrors] | <code>Boolean</code> | <code>false</code> | If true, errors during connection.release() invoked by the pool will be ignored |
| [options.releaseOptions] | <code>Object</code> | <code>{force: true}</code> | The connection.release options (see connection.release for more info) |
| [options.releaseOptions.force] | <code>Boolean</code> | <code>true</code> | If force=true the connection.break will be called before trying to release to ensure all running activities are aborted |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) |  | Invoked with an error or the result of the action after the connection was released by the pool |

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
<a name="Pool+parallelQuery"></a>

### Pool#parallelQuery(querySpec, [options], [callback]) ⇒ <code>Promise</code>
This function invokes the requested queries in parallel (limiting it based on the amount of node.js thread pool size).<br>
In order for the queries to run in parallel, multiple connections will be used so use this with caution.

**Returns**: <code>Promise</code> - In case of no callback provided in input, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| querySpec | [<code>Array.&lt;QuerySpec&gt;</code>](#QuerySpec) | Array of query spec objects |
| [options] | <code>Object</code> | Optional runtime options |
| [options.limit] | <code>Number</code> | The max connections to be used in parallel (if not provided, it will be calcaulated based on the current node.js thread pool size) |
| [callback] | [<code>AsyncCallback</code>](#AsyncCallback) | Invoked with an error or an array of query results |

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
<a name="Pool+terminate"></a>

### Pool#terminate([callback]) ⇒ <code>Promise</code>
This function modifies the existing pool.terminate function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.<br>
The pool.terminate also has an alias pool.close for consistent close function naming to all relevant objects.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

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

### Pool#close([callback]) ⇒ <code>Promise</code>
Alias for pool.terminate, see pool.terminate for more info.

**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | An optional terminate callback function (see oracledb docs) |

<a name="Pool+event_connection-created"></a>

### "connection-created" (connection)
This events is triggered when a connection is created via pool.

**Kind**: event emitted by [<code>Pool</code>](#Pool)  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The connection instance |

<a name="Pool+event_connection-released"></a>

### "connection-released" (connection)
This events is triggered when a connection is released successfully.

**Kind**: event emitted by [<code>Pool</code>](#Pool)  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The connection instance |

<a name="Pool+event_release"></a>

### "release"
This events is triggered after the pool is released successfully.

**Kind**: event emitted by [<code>Pool</code>](#Pool)  
<a name="Pool.extend"></a>

### Pool.extend(pool, [poolAttributes])
Extends the provided oracledb pool instance.

**Kind**: static method of [<code>Pool</code>](#Pool)  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pool | <code>Object</code> |  | The oracledb pool instance |
| [poolAttributes] | <code>Object</code> |  | The connection pool attributes object |
| [poolAttributes.retryCount] | <code>Number</code> | <code>10</code> | The max amount of retries to get a connection from the pool in case of any error |
| [poolAttributes.retryInterval] | <code>Number</code> | <code>250</code> | The interval in millies between get connection retry attempts |
| [poolAttributes.runValidationSQL] | <code>Boolean</code> | <code>true</code> | True to ensure the connection returned is valid by running a test validation SQL |
| [poolAttributes.validationSQL] | <code>String</code> | <code>SELECT 1 FROM DUAL</code> | The test SQL to invoke before returning a connection to validate the connection is open |

<a name="ResultSetReadStream"></a>

## ResultSetReadStream
**Kind**: global class  
**Access**: public  
**Author**: Sagie Gur-Ari  

* [ResultSetReadStream](#ResultSetReadStream)
    * [new ResultSetReadStream()](#new_ResultSetReadStream_new)
    * [#close()](#ResultSetReadStream+close)

<a name="new_ResultSetReadStream_new"></a>

### new ResultSetReadStream()
A node.js read stream for resultsets.

<a name="ResultSetReadStream+close"></a>

### ResultSetReadStream#close()
Closes the stream and prevent any more data events from being invoked.<br>
It will also free the connection to enable using it to invoke more operations.

**Access**: public  
<a name="SimpleOracleDB"></a>

## SimpleOracleDB
**Kind**: global class  
**Access**: public  
**Author**: Sagie Gur-Ari  

* [SimpleOracleDB](#SimpleOracleDB)
    * [new SimpleOracleDB()](#new_SimpleOracleDB_new)
    * [.diagnosticInfo](#SimpleOracleDB.diagnosticInfo) : <code>Object</code>
    * [.enableDiagnosticInfo](#SimpleOracleDB.enableDiagnosticInfo) : <code>Boolean</code>
    * [#extend(oracledb)](#SimpleOracleDB+extend)
    * [#extend(pool)](#SimpleOracleDB+extend)
    * [#extend(connection)](#SimpleOracleDB+extend)
    * [#addExtension(type, name, extension, [options])](#SimpleOracleDB+addExtension) ⇒ <code>Boolean</code>
    * _instance_
        * ["pool-created" (pool)](#SimpleOracleDB+event_pool-created)
        * ["pool-released" (pool)](#SimpleOracleDB+event_pool-released)
        * ["connection-created" (connection)](#SimpleOracleDB+event_connection-created)
        * ["connection-released" (connection)](#SimpleOracleDB+event_connection-released)

<a name="new_SimpleOracleDB_new"></a>

### new SimpleOracleDB()
Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
See extend function for more info.

<a name="SimpleOracleDB.diagnosticInfo"></a>

### SimpleOracleDB.diagnosticInfo : <code>Object</code>
The pool/connection diagnostics info.<br>
This includes info of all live pools (including live time and create time) and all live connections (including parent pool if any, live time, create time and last SQL)

**Access**: public  
<a name="SimpleOracleDB.enableDiagnosticInfo"></a>

### SimpleOracleDB.enableDiagnosticInfo : <code>Boolean</code>
True if the monitoring is enabled and it will listen and store pool/connection diagnostics information.<br>
By default this is set to false.

**Access**: public  
<a name="SimpleOracleDB+extend"></a>

### SimpleOracleDB#extend(oracledb)
Extends the oracledb library which from that point will allow fetching the modified
connection objects via oracledb.getConnection or via pool.getConnection

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| oracledb | <code>oracledb</code> | The oracledb library |

**Example**  
```js
//load the oracledb library
var oracledb = require('oracledb');

//load the simple oracledb
var SimpleOracleDB = require('simple-oracledb');

//modify the original oracledb library
SimpleOracleDB.extend(oracledb);
```
<a name="SimpleOracleDB+extend"></a>

### SimpleOracleDB#extend(pool)
Extends the oracledb pool instance which from that point will allow fetching the modified
connection objects via pool.getConnection

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| pool | [<code>Pool</code>](#Pool) | The oracledb pool instance |

**Example**  
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
<a name="SimpleOracleDB+extend"></a>

### SimpleOracleDB#extend(connection)
Extends the oracledb connection instance which from that point will allow access to all
the extended capabilities of this library.

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The oracledb connection instance |

**Example**  
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
<a name="SimpleOracleDB+addExtension"></a>

### SimpleOracleDB#addExtension(type, name, extension, [options]) ⇒ <code>Boolean</code>
Adds an extension to all newly created objects of the requested type.<br>
An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
This function enables external libraries to further extend oracledb using a very simple API and without the need to wrap the pool/connection creation functions.<br>
Extension functions automatically get promisified unless specified differently in the optional options.

**Returns**: <code>Boolean</code> - True if added, false if ignored  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | <code>String</code> |  | Either 'connection' or 'pool' |
| name | <code>String</code> |  | The function name which will be added to the object |
| extension | <code>function</code> |  | The function to be added |
| [options] | <code>Object</code> |  | Any extension options needed |
| [options.promise] | <code>Object</code> |  | Promise options |
| [options.promise.noPromise] | <code>Boolean</code> | <code>false</code> | If true, do not promisify function |
| [options.promise.force] | <code>Boolean</code> | <code>false</code> | If true, do not check if promise is supported |
| [options.promise.defaultCallback] | <code>Boolean</code> | <code>false</code> | If true and no callback provided, generate an empty callback |
| [options.promise.callbackMinIndex] | <code>Number</code> | <code>0</code> | The minimum index in the arguments that the callback is found in |

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
<a name="SimpleOracleDB+event_pool-created"></a>

### "pool-created" (pool)
This events is triggered when a pool is created.

**Kind**: event emitted by [<code>SimpleOracleDB</code>](#SimpleOracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| pool | [<code>Pool</code>](#Pool) | The pool instance |

<a name="SimpleOracleDB+event_pool-released"></a>

### "pool-released" (pool)
This events is triggered after a pool is released.

**Kind**: event emitted by [<code>SimpleOracleDB</code>](#SimpleOracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| pool | [<code>Pool</code>](#Pool) | The pool instance |

<a name="SimpleOracleDB+event_connection-created"></a>

### "connection-created" (connection)
This events is triggered when a connection is created via oracledb.

**Kind**: event emitted by [<code>SimpleOracleDB</code>](#SimpleOracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The connection instance |

<a name="SimpleOracleDB+event_connection-released"></a>

### "connection-released" (connection)
This events is triggered when a connection is released successfully.

**Kind**: event emitted by [<code>SimpleOracleDB</code>](#SimpleOracleDB)  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | The connection instance |

<a name="ConnectionAction"></a>

## ConnectionAction : <code>function</code>
An action requested by the pool to be invoked.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| connection | [<code>Connection</code>](#Connection) | A valid connection to be used by the action |
| callback | [<code>AsyncCallback</code>](#AsyncCallback) | The callback to invoke at the end of the action |

<a name="QuerySpec"></a>

## QuerySpec : <code>Object</code>
Holds query invocation definitions.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>String</code> | The SQL to execute |
| [bindParams] | <code>Object</code> | Optional bind parameters |
| [options] | <code>Object</code> | Optional query options |

<a name="AsyncCallback"></a>

## AsyncCallback : <code>function</code>
Invoked when an async operation has finished.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>Error</code> | Any possible error |
| [output] | <code>Object</code> | The operation output |

