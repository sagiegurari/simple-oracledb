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
            var obj = {};
            try {
                simpleOracleDB.extend();
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
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
            oracledb.getConnection(function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
            });
        });
    });
});
