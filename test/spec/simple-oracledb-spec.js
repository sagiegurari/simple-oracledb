'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;

describe('simple oracledb tests', function () {
    var oracledb = require('../helpers/test-oracledb').create();
    oracledb.BLOB = 2007;
    oracledb.CLOB = 2006;
    oracledb.BIND_OUT = 3003;
    var simpleOracleDB = require('../../');
    simpleOracleDB.extend(oracledb);

    describe('extend tests', function () {
        it('extend oracledb', function () {
            var oracledbLib = {
                createPool: function () {
                    return undefined;
                }
            };
            simpleOracleDB.extend(oracledbLib);
            assert.isTrue(oracledbLib.simplified);
        });

        it('extend pool', function () {
            var pool = {
                getConnection: function () {
                    return undefined;
                }
            };
            simpleOracleDB.extend(pool);
            assert.isTrue(pool.simplified);
        });

        it('extend connection', function () {
            var connection = {
                execute: function () {
                    return undefined;
                }
            };
            simpleOracleDB.extend(connection);
            assert.isTrue(connection.simplified);
        });

        it('extend unsupported', function () {
            var obj = {};
            try {
                simpleOracleDB.extend(obj);
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });

        it('extend no input', function () {
            try {
                simpleOracleDB.extend();
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });
    });

    describe('createPool tests', function () {
        it('createPool valid', function (done) {
            var eventTriggered = false;
            simpleOracleDB.once('pool-created', function (pool) {
                assert.isDefined(pool);
                assert.isTrue(pool.simplified);
                eventTriggered = true;
            });

            oracledb.createPool(function (error, pool) {
                assert.isNull(error);
                assert.isDefined(pool);
                assert.isTrue(pool.simplified);

                assert.isTrue(eventTriggered);

                simpleOracleDB.once('pool-released', function (releasedPool) {
                    assert.isTrue(releasedPool === pool);

                    done();
                });

                pool.close();
            });
        });

        it('createPool error', function (done) {
            oracledb.createPool(true, function (error, pool) {
                assert.isDefined(error);
                assert.isUndefined(pool);

                done();
            });
        });
    });

    describe('getConnection tests', function () {
        it('getConnection valid', function (done) {
            var eventTriggered = false;
            simpleOracleDB.once('connection-created', function (connection) {
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                eventTriggered = true;
            });

            oracledb.getConnection(function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);

                assert.isTrue(eventTriggered);

                simpleOracleDB.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });
        });
    });

    describe('stats tests', function () {
        it('stats', function () {
            assert.isDefined(simpleOracleDB.stats);
            assert.isDefined(simpleOracleDB.stats.pool);
            assert.isDefined(simpleOracleDB.stats.connection);
        });
    });

    describe('enableStats tests', function () {
        it('enableStats', function () {
            assert.isDefined(simpleOracleDB.enableStats);

            simpleOracleDB.enableStats = true;
            assert.isTrue(simpleOracleDB.enableStats);

            simpleOracleDB.enableStats = false;
            assert.isFalse(simpleOracleDB.enableStats);
            assert.equal(Object.keys(simpleOracleDB.stats.pool).length, 0);
            assert.equal(Object.keys(simpleOracleDB.stats.connection).length, 0);
        });
    });
});
