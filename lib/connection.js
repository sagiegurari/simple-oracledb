'use strict';

var debug = require('debuglog')('simple-oracledb');
var asyncLib = require('async');
var rowsReader = require('./rows-reader');
var resultSetReader = require('./resultset-reader');
var recordWriter = require('./record-writer');
var constants = require('./constants');
var ResultSetReadStream = require('./resultset-read-stream');
var singleAsyncCallback = require('./single-async-callback');
var extensions = require('./extensions');
var emitter = require('./emitter');
var promiseHelper = require('./promise-helper');

var connectionIDCounter = 0;

/**
 * This events is triggered when the connection is released successfully.
 *
 * @event Connection#release
 */

/*jslint debug: true */
/*istanbul ignore next*/
/**
 * This class holds all the extended capabilities added the oracledb connection.
 *
 * @author Sagie Gur-Ari
 * @class Connection
 * @public
 * @fires event:release
 */
function Connection() {
    //should not be called
}
/*jslint debug: false */

/**
 * Marker property.
 *
 * @member {boolean}
 * @alias Connection.simplified
 * @memberof! Connection
 * @public
 */
Connection.prototype.simplified = true;

/**
 * Empty function.
 *
 * @function
 * @memberof! Connection
 * @private
 * @returns {undefined} Empty return
 */
Connection.prototype.noop = function () {
    return undefined;
};

/**
 * Extends the original oracledb connection.execute to provide additional behavior.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} [bindParams] - Optional bind parameters
 * @param {object} [options] - Optional execute options
 * @param {AsyncCallback} [callback] - Callback function with the execution results
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
Connection.prototype.execute = function () {
    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    if (this.inTransaction && (argumentsArray.length >= 3)) {
        if (typeof argumentsArray[2] !== 'function') {
            argumentsArray[2].autoCommit = false;
        }
    }

    var sql;
    if ((argumentsArray[0]) && (typeof argumentsArray[0] === 'string')) {
        sql = argumentsArray[0];
    }
    this.diagnosticInfo.lastSQL = sql;

    return this.baseExecute.apply(this, argumentsArray);
};

/**
 * Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
 * The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
 * All LOBs will be read and all rows will be fetched.<br>
 * This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
 * The function arguments used to execute the 'query' are exactly as defined in the oracledb connection.execute function.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} [bindParams] - Optional bind parameters
 * @param {object} [options] - Optional execute options
 * @param {object} [options.splitResults=false] - True to enable to split the results into bulks, each bulk will invoke the provided callback (last callback invocation will have empty results, promise not supported). See also bulkRowsAmount option.
 * @param {object} [options.streamResults=false] - True to enable to stream the results, the callback will receive a read stream object which can be piped or used with standard stream events (ignored if splitResults=true).
 * @param {number} [options.bulkRowsAmount=100] - The amount of rows to fetch (for splitting results, that is the max rows that the callback will get for each callback invocation)
 * @param {AsyncCallback} [callback] - Invoked with an error or the query results object holding all data including LOBs
 * @returns {ResultSetReadStream|Promise} The stream to read the results from (if streamResults=true in options) or promise if callback not provided
 * @example
 * ```js
 * //read all rows and get an array of objects with all data
 * connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], function onResults(error, results) {
 *   if (error) {
 *     //handle error...
 *   } else {
 *     //print the 4th row DEPARTMENT_ID column value
 *     console.log(results[3].DEPARTMENT_ID);
 *   }
 * });
 *
 * //read all rows in bulks (split results via option.splitResults)
 * connection.query('SELECT * FROM departments WHERE manager_id > :id', [110], {
 *   splitResults: true,
 *   bulkRowsAmount: 100 //The amount of rows to fetch (for splitting results, that is the max rows that the callback will get for each callback invocation)
 * }, function onResults(error, results) {
 *   if (error) {
 *     //handle error...
 *   } else if (results.length) {
 *     //handle next bulk of results
 *   } else {
 *     //all rows read
 *   }
 * });
 *
 * //stream all rows (options.streamResults)
 * //if callback is provided, the stream is provided in the result as well
 * var stream = connection.query('SELECT * FROM departments WHERE manager_id > :id', [110], {
 *   streamResults: true
 * });
 *
 * //listen to fetched rows via data event or just pipe to another handler
 * stream.on('data', function (row) {
 *   //use row object
 *
 *   if (row.MY_ID === 800) {
 *     stream.close(); //optionally call the close function to prevent any more 'data' events and free the connection to execute other operations
 *   }
 * });
 *
 * //listen to other events such as end/close/error....
 * ```
 */
