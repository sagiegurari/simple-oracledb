'use strict';

let enabled = false;

/**
 * This class monitors the active connections and pools.
 *
 * @author Sagie Gur-Ari
 * @class Monitor
 * @private
 * @param {SimpleOracleDB} simpleOracleDB - The instance of the library
 */
function Monitor(simpleOracleDB) {
    const self = this;
    self.diagnosticInfo = {};

    /*eslint-disable func-name-matching*/
    /**
     * True if the monitor is enabled and it will listen and store pool/connection diagnostics information.
     *
     * @memberof! Monitor
     * @member {Boolean}
     * @alias Monitor.enabled
     * @public
     */
    Object.defineProperty(self, 'enabled', {
        /**
         * Getter for the enabled flag.
         *
         * @function
         * @memberof! Monitor
         * @private
         * @returns {Boolean} The enabled flag value
         */
        get: function isEnabled() {
            return enabled;
        },
        /**
         * Setter for the enabled flag.
         *
         * @function
         * @memberof! Monitor
         * @private
         * @param {Boolean} value - The enabled flag value
         */
        set: function setEnabled(value) {
            enabled = value;

            this.diagnosticInfo.pool = this.diagnosticInfo.pool || {};
            this.diagnosticInfo.connection = this.diagnosticInfo.connection || {};

            //when disabling, clear all stored data
            if (!enabled) {
                this.diagnosticInfo.pool = {};
                this.diagnosticInfo.connection = {};
            }
        }
    });
    /*eslint-enable func-name-matching*/
    self.enabled = false;

    simpleOracleDB.on('connection-created', function onConnectionCreated(connection) {
        self.monitorConnection(connection);
    });

    simpleOracleDB.on('pool-created', function onPoolCreated(pool) {
        self.monitorPool(pool);
    });
}

/**
 * Monitors the provided connection.
 *
 * @function
 * @memberof! Monitor
 * @private
 * @param {Connection} connection - The connection instance
 * @param {Pool} [pool] - The pool instance (if this connection was created via pool)
 */
Monitor.prototype.monitorConnection = function (connection, pool) {
    const self = this;

    if (connection && connection.diagnosticInfo && self.enabled) {
        const id = connection.diagnosticInfo.id;
        const statsInfo = {
            connection,
            createTime: Date.now(),
            pool
        };

        /*eslint-disable func-name-matching*/
        Object.defineProperties(statsInfo, {
            sql: {
                /**
                 * Getter for the last SQL executed by the connection.
                 *
                 * @function
                 * @memberof! Info
                 * @private
                 * @returns {String} The last SQL executed by the connection
                 */
                get: function getSQL() {
                    return this.connection.diagnosticInfo.lastSQL;
                }
            },
            liveTime: {
                /**
                 * Getter for the connection live time in millies.
                 *
                 * @function
                 * @memberof! Info
                 * @private
                 * @returns {Number} The connection live time in millies
                 */
                get: function getLiveTime() {
                    return Date.now() - this.createTime;
                }
            }
        });
        /*eslint-enable func-name-matching*/

        self.diagnosticInfo.connection[id] = statsInfo;

        connection.once('release', function onRelease() {
            delete self.diagnosticInfo.connection[id];
        });
    }
};

/**
 * Monitors the provided pool.
 *
 * @function
 * @memberof! Monitor
 * @private
 * @param {Pool} pool - The pool instance
 */
Monitor.prototype.monitorPool = function (pool) {
    const self = this;

    if (pool && pool.diagnosticInfo && self.enabled) {
        const statsInfo = {
            pool,
            createTime: Date.now()
        };

        /*eslint-disable func-name-matching*/
        Object.defineProperties(statsInfo, {
            liveTime: {
                /**
                 * Getter for the pool live time in millies.
                 *
                 * @function
                 * @memberof! Info
                 * @private
                 * @returns {Number} The pool live time in millies
                 */
                get: function getLiveTime() {
                    return Date.now() - this.createTime;
                }
            }
        });
        /*eslint-enable func-name-matching*/

        const id = pool.diagnosticInfo.id;
        self.diagnosticInfo.pool[id] = statsInfo;

        const onCreate = function (connection) {
            self.monitorConnection(connection, pool);
        };

        pool.on('connection-created', onCreate);

        pool.once('release', function onRelease() {
            delete self.diagnosticInfo.pool[id];

            pool.removeListener('connection-created', onCreate);
        });
    }
};

module.exports = {
    /**
     * Creates and returns a new monitor instance.
     *
     * @function
     * @memberof! Monitor
     * @private
     * @param {SimpleOracleDB} simpleOracleDB - The instance of the library
     * @returns {Monitor} The monitor instance
     */
    create(simpleOracleDB) {
        return new Monitor(simpleOracleDB);
    }
};
