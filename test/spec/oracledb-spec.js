'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var PromiseLib = global.Promise || require('promiscuous');
var OracleDB = require('../../lib/oracledb');
var emitter = require('../../lib/emitter');

describe('OracleDB Tests', function () {
    var noop = function () {
        return undefined;
    };

    var createOracleDB = function () {
        var oracledb = {
            getConnection: function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);
                var callback = argumentsArray.pop();

                setTimeout(function () {
                    callback(null, {
                        release: function (cb) {
                            setTimeout(cb, 0);
                        }
                    });
                }, 0);
            }
        };

        emitter(oracledb);

        return oracledb;
    };

    describe('extend tests', function () {
        it('valid', function () {
            var oracledb = {
                getConnection: noop
            };

            OracleDB.extend(oracledb);

            assert.isTrue(oracledb.simplified);
            assert.isFunction(oracledb.baseGetConnection);
        });

        it('no input', function () {
            OracleDB.extend(); //ensure no error
        });
    });

    describe('getConnection tests', function () {
        it('getConnection simple', function (done) {
            var oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            var output = oracledb.getConnection(function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                assert.isDefined(connection.diagnosticInfo.id);

                oracledb.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });

            assert.isUndefined(output);
        });

        it('getConnection error', function (done) {
            var oracledb = createOracleDB();

            OracleDB.extend(oracledb);
            oracledb.baseGetConnection = function (callback) {
                callback(new Error('test'));
            };

            oracledb.getConnection(function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);

                done();
            });
        });

        it('getConnection simple promise', function (done) {
            var oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            global.Promise = PromiseLib;

            oracledb.getConnection().then(function (connection) {
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                assert.isDefined(connection.diagnosticInfo.id);

                oracledb.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });
        });

        it('getConnection error promise then', function (done) {
            var oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            global.Promise = PromiseLib;

            oracledb.baseGetConnection = function (callback) {
                callback(new Error('test'));
            };

            oracledb.getConnection().then(function () {
                assert.fail();
            }, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection error promise catch', function (done) {
            var oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            global.Promise = PromiseLib;

            oracledb.baseGetConnection = function (callback) {
                callback(new Error('test'));
            };

            oracledb.getConnection().then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection promise not supported', function () {
            var oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            global.Promise = PromiseLib;

            delete global.Promise;

            var errorFound = false;

            try {
                oracledb.getConnection().then(function () {
                    assert.fail();
                }).catch(function () {
                    assert.fail();
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });
    });
});
