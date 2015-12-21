## Classes

<dl>
<dt><a href="#Connection">Connection</a></dt>
<dd></dd>
<dt><a href="#Pool">Pool</a></dt>
<dd></dd>
<dt><a href="#RecordReader">RecordReader</a></dt>
<dd></dd>
<dt><a href="#RecordWriter">RecordWriter</a></dt>
<dd></dd>
<dt><a href="#ResultSetReader">ResultSetReader</a></dt>
<dd></dd>
<dt><a href="#RowsReader">RowsReader</a></dt>
<dd></dd>
<dt><a href="#SimpleOracleDB">SimpleOracleDB</a></dt>
<dd></dd>
<dt><a href="#Stream">Stream</a></dt>
<dd></dd>
</dl>

## Objects

<dl>
<dt><a href="#Constants">Constants</a> : <code>object</code></dt>
<dd><p>Library constants.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AsyncCallback">AsyncCallback</a> : <code>function</code></dt>
<dd><p>Invoked when an async operation has finished.</p>
</dd>
</dl>

<a name="Connection"></a>
## Connection
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [Connection](#Connection)
    * [new Connection()](#new_Connection_new)
    * [.simplified](#Connection.simplified) : <code>boolean</code>
    * [#noop()](#Connection+noop) ⇒ <code>undefined</code> ℗
    * [#query(sql, [bindParams], [options], callback)](#Connection+query)
    * [#insert(sql, bindParams, options, callback)](#Connection+insert)
    * [#update(sql, bindParams, options, callback)](#Connection+update)
    * [#insertOrUpdate(insert, argumentsArray)](#Connection+insertOrUpdate) ℗
    * [#release([callback])](#Connection+release)
    * [#rollback([callback])](#Connection+rollback)
    * [#queryJSON(sql, [bindParams], [options], callback)](#Connection+queryJSON)
    * [#batchInsert(sql, bindParamsArray, options, callback)](#Connection+batchInsert)
    * [#modifyParams(argumentsArray)](#Connection+modifyParams) ⇒ <code>object</code> ℗
    * [#createCallback(callback, commit, [output])](#Connection+createCallback) ⇒ <code>function</code> ℗
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
<a name="Connection+noop"></a>
### Connection#noop() ⇒ <code>undefined</code> ℗
Empty function.

**Returns**: <code>undefined</code> - Empty return  
**Access:** private  
<a name="Connection+query"></a>
### Connection#query(sql, [bindParams], [options], callback)
Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
All LOBs will be read and all rows will be fetched.<br>
This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
The function arguments used to execute the 'query' are exactly as defined in the oracledb connection.execute function.

**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sql | <code>string</code> |  | The SQL to execute |
| [bindParams] | <code>object</code> |  | Optional bind parameters |
| [options] | <code>object</code> |  | Optional execute options |
| [options.streamResults] | <code>object</code> |  | True to enable to stream the results in bulks, each bulk will invoke the provided callback (last callback invocation will have empty results) |
| [options.bulkRowsAmount] | <code>number</code> | <code>100</code> | The amount of rows to fetch (for streaming, thats the max rows that the callback will get for each streaming invocation) |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> |  | Invoked with an error or the query results object holding all data including LOBs |

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

//read all rows in bulks (streaming results)
connection.query('SELECT * FROM departments', {
  streamResults: true,
  bulkRowsAmount: 100 //The amount of rows to fetch (for streaming, thats the max rows that the callback will get for each streaming invocation)
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
<a name="Connection+insert"></a>
### Connection#insert(sql, bindParams, options, callback)
Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
The callback output will be the same as oracledb conection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| bindParams | <code>object</code> | The bind parameters used to specify the values for the columns |
| options | <code>object</code> | Any execute options |
| [options.autoCommit] | <code>object</code> | If you wish to commit after the insert, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
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
```
<a name="Connection+update"></a>
### Connection#update(sql, bindParams, options, callback)
Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
The callback output will be the same as oracledb conection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> | The SQL to execute |
| bindParams | <code>object</code> | The bind parameters used to specify the values for the columns |
| options | <code>object</code> | Any execute options |
| [options.autoCommit] | <code>object</code> | If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked) |
| [options.lobMetaInfo] | <code>object</code> | For LOB support this object must hold a mapping between DB column name and bind variable name |
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
<a name="Connection+insertOrUpdate"></a>
### Connection#insertOrUpdate(insert, argumentsArray) ℗
Internal function which handles both INSERT and UPDATE commands.

**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| insert | <code>boolean</code> | True for insert, false for update |
| argumentsArray | <code>Array</code> | The original arguments array |

<a name="Connection+release"></a>
### Connection#release([callback])
This function modifies the existing connection.release function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release a connection that fails to be released, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | An optional release callback function (see oracledb docs) |

**Example**  
```js
connection.release(); //no callback needed

//still possible to call with a release callback function
connection.release(function onRelease(error) {
  if (error) {
    //now what?
  }
});
```
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
The callback output will be an array of objects of same as oracledb conection.execute (per row).<br>
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
<a name="Connection+modifyParams"></a>
### Connection#modifyParams(argumentsArray) ⇒ <code>object</code> ℗
Internal function used to modify the INSERT/UPDATE SQL arguments.<br>
This function will add the RETURNING clause to the SQL to support LOBs modification after the INSERT/UPDATE finished.<br>
In addition it will modify the bind variables to specify the OUT bind to enable access to the LOB object.

**Returns**: <code>object</code> - LOB information used for SQL execution processing  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| argumentsArray | <code>Array</code> | Array of arguments provided in the insert/update functions |

<a name="Connection+createCallback"></a>
### Connection#createCallback(callback, commit, [output]) ⇒ <code>function</code> ℗
Internal function used to wrap the original callback.

**Returns**: <code>function</code> - A wrapper callback  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The callback function to invoke |
| commit | <code>boolean</code> | True to run commit |
| [output] | <code>object</code> | Optional output to pass to the callback |

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
**Access:** public  
**Author:** Sagie Gur-Ari  

* [Pool](#Pool)
    * [new Pool()](#new_Pool_new)
    * [.simplified](#Pool.simplified) : <code>boolean</code>
    * [#noop()](#Pool+noop) ⇒ <code>undefined</code> ℗
    * [#getConnection(callback)](#Pool+getConnection)
    * [#terminate([callback])](#Pool+terminate)
    * _static_
        * [.extend(pool, [poolAttributes])](#Pool.extend)

<a name="new_Pool_new"></a>
### new Pool()
This class holds all the extended capabilities added the oracledb pool.

<a name="Pool.simplified"></a>
### Pool.simplified : <code>boolean</code>
Marker property.

**Access:** public  
<a name="Pool+noop"></a>
### Pool#noop() ⇒ <code>undefined</code> ℗
Empty function.

**Returns**: <code>undefined</code> - Empty return  
**Access:** private  
<a name="Pool+getConnection"></a>
### Pool#getConnection(callback)
Wraps the original oracledb getConnection in order to provide an extended connection object.<br>
In addition, this function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
See https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool for official API details.<br>
See https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool for extended createPool API details.<br>

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or an extended connection object |

<a name="Pool+terminate"></a>
### Pool#terminate([callback])
This function modifies the existing pool.terminate function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

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
```
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

<a name="RecordReader"></a>
## RecordReader
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [RecordReader](#RecordReader)
    * [new RecordReader()](#new_RecordReader_new)
    * [#getValue(field, callback)](#RecordReader+getValue) ℗
    * [#createFieldHandler(jsObject, columnName, value)](#RecordReader+createFieldHandler) ⇒ <code>function</code> ℗
    * [#read(columnNames, row, callback)](#RecordReader+read)
    * [#readJSON(jsRow, column)](#RecordReader+readJSON) ⇒ <code>object</code>

<a name="new_RecordReader_new"></a>
### new RecordReader()
Record reading helper functions.

<a name="RecordReader+getValue"></a>
### RecordReader#getValue(field, callback) ℗
Returns the value of the field from the row.

**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>object</code> | The field value |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the value is fully read or in case of an error |

<a name="RecordReader+createFieldHandler"></a>
### RecordReader#createFieldHandler(jsObject, columnName, value) ⇒ <code>function</code> ℗
Returns a handler function.

**Returns**: <code>function</code> - The handler function  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| jsObject | <code>object</code> | The result object holder to populate |
| columnName | <code>string</code> | The field name |
| value | <code>object</code> | The field value |

<a name="RecordReader+read"></a>
### RecordReader#read(columnNames, row, callback)
Reads all data from the provided oracle record.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| row | <code>object</code> &#124; <code>Array</code> | The oracle row object |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the row is fully read or in case of an error |

<a name="RecordReader+readJSON"></a>
### RecordReader#readJSON(jsRow, column) ⇒ <code>object</code>
Read a JSON record.

**Returns**: <code>object</code> - The JSON object  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| jsRow | <code>object</code> | The JS object holding the row data. |
| column | <code>string</code> | The column name |

<a name="RecordWriter"></a>
## RecordWriter
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [RecordWriter](#RecordWriter)
    * [new RecordWriter()](#new_RecordWriter_new)
    * [#write(outBindings, lobData, callback)](#RecordWriter+write)
    * [#writeMultiple(outBindings, lobData, callback)](#RecordWriter+writeMultiple)

<a name="new_RecordWriter_new"></a>
### new RecordWriter()
Record writing helper functions.

<a name="RecordWriter+write"></a>
### RecordWriter#write(outBindings, lobData, callback)
Writes all LOBs columns via out bindings of the INSERT/UPDATE command.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| outBindings | <code>object</code> | The output bindings of the INSERT/UPDATE result |
| lobData | <code>object</code> | The LOB data holder (key column name, value column value) |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the row is fully written to or in case of an error |

<a name="RecordWriter+writeMultiple"></a>
### RecordWriter#writeMultiple(outBindings, lobData, callback)
Writes all LOBs columns via out bindings of the INSERT/UPDATE command with support of multiple rows.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| outBindings | <code>object</code> | The output bindings of the INSERT/UPDATE result |
| lobData | <code>object</code> | The LOB data holder (key column name, value column value) |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the row is fully written to or in case of an error |

<a name="ResultSetReader"></a>
## ResultSetReader
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [ResultSetReader](#ResultSetReader)
    * [new ResultSetReader()](#new_ResultSetReader_new)
    * [#readNextRows(columnNames, resultSet, [options], callback)](#ResultSetReader+readNextRows) ℗
    * [#readAllRows(columnNames, resultSet, options, callback, [jsRowsBuffer])](#ResultSetReader+readAllRows) ℗
    * [#read(columnNames, resultSet, options, callback)](#ResultSetReader+read)
    * [#stream(columnNames, resultSet, options, callback)](#ResultSetReader+stream)

<a name="new_ResultSetReader_new"></a>
### new ResultSetReader()
ResultSet object reading helper functions.

<a name="ResultSetReader+readNextRows"></a>
### ResultSetReader#readNextRows(columnNames, resultSet, [options], callback) ℗
Reads the next rows data from the provided oracle ResultSet object.

**Access:** private  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| columnNames | <code>Array</code> |  | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> |  | The oracle ResultSet object |
| [options] | <code>object</code> |  | Any options |
| [options.bulkRowsAmount] | <code>number</code> | <code>100</code> | The amount of rows to fetch |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> |  | called when the next rows have been read |

<a name="ResultSetReader+readAllRows"></a>
### ResultSetReader#readAllRows(columnNames, resultSet, options, callback, [jsRowsBuffer]) ℗
Reads all data from the provided oracle ResultSet object into the provided buffer.

**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> | The oracle ResultSet object |
| options | <code>object</code> | Any options |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when all rows are fully read or in case of an error |
| [jsRowsBuffer] | <code>Array</code> | The result buffer, if not provided, the callback will be called for each bulk |

<a name="ResultSetReader+read"></a>
### ResultSetReader#read(columnNames, resultSet, options, callback)
Reads all data from the provided oracle ResultSet object.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> | The oracle ResultSet object |
| options | <code>object</code> | Any options |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when all rows are fully read or in case of an error |

<a name="ResultSetReader+stream"></a>
### ResultSetReader#stream(columnNames, resultSet, options, callback)
Streams all data from the provided oracle ResultSet object to the callback in bulks.<br>
The last callback call will have an empty result.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> | The oracle ResultSet object |
| options | <code>object</code> | Any options |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called for each read bulk of rows or in case of an error |

<a name="RowsReader"></a>
## RowsReader
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [RowsReader](#RowsReader)
    * [new RowsReader()](#new_RowsReader_new)
    * [#read(columnNames, rows, callback)](#RowsReader+read)
    * [#readJSON(jsRows)](#RowsReader+readJSON) ⇒ <code>object</code>

<a name="new_RowsReader_new"></a>
### new RowsReader()
Rows array reading helper functions.

<a name="RowsReader+read"></a>
### RowsReader#read(columnNames, rows, callback)
Reads all data from the provided oracle records array.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| rows | <code>Array</code> | The oracle rows array |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when all rows are fully read or in case of an error |

<a name="RowsReader+readJSON"></a>
### RowsReader#readJSON(jsRows) ⇒ <code>object</code>
Read a JSON rows.

**Returns**: <code>object</code> - The JSON object  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| jsRows | <code>Array</code> | The JS objects holding the row data. |

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
| poolAttributes | <code>object</code> |  | The connection pool attributes object |
| [poolAttributes.retryCount] | <code>number</code> | <code>10</code> | The max amount of retries to get a connection from the pool in case of any error |
| [poolAttributes.retryInterval] | <code>number</code> | <code>250</code> | The interval in millies between get connection retry attempts |
| [poolAttributes.runValidationSQL] | <code>boolean</code> | <code>true</code> | True to ensure the connection returned is valid by running a test validation SQL |
| [poolAttributes.validationSQL] | <code>string</code> | <code>&quot;SELECT 1 FROM DUAL&quot;</code> | The test SQL to invoke before returning a connection to validate the connection is open |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> |  | Invoked with an error or the oracle connection pool instance |

<a name="Stream"></a>
## Stream
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [Stream](#Stream)
    * [new Stream()](#new_Stream_new)
    * [#read(readableStream, binary, callback)](#Stream+read)
    * [#write(writableStream, data, callback)](#Stream+write)

<a name="new_Stream_new"></a>
### new Stream()
Stream helper functions.

<a name="Stream+read"></a>
### Stream#read(readableStream, binary, callback)
Reads all data from the provided stream.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| readableStream | <code>object</code> | The readable stream |
| binary | <code>boolean</code> | True for binary stream, else character stream |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the stream is fully read. |

<a name="Stream+write"></a>
### Stream#write(writableStream, data, callback)
Writes the provided data to the stream.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| writableStream | <code>object</code> | The writable stream |
| data | <code>Buffer</code> &#124; <code>string</code> | The text of binary data to write |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the data is fully written to the provided stream |

<a name="Constants"></a>
## Constants : <code>object</code>
Library constants.

**Kind**: global namespace  
**Author:** Sagie Gur-Ari  

* [Constants](#Constants) : <code>object</code>
    * [.clobType](#Constants.clobType) : <code>number</code>
    * [.blobType](#Constants.blobType) : <code>number</code>
    * [.bindOut](#Constants.bindOut) : <code>number</code>

<a name="Constants.clobType"></a>
### Constants.clobType : <code>number</code>
Holds the CLOB type.

**Access:** public  
<a name="Constants.blobType"></a>
### Constants.blobType : <code>number</code>
Holds the BLOB type.

**Access:** public  
<a name="Constants.bindOut"></a>
### Constants.bindOut : <code>number</code>
Holds the BIND_OUT value.

**Access:** public  
<a name="AsyncCallback"></a>
## AsyncCallback : <code>function</code>
Invoked when an async operation has finished.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>error</code> | Any possible error |
| [output] | <code>object</code> | The operation output |

