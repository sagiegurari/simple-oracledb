'use strict';

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

var emitter = require('./emitter');
var Pool = require('./pool');
var Connection = require('./connection');
var constants = require('./constants');
var promiseHelper = require('./promise-helper');

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
 * @member {boolean}
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
 * @param {object} connectionAttributes - The connection attributes object
 * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection instance
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
OracleDB.prototype.getConnection = function () {
    var self = this;

    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var callback = argumentsArray.pop();

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

    self.baseGetConnection.apply(self, argumentsArray);
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
 * @param {object} poolAttributes - The connection pool attributes object (see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpool for more attributes)
 * @param {number} [poolAttributes.retryCount=10] - The max amount of retries to get a connection from the pool in case of any error
 * @param {number} [poolAttributes.retryInterval=250] - The interval in millies between get connection retry attempts
 * @param {boolean} [poolAttributes.runValidationSQL=true] - True to ensure the connection returned is valid by running a test validation SQL
 * @param {string} [poolAttributes.validationSQL=SELECT 1 FROM DUAL] - The test SQL to invoke before returning a connection to validate the connection is open
 * @param {AsyncCallback} [callback] - Invoked with an error or the oracle connection pool instance
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
OracleDB.prototype.createPool = function () {
    var self = this;

    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var callback = argumentsArray.pop();
    var poolAttributes;
    if (argumentsArray && argumentsArray.length) {
        poolAttributes = argumentsArray[0];
    }

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

    self.baseCreatePool.apply(self, argumentsArray);
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/

//add promise support
OracleDB.prototype.createPool = promiseHelper.promisify(OracleDB.prototype.createPool);

module.exports = {
    /**
     * Extends the provided oracledb instance.
     *
     * @function
     * @memberof! OracleDB
     * @public
     * @param {object} oracledb - The oracledb instance
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
