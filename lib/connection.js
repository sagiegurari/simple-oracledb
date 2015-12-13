'use strict';

var asyncLib = require('async');
var rowsReader = require('./rows-reader');
var resultSetReader = require('./resultset-reader');
var recordWriter = require('./record-writer');
var constants = require('./constants');

/*jslint debug: true */
/**
 * This class holds all the extended capabilities added the oracledb connection.
 *
 * @author Sagie Gur-Ari
 * @class Connection
 * @public
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
 * @param {AsyncCallback} callback - Invoked with an error or the query results object holding all data including LOBs
 * @example
 * ```js
 * connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], function onResults(error, results) {
 *   if (error) {
 *     //handle error...
 *   } else {
 *     //print the 4th row DEPARTMENT_ID column value
 *     console.log(results[3].DEPARTMENT_ID);
 *   }
 * });
 * ```
 */
Connection.prototype.query = function () {
    var self = this;

    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var callback = argumentsArray.pop();
    argumentsArray.push(function onExecute(error, results) {
        if (error || (!results)) {
            callback(error, results);
        } else if (results.resultSet) {
            resultSetReader.read(results.metaData, results.resultSet, callback);
        } else {
            rowsReader.read(results.metaData, results.rows, callback);
        }
    });

    self.execute.apply(self, argumentsArray);
};

/**
 * Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation with LOB support.<br>
 * The callback output will be the same as oracledb conection.execute.<br>
 * All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} bindParams - The bind parameters used to specify the values for the columns
 * @param {object} options - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the insert, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {AsyncCallback} callback - Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
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
 * ```
 */
Connection.prototype.insert = function () {
    var argumentsArray = Array.prototype.slice.call(arguments, 0);
    this.insertOrUpdate(true, argumentsArray);
};

/**
 * Provides simpler interface than the original oracledb connection.execute function to enable simple update invocation with LOB support.<br>
 * The callback output will be the same as oracledb conection.execute.<br>
 * All LOBs will be written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'update' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {string} sql - The SQL to execute
 * @param {object} bindParams - The bind parameters used to specify the values for the columns
 * @param {object} options - Any execute options
 * @param {object} [options.autoCommit] - If you wish to commit after the update, this property must be set to true in the options (oracledb.autoCommit is not checked)
 * @param {object} [options.lobMetaInfo] - For LOB support this object must hold a mapping between DB column name and bind variable name
 * @param {AsyncCallback} callback - Invoked with an error or the update results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
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
    this.insertOrUpdate(false, argumentsArray);
};

/**
 * Internal function which handles both INSERT and UPDATE commands.
 *
 * @function
 * @memberof! Connection
 * @private
 * @param {boolean} insert - True for insert, false for update
 * @param {Array} argumentsArray - The original arguments array
 */
Connection.prototype.insertOrUpdate = function (insert, argumentsArray) {
    var self = this;

    var lobInfo = self.modifyParams(argumentsArray);
    var lobColumns = lobInfo.lobColumns;
    var lobData = lobInfo.lobData;
    var autoCommit = lobInfo.autoCommit;

    var callback = argumentsArray.pop();
    argumentsArray.push(function onExecute(error, results) {
        var wrapper = self.createCallback(callback, autoCommit, results);

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

/**
 * This function modifies the existing connection.release function by enabling the input
 * callback to be an optional parameter.<br>
 * Since there is no real way to release a connection that fails to be released, all that you can do in the callback
 * is just log the error and continue.<br>
 * Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {function} [callback] - An optional release callback function (see oracledb docs)
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
 * ```
 */
Connection.prototype.release = function (callback) {
    callback = callback || this.noop;

    this.baseRelease(callback);
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
    callback = callback || this.noop;

    this.baseRollback(callback);
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
 * @param {AsyncCallback} callback - Invoked with an error or the query results object holding the row count and JSONs
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

    var callback = argumentsArray.pop();
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

/**
 * Enables to run an INSERT SQL statement multiple times for each of the provided bind params.<br>
 * This allows to insert to same table multiple different rows with one single call.<br>
 * The callback output will be an array of objects of same as oracledb conection.execute (per row).<br>
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
 * @param {AsyncCallback} callback - Invoked with an error or the insert results (if LOBs are provided, the callback will be triggered after they have been fully written to the DB)
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
    var self = this;

    //auto commit should wrap all commands
    var commit = options.autoCommit;
    options.autoCommit = false;

    //create tasks
    var tasks = [];
    bindParamsArray.forEach(function createTask(bindParams) {
        tasks.push(function executeTask(asyncCallback) {
            self.insert(sql, bindParams, options, asyncCallback);
        });
    });

    asyncLib.parallel(tasks, function onBatchDone(error, results) {
        var batchCallback = self.createCallback(callback, commit, results);
        batchCallback(error);
    });
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
    if ((argumentsArray.length === 4) && argumentsArray[2] && argumentsArray[2].lobMetaInfo) {
        lobMetaInfo = argumentsArray[2].lobMetaInfo;

        lobColumns = Object.keys(lobMetaInfo);

        //modify SQL by adding RETURNING clause and modify bind variables definition
        if (lobColumns && lobColumns.length) {
            autoCommit = argumentsArray[2].autoCommit;
            argumentsArray[2].autoCommit = false; //must disable auto commit to support LOBs

            var sql = [argumentsArray[0]];
            var bindVariables = argumentsArray[1];
            lobData = {};

            sql.push(' RETURNING ');

            var index;
            var columnName;
            var lobValue;
            var bindVariableName;
            for (index = 0; index < lobColumns.length; index++) {
                if (index > 0) {
                    sql.push(', ');
                }

                columnName = lobColumns[index];

                sql.push(columnName);
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

            sql.push(' INTO ');

            for (index = 0; index < lobColumns.length; index++) {
                if (index > 0) {
                    sql.push(', ');
                }

                sql.push(':');
                columnName = lobColumns[index];
                sql.push(lobMetaInfo[columnName]);
            }

            argumentsArray[0] = sql.join('');
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
 * @param {boolean} commit - True to run commit
 * @param {object} [output] - Optional output to pass to the callback
 * @returns {function} A wrapper callback
 */
Connection.prototype.createCallback = function (callback, commit, output) {
    var self = this;

    var invoked = false;
    return function onCallback(error) {
        if (!invoked) {
            invoked = true;

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
                        callback(commitError);
                    } else {
                        callback(null, output);
                    }
                });
            } else {
                callback(null, output);
            }
        }
    };
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
                if (connection[property]) {
                    connection['base' + property.charAt(0).toUpperCase() + property.slice(1)] = connection[property];
                }

                connection[property] = Connection.prototype[property];
            });
        }
    }
};
