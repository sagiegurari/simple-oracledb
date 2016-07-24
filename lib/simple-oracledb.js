'use strict';

/**
 * This events is triggered when a pool is created.
 *
 * @event SimpleOracleDB#pool-created
 * @param {Pool} pool - The pool instance
 */

/**
 * This events is triggered after a pool is released.
 *
 * @event SimpleOracleDB#pool-released
 * @param {Pool} pool - The pool instance
 */

/**
 * This events is triggered when a connection is created via oracledb.
 *
 * @event SimpleOracleDB#connection-created
 * @param {Connection} connection - The connection instance
 */

/**
 * This events is triggered when a connection is released successfully.
 *
 * @event SimpleOracleDB#connection-released
 * @param {Connection} connection - The connection instance
 */

/**
 * Invoked when an async operation has finished.
 *
 * @callback AsyncCallback
 * @param {error} [error] - Any possible error
 * @param {object} [output] - The operation output
 */

var emitter = require('./emitter');
var Pool = require('./pool');
var Connection = require('./connection');
var constants = require('./constants');
var extensions = require('./extensions');
var Monitor = require('./monitor');
var promiseHelper = require('./promise-helper');

/**
 * Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
 * See extend function for more info.
 *
 * @author Sagie Gur-Ari
 * @class SimpleOracleDB
 * @public
 */
function SimpleOracleDB() {
    emitter(this);

    var monitor = Monitor.create(this);

    Object.defineProperty(this, 'diagnosticInfo', {
        /**
         * Getter for the diagnostic info data.
         *
         * @function
         * @memberof! Info
         * @private
         * @returns {object} The diagnostic info data
         */
        get: function getDiagnosticInfo() {
            /**
             * The pool/connection diagnostics info.<br>
             * This includes info of all live pools (including live time and create time) and all live connections (including parent pool if any, live time, create time and last SQL)
             *
             * @memberof! SimpleOracleDB
             * @member {object}
             * @alias SimpleOracleDB.diagnosticInfo
             * @public
             */
            var diagnosticInfo = monitor.diagnosticInfo;

            return diagnosticInfo;
        }
    });

    Object.defineProperty(this, 'enableDiagnosticInfo', {
        /**
         * Getter for the diagnostic info enabled flag.
         *
         * @function
         * @memberof! Info
         * @private
         * @returns {boolean} The diagnostic info enabled flag
         */
        get: function isEnabled() {
            /**
             * True if the monitoring is enabled and it will listen and store pool/connection diagnostics information.<br>
             * By default this is set to false.
             *
             * @memberof! SimpleOracleDB
             * @member {boolean}
             * @alias SimpleOracleDB.enableDiagnosticInfo
             * @public
             */
            var enableDiagnosticInfo = monitor.enabled;

            return enableDiagnosticInfo;
        },
        /**
         * Setter for the diagnostic info enabled flag.
         *
         * @function
         * @memberof! Info
         * @private
         * @param {boolean} value - The diagnostic info enabled flag
         */
        set: function setEnabled(value) {
            monitor.enabled = value;
        }
    });
}

/*eslint-disable valid-jsdoc*/
/**
 * Extends the oracledb library which from that point will allow fetching the modified
 * connection objects via oracledb.getConnection or via pool.getConnection
 *
 * @function
 * @memberof! SimpleOracleDB
 * @public
 * @param {oracledb} oracledb - The oracledb library
 *
 * @also
 *
 * Extends the oracledb pool instance which from that point will allow fetching the modified
 * connection objects via pool.getConnection
 *
 * @function
 * @memberof! SimpleOracleDB
 * @public
 * @param {Pool} pool - The oracledb pool instance
 *
 * @also
 *
 * Extends the oracledb connection instance which from that point will allow access to all
 * the extended capabilities of this library.
 *
 * @function
 * @memberof! SimpleOracleDB
 * @public
 * @param {Connection} connection - The oracledb connection instance
 */
