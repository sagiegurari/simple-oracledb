'use strict';

var Connection = require('./connection');

/*jslint debug: true */
/**
 * This class holds all the extended capabilities added the oracledb pool.
 *
 * @author Sagie Gur-Ari
 * @class Pool
 * @public
 */
function Pool() {
    //should not be called
}
/*jslint debug: false */

/**
 * Marker property.
 *
 * @member {boolean}
 * @alias Pool.simplified
 * @memberof! Pool
 * @public
 */
Pool.prototype.simplified = true;

/**
 * Empty function.
 *
 * @function
 * @memberof! Pool
 * @private
 * @returns {undefined} Empty return
 */
Pool.prototype.noop = function () {
    return undefined;
};

/**
 * Wraps the original oracledb getConnection in order to provide an extended connection object.<br>
 * See https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool for more details.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {AsyncCallback} callback - Invoked with an error or an extended connection object
 */
Pool.prototype.getConnection = function (callback) {
    this.getConnectionOrg(function onConnection(error, connection) {
        if ((!error) && connection) {
            Connection.extend(connection);
        }

        callback(error, connection);
    });
};

/**
 * This function modifies the existing pool.terminate function by enabling the input
 * callback to be an optional parameter.<br>
 * Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
 * is just log the error and continue.<br>
 * Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {function} [callback] - An optional terminate callback function (see oracledb docs)
 * @example
 * ```js
 * pool.terminate(); //no callback needed
 *
 * //still possible to call with a terminate callback function
 * pool.terminate(function onTerminate(error) {
 *   if (error) {
 *     //now what?
 *   }
 * });
 * ```
 */
Pool.prototype.terminate = function (callback) {
    callback = callback || this.noop;

    this.baseTerminate(callback);
};

module.exports = {
    /**
     * Extends the provided oracledb pool instance.
     *
     * @function
     * @memberof! Pool
     * @public
     * @param {object} pool - The oracledb pool instance
     */
    extend: function extend(pool) {
        if (pool && (!pool.simplified)) {
            pool.getConnectionOrg = pool.getConnection;

            var properties = Object.keys(Pool.prototype);

            properties.forEach(function addProperty(property) {
                if (pool[property]) {
                    pool['base' + property.charAt(0).toUpperCase() + property.slice(1)] = pool[property];
                }

                pool[property] = Pool.prototype[property];
            });
        }
    }
};
