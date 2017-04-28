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
 * @param {Error} [error] - Any possible error
 * @param {Object} [output] - The operation output
 */

var util = require('util');
var EventEmitterEnhancer = require('event-emitter-enhancer');
var OracleDB = require('./oracledb');
var Pool = require('./pool');
var Connection = require('./connection');
var extensions = require('./extensions');
var Monitor = require('./monitor');
var funcs = require('funcs-js');
var promiseHelper = require('./promise-helper');

var proxyEventsDone = false;

/**
 * Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
 * See extend function for more info.
 *
 * @author Sagie Gur-Ari
 * @class SimpleOracleDB
 * @public
 */
function SimpleOracleDB() {
    //call super constructor
    EventEmitterEnhancer.EnhancedEventEmitter.call(this);

    var monitor = Monitor.create(this);

    /*eslint-disable func-name-matching*/
    Object.defineProperty(this, 'diagnosticInfo', {
        /**
         * Getter for the diagnostic info data.
         *
         * @function
         * @memberof! Info
         * @private
         * @returns {Object} The diagnostic info data
         */
        get: function getDiagnosticInfo() {
            /**
             * The pool/connection diagnostics info.<br>
             * This includes info of all live pools (including live time and create time) and all live connections (including parent pool if any, live time, create time and last SQL)
             *
             * @memberof! SimpleOracleDB
             * @member {Object}
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
         * @returns {Boolean} The diagnostic info enabled flag
         */
        get: function isEnabled() {
            /**
             * True if the monitoring is enabled and it will listen and store pool/connection diagnostics information.<br>
             * By default this is set to false.
             *
             * @memberof! SimpleOracleDB
             * @member {Boolean}
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
         * @param {Boolean} value - The diagnostic info enabled flag
         */
        set: function setEnabled(value) {
            monitor.enabled = value;
        }
    });
    /*eslint-enable func-name-matching*/
}

//setup SimpleOracleDB as an event emitter
util.inherits(SimpleOracleDB, EventEmitterEnhancer.EnhancedEventEmitter);

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * Extends the oracledb library which from that point will allow fetching the modified
 * connection objects via oracledb.getConnection or via pool.getConnection
 *
 * @function
 * @memberof! SimpleOracleDB
 * @public
 * @param {oracledb} oracledb - The oracledb library
 * @example
 * ```js
 * //load the oracledb library
 * var oracledb = require('oracledb');
 *
 * //load the simple oracledb
 * var SimpleOracleDB = require('simple-oracledb');
 *
 * //modify the original oracledb library
 * SimpleOracleDB.extend(oracledb);
 * ```
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
 * @example
 * ```js
 * //load the simple oracledb
 * var SimpleOracleDB = require('simple-oracledb');
 *
 * function myFunction(pool) {
 *   //modify the original oracledb pool instance
 *   SimpleOracleDB.extend(pool);
 *
 *   //from this point connections fetched via pool.getConnection(...)
 *   //have access to additional functionality.
 *   pool.getConnection(function onConnection(error, connection) {
 *     if (error) {
 *       //handle error
 *     } else {
 *       //work with new capabilities or original oracledb capabilities
 *       connection.query(...);
 *     }
 *   });
 * }
 * ```
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
 * @example
 * ```js
 * //load the simple oracledb
 * var SimpleOracleDB = require('simple-oracledb');
 *
 * function doSomething(connection, callback) {
 *   //modify the original oracledb connection instance
 *   SimpleOracleDB.extend(connection);
 *
 *   //from this point the connection has access to additional functionality as well as the original oracledb capabilities.
 *   connection.query(...);
 * }
 * ```
 */
SimpleOracleDB.prototype.extend = function (oracle) {
    var self = this;

    if (oracle) {
        if (oracle.createPool) {
            OracleDB.extend(oracle);

            if (oracle.simplified && (!proxyEventsDone)) {
                self.proxyEvents(oracle, [
                    'pool-created',
                    'pool-released',
                    'connection-created',
                    'connection-released'
                ]);

                proxyEventsDone = true;
            }
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
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

/**
 * Adds an extension to all newly created objects of the requested type.<br>
 * An extension, is a function which will be added to any pool or connection instance created after the extension was added.<br>
 * This function enables external libraries to further extend oracledb using a very simple API and without the need to wrap the pool/connection creation functions.<br>
 * Extension functions automatically get promisified unless specified differently in the optional options.
 *
 * @function
 * @memberof! SimpleOracleDB
 * @public
 * @param {String} type - Either 'connection' or 'pool'
 * @param {String} name - The function name which will be added to the object
 * @param {function} extension - The function to be added
 * @param {Object} [options] - Any extension options needed
 * @param {Object} [options.promise] - Promise options
 * @param {Boolean} [options.promise.noPromise=false] - If true, do not promisify function
 * @param {Boolean} [options.promise.force=false] - If true, do not check if promise is supported
 * @param {Boolean} [options.promise.defaultCallback=false] - If true and no callback provided, generate an empty callback
 * @param {Number} [options.promise.callbackMinIndex=0] - The minimum index in the arguments that the callback is found in
 * @returns {Boolean} True if added, false if ignored
 * @example
 * ```js
 * //define a new function for all new connection objects called 'myConnFunc' which accepts 2 arguments
 * SimpleOracleDB.addExtension('connection', 'myConnFunc', function (myParam1, myParam2, callback) {
 *   //implement some custom functionality...
 *
 *   callback();
 * });
 *
 * //get connection (via oracledb directly or via pool) and start using the new function
 * connection.myConnFunc('test', 123, function () {
 *   //continue flow...
 * });
 *
 * //extensions are automatically promisified (can be disabled) so you can also run extension functions without callback
 * var promise = connection.myConnFunc('test', 123);
 * promise.then(function () {
 *   //continue flow...
 * }).catch(function (error) {
 *   //got some error...
 * });
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
SimpleOracleDB.prototype.addExtension = function (type, name, extension, options) {
    return extensions.add(type, name, extension, options);
};

/**
 * Internal utility function which returns a callback function which will invoke the requested action on the provided connection.
 *
 * @function
 * @memberof! SimpleOracleDB
 * @private
 * @param {function} action - The function to invoke with the provided connection
 * @param {Object} invocationOptions - See oracledb.run/pool.run
 * @param {Object} releaseOptions - See oracledb.run/pool.run
 * @param {function} callback - Invoked with result/error after the action is invoked and the connection is released
 * @returns {function} The callback function
 * @example
 * ```js
 * var actionRunner = simpleOracleDB.createOnConnectionCallback(function (connection) {
 *   return connection.query('SELECT * FROM PEOPLE');
 * }, {
 *   ignoreReleaseErrors: false
 * }, {
 *   retryCount: 5
 * }, callback);
 * oracledb.getConnection(connectionAttributes, actionRunner);
 * ```
 */
SimpleOracleDB.prototype.createOnConnectionCallback = function (action, invocationOptions, releaseOptions, callback) {
    return function onConnection(connectionError, connection) {
        if (connectionError) {
            callback(connectionError);
        } else {
            try {
                var onActionDone = function (actionAsyncError, result) {
                    connection.release(releaseOptions, function onConnectionRelease(releaseError) {
                        if (actionAsyncError) {
                            callback(actionAsyncError);
                        } else if (releaseError && (!invocationOptions.ignoreReleaseErrors)) {
                            callback(releaseError);
                        } else {
                            callback(null, result);
                        }
                    });
                };

                onActionDone = funcs.once(onActionDone, {
                    callbackStyle: true
                });

                var promise = action(connection, onActionDone);

                if (promiseHelper.isPromise(promise)) {
                    promise.then(function onActionResult(result) {
                        onActionDone(null, result);
                    }).catch(onActionDone);
                }
            } catch (actionSyncError) {
                connection.release(releaseOptions, function onConnectionRelease() {
                    callback(actionSyncError);
                });
            }
        }
    };
};

module.exports = new SimpleOracleDB();
