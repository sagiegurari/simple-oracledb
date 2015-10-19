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
        it('getConnection simple', function () {
            var testPool = oracledb.createPool();

            Pool.extend(testPool);

            testPool.getConnection(function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
            })
        });

        it('getConnection error', function () {
            var testPool = oracledb.createPool();

            Pool.extend(testPool);

            testPool.throwError = true;
            testPool.getConnection(function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);
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
