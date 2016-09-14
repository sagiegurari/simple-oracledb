'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var PromiseLib = global.Promise || require('promiscuous');

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

            var errorFound = false;
            try {
                simpleOracleDB.extend(obj);
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('extend no input', function () {
            var errorFound = false;
            try {
                simpleOracleDB.extend();
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
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

        it('createPool valid promise', function (done) {
            var eventTriggered = false;
            simpleOracleDB.once('pool-created', function (pool) {
                assert.isDefined(pool);
                assert.isTrue(pool.simplified);
                eventTriggered = true;
            });

            global.Promise = PromiseLib;

            oracledb.createPool().then(function (pool) {
                assert.isDefined(pool);
                assert.isTrue(pool.simplified);

                assert.isTrue(eventTriggered);

                simpleOracleDB.once('pool-released', function (releasedPool) {
                    assert.isTrue(releasedPool === pool);

                    done();
                });

                pool.close();
            }, function () {
                assert.fail();
            });
        });

        it('createPool error', function (done) {
            oracledb.createPool(true, function (error, pool) {
                assert.isDefined(error);
                assert.isUndefined(pool);

                done();
            });
        });

        it('createPool error promise', function (done) {
            global.Promise = PromiseLib;

            oracledb.createPool({}).then(function () {
                assert.fail();
            }, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('createPool promise not supported', function () {
            delete global.Promise;

            var errorFound = false;
            try {
                oracledb.createPool();
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);

            global.Promise = PromiseLib;
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

            oracledb.getConnection({}, function (error, connection) {
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

        it('getConnection valid promise', function (done) {
            var eventTriggered = false;
            simpleOracleDB.once('connection-created', function (connection) {
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                eventTriggered = true;
            });

            oracledb.getConnection({}).then(function (connection) {
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);

                assert.isTrue(eventTriggered);

                simpleOracleDB.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            }, function () {
                assert.fail();
            });
        });
    });

    describe('diagnosticInfo tests', function () {
        it('diagnosticInfo', function () {
            assert.isDefined(simpleOracleDB.diagnosticInfo);
            assert.isDefined(simpleOracleDB.diagnosticInfo.pool);
            assert.isDefined(simpleOracleDB.diagnosticInfo.connection);
        });
    });

    describe('enableDiagnosticInfo tests', function () {
        it('enableDiagnosticInfo', function () {
            assert.isDefined(simpleOracleDB.enableDiagnosticInfo);

            simpleOracleDB.enableDiagnosticInfo = true;
            assert.isTrue(simpleOracleDB.enableDiagnosticInfo);

            simpleOracleDB.enableDiagnosticInfo = false;
            assert.isFalse(simpleOracleDB.enableDiagnosticInfo);
            assert.equal(Object.keys(simpleOracleDB.diagnosticInfo.pool).length, 0);
            assert.equal(Object.keys(simpleOracleDB.diagnosticInfo.connection).length, 0);
        });
    });
});
