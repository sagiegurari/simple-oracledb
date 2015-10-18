'use strict';

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
 * @param {*} [params] - See oracledb connection.execute function
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
 * Provides simpler interface than the original oracledb connection.execute function to enable simple insert invocation which LOB support.<br>
 * The callback output will be the same as oracledb conection.execute.<br>
 * All LOBs will be read and written to the DB via streams and only after all LOBs are written the callback will be called.<br>
 * The function arguments used to execute the 'insert' are exactly as defined in the oracledb connection.execute function, however the options are mandatory.
 *
 * @function
 * @memberof! Connection
 * @public
 * @param {*} [params] - See oracledb connection.execute function
 * @example
 * ```js
 * connection.insert('INSERT INTO mylobs (id, clob_column1, blob_column2) VALUES (:id, EMPTY_CLOB(), EMPTY_BLOB())', { //no need to specify the RETURNING clause in the SQL
 *   id: 110,
 *   clobText1: 'some long clob string', //add bind variable with LOB column name and text content (need to map that name in the options)
 *   blobBuffer2: new Buffer('some blob content, can be binary...')  //add bind variable with LOB column name and text content (need to map that name in the options)
 * }, {
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
    var self = this;

    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var lobMetaInfo;
    var lobColumns;
    var lobData;
    if (argumentsArray.length === 4) {
        lobMetaInfo = argumentsArray[2].lobMetaInfo || {};

        lobColumns = Object.keys(lobMetaInfo);

        //modify SQL by adding RETURNING clause and modify bind variables definition
        if (lobColumns && lobColumns.length) {
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

    var callback = argumentsArray.pop();
    argumentsArray.push(function onExecute(error, results) {
        if (error || (!results)) {
            callback(error, results);
        } else if ((results.rowsAffected === 1) && lobColumns && lobColumns.length) {
            recordWriter.write(results.outBinds, lobData, function onWrite(writeError) {
                if (writeError) {
                    callback(writeError);
                } else {
                    callback(null, results);
                }
            });
        } else {
            callback(error, results);
        }
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

module.exports = {
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