Connection.prototype.query = function () {
    var self = this;

    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var callback;
    if (typeof argumentsArray[argumentsArray.length - 1] === 'function') { //if last argument is callback
        callback = argumentsArray.pop();
    }

    var options = argumentsArray[argumentsArray.length - 1];
    var handleType = 0;
    var output;

    var queryAsync = function (promiseCallback) {
        callback = callback || promiseCallback;

        if ((!output) && (!callback)) {
            throw new Error('Callback not provided.');
        }

        argumentsArray.push(self.createQueryCallback(callback, options, handleType, output));

        self.execute.apply(self, argumentsArray);
    };

    if (typeof options === 'object') {
        if (options.splitResults) {
            handleType = 1;
        } else if (options.streamResults || options.stream) { //support also the oracledb stream option
            handleType = 2;

            output = new ResultSetReadStream();
        }

        if (handleType) {
            options.resultSet = true;

            //use simple-oracledb streaming instead of oracledb stream capability (which is actually based on this project)
            delete options.stream;
        }
    }

    //if promise requested and supported by current platform
    if ((!output) && (!callback) && (handleType !== 1)) { //split doesn't support promise
        output = promiseHelper.runPromise(queryAsync, callback, (!output) && (handleType !== 1));
    } else {
        queryAsync();
    }

    return output;
};

/**
 * Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
 * The callback output will be the same as oracledb connection.execute.<br>
 * All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} [bindParams] - The bind parameters used to specify the values for the columns
 * @param {object} [options] - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the insert, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {object} [options.returningInfo] - columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided)
 * @param {AsyncCallback} [callback] - Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
 *   id: 110,
 *   clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
 *   blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
 * }, {
 *   autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
 *   lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
 *     clob_column1: 'clobText1', //map oracle column name to bind variable name
 *     blob_column2: 'blobBuffer2'
 *   }
 * }, function onResults(error, output) {
 *   //continue flow...
 * });
 *
 * //add few more items to the RETURNING clause (only used if lobMetaInfo is provided)
 * connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:myid, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
 *   myid: {
 *     type: oracledb.NUMBER,
 *     dir: oracledb.BIND_INOUT,
 *     val: 1234
 *   },
 *   clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
 *   blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
 * }, {
 *   autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
 *   lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
 *     clob_column1: 'clobText1', //map oracle column name to bind variable name
 *     blob_column2: 'blobBuffer2'
 *   },
 *   returningInfo: { //all items in this column/bind variable object will be added to the generated RETURNING clause
 *     id: 'myid'
 *   }
 * }, function onResults(error, output) {
 *   //continue flow...
 * });
 * ```
 */
Connection.prototype.insert = function () {
    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    return this.insertOrUpdate(true, argumentsArray);
};

/**
 * Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
 * The callback output will be the same as oracledb connection.execute.<br>
 * All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} [bindParams] - The bind parameters used to specify the values for the columns
 * @param {object} [options] - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {object} [options.returningInfo] - columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example
 * @param {AsyncCallback} [callback] - Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * connection.update('UPDATE mylobs SET name = :name, clob_column1 = EMPTY_CLOB(), blob_column2 = EMPTY_BLOB() WHERE id = :id', { //no need to specify the RETURNING clause in the SQL
 *   id: 110,
 *   name: 'My Name',
 *   clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
 *   blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
 * }, {
 *   autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
 *   lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
 *     clob_column1: 'clobText1', //map oracle column name to bind variable name
 *     blob_column2: 'blobBuffer2'
 *   }
 * }, function onResults(error, output) {
 *   //continue flow...
 * });
 * ```
 */
Connection.prototype.update = function () {
    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    return this.insertOrUpdate(false, argumentsArray);
};

