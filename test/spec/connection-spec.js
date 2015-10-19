'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var helper = require('../helpers/test-oracledb');
var constants = require('../../lib/constants');
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

    describe('insert', function () {
        it('no lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindVars, {
                    id1: 1,
                    id2: 2
                });
                assert.deepEqual(options, {
                    lobMetaInfo: {}
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {}
                });
            };

            connection.insert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', {
                id1: 1,
                id2: 2
            }, {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);

                done();
            });
        });

        it('multiple lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            var lobsWritten = 0;
            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                var lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                var lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                var lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);
                assert.equal(lobsWritten, 3);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                var lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                var lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    var cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                var lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);

                done();
            });
        });

        it('error on execute', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                callback(new Error('execute error test'));
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);

                done();
            });
        });
    });

    describe('update', function () {
        it('no lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2');
                assert.deepEqual(bindVars, {
                    id1: 1,
                    id2: 2
                });
                assert.deepEqual(options, {
                    lobMetaInfo: {}
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {}
                });
            };

            connection.update('UPDATE nolobs SET id = :id1, id2 = :id2', {
                id1: 1,
                id2: 2
            }, {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);

                done();
            });
        });

        it('multiple lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            var lobsWritten = 0;
            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                var lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.on('end', function () {
                    lobsWritten++;
                });
                var lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.on('end', function () {
                    lobsWritten++;
                });
                var lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.on('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 3,
                    outBinds: {
                        lob1: [lob1, lob1, lob1],
                        lob2: [lob2, lob2, lob2],
                        lob3: [lob3, lob3, lob3]
                    }
                });
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 3);
                assert.equal(lobsWritten, 9);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                var lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                var lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    var cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                var lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 3,
                    outBinds: {
                        lob1: [lob1, lob1, lob1],
                        lob2: [lob2, lob2, lob2],
                        lob3: [lob3, lob3, lob3]
                    }
                });
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);

                done();
            });
        });

        it('error on execute', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                callback(new Error('execute error test'));
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);

                done();
            });
        });
    });

    describe('release', function () {
        it('callback provided', function (done) {
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    cb();

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
                    cb();

                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release();
        });
    });
});