SimpleOracleDB.prototype.extend = function () {
    var self = this;

    var extendArgs = Array.prototype.slice.call(arguments, 0);

    if (extendArgs.length === 1) {
        var oracle = extendArgs.pop();

        if (oracle.createPool) {
            oracle.simplified = true;

            //update type meta info
            if (oracle.BLOB !== undefined) {
                constants.blobType = oracle.BLOB;
            }
            if (oracle.CLOB !== undefined) {
                constants.clobType = oracle.CLOB;
            }
            if (oracle.BIND_OUT !== undefined) {
                constants.bindOut = oracle.BIND_OUT;
            }

            var getConnectionOrg = oracle.getConnection;

            /**
             * Wraps the original oracledb getConnection in order to provide an extended connection object.
             *
             * @function
             * @memberof! SimpleOracleDB
             * @public
             * @param {object} connectionAttributes - The connection attributes object
             * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection instance
             * @returns {Promise} In case of no callback provided in input, this function will return a promise
             */
            oracle.getConnection = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                var callback = argumentsArray.pop();

                var getConnectionAsync = function () {
                    var wrapperCallback = function onConnection(error, connection) {
                        /*istanbul ignore else*/
                        if ((!error) && connection) {
                            self.emit('connection-created', connection);

                            connection.once('release', function onRelease() {
                                self.emit('connection-released', connection);
                            });
                        }

                        callback(error, connection);
                    };
                    argumentsArray.push(Connection.wrapOnConnection(wrapperCallback));

                    getConnectionOrg.apply(oracle, argumentsArray);
                };

                //if promise requested and supported by current platform
                var promise;
                if (!callback) {
                    promise = promiseHelper(function onPromise(promiseCallback) {
                        callback = promiseCallback;

                        getConnectionAsync();
                    });
                } else {
                    getConnectionAsync();
                }

                return promise;
            };

            var createPoolOrg = oracle.createPool;

            /**
             * Wraps the original oracledb createPool in order to provide an extended pool object.
             *
             * @function
             * @memberof! SimpleOracleDB
             * @public
             * @param {object} poolAttributes - The connection pool attributes object (see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpool for more attributes)
             * @param {number} [poolAttributes.retryCount=10] - The max amount of retries to get a connection from the pool in case of any error
             * @param {number} [poolAttributes.retryInterval=250] - The interval in millies between get connection retry attempts
             * @param {boolean} [poolAttributes.runValidationSQL=true] - True to ensure the connection returned is valid by running a test validation SQL
             * @param {string} [poolAttributes.validationSQL=SELECT 1 FROM DUAL] - The test SQL to invoke before returning a connection to validate the connection is open
             * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection pool instance
             * @returns {Promise} In case of no callback provided in input, this function will return a promise
             */
            oracle.createPool = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                var callback = argumentsArray.pop();
                var poolAttributes;
                if (argumentsArray && argumentsArray.length) {
                    poolAttributes = argumentsArray[0];
                } else if (typeof callback === 'object') {
                    poolAttributes = callback;
                    argumentsArray.push(poolAttributes);
                    callback = null;
                }

                var createPoolAsync = function () {
                    argumentsArray.push(function onPool(error, pool) {
                        if ((!error) && pool) {
                            Pool.extend(pool, poolAttributes);

                            self.emit('pool-created', pool);

                            pool.once('release', function onRelease() {
                                self.emit('pool-released', pool);
                            });
                        }

                        callback(error, pool);
                    });

                    createPoolOrg.apply(oracle, argumentsArray);
                };

                //if promise requested and supported by current platform
                var promise;
                if (!callback) {
                    promise = promiseHelper(function onPromise(promiseCallback) {
                        callback = promiseCallback;

                        createPoolAsync();
                    });
                } else {
                    createPoolAsync();
                }

                return promise;
            };
        } else if (oracle.getConnection) {
            Pool.extend(oracle);
        } else if (oracle.execute) {
            Connection.extend(oracle);
        } else {
            throw new Error('Unsupported object provided.');
        }
    } else {
        throw new Error('Invalid input provided.');
    }
};
/*eslint-enable valid-jsdoc*/

/**
 * Adds an extension to all newly created objects of the requested type.<br>
 * An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
 * This function enables external libraries to further extend oracledb using a very simple API and without the need to wrap the pool/connection creation functions.
 *
 * @function
 * @memberof! SimpleOracleDB
 * @public
 * @param {string} type - Either 'connection' or 'pool'
 * @param {string} name - The function name which will be added to the object
 * @param {function} extension - The function to be added
 * @returns {boolean} True if added, false if ignored
 * @example
 * ```js
 * //define a new function for all new connection objects called 'myConnFunc' which accepts 2 arguments
 * SimpleOracleDB.addExtension('connection', 'myConnFunc', function (myParam1, myParam2) {
 *   //implement some custom functionality
 * });
 *
 * //get connection (via oracledb directly or via pool) and start using the new function
 * connection.myConnFunc('test', 123);
 *
 * //define a new function for all new pool objects called 'myPoolFunc'
 * SimpleOracleDB.addExtension('pool', 'myPoolFunc', function () {
 *   //implement some custom functionality
 * });
 *
 * //get pool and start using the new function
 * pool.myPoolFunc();
 * ```
 */
SimpleOracleDB.prototype.addExtension = function (type, name, extension) {
    return extensions.add(type, name, extension);
};

module.exports = new SimpleOracleDB();
