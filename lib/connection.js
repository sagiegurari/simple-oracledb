'use strict';

var rowsReader = require('./rows-reader');
var resultSetReader = require('./resultset-reader');

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
 */
Connection.prototype.noop = function () {
    return undefined;
};

/**
 * Provides simpler interface than the original oracledb connection.execute function to enable simple query invocation.<br>
 * The callback output will be an array of objects, each object holding a property for each field with the actual value.<br>
 * All LOBs will be read and all rows will be fetched.<br>
 * This function is not recommended for huge results sets or huge LOB values as it will consume a lot of memory.<br>
 * The function arguments used to execute the query are exactly as defined in the oracledb connection.execute function.
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
    argumentsArray.push(function onConnection(error, results) {
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
