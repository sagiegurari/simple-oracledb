# simple-oracledb

[![NPM Version](http://img.shields.io/npm/v/simple-oracledb.svg?style=flat)](https://www.npmjs.org/package/simple-oracledb) [![Build Status](https://travis-ci.org/sagiegurari/simple-oracledb.svg)](http://travis-ci.org/sagiegurari/simple-oracledb) [![Coverage Status](https://coveralls.io/repos/sagiegurari/simple-oracledb/badge.svg)](https://coveralls.io/r/sagiegurari/simple-oracledb) [![Code Climate](https://codeclimate.com/github/sagiegurari/simple-oracledb/badges/gpa.svg)](https://codeclimate.com/github/sagiegurari/simple-oracledb) [![bitHound Score](https://www.bithound.io/sagiegurari/simple-oracledb/badges/score.svg)](https://www.bithound.io/sagiegurari/simple-oracledb) [![Inline docs](http://inch-ci.org/github/sagiegurari/simple-oracledb.svg?branch=master)](http://inch-ci.org/github/sagiegurari/simple-oracledb)<br>
[![License](https://img.shields.io/npm/l/simple-oracledb.svg?style=flat)](https://github.com/sagiegurari/simple-oracledb/blob/master/LICENSE) [![Total Downloads](https://img.shields.io/npm/dt/simple-oracledb.svg?style=flat)](https://www.npmjs.org/package/simple-oracledb) [![Dependency Status](https://david-dm.org/sagiegurari/simple-oracledb.svg)](https://david-dm.org/sagiegurari/simple-oracledb) [![devDependency Status](https://david-dm.org/sagiegurari/simple-oracledb/dev-status.svg)](https://david-dm.org/sagiegurari/simple-oracledb#info=devDependencies)<br>
[![Retire Status](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/simple-oracledb/master/package.json)](http://retire.insecurity.today/api/image?uri=https://raw.githubusercontent.com/sagiegurari/simple-oracledb/master/package.json)

> Extend capabilities of oracledb with simplified API for quicker development.

* [Overview](#overview)
* [Usage](#usage)
  * [query](#usage-query)
  * [insert](#usage-insert)
  * [update](#usage-update)
  * [release](#usage-release)
  * [terminate](#usage-terminate)
* [Installation](#installation)
* [Limitations](#limitations)
* [API Documentation](docs/api.md)
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
}
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
    }
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

<a name="usage-query"></a>
## 'connection.query(sql, bindVariables, [options], callback)'
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

<a name="usage-insert"></a>
## 'connection.insert(sql, bindVariables, options, callback)'
Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
The callback output will be the same as oracledb conection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

```js
connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
  id: 110,
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}, function onResults(error, output) {
  //continue flow...
});
```

<a name="usage-update"></a>
## 'connection.update(sql, bindVariables, options, callback)'
Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
The callback output will be the same as oracledb conection.execute.<br>
All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.

```js
connection.update('UPDATE mylobs SET name = :name, clob_column1 = EMPTY_CLOB(), blob_column2 = EMPTY_BLOB() WHERE id = :id', { //no need to specify the RETURNING clause in the SQL
  id: 110,
  name: 'My Name',
  clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
  blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
}, {
  lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
    clob_column1: 'clobText1', //map oracle column name to bind variable name
    blob_column2: 'blobBuffer2'
  }
}, function onResults(error, output) {
  //continue flow...
});
```

<a name="usage-release"></a>
## 'connection.release([callback])'
This function modifies the existing connection.release function by enabling the input callback to be an optional parameter.<br>
Since there is no real way to release a connection that fails to be released, all that you can do in the callback is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

```js
connection.release(); //no callback needed

//still possible to call with a release callback function
connection.release(function onRelease(error) {
  if (error) {
    //now what?
  }
});
```

<a name="usage-terminate"></a>
## 'pool.terminate([callback])'
This function modifies the existing pool.terminate function by enabling the input
callback to be an optional parameter.<br>
Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
is just log the error and continue.<br>
Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.

```js
pool.terminate(); //no callback needed

//still possible to call with a terminate callback function
pool.terminate(function onTerminate(error) {
  if (error) {
    //now what?
  }
});
```
<br>
**The rest of the API is the same as defined in the oracledb library: https://github.com/oracle/node-oracledb/blob/master/doc/api.md**

<a name="installation"></a>
## Installation
In order to use this library, just run the following npm install command:

```sh
npm install --save simple-oracledb
```

This library doesn't define oracledb as a dependency and therefore it is not installed when installing simple-oracledb.<br>
You should define oracledb in your package.json and install it based on the oracledb installation instructions found at: https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

<a name="limitations"></a>
## Limitations
The simpler API can lead to higher memory consumption and therefore might not be suitable in all cases.<br>
<br>
Also, since this is work in progress, only few capabilities currently were added.<br>
However, in the near future more and more functionality will be added.

## API Documentation
See full docs at: [API Docs](docs/api.md)

<a name="history"></a>
## Release History

| Date        | Version | Description |
| ----------- | ------- | ----------- |
| 2015-10-19  | v0.0.7  | Added pool.terminate support |
| 2015-10-19  | v0.0.6  | Maintenance |
| 2015-10-18  | v0.0.5  | Added connection.update support |
| 2015-10-18  | v0.0.4  | Added connection.insert support |
| 2015-10-16  | v0.0.3  | Maintenance |
| 2015-10-15  | v0.0.1  | Initial release. |

<a name="license"></a>
## License
Developed by Sagie Gur-Ari and licensed under the Apache 2 open source license.