/**
 * Internal function which handles both INSERT and UPDATE commands.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {boolean} insert - True for insert, false for update
 * @param {Array} argumentsArray - The original arguments array
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 */
Connection.prototype.insertOrUpdate = function (insert, argumentsArray) {
    var self = this;

    var lobInfo = self.modifyParams(argumentsArray);
    var lobColumns = lobInfo.lobColumns;
    var lobData = lobInfo.lobData;
    var autoCommit = lobInfo.autoCommit;

    var callback;
    if (typeof argumentsArray[argumentsArray.length - 1] === 'function') {
        callback = argumentsArray.pop();
    }

    var insertOrUpdateAsync = function (promiseCallback) {
        callback = callback || promiseCallback;

        argumentsArray.push(function onExecute(error, results) {
            var wrapper = self.createModifyCallback(callback, autoCommit, results);

            if ((!error) && results && lobColumns && lobColumns.length) {
                if (insert && (results.rowsAffected === 1)) {
                    recordWriter.write(results.outBinds, lobData, wrapper);
                    wrapper = self.noop;
                } else if ((!insert) && (results.rowsAffected >= 1)) {
                    recordWriter.writeMultiple(results.outBinds, lobData, wrapper);
                    wrapper = self.noop;
                }
            }

            wrapper(error, results);
        });

        self.execute.apply(self, argumentsArray);
    };

    return promiseHelper.run(insertOrUpdateAsync, callback, true);
};

/**
 * This function modifies the existing connection.release function by enabling the input
 * callback to be an optional parameter and providing ability to auto retry in case of any errors during release.<br>
 * The connection.release also has an alias connection.close for consistent close function naming to all relevant objects.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {object} [options] - Optional options used to define error handling (retry is enabled only if options are provided)
 * @param {number} [options.retryCount=10] - Optional number of retries in case of any error during the release
 * @param {number} [options.retryInterval=250] - Optional interval in millies between retries
 * @param {boolean} [options.force=false] - If force=true the connection.break will be called before trying to release to ensure all running activities are aborted
 * @param {function} [callback] - An optional release callback function (see oracledb docs)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @fires event:release
 * @example
 * ```js
 * connection.release(); //no callback needed
 *
 * //still possible to call with a release callback function
 * connection.release(function onRelease(error) {
 *   if (error) {
 *     //now what?
 *   }
 * });
 *
 * //retry release in case of errors is enabled if options are provided
 * connection.release({
 *   retryCount: 20, //retry max 20 times in case of errors (default is 10 if not provided)
 *   retryInterval: 1000 //retry every 1 second (default is 250 millies if not provided)
 * });
 *
 * //you can provide both retry options and callback (callback will be called only after all retries are done or in case connection was released)
 * connection.release({
 *   retryCount: 10,
 *   retryInterval: 250,
 *   force: true //break any running operation before running release
 * }, function onRelease(error) {
 *   if (error) {
 *     //now what?
 *   }
 * });
 *
 * //can also use close instead of release
 * connection.close({
 *   retryCount: 10,
 *   retryInterval: 250
 * }, function onRelease(error) {
 *   if (error) {
 *     //now what?
 *   }
 * });
 * ```
 */
Connection.prototype.release = function () {
    var self = this;

    var args = Array.prototype.slice.call(arguments);

    var callback;
    var options;

    if (args.length === 2) {
        options = args[0];
        callback = args[1];
    } else if (args.length === 1) {
        if (typeof args[0] === 'function') {
            callback = args[0];
        } else {
            options = args[0];
        }
    }

    var force;
    if (options) {
        options.retryCount = Math.max(options.retryCount || 10, 1);
        options.retryInterval = Math.max(options.retryInterval || 250, 1);
        force = options.force;
    }

    var releaseAsync = function (promiseCallback) {
        callback = callback || promiseCallback || self.noop;

        if (options) {
            asyncLib.retry({
                times: options.retryCount,
                interval: options.retryInterval
            }, function attemptRelease(asyncRetryCallback) {
                asyncLib.series([
                    function breakOperations(asyncReleaseCallback) {
                        if (force) {
                            self.break(function onBreak(breakError) {
                                if (breakError) {
                                    debug('Unable to break connection operations, ', breakError.stack);
                                }

                                self.rollback(function onRollback(rollbackError) {
                                    /*istanbul ignore next*/
                                    if (rollbackError) {
                                        debug('Unable to rollback connection, ', rollbackError.stack);
                                    }

                                    asyncReleaseCallback(); //never pass this error to allow the release attempt
                                });
                            });
                        } else {
                            asyncReleaseCallback();
                        }
                    },
                    function runRelease(asyncReleaseCallback) {
                        self.baseRelease(function onRelease(error) {
                            if (error) {
                                debug('Unable to release connection, ', error.stack);
                            } else {
                                self.emit('release');
                            }

                            asyncReleaseCallback(error);
                        });
                    }
                ], asyncRetryCallback);
            }, callback);
        } else {
            self.baseRelease(function onRelease(error) {
                /*istanbul ignore else*/
                if (!error) {
                    self.emit('release');
                }

                callback(error);
            });
        }
    };

    return promiseHelper.run(releaseAsync, callback);
};

