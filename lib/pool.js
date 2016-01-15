'use strict';

var asyncLib = require('async');
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
 * In addition, this function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
 * It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
 * See https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool for official API details.<br>
 * See https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool for extended createPool API details.<br>
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {AsyncCallback} callback - Invoked with an error or an extended connection object
 */
Pool.prototype.getConnection = function (callback) {
    var self = this;

    asyncLib.retry({
        times: self.poolAttributes.retryCount,
        interval: self.poolAttributes.retryInterval
    }, function attemptGetConnection(asyncCallback) {
        self.getConnectionOrg(function onConnection(error, connection) {
            if (error) {
                asyncCallback(error);
            } else if (self.poolAttributes.runValidationSQL && self.poolAttributes.validationSQL) {
                connection.execute(self.poolAttributes.validationSQL, function onExecuteDone(testError) {
                    if (testError) {
                        connection.release(function onConnectionRelease() {
                            asyncCallback(testError);
                        });
                    } else {
                        asyncCallback(error, connection);
                    }
                });
            } else {
                asyncCallback(error, connection);
            }
        });
    }, Connection.wrapOnConnection(callback));
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
     * @param {object} [poolAttributes] - The connection pool attributes object
     * @param {number} [poolAttributes.retryCount=10] - The max amount of retries to get a connection from the pool in case of any error
     * @param {number} [poolAttributes.retryInterval=250] - The interval in millies between get connection retry attempts
     * @param {boolean} [poolAttributes.runValidationSQL=true] - True to ensure the connection returned is valid by running a test validation SQL
     * @param {string} [poolAttributes.validationSQL=SELECT 1 FROM DUAL] - The test SQL to invoke before returning a connection to validate the connection is open
     */
    extend: function extend(pool, poolAttributes) {
        if (pool && (!pool.simplified)) {
            pool.getConnectionOrg = pool.getConnection;
            pool.poolAttributes = poolAttributes || {};

            //set defaults
            pool.poolAttributes.retryCount = Math.max(pool.poolAttributes.retryCount || 10, 1);
            pool.poolAttributes.retryInterval = pool.poolAttributes.retryInterval || 250;
            if (pool.poolAttributes.runValidationSQL === undefined) {
                pool.poolAttributes.runValidationSQL = true;
            }
            pool.poolAttributes.validationSQL = pool.poolAttributes.validationSQL || 'SELECT 1 FROM DUAL';

            var properties = Object.keys(Pool.prototype);

            properties.forEach(function addProperty(property) {
                if (typeof pool[property] === 'function') {
                    pool['base' + property.charAt(0).toUpperCase() + property.slice(1)] = pool[property];
                }

                pool[property] = Pool.prototype[property];
            });
        }
    }
};
