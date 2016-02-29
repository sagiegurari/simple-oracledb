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
var extensions = require('./extensions');

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
