'use strict';

var debug = require('debuglog')('simple-oracledb');
var asyncLib = require('async');
var Connection = require('./connection');
var singleAsyncCallback = require('./single-async-callback');
var extensions = require('./extensions');
var emitter = require('./emitter');
var promiseHelper = require('./promise-helper');

var poolIDCounter = 0;

/**
 * This events is triggered when a connection is created via pool.
 *
 * @event Pool#connection-created
 * @param {Connection} connection - The connection instance
 */

/**
 * This events is triggered when a connection is released successfully.
 *
 * @event Pool#connection-released
 * @param {Connection} connection - The connection instance
 */

/**
 * This events is triggered after the pool is released successfully.
 *
 * @event Pool#release
 */

/*jslint debug: true */
/*istanbul ignore next*/
/**
 * This class holds all the extended capabilities added the oracledb pool.
 *
 * @author Sagie Gur-Ari
 * @class Pool
 * @public
 * @fires event:connection-created
 * @fires event:connection-released
 * @fires event:release
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
 * Sets up events based on connection events.
 *
 * @function
 * @memberof! Pool
 * @private
 * @param {Connection} connection - The connection object
 */
Pool.prototype.setupEvents = function (connection) {
    var self = this;

    if (connection) {
        connection.once('release', function onRelease() {
            self.emit('connection-released', connection);
        });

        self.emit('connection-created', connection);
    }
};

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * Wraps the original oracledb getConnection in order to provide an extended connection object.<br>
 * In addition, this function will attempt to fetch a connection from the pool and in case of any error will reattempt for a configurable amount of times.<br>
 * It will also ensure the provided connection is valid by running a test SQL and if validation fails, it will fetch another connection (continue to reattempt).<br>
 * See [getConnection](https://github.com/oracle/node-oracledb/blob/master/doc/api.md#getconnectionpool) for official API details.<br>
 * See [createPool](https://github.com/sagiegurari/simple-oracledb/blob/master/docs/api.md#SimpleOracleDB.oracle.createPool) for extended createPool API details.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {AsyncCallback} [callback] - Invoked with an error or an extended connection object
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 * @fires event:connection-created
 * @example
 * ```js
 * oracledb.createPool({
 *   retryCount: 5, //The max amount of retries to get a connection from the pool in case of any error (default to 10 if not provided)
 *   retryInterval: 500, //The interval in millies between get connection retry attempts (defaults to 250 millies if not provided)
 *   runValidationSQL: true, //True to ensure the connection returned is valid by running a test validation SQL (defaults to true)
 *   validationSQL: 'SELECT 1 FROM DUAL', //The test SQL to invoke before returning a connection to validate the connection is open (defaults to 'SELECT 1 FROM DUAL')
 *   //any other oracledb pool attributes
 * }, function onPoolCreated(error, pool) {
 *   pool.getConnection(function onConnection(poolError, connection) {
 *     //continue flow (connection, if provided, has been tested to ensure it is valid)
 *   });
 * });
 * ```
 */
Pool.prototype.getConnection = function (callback) {
    var self = this;

    var onWrapperConnectionCreated = function (error, connection) {
        /*istanbul ignore else*/
        if ((!error) && connection) {
            self.setupEvents(connection);
        }

        callback(error, connection);
    };

    asyncLib.retry({
        times: self.poolAttributes.retryCount,
        interval: self.poolAttributes.retryInterval
    }, function attemptGetConnection(asyncCallback) {
        self.baseGetConnection(function onConnection(error, connection) {
            if (error) {
                debug('Unable to get pooled connection, ', error.stack);
                asyncCallback(error);
            } else if (self.poolAttributes.runValidationSQL && self.poolAttributes.validationSQL) {
                connection.execute(self.poolAttributes.validationSQL, function onExecuteDone(testError) {
                    if (testError) {
                        debug('Pooled connection validation failed, ', testError.stack);

                        connection.release(function onConnectionRelease(releaseError) {
                            if (releaseError) {
                                debug('Unable to release connection, ', releaseError.stack);
                            }

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
    }, Connection.wrapOnConnection(onWrapperConnectionCreated));
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
Pool.prototype.getConnection = promiseHelper.promisify(Pool.prototype.getConnection);

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * This function invokes the provided action (function) with a valid connection object and a callback.<br>
 * The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
 * must call the callback with an error (if any) and result.<br>
 * The pool will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
 * This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {ConnectionAction} action - An action requested by the pool to be invoked.
 * @param {object} [options] - Optional runtime options
 * @param {boolean} [options.ignoreReleaseErrors=false] - If true, errors during connection.release() invoked by the pool will be ignored
 * @param {object} [options.releaseOptions={force: true}] - The connection.release options (see connection.release for more info)
 * @param {boolean} [options.releaseOptions.force=true] - If force=true the connection.break will be called before trying to release to ensure all running activities are aborted
 * @param {AsyncCallback} [callback] - Invoked with an error or the result of the action after the connection was released by the pool
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 * @example
 * ```js
 * pool.run(function (connection, callback) {
 *   //run some query and the output will be available in the 'run' callback
 *   connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], callback);
 * }, function onActionDone(error, result) {
 *   //do something with the result/error
 * });
 *
 * pool.run(function (connection, callback) {
 *   //run some database operations in a transaction
 *   connection.transaction([
 *     function firstAction(callback) {
 *       connection.insert(...., callback);
 *     },
 *     function secondAction(callback) {
 *       connection.update(...., callback);
 *     }
 *   ], {
 *     sequence: true
 *   }, callback); //at end of transaction, call the pool provided callback
 * }, {
 *   ignoreReleaseErrors: false //enable/disable ignoring any release error (default not to ignore)
 * }, function onActionDone(error, result) {
 *   //do something with the result/error
 * });
 * ```
 */
Pool.prototype.run = function (action, options, callback) {
    var self = this;

    if ((!callback) && (typeof options === 'function')) {
        callback = options;
        options = null;
    }

    if (action && (typeof action === 'function')) {
        options = options || {};
        var releaseOptions = options.releaseOptions || {};
        if (releaseOptions.force === undefined) {
            releaseOptions.force = true;
        }

        callback = singleAsyncCallback(callback);

        self.getConnection(function onConnection(connectionError, connection) {
            if (connectionError) {
                callback(connectionError);
            } else {
                try {
                    action(connection, function onActionDone(actionAsyncError, result) {
                        connection.release(releaseOptions, function onConnectionRelease(releaseError) {
                            if (actionAsyncError) {
                                callback(actionAsyncError);
                            } else if (releaseError && (!options.ignoreReleaseErrors)) {
                                callback(releaseError);
                            } else {
                                callback(null, result);
                            }
                        });
                    });
                } catch (actionSyncError) {
                    connection.release(releaseOptions, function onConnectionRelease() {
                        callback(actionSyncError);
                    });
                }
            }
        });
    } else {
        throw new Error('Illegal input provided.');
    }
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
Pool.prototype.run = promiseHelper.promisify(Pool.prototype.run, {
    callbackMinIndex: 1
});

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * This function modifies the existing pool.terminate function by enabling the input
 * callback to be an optional parameter.<br>
 * Since there is no real way to release the pool that fails to be terminated, all that you can do in the callback
 * is just log the error and continue.<br>
 * Therefore this function allows you to ignore the need to pass a callback and makes it as an optional parameter.<br>
 * The pool.terminate also has an alias pool.close for consistent close function naming to all relevant objects.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {function} [callback] - An optional terminate callback function (see oracledb docs)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
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
 *
 * //can also use close
 * pool.close();
 * ```
 */
Pool.prototype.terminate = function (callback) {
    var self = this;

    self.baseTerminate(function onPoolTerminate(error) {
        self.emit('release');

        callback(error);
    });
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
Pool.prototype.terminate = promiseHelper.promisify(Pool.prototype.terminate, {
    defaultCallback: true
});

/**
 * Alias for pool.terminate, see pool.terminate for more info.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {function} [callback] - An optional terminate callback function (see oracledb docs)
 * @returns {Promise} In case of no callback provided in input and promise is supported, this function will return a promise
 */
Pool.prototype.close = Pool.prototype.terminate;

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

            var extendedCapabilities = extensions.get('pool');
            properties = Object.keys(extendedCapabilities);

            properties.forEach(function addProperty(property) {
                if (!pool[property]) {
                    pool[property] = extendedCapabilities[property];
                }
            });

            emitter(pool);

            pool.diagnosticInfo = pool.diagnosticInfo || {};
            pool.diagnosticInfo.id = poolIDCounter;
            poolIDCounter++;
        }
    }
};
