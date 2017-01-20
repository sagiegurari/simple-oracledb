'use strict';

var emitter = require('./emitter');
var Pool = require('./pool');
var Connection = require('./connection');
var constants = require('./constants');
var promiseHelper = require('./promise-helper');

/**
 * This events is triggered when a pool is created.
 *
 * @event OracleDB#pool-created
 * @param {Pool} pool - The pool instance
 */

/**
 * This events is triggered after a pool is released.
 *
 * @event OracleDB#pool-released
 * @param {Pool} pool - The pool instance
 */

/**
 * This events is triggered when a connection is created via oracledb.
 *
 * @event OracleDB#connection-created
 * @param {Connection} connection - The connection instance
 */

/**
 * This events is triggered when a connection is released successfully.
 *
 * @event OracleDB#connection-released
 * @param {Connection} connection - The connection instance
 */

/**
 * An action requested by the pool to be invoked.
 *
 * @callback ConnectionAction
 * @param {Connection} connection - A valid connection to be used by the action
 * @param {AsyncCallback} callback - The callback to invoke at the end of the action
 */

/*jslint debug: true */
/*istanbul ignore next*/
/**
 * This class holds all the extended capabilities added the oracledb.
 *
 * @author Sagie Gur-Ari
 * @class OracleDB
 * @public
 */
function OracleDB() {
    //should not be called
}
/*jslint debug: false */

/**
 * Marker property.
 *
 * @member {Boolean}
 * @alias OracleDB.simplified
 * @memberof! OracleDB
 * @public
 */
