'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var oracledb = require('../helpers/test-oracledb');
var Pool = require('../../lib/pool');

describe('Pool Tests', function () {
    describe('extend tests', function () {
        it('extend', function () {
            var testPool = oracledb.createPool();

            Pool.extend(testPool);

            assert.isTrue(testPool.simplified);
            assert.isFunction(testPool.getConnectionOrg);
        });
    });

    describe('getConnection tests', function () {
        it('getConnection simple', function (done) {
            var testPool = oracledb.createPool();

            Pool.extend(testPool);

            testPool.getConnection(function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);

                done();
            })
        });

        it('getConnection error', function (done) {
            var testPool = oracledb.createPool();

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.throwError = true;
            testPool.getConnection(function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);

                done();
            })
        });

        it('getConnection error with valid retry', function (done) {
            var testPool = oracledb.createPool();

            var counter = 0;
            testPool.getConnection = function (callback) {
                counter++;

                if (counter < 2) {
                    callback(new Error());
                } else if (counter === 2) {
                    callback(null, {});
                } else {
                    assert.fail();
                }
            };

            Pool.extend(testPool, {
                retryCount: 5
            });

            testPool.getConnection(function (error, connection) {
                assert.equal(counter, 2);
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);

                done();
            })
        });

        it('getConnection error with error retry', function (done) {
            var testPool = oracledb.createPool();

            var counter = 0;
            testPool.getConnection = function (callback) {
                counter++;

                if (counter > 10) {
                    assert.fail();
                }

                callback(new Error());
            };

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.getConnection(function (error) {
                assert.equal(counter, 10);
                assert.isDefined(error);

                done();
            })
        });
    });

    describe('terminate', function () {
        it('callback provided', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);
            pool.terminate(function () {
                return undefined;
            });
        });

        it('callback undefined', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);
            pool.terminate();
        });
    });
});
