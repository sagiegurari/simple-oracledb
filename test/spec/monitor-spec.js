'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var events = require('events');
var EventEmitter = events.EventEmitter;
var Monitor = require('../../lib/monitor');
var emitter = require('../../lib/emitter');

var eventEmitter = new EventEmitter();
var monitor = Monitor.create(eventEmitter);

describe('monitor Tests', function () {
    var createConnection = function (id, sql) {
        var connection = {
            diagnosticInfo: {
                id: id || 10,
                lastSQL: sql || 'test sql'
            }
        };

        emitter(connection);

        return connection;
    };

    describe('monitorConnection', function () {
        it('monitorConnection no data', function () {
            monitor.enabled = true;
            monitor.monitorConnection();

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);
        });

        it('monitorConnection no diagnosticInfo', function () {
            monitor.enabled = true;
            monitor.monitorConnection({});

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);
        });

        it('monitorConnection disabled', function () {
            monitor.enabled = false;
            monitor.monitorConnection({
                diagnosticInfo: {
                    id: 10
                }
            });

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);
        });

        it('monitorConnection valid no pool', function () {
            var connection = createConnection(15, 'my sql');

            monitor.enabled = true;
            monitor.monitorConnection(connection);

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 1);
            assert.isDefined(monitor.diagnosticInfo.connection[connection.diagnosticInfo.id].createTime);
            assert.equal(monitor.diagnosticInfo.connection[connection.diagnosticInfo.id].sql, 'my sql');
            assert.isDefined(monitor.diagnosticInfo.connection[connection.diagnosticInfo.id].liveTime);

            assert.deepEqual(monitor.diagnosticInfo.connection[connection.diagnosticInfo.id], {
                connection: connection,
                createTime: monitor.diagnosticInfo.connection[connection.diagnosticInfo.id].createTime,
                pool: undefined
            });

            connection.emit('release');

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);
        });

        it('monitorConnection valid with pool', function () {
            var connection = createConnection();

            var pool = {
                test: true
            };

            monitor.enabled = true;
            monitor.monitorConnection(connection, pool);

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 1);
            assert.isDefined(monitor.diagnosticInfo.connection[connection.diagnosticInfo.id].createTime);

            assert.deepEqual(monitor.diagnosticInfo.connection[connection.diagnosticInfo.id], {
                connection: connection,
                createTime: monitor.diagnosticInfo.connection[connection.diagnosticInfo.id].createTime,
                pool: pool
            });

            connection.emit('release');

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);
        });
    });

    describe('monitorPool', function () {
        it('monitorPool no data', function () {
            monitor.enabled = true;
            monitor.monitorPool();

            assert.equal(Object.keys(monitor.diagnosticInfo.pool).length, 0);
        });

        it('monitorPool no diagnosticInfo', function () {
            monitor.enabled = true;
            monitor.monitorPool({});

            assert.equal(Object.keys(monitor.diagnosticInfo.pool).length, 0);
        });

        it('monitorPool disabled', function () {
            monitor.enabled = false;
            monitor.monitorPool({
                diagnosticInfo: {
                    id: 10
                }
            });

            assert.equal(Object.keys(monitor.diagnosticInfo.pool).length, 0);
        });

        it('monitorPool valid', function () {
            var pool = {
                diagnosticInfo: {
                    id: 10
                }
            };
            emitter(pool);

            monitor.enabled = true;
            monitor.monitorPool(pool);

            assert.equal(Object.keys(monitor.diagnosticInfo.pool).length, 1);
            assert.isDefined(monitor.diagnosticInfo.pool[pool.diagnosticInfo.id].createTime);
            assert.isDefined(monitor.diagnosticInfo.pool[pool.diagnosticInfo.id].liveTime);

            assert.deepEqual(monitor.diagnosticInfo.pool[pool.diagnosticInfo.id], {
                pool: pool,
                createTime: monitor.diagnosticInfo.pool[pool.diagnosticInfo.id].createTime
            });

            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);
            var connection = createConnection();
            pool.emit('connection-created', connection);
            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 1);
            connection.emit('release');
            assert.equal(Object.keys(monitor.diagnosticInfo.connection).length, 0);

            pool.emit('release');

            assert.equal(Object.keys(monitor.diagnosticInfo.pool).length, 0);
        });
    });
});
