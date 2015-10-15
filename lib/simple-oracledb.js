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
var RecordReader = require('./record-reader');

/**
 * Simple oracledb enables to extend the oracledb main object, oracledb pool and oracledb connection.<br>
 * See extend function for more info.
 *
 * @author Sagie Gur-Ari
 * @namespace SimpleOracleDB
 */
module.exports = {
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
    extend: function extend(oracle) {
        if (oracle.createPool) {
            oracle.simplified = true;
            if (oracle.BLOB !== undefined) {
                RecordReader.blobType = oracle.BLOB;
            }

            var getConnectionOrg = oracle.getConnection;

            /**
             * Wraps the original oracledb getConnection in order to provide an extended connection object.
             *
             * @function
             * @memberof! oracledb
             * @public
             * @param {*} [params] - The oracledb getConnection arguments
             */
            oracle.getConnection = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                var callback = argumentsArray.pop();
                argumentsArray.push(function onConnection(error, connection) {
                    if ((!error) && connection) {
                        Connection.extend(connection);
                    }

                    callback(error, connection);
                });

                return getConnectionOrg.apply(oracle, argumentsArray);
            };

            var createPoolOrg = oracle.createPool;

            /**
             * Wraps the original oracledb createPool in order to provide an extended pool object.
             *
             * @function
             * @memberof! oracledb
             * @public
             * @param {*} [params] - The oracledb createPool arguments
             */
            oracle.createPool = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                var callback = argumentsArray.pop();
                argumentsArray.push(function onPool(error, pool) {
                    if ((!error) && pool) {
                        Pool.extend(pool);
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
    }
    /*eslint-enable valid-jsdoc*/
};