/**
 * Alias for connection.release, see connection.release for more info.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {object} [options] - Optional options used to define error handling (retry is enabled only if options are provided)
 * @param {number} [options.retryCount=10] - Optional number of retries in case of any error during the release
 * @param {number} [options.retryInterval=250] - Optional interval in millies between retries
 * @param {boolean} [options.force=false] - If force=true the connection.break will be called before trying to release to ensure all running activities are aborted
 * @param {function} [callback] - An optional release callback function (see oracledb docs)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @fires event:release
 */
Connection.prototype.close = Connection.prototype.release;

/**
 * Extends the connection.commit to prevent commit being invoked while in the middle of a transaction.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {function} [callback] - The commit callback function (see oracledb docs)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 */
Connection.prototype.commit = function (callback) {
    var self = this;

    var commitAsync = function (promiseCallback) {
        callback = callback || promiseCallback;

        if (self.inTransaction) {
            callback(new Error('Connection is in the middle of a transaction.'));
        } else {
            self.baseCommit(callback);
        }
    };

    return promiseHelper.run(commitAsync, callback);
};

/**
 * This function modifies the existing connection.rollback function by enabling the input
 * callback to be an optional parameter.<br>
 * If rollback fails, you can't really rollback again the data, so the callback is not always needed.<br>
 * Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {function} [callback] - An optional rollback callback function (see oracledb docs)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * connection.rollback(); //no callback needed
 *
 * //still possible to call with a rollback callback function
 * connection.rollback(function onRollback(error) {
 *   if (error) {
 *     //now what?
 *   }
 * });
 * ```
 */
Connection.prototype.rollback = function (callback) {
    var self = this;

    var rollbackAsync = function (promiseCallback) {
        callback = callback || promiseCallback || self.noop;

        if (self.inTransaction) {
            callback(new Error('Connection is in the middle of a transaction.'));
        } else {
            self.baseRollback(callback);
        }
    };

    return promiseHelper.run(rollbackAsync, callback);
};

/**
 * This function will invoke the provided SQL SELECT and return a results object with the returned row count and the JSONs.<br>
 * The json property will hold a single JSON object in case the returned row count is 1, and an array of JSONs in case the row count is higher.<br>
 * The query expects that only 1 column is fetched and if more are detected in the results, this function will return an error in the callback.<br>
 * The function arguments used to execute the 'queryJSON' are exactly as defined in the oracledb connection.execute function.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} [bindParams] - Optional bind parameters
 * @param {object} [options] - Optional execute options
 * @param {AsyncCallback} [callback] - Invoked with an error or the query results object holding the row count and JSONs
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * connection.queryJSON('SELECT JSON_DATA FROM APP_CONFIG WHERE ID > :id', [110], function onResults(error, results) {
 *   if (error) {
 *     //handle error...
 *   } else if (results.rowCount === 1) { //single JSON is returned
 *     //print the JSON
 *     console.log(results.json);
 *   } else if (results.rowCount > 1) { //multiple JSONs are returned
 *     //print the JSON
 *     results.json.forEach(function printJSON(json) {
 *       console.log(json);
 *     });
 *   } else {
 *     console.log('Did not find any results');
 *   }
 * });
 * ```
 */
