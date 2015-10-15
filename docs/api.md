## Classes
<dl>
<dt><a href="#Connection">Connection</a></dt>
<dd></dd>
<dt><a href="#Pool">Pool</a></dt>
<dd></dd>
</dl>
## Objects
<dl>
<dt><a href="#RecordReader">RecordReader</a> : <code>object</code></dt>
<dd><p>Record reading helper functions.</p>
</dd>
<dt><a href="#ResultSetReader">ResultSetReader</a> : <code>object</code></dt>
<dd><p>ResultSet object reading helper functions.</p>
</dd>
<dt><a href="#RowsReader">RowsReader</a> : <code>object</code></dt>
<dd><p>Rows array reading helper functions.</p>
</dd>
<dt><a href="#SimpleOracleDB">SimpleOracleDB</a> : <code>object</code></dt>
<dd><p>Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
See extend function for more info.</p>
</dd>
<dt><a href="#Stream">Stream</a> : <code>object</code></dt>
<dd><p>Stream helper functions.</p>
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
  * [#query([params])](#Connection+query)
  * [#release([callback])](#Connection+release)
  * _static_
    * [.extend(connection)](#Connection.extend)

<a name="new_Connection_new"></a>
### new Connection()
This class holds all the extended capabilities added the oracledb connection.

<a name="Connection.simplified"></a>
### Connection.simplified : <code>boolean</code>
Marker property.

**Access:** public  
<a name="Connection+query"></a>
### Connection#query([params])
Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
All LOBs will be read and all rows will be fetched.<br>
This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
The function arguments used to execute the query are exactly as defined in the oracledb connection.execute function.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>\*</code> | See oracledb connection.execute function |

**Example**  
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
  * [#getConnection([params], callback)](#Pool+getConnection)
  * _static_
    * [.extend(pool)](#Pool.extend)

<a name="new_Pool_new"></a>
### new Pool()
This class holds all the extended capabilities added the oracledb pool.

<a name="Pool.simplified"></a>
### Pool.simplified : <code>boolean</code>
Marker property.

**Access:** public  
<a name="Pool+getConnection"></a>
### Pool#getConnection([params], callback)
Wraps the original oracledb getConnection in order to provide an extended connection object.

**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>\*</code> | The oracledb pool getConnection arguments |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked with an error or an extended connection object |

<a name="Pool.extend"></a>
### Pool.extend(pool)
Extends the provided oracledb pool instance.

**Kind**: static method of <code>[Pool](#Pool)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| pool | <code>object</code> | The oracledb pool instance |

<a name="RecordReader"></a>
## RecordReader : <code>object</code>
Record reading helper functions.

**Kind**: global namespace  
**Author:** Sagie Gur-Ari  

* [RecordReader](#RecordReader) : <code>object</code>
  * [.blobType](#RecordReader.blobType) : <code>number</code>
  * _static_
    * [.getValue(field, callback)](#RecordReader.getValue) ℗
    * [.createFieldHandler(jsObject, columnName, value)](#RecordReader.createFieldHandler) ⇒ <code>function</code> ℗
    * [.read(columnNames, row, callback)](#RecordReader.read)

<a name="RecordReader.blobType"></a>
### RecordReader.blobType : <code>number</code>
Holds the BLOB type.

**Access:** public  
<a name="RecordReader.getValue"></a>
### RecordReader.getValue(field, callback) ℗
Returns the value of the field from the row.

**Kind**: static method of <code>[RecordReader](#RecordReader)</code>  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>object</code> | The field value |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the value is fully read or in case of an error |

<a name="RecordReader.createFieldHandler"></a>
### RecordReader.createFieldHandler(jsObject, columnName, value) ⇒ <code>function</code> ℗
Returns a handler function.

**Kind**: static method of <code>[RecordReader](#RecordReader)</code>  
**Returns**: <code>function</code> - The handler function  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| jsObject | <code>object</code> | The result object holder to populate |
| columnName | <code>string</code> | The field name |
| value | <code>object</code> | The field value |

<a name="RecordReader.read"></a>
### RecordReader.read(columnNames, row, callback)
Reads all data from the provided oracle record.

**Kind**: static method of <code>[RecordReader](#RecordReader)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| row | <code>object</code> &#124; <code>Array</code> | The oracle row object |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the row is fully read or in case of an error |

<a name="ResultSetReader"></a>
## ResultSetReader : <code>object</code>
ResultSet object reading helper functions.

**Kind**: global namespace  
**Author:** Sagie Gur-Ari  

* [ResultSetReader](#ResultSetReader) : <code>object</code>
  * [.readNextRows(columnNames, resultSet, callback)](#ResultSetReader.readNextRows) ℗
  * [.readAllRows(columnNames, resultSet, callback, jsRowsBuffer)](#ResultSetReader.readAllRows) ℗
  * [.read(columnNames, resultSet, callback)](#ResultSetReader.read)

<a name="ResultSetReader.readNextRows"></a>
### ResultSetReader.readNextRows(columnNames, resultSet, callback) ℗
Reads the next rows data from the provided oracle ResultSet object.

**Kind**: static method of <code>[ResultSetReader](#ResultSetReader)</code>  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> | The oracle ResultSet object |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the next rows have been read |

<a name="ResultSetReader.readAllRows"></a>
### ResultSetReader.readAllRows(columnNames, resultSet, callback, jsRowsBuffer) ℗
Reads all data from the provided oracle ResultSet object into the provided buffer.

**Kind**: static method of <code>[ResultSetReader](#ResultSetReader)</code>  
**Access:** private  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> | The oracle ResultSet object |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when all rows are fully read or in case of an error |
| jsRowsBuffer | <code>Array</code> | The result buffer |

<a name="ResultSetReader.read"></a>
### ResultSetReader.read(columnNames, resultSet, callback)
Reads all data from the provided oracle ResultSet object.

**Kind**: static method of <code>[ResultSetReader](#ResultSetReader)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| resultSet | <code>Array</code> | The oracle ResultSet object |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when all rows are fully read or in case of an error |

<a name="RowsReader"></a>
## RowsReader : <code>object</code>
Rows array reading helper functions.

**Kind**: global namespace  
**Author:** Sagie Gur-Ari  
<a name="RowsReader.read"></a>
### RowsReader.read(columnNames, rows, callback)
Reads all data from the provided oracle records array.

**Kind**: static method of <code>[RowsReader](#RowsReader)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| columnNames | <code>Array</code> | Array of strings holding the column names of the results |
| rows | <code>Array</code> | The oracle rows array |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when all rows are fully read or in case of an error |

<a name="SimpleOracleDB"></a>
## SimpleOracleDB : <code>object</code>
Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
See extend function for more info.

**Kind**: global namespace  
**Author:** Sagie Gur-Ari  

* [SimpleOracleDB](#SimpleOracleDB) : <code>object</code>
  * [.extend(oracledb)](#SimpleOracleDB.extend)
  * [.extend(pool)](#SimpleOracleDB.extend)
  * [.extend(connection)](#SimpleOracleDB.extend)

<a name="SimpleOracleDB.extend"></a>
### SimpleOracleDB.extend(oracledb)
Extends the oracledb library which from that point will allow fetching the modified
connection objects via oracledb.getConnection or via pool.getConnection

**Kind**: static method of <code>[SimpleOracleDB](#SimpleOracleDB)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| oracledb | <code>oracledb</code> | The oracledb library |

<a name="SimpleOracleDB.extend"></a>
### SimpleOracleDB.extend(pool)
Extends the oracledb pool instance which from that point will allow fetching the modified
connection objects via pool.getConnection

**Kind**: static method of <code>[SimpleOracleDB](#SimpleOracleDB)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| pool | <code>[Pool](#Pool)</code> | The oracledb pool instance |

<a name="SimpleOracleDB.extend"></a>
### SimpleOracleDB.extend(connection)
Extends the oracledb connection instance which from that point will allow access to all
the extended capabilities of this library.

**Kind**: static method of <code>[SimpleOracleDB](#SimpleOracleDB)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| connection | <code>[Connection](#Connection)</code> | The oracledb connection instance |

<a name="Stream"></a>
## Stream : <code>object</code>
Stream helper functions.

**Kind**: global namespace  
**Author:** Sagie Gur-Ari  
<a name="Stream.readFully"></a>
### Stream.readFully(readableStream, binary, callback)
Reads all data from the provided stream.<br>
The stream data is expected to be UTF-8 string.

**Kind**: static method of <code>[Stream](#Stream)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| readableStream | <code>object</code> | The readable stream |
| binary | <code>boolean</code> | True for binary stream, else character stream |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | called when the stream is fully read. |

<a name="AsyncCallback"></a>
## AsyncCallback : <code>function</code>
Invoked when an async operation has finished.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>error</code> | Any possible error |
| [output] | <code>object</code> | The operation output |

