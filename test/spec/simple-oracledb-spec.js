'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;

describe('simple oracledb tests', function () {
    var oracledb = require('../helper/test-oracledb').create();
    var simpleOracleDB = require('../../');
    simpleOracleDB.extend(oracledb);

    describe('extend tests', function () {
        it('extend', function () {
            assert.isTrue(oracledb.simplified);
        });
    });

    describe('createPool tests', function () {
        it('createPool valid', function () {
            oracledb.createPool(false, function (error, pool) {
                assert.isNull(error);
                assert.isDefined(pool);
                assert.isTrue(pool.simplified);
            });
        });

        it('createPool error', function () {
            oracledb.createPool(true, function (error, pool) {
                assert.isDefined(error);
                assert.isUndefined(pool);
            });
        });
    });

    describe('getConnection tests', function () {
        it('getConnection valid', function () {
            oracledb.getConnection(false, function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
            });
        });

        it('getConnection error', function () {
            oracledb.getConnection(true, function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);
            });
        });
    });
});