Connection.prototype.queryJSON = function () {
    var self = this;

    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var callback;
    if (typeof argumentsArray[argumentsArray.length - 1] === 'function') { //if last argument is callback
        callback = argumentsArray.pop();
    }

    var queryJSONAsync = function (promiseCallback) {
        callback = callback || promiseCallback;

        argumentsArray.push(function onExecute(error, jsRows) {
            if (error) {
                callback(error);
            } else if ((!jsRows) || (!jsRows.length)) {
                callback(null, {
                    rowCount: 0,
                    json: []
                });
            } else {
                var callbackCalled = false;
                var json;
                try {
                    json = rowsReader.readJSON(jsRows);
                } catch (parseError) {
                    callbackCalled = true;
                    callback(parseError);
                }

                if (!callbackCalled) {
                    var output = {
                        rowCount: jsRows.length,
                        json: json
                    };

                    if (output.json.length === 1) {
                        output.json = output.json[0];
                    }

                    callback(null, output);
                }
            }
        });

        self.query.apply(self, argumentsArray);
    };

    return promiseHelper.run(queryJSONAsync, callback, true);
};

/**
 * Enables to run an INSERT SQL statement multiple times for each of the provided bind params.<br>
 * This allows to insert to same table multiple different rows with one single call.<br>
 * The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
 * All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
 * the bind params is now an array of bind params (one per row).
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {Array} bindParamsArray - An array of instances of object/Array bind parameters used to specify the values for the columns per row
 * @param {object} options - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {object} [options.returningInfo] - columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example
 * @param {AsyncCallback} [callback] - Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * connection.batchInsert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', [ //no need to specify the RETURNING clause in the SQL
 *   { //first row values
 *     id: 110,
 *     clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
 *     blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
 *   },
 *   { //second row values
 *     id: 111,
 *     clobText1: 'second row',
 *     blobBuffer2: new Buffer('second rows')
 *   }
 * ], {
 *   autoCommit: true, //must be set to true in options to support auto commit after insert is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
 *   lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
 *     clob_column1: 'clobText1', //map oracle column name to bind variable name
 *     blob_column2: 'blobBuffer2'
 *   }
 * }, function onResults(error, output) {
 *   //continue flow...
 * });
 * ```
 */
Connection.prototype.batchInsert = function (sql, bindParamsArray, options, callback) {
    return this.batchInsertOrUpdate(true, sql, bindParamsArray, options, callback);
};

/**
 * Enables to run an UPDATE SQL statement multiple times for each of the provided bind params.<br>
 * This allows to update to same table multiple different rows with one single call.<br>
 * The callback output will be an array of objects of same as oracledb connection.execute (per row).<br>
 * All LOBs for all rows will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory and
 * the bind params is now an array of bind params (one per row).
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} bindParamsArray - An array of instances of object/Array bind parameters used to specify the values for the columns per row
 * @param {object} options - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {object} [options.returningInfo] - columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example
 * @param {AsyncCallback} [callback] - Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * connection.batchUpdate('UPDATE mylobs SET name = :name, clob_column1 = EMPTY_CLOB(), blob_column2 = EMPTY_BLOB() WHERE id = :id', [ //no need to specify the RETURNING clause in the SQL
 *   { //first row values
 *     id: 110,
 *     clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
 *     blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
 *   },
 *   { //second row values
 *     id: 111,
 *     clobText1: 'second row',
 *     blobBuffer2: new Buffer('second rows')
 *   }
 * ], {
 *   autoCommit: true, //must be set to true in options to support auto commit after update is done, otherwise the auto commit will be false (oracledb.autoCommit is not checked)
 *   lobMetaInfo: { //if LOBs are provided, this data structure must be provided in the options object and the bind variables parameter must be an object (not array)
 *     clob_column1: 'clobText1', //map oracle column name to bind variable name
 *     blob_column2: 'blobBuffer2'
 *   }
 * }, function onResults(error, output) {
 *   //continue flow...
 * });
 * ```
 */
Connection.prototype.batchUpdate = function (sql, bindParamsArray, options, callback) {
    return this.batchInsertOrUpdate(false, sql, bindParamsArray, options, callback);
};

