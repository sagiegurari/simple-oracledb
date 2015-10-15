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
 * Wraps the original oracledb getConnection in order to provide an extended connection object.
 *
 * @function
 * @memberof! Pool
 * @public
 * @param {*} [params] - The oracledb pool getConnection arguments
 * @param {AsyncCallback} callback - Invoked with an error or an extended connection object
 */
Pool.prototype.getConnection = function () {
    var argumentsArray = Array.prototype.slice.call(arguments, 0);

    var callback = argumentsArray.pop();
    argumentsArray.push(function onConnection(error, connection) {
        if ((!error) && connection) {
            Connection.extend(connection);
        }

        callback(error, connection);
    });

    this.getConnectionOrg.apply(this, argumentsArray);
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
                pool[property] = Pool.prototype[property];
            });
        }
    }
};