OracleDB.prototype.simplified = true;

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * Wraps the original oracledb getConnection in order to provide an extended connection object.
 *
 * @function
 * @memberof! OracleDB
 * @public
 * @param {Object} connectionAttributes - The connection attributes object
 * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection instance
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
OracleDB.prototype.getConnection = function (connectionAttributes, callback) {
    var self = this;

    var onWrapperConnection = function (error, connection) {
        /*istanbul ignore else*/
        if ((!error) && connection) {
            self.emit('connection-created', connection);

            connection.once('release', function onRelease() {
                self.emit('connection-released', connection);
            });
        }

        callback(error, connection);
    };

    self.baseGetConnection(connectionAttributes, Connection.wrapOnConnection(onWrapperConnection));
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
OracleDB.prototype.getConnection = promiseHelper.promisify(OracleDB.prototype.getConnection);

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * Wraps the original oracledb createPool in order to provide an extended pool object.
 *
 * @function
 * @memberof! OracleDB
 * @public
 * @param {Object} poolAttributes - The connection pool attributes object (see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpool for more attributes)
 * @param {Number} [poolAttributes.retryCount=10] - The max amount of retries to get a connection from the pool in case of any error
 * @param {Number} [poolAttributes.retryInterval=250] - The interval in millies between get connection retry attempts
 * @param {Boolean} [poolAttributes.runValidationSQL=true] - True to ensure the connection returned is valid by running a test validation SQL
 * @param {String} [poolAttributes.validationSQL=SELECT 1 FROM DUAL] - The test SQL to invoke before returning a connection to validate the connection is open
 * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection pool instance
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
OracleDB.prototype.createPool = function (poolAttributes, callback) {
    var self = this;

    if ((!callback) && poolAttributes && (typeof poolAttributes === 'function')) {
        callback = poolAttributes;
        poolAttributes = null;
    }

    self.baseCreatePool(poolAttributes, function onPool(error, pool) {
        if ((!error) && pool) {
            Pool.extend(pool, poolAttributes);

            self.emit('pool-created', pool);

            pool.once('release', function onRelease() {
                self.emit('pool-released', pool);
            });
        }

        callback(error, pool);
    });
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
OracleDB.prototype.createPool = promiseHelper.promisify(OracleDB.prototype.createPool);

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
/**
 * This function invokes the provided action (function) with a valid connection object and a callback.<br>
 * The action can use the provided connection to run any connection operation/s (execute/query/transaction/...) and after finishing it
 * must call the callback with an error (if any) and result.<br>
 * For promise support, the action can simply return a promise instead of calling the provided callback.<br>
 * This function will ensure the connection is released properly and only afterwards will call the provided callback with the action error/result.<br>
 * This function basically will remove the need of caller code to get and release a connection and focus on the actual database operation logic.<br>
 * It is recommanded to create a pool and use the pool.run instead of oracledb.run as this function will create a new connection (and release it) for each invocation,
 * on the other hand, pool.run will reuse pool managed connections which will result in improved performance.
 *
 * @function
 * @memberof! OracleDB
 * @public
 * @param {Object} connectionAttributes - The connection attributes object (see oracledb.getConnection for more details)
 * @param {Boolean} [connectionAttributes.ignoreReleaseErrors=false] - If true, errors during connection.release() invoked internally will be ignored
 * @param {Object} [connectionAttributes.releaseOptions={force: true}] - The connection.release options (see connection.release for more info)
 * @param {Boolean} [connectionAttributes.releaseOptions.force=true] - If force=true the connection.break will be called before trying to release to ensure all running activities are aborted
 * @param {ConnectionAction} action - An action requested to be invoked.
 * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection instance
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 * @example
 * ```js
 * oracledb.run({
 *  user: process.env.ORACLE_USER,
 *  password: process.env.ORACLE_PASSWORD,
 *  connectString: process.env.ORACLE_CONNECTION_STRING
 * }, function onConnection(connection, callback) {
 *   //run some query and the output will be available in the 'run' callback
 *   connection.query('SELECT department_id, department_name FROM departments WHERE manager_id < :id', [110], callback);
 * }, function onActionDone(error, result) {
 *   //do something with the result/error
 * });
 *
 * oracledb.run({
 *  user: process.env.ORACLE_USER,
 *  password: process.env.ORACLE_PASSWORD,
 *  connectString: process.env.ORACLE_CONNECTION_STRING
 * }, function (connection, callback) {
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
 *   }, callback); //at end of transaction, call the oracledb provided callback
 * }, function onActionDone(error, result) {
 *   //do something with the result/error
 * });
 *
 * //full promise support for both oracledb.run and the action
 * oracledb.run({
 *  user: process.env.ORACLE_USER,
 *  password: process.env.ORACLE_PASSWORD,
 *  connectString: process.env.ORACLE_CONNECTION_STRING
 * }, function (connection) {
 *   //run some database operations in a transaction and return a promise
 *   return connection.transaction([
 *     function firstAction() {
 *       return connection.insert(....); //returns a promise
 *     },
 *     function secondAction() {
 *       return connection.update(....); //returns a promise
 *     }
 *   ]);
 * }).then(function (result) {
 *   //do something with the result
 * });
 * ```
 */
OracleDB.prototype.run = function (connectionAttributes, action, callback) {
    if (connectionAttributes && (typeof connectionAttributes === 'object') && action && (typeof action === 'function')) {
        var releaseOptions = connectionAttributes.releaseOptions || {};
        if (releaseOptions.force === undefined) {
            releaseOptions.force = true;
        }

        var simpleOracleDB = require('./simple-oracledb');
        var actionRunner = simpleOracleDB.createOnConnectionCallback(action, connectionAttributes, releaseOptions, callback);
        this.getConnection(connectionAttributes, actionRunner);
    } else {
        throw new Error('Illegal input provided.');
    }
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
OracleDB.prototype.run = promiseHelper.promisify(OracleDB.prototype.run, {
    callbackMinIndex: 2
});

module.exports = {
    /**
     * Extends the provided oracledb instance.
     *
     * @function
     * @memberof! OracleDB
     * @public
     * @param {Object} oracledb - The oracledb instance
     */
    extend: function extend(oracledb) {
        if (oracledb && (!oracledb.simplified)) {
            //update type meta info
            if (oracledb.BLOB !== undefined) {
                constants.blobType = oracledb.BLOB;
            }
            if (oracledb.CLOB !== undefined) {
                constants.clobType = oracledb.CLOB;
            }
            if (oracledb.BIND_OUT !== undefined) {
                constants.bindOut = oracledb.BIND_OUT;
            }

            var properties = Object.keys(OracleDB.prototype);

            properties.forEach(function addProperty(property) {
                if (typeof oracledb[property] === 'function') {
                    oracledb['base' + property.charAt(0).toUpperCase() + property.slice(1)] = oracledb[property];
                }

                oracledb[property] = OracleDB.prototype[property];
            });

            emitter(oracledb);
        }
    }
};