/**
 * Internal function to run batch INSERT/UPDATE commands.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {boolean} insert - True for insert, false for update
 * @param {string} sql - The SQL to execute
 * @param {object} bindParamsArray - An array of instances of object/Array bind parameters used to specify the values for the columns per row
 * @param {object} options - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the insert/update, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {object} [options.returningInfo] - columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided), see connection.insert example
 * @param {AsyncCallback} [callback] - Invoked with an error or the insert/update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * ```
 */
Connection.prototype.batchInsertOrUpdate = function (insert, sql, bindParamsArray, options, callback) {
    var self = this;

    var batchInsertOrUpdateAsync = function (promiseCallback) {
        callback = callback || promiseCallback;

        //auto commit should wrap all commands
        var commit = options.autoCommit;
        options.autoCommit = false;
        if (self.inTransaction) {
            commit = false;
        }

        var operation = 'update';
        if (insert) {
            operation = 'insert';
        }

        //create tasks
        var tasks = [];
        bindParamsArray.forEach(function createTask(bindParams) {
            tasks.push(function executeTask(asyncCallback) {
                self[operation](sql, bindParams, options, asyncCallback);
            });
        });

        asyncLib.parallel(tasks, function onBatchDone(error, results) {
            var batchCallback = self.createModifyCallback(callback, commit, results);
            batchCallback(error);
        });
    };

    return promiseHelper.run(batchInsertOrUpdateAsync, callback, true);
};

/**
 * Enables to run multiple oracle operations in a single transaction.<br>
 * This function basically allows to automatically commit or rollback once all your actions are done.<br>
 * Actions are basically javascript functions which get a callback when invoked, and must call that callback with error or result.<br>
 * All provided actions are executed in parallel unless options.sequence=true is provided.<br>
 * Once all actions are done, in case of any error in any action, a rollback will automatically get invoked, otherwise a commit will be invoked.<br>
 * Once the rollback/commit is done, the provided callback will be invoked with the error (if any) and results of all actions.<br>
 * When calling any connection operation (execute, insert, update, ...) the connection will automatically set the autoCommit=false and will ignore the value provided.<br>
 * This is done to prevent commits in the middle of the transaction.<br>
 * In addition, you can not start a transaction while another transaction is in progress.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {Array|function} actions - A single action function or an array of action functions.
 * @param {object} [options] - Any transaction options
 * @param {boolean} [options.sequence=false] - True to run all actions in sequence, false to run them in parallel (default)
 * @param {AsyncCallback} [callback] - Invoked with an error or the transaction results
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 * @example
 * ```js
 * //run all actions in parallel
 * connection.transaction([
 *   function insertSomeRows(callback) {
 *     connection.insert(...., function (error, results) {
 *       //some more inserts....
 *       connection.insert(...., callback);
 *     });
 *   },
 *   function insertSomeMoreRows(callback) {
 *     connection.insert(...., callback);
 *   },
 *   function doSomeUpdates(callback) {
 *     connection.update(...., callback);
 *   },
 *   function runBatchUpdates(callback) {
 *     connection.batchUpdate(...., callback);
 *   }
 * ], function onTransactionResults(error, output) {
 *   //continue flow...
 * });
 *
 * //run all actions in sequence
 * connection.transaction([
 *   function firstAction(callback) {
 *     connection.insert(...., callback);
 *   },
 *   function secondAction(callback) {
 *     connection.update(...., callback);
 *   }
 * ], {
 *   sequence: true
 * }, function onTransactionResults(error, output) {
 *   //continue flow...
 * });
 * ```
 */
Connection.prototype.transaction = function (actions, options, callback) {
    var self = this;

    if ((!callback) && options && (typeof options === 'function')) {
        callback = options;
        options = null;
    }

    var transactionAsync = function (promiseCallback) {
        callback = callback || promiseCallback;

        if (actions) {
            if (self.inTransaction) {
                callback(new Error('Connection already running a transaction.'));
            } else {
                self.inTransaction = true;

                if (typeof actions === 'function') {
                    actions = [actions];
                }

                options = options || {};

                var asyncFunc = 'parallel';
                if (options.sequence) {
                    asyncFunc = 'series';
                }

                asyncLib[asyncFunc](actions, function onTransactionEnd(error, results) {
                    var transactionCallback = self.createModifyCallback(callback, true, results);

                    self.inTransaction = false;
                    transactionCallback(error);
                });
            }
        }
    };

    return promiseHelper.run(transactionAsync, callback, true);
};

