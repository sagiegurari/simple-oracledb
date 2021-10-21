'use strict';

const chai = require('chai');
const assert = chai.assert;
const PromiseLib = global.Promise || require('promiscuous');

describe('simple oracledb tests', function () {
    const oracledb = require('../helpers/test-oracledb').create();
    oracledb.BLOB = 2019;
    oracledb.CLOB = 2017;
    oracledb.STRING = 2001;
    oracledb.NUMBER = 2010;
    oracledb.DATE = 2011;
    oracledb.BIND_OUT = 3003;
    const simpleOracleDB = require('../../');
    simpleOracleDB.extend(oracledb);

    describe('extend tests', function () {
        it('extend oracledb', function () {
            const oracledbLib = {
                createPool() {
                    return undefined;
                }
            };
            simpleOracleDB.extend(oracledbLib);
            assert.isTrue(oracledbLib.simplified);
        });

        it('extend pool', function () {
            const pool = {
                getConnection() {
                    return undefined;
                }
            };
            simpleOracleDB.extend(pool);
            assert.isTrue(pool.simplified);
        });

        it('extend connection', function () {
            const connection = {
                execute() {
                    return undefined;
                }
            };
            simpleOracleDB.extend(connection);
            assert.isTrue(connection.simplified);
        });

        it('extend unsupported', function () {
            const obj = {};

            let errorFound = false;
            try {
                simpleOracleDB.extend(obj);
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('extend no input', function () {
            let errorFound = false;
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
            let eventTriggered = false;
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
            let eventTriggered = false;
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

            let errorFound = false;
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
            let eventTriggered = false;
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
            let eventTriggered = false;
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
