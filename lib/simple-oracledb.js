'use strict';

/**
 * Invoked when an async operation has finished.
 *
 * @callback AsyncCallback
 * @param {error} [error] - Any possible error
 * @param {object} [output] - The operation output
 */

var Pool = require('./pool');
var Connection = require('./connection');
var constants = require('./constants');

/*jslint debug: true */
/**
 * Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
 * See extend function for more info.
 *
 * @author Sagie Gur-Ari
 * @class SimpleOracleDB
 * @public
 */
function SimpleOracleDB() {
    //should not be called
}
/*jslint debug: false */

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
             * @param {AsyncCallback} callback - Invoked with an error or the oracle connection instance
             */
            oracle.getConnection = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                var callback = argumentsArray.pop();
                argumentsArray.push(Connection.wrapOnConnection(callback));

                return getConnectionOrg.apply(oracle, argumentsArray);
            };

            var createPoolOrg = oracle.createPool;

            /**
             * Wraps the original oracledb createPool in order to provide an extended pool object.
             *
             * @function
             * @memberof! SimpleOracleDB
             * @public
             * @param {object} [poolAttributes] - The connection pool attributes object
             * @param {number} [poolAttributes.retryCount=10] - The max amount of retries to get a connection from the pool in case of any error
             * @param {number} [poolAttributes.retryInterval=250] - The interval in millies between get connection retry attempts
             * @param {boolean} [poolAttributes.runValidationSQL=true] - True to ensure the connection returned is valid by running a test validation SQL
             * @param {string} [poolAttributes.validationSQL=SELECT 1 FROM DUAL] - The test SQL to invoke before returning a connection to validate the connection is open
             * @param {AsyncCallback} callback - Invoked with an error or the oracle connection pool instance
             */
            oracle.createPool = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                var callback = argumentsArray.pop();
                var poolAttributes;
                if (argumentsArray && argumentsArray.length) {
                    poolAttributes = argumentsArray[0];
                }

                argumentsArray.push(function onPool(error, pool) {
                    if ((!error) && pool) {
                        Pool.extend(pool, poolAttributes);
                    }

                    callback(error, pool);
                });

                return createPoolOrg.apply(oracle, argumentsArray);
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

module.exports = new SimpleOracleDB();