/**
 * Internal function used to generate the returning into clause.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {string} sql - The original SQL
 * @param {object} lobMetaInfo - The LOB meta info object
 * @param {Array} lobColumns - The LOB column names
 * @param {object} [additionalReturningInfo] - columnName/bindVarName pairs which will be added to the RETURNING ... INTO ... clause (only used if lobMetaInfo is provided)
 * @returns {string} The modified SQL
 */
Connection.prototype.generateReturningClause = function (sql, lobMetaInfo, lobColumns, additionalReturningInfo) {
    var buffer = [sql];

    buffer.push(' RETURNING ');

    var index;
    var columnName;
    for (index = 0; index < lobColumns.length; index++) {
        if (index > 0) {
            buffer.push(', ');
        }

        columnName = lobColumns[index];

        buffer.push(columnName);
    }

    var returnColumnNames;
    if (additionalReturningInfo) {
        returnColumnNames = Object.keys(additionalReturningInfo);

        for (index = 0; index < returnColumnNames.length; index++) {
            buffer.push(', ');
            buffer.push(returnColumnNames[index]);
        }
    }

    buffer.push(' INTO ');

    for (index = 0; index < lobColumns.length; index++) {
        if (index > 0) {
            buffer.push(', ');
        }

        buffer.push(':');
        columnName = lobColumns[index];
        buffer.push(lobMetaInfo[columnName]);
    }

    if (returnColumnNames) {
        for (index = 0; index < returnColumnNames.length; index++) {
            buffer.push(', ');
            buffer.push(':');
            buffer.push(additionalReturningInfo[returnColumnNames[index]]);
        }
    }

    return buffer.join('');
};

/**
 * Internal function used to modify the INSERT/UPDATE SQL arguments.<br>
 * This function will add the RETURNING clause to the SQL to support LOBs modification after the INSERT/UPDATE finished.<br>
 * In addition it will modify the bind variables to specify the OUT bind to enable access to the LOB object.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {Array} argumentsArray - Array of arguments provided in the insert/update functions
 * @returns {object} LOB information used for SQL execution processing
 */
Connection.prototype.modifyParams = function (argumentsArray) {
    var lobMetaInfo;
    var lobColumns;
    var lobData;
    var autoCommit;
    if ((argumentsArray.length >= 3) && argumentsArray[2] && argumentsArray[2].lobMetaInfo) {
        lobMetaInfo = argumentsArray[2].lobMetaInfo;

        lobColumns = Object.keys(lobMetaInfo);

        //modify SQL by adding RETURNING clause and modify bind variables definition
        if (lobColumns && lobColumns.length) {
            autoCommit = argumentsArray[2].autoCommit;
            argumentsArray[2].autoCommit = false; //must disable auto commit to support LOBs

            var additionalReturningInfo = argumentsArray[2].returningInfo;

            var bindVariables = argumentsArray[1];
            lobData = {};

            var index;
            var columnName;
            var lobValue;
            var bindVariableName;
            for (index = 0; index < lobColumns.length; index++) {
                columnName = lobColumns[index];

                bindVariableName = lobMetaInfo[columnName];
                lobValue = bindVariables[bindVariableName];
                lobData[bindVariableName] = lobValue;

                if (typeof lobValue === 'string') { //CLOB
                    bindVariables[bindVariableName] = {
                        type: constants.clobType,
                        dir: constants.bindOut
                    };
                } else { //BLOB
                    bindVariables[bindVariableName] = {
                        type: constants.blobType,
                        dir: constants.bindOut
                    };
                }
            }

            argumentsArray[0] = this.generateReturningClause(argumentsArray[0], lobMetaInfo, lobColumns, additionalReturningInfo);
        }
    }

    return {
        lobMetaInfo: lobMetaInfo,
        lobColumns: lobColumns,
        lobData: lobData,
        autoCommit: autoCommit
    };
};

/**
 * Internal function used to wrap the original callback.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {function} callback - The callback function to invoke
 * @param {object} [options] - Optional execute options
 * @param {number} handleType - 1 to split results, 2 to stream results, else default behaviour
 * @param {ResultSetReadStream} [stream] - The stream to read the results from (if streamResults=true in options)
 * @returns {function} A wrapper callback
 */
