'use strict';

var enabled = false;

/**
 * This class monitors the active connections and pools.
 *
 * @author Sagie Gur-Ari
 * @class Monitor
 * @private
 * @param {SimpleOracleDB} simpleOracleDB - The instance of the library
 */
function Monitor(simpleOracleDB) {
    var self = this;
    self.stats = {};

    /**
     * True if the monitor is enabled and it will listen and store pool/connection diagnostics information.
     *
     * @memberof! Monitor
     * @member {boolean}
     * @alias Monitor.enabled
     * @public
     */
    Object.defineProperty(self, 'enabled', {
        get: function isEnabled() {
            return enabled;
        },
        set: function setEnabled(value) {
            enabled = value;

            this.stats.pool = this.stats.pool || {};
            this.stats.connection = this.stats.connection || {};

            //when disabling, clear all stored data
            if (!enabled) {
                this.stats.pool = {};
                this.stats.connection = {};
            }
        }
    });
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
    var self = this;

    if (connection && connection.diagnosticInfo && self.enabled) {
        var id = connection.diagnosticInfo.id;
        var statsInfo = {
            connection: connection,
            createTime: Date.now(),
            pool: pool
        };

        Object.defineProperties(statsInfo, {
            sql: {
                get: function getSQL() {
                    return this.connection.diagnosticInfo.lastSQL;
                }
            },
            liveTime: {
                get: function getLiveTime() {
                    return Date.now() - this.createTime;
                }
            }
        });

        self.stats.connection[id] = statsInfo;

        connection.once('release', function onRelease() {
            delete self.stats.connection[id];
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
    var self = this;

    if (pool && pool.diagnosticInfo && self.enabled) {
        var statsInfo = {
            pool: pool,
            createTime: Date.now()
        };

        Object.defineProperties(statsInfo, {
            liveTime: {
                get: function getLiveTime() {
                    return Date.now() - this.createTime;
                }
            }
        });

        var id = pool.diagnosticInfo.id;
        self.stats.pool[id] = statsInfo;

        var onCreate = function (connection) {
            self.monitorConnection(connection, pool);
        };

        pool.on('connection-created', onCreate);

        pool.once('release', function onRelease() {
            delete self.stats.pool[id];

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
    create: function (simpleOracleDB) {
        return new Monitor(simpleOracleDB);
    }
};
