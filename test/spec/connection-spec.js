'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var helper = require('../helpers/test-oracledb');
var Connection = require('../../lib/connection');

describe('Connection Tests', function () {
    describe('extend', function () {
        it('extend', function () {
            var testConnection = {};
            Connection.extend(testConnection);

            assert.isTrue(testConnection.simplified);
        });
    });

    describe('query', function () {
        var columnNames = [
            {
                name: 'COL1'
            },
            {
                name: 'COL2'
            }, {
                name: 'COL3'
            },
            {
                name: 'COL4'
            },
            {
                name: 'LOB1'
            },
            {
                name: 'LOB2'
            }
        ];

        it('error', function () {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(new Error('test error'));
            };

            connection.query(1, 2, 3, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
            });
        });

        it('rows - empty', function () {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.equal(argumentsArray.shift(), 'a');

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    rows: []
                });
            };

            connection.query(1, 2, 'a', function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);
            });
        });

        it('resultset - empty', function () {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.equal(argumentsArray.shift(), 'a');

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    resultSet: {
                        getRows: function (number, callback) {
                            assert.equal(number, 100);
                            callback(null, []);
                        }
                    }
                });
            };

            connection.query(1, 2, 'a', function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);
            });
        });

        it('rows - data', function () {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.execute = function () {
                var lob1 = helper.createCLOB();
                var lob2 = helper.createCLOB();

                arguments[arguments.length - 1](null, {
                    metaData: columnNames,
                    rows: [
                        {
                            COL1: lob1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: undefined,
                            LOB1: undefined,
                            LOB2: undefined
                        },
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: lob2,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                });

                setTimeout(function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');

                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }, 10);
            };

            connection.query(1, 2, 3, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456',
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            });
        });

        it('resultset - data', function () {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.execute = function () {
                var lob1 = helper.createCLOB();
                var lob2 = helper.createCLOB();

                var dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        },
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                var dbEvents = [null, function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                }, function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }];

                var argumentsArray = Array.prototype.slice.call(arguments, 0);
                argumentsArray.pop()(null, {
                    metaData: columnNames,
                    resultSet: {
                        getRows: function (number, callback) {
                            assert.equal(number, 100);

                            var events = dbEvents.shift();
                            if (events) {
                                setTimeout(events, 10);
                            }

                            callback(null, dbData.shift());
                        }
                    }
                });
            };

            connection.query(1, 2, 3, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2',
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            });
        });
    });

    describe('release', function () {
        it('callback provided', function (done) {
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release(function () {
                return undefined;
            });
        });

        it('callback undefined', function (done) {
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release();
        });
    });
});