Connection.prototype.createQueryCallback = function (callback, options, handleType, stream) {
    var self = this;

    return function onCallback(error, results) {
        var metaData = self.getMetaData(results);

        if (error || (!results)) {
            error = error || new Error('No Results');

            if (callback) {
                callback(error, results);
            } else {
                /**
                 * Pushes error event to the stream.
                 *
                 * @function
                 * @memberof! ResultSetReadStream
                 * @alias ResultSetReadStream.nextRow
                 * @variation 2
                 * @private
                 * @param {function} streamCallback - The callback function
                 */
                stream.nextRow = function emitError(streamCallback) {
                    streamCallback(error);
                };
            }
        } else if (results.resultSet) {
            switch (handleType) {
            case 1: //options.splitResults
                resultSetReader.readBulks(metaData, results.resultSet, options, callback);
                break;
            case 2: //options.streamResults
                resultSetReader.stream(metaData, results.resultSet, options, stream);

                if (callback) {
                    callback(null, stream);
                }
                break;
            default:
                resultSetReader.readFully(metaData, results.resultSet, options, callback);
            }
        } else {
            rowsReader.read(metaData, results.rows, callback);
        }
    };
};

/**
 * Internal function used to wrap the original callback.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {function} callback - The callback function to invoke
 * @param {boolean} commit - True to run commit
 * @param {object} [output] - Optional output to pass to the callback
 * @returns {function} A wrapper callback
 */
Connection.prototype.createModifyCallback = function (callback, commit, output) {
    var self = this;

    var wrapperCallback = function onCallback(error) {
        if (error) {
            if (commit) {
                self.rollback(function onRollback() {
                    callback(error);
                });
            } else {
                callback(error);
            }
        } else if (commit) {
            self.commit(function onCommit(commitError) {
                if (commitError) {
                    self.rollback(function onRollback() {
                        callback(commitError);
                    });
                } else {
                    callback(null, output);
                }
            });
        } else {
            callback(null, output);
        }
    };

    return singleAsyncCallback(wrapperCallback);
};

/**
 * Returns the meta data object from the results.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {object} [results] - The execute results object provided in the callback
 * @returns {object} The meta data object
 * @example
 * ```js
 * connection.query('SELECT * FROM MY_TABLE', function onResults(error, results) {
 *  var metaData = connection.getMetaData(results);
 *  console.log(metaData);
 * });
 * ```
 */
Connection.prototype.getMetaData = function (results) {
    var metaData;

    if (results) {
        metaData = results.metaData;
        if (((!metaData) || (!metaData.length)) && results.resultSet && results.resultSet.metaData) {
            metaData = results.resultSet.metaData;
        }
    }

    return metaData;
};

module.exports = {
    /**
     * Returns a getConnection callback wrapper which extends the connection and
     * calls the original callback.
     *
     * @function
     * @memberof! Connection
     * @public
     * @param {function} callback - The getConnection callback
     * @returns {function} The getConnection callback wrapper.
     */
    wrapOnConnection: function wrapOnConnection(callback) {
        var self = this;

        return function onConnection(error, connection) {
            if ((!error) && connection) {
                self.extend(connection);
            }

            callback(error, connection);
        };
    },
    /**
     * Extends the provided oracledb connection instance.
     *
     * @function
     * @memberof! Connection
     * @public
     * @param {object} connection - The oracledb connection instance
     */
    extend: function extend(connection) {
        if (connection && (!connection.simplified)) {
            var properties = Object.keys(Connection.prototype);

            properties.forEach(function addProperty(property) {
                if (typeof connection[property] === 'function') {
                    connection['base' + property.charAt(0).toUpperCase() + property.slice(1)] = connection[property];
                }

                connection[property] = Connection.prototype[property];
            });

            var extendedCapabilities = extensions.get('connection');
            properties = Object.keys(extendedCapabilities);

            properties.forEach(function addProperty(property) {
                if (!connection[property]) {
                    connection[property] = extendedCapabilities[property];
                }
            });

            emitter(connection);

            connection.diagnosticInfo = connection.diagnosticInfo || {};
            connection.diagnosticInfo.id = connectionIDCounter;
            connectionIDCounter++;
        }
    }
};
