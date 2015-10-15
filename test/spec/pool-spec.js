'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var oracledb = require('../helper/test-oracledb');
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

            testPool.getConnection(false, function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
            })
        });

        it('getConnection error', function () {
            var testPool = oracledb.createPool();

            Pool.extend(testPool);

            testPool.getConnection(true, function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);
            })
        });
    });
});
