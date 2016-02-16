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

            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(new Error('test error'));
            };

            connection.query(1, 2, 3, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
            });
        });

        it('no callback (without streaming)', function () {
            var connection = {};
            Connection.extend(connection);

            try {
                connection.query('sql', [], {
                    splitResults: true
                });
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });

        it('rows - empty', function () {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
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

        it('resultset - empty without stream', function () {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.equal(argumentsArray.shift(), 'a');

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close: function (releaseCallback) {
                            releaseCallback();
                        },
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

        it('resultset - empty with stream', function () {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 5);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.equal(argumentsArray.shift(), 'a');

                argumentsArray.shift();

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close: function (releaseCallback) {
                            releaseCallback();
                        },
                        getRows: function (number, callback) {
                            assert.equal(number, 100);
                            callback(null, []);
                        }
                    }
                });
            };

            connection.query(1, 2, 'a', {
                splitResults: true
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);
            });
        });

        it('rows - data', function () {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.baseExecute = function () {
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

        it('resultset - data', function (done) {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.baseExecute = function () {
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
                        close: function (releaseCallback) {
                            releaseCallback();
                        },
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

                done();
            });
        });

        it('resultset - data split', function (done) {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.baseExecute = function () {
                var lob1 = helper.createCLOB();
                var lob2 = helper.createCLOB();

                assert.isUndefined(arguments[2].stream);
                assert.isTrue(arguments[2].splitResults);

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

            var outputData = [
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
                    }
                ],
                [
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ]
            ];

            connection.query('sql', [1, 2, 3], {
                splitResults: true,
                stream: true
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual(outputData.shift(), jsRows);

                if (outputData.length === 0) {
                    done();
                } else if (outputData.length < 0) {
                    assert.fail();
                }
            });
        });

        it('resultset - data stream', function (done) {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.baseExecute = function () {
                var lob1 = helper.createCLOB();
                var lob2 = helper.createCLOB();

                assert.isUndefined(arguments[2].stream);
                assert.isTrue(arguments[2].streamResults);

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
                        }
                    ],
                    [
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
                        close: function (releaseCallback) {
                            releaseCallback();
                        },
                        getRows: function (number, callback) {
                            assert.equal(number, 1);

                            var events = dbEvents.shift();
                            if (events) {
                                setTimeout(events, 10);
                            }

                            callback(null, dbData.shift());
                        }
                    }
                });
            };

            var outputData = [
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
            ];

            connection.query('my sql', [1, 2, 3], {
                streamResults: true,
                stream: true
            }, function (error, stream) {
                assert.isNull(error);

                var eventCounter = 0;
                stream.on('data', function (row) {
                    assert.deepEqual(outputData[eventCounter], row);
                    eventCounter++;
                });

                stream.on('end', function () {
                    assert.equal(eventCounter, outputData.length);

                    done();
                });
            });
        });

        it('resultset - data stream no callback', function (done) {
            var connection = {};
            Connection.extend(connection);

            var date = new Date();
            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                setTimeout(function () {
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
                            }
                        ],
                        [
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

                    argumentsArray.pop()(null, {
                        metaData: columnNames,
                        resultSet: {
                            close: function (releaseCallback) {
                                releaseCallback();
                            },
                            getRows: function (number, callback) {
                                assert.equal(number, 1);

                                var events = dbEvents.shift();
                                if (events) {
                                    setTimeout(events, 10);
                                }

                                callback(null, dbData.shift());
                            }
                        }
                    });
                }, 10);
            };

            var outputData = [
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
            ];

            var stream = connection.query('sql', [], {
                streamResults: true
            });

            var eventCounter = 0;
            stream.on('data', function (row) {
                assert.deepEqual(outputData[eventCounter], row);
                eventCounter++;
            });

            stream.on('end', function () {
                assert.equal(eventCounter, outputData.length);

                done();
            });
        });

        it('resultset - error stream no callback', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                setTimeout(function () {
                    argumentsArray.pop()(new Error('test error'));
                }, 10)
            };

            var stream = connection.query('sql', [], {
                streamResults: true
            });

            stream.on('data', function () {
                assert.fail();
            });

            stream.on('error', function (error) {
                assert.equal(error.message, 'test error');

                done();
            });
        });
    });

    describe('insert', function () {
        it('no lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindVars, options, callback) {
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
            var commitCalled = false;
            var connection = {
                commit: function (callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            var lobsWritten = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
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
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);
                assert.equal(lobsWritten, 3);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('multiple lobs with additional returning info', function (done) {
            var commitCalled = false;
            var connection = {
                commit: function (callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            var lobsWritten = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:myid, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b, id INTO :lob1, :lob2, :lob3, :myid');
                assert.deepEqual(bindVars, {
                    myid: {
                        type: 123456,
                        dir: constants.bindOut,
                        val: 1
                    },
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
                    },
                    returningInfo: [
                        {
                            columnName: 'id',
                            bindVarName: 'myid'
                        }
                    ]
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

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:myid, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                myid: {
                    type: 123456,
                    dir: constants.bindOut,
                    val: 1
                },
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: new Buffer('binary data')
            }, {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                },
                returningInfo: [
                    {
                        columnName: 'id',
                        bindVarName: 'myid'
                    }
                ]
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);
                assert.equal(lobsWritten, 3);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindVars, options, callback) {
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

            connection.baseExecute = function (sql, bindVars, options, callback) {
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

        it('error on commit', function (done) {
            var connection = {
                rollback: function (cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            connection.commit = function (callback) {
                callback(new Error('commit error'));
            };

            var lobsWritten = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
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
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'commit error');
                assert.equal(lobsWritten, 3);

                done();
            });
        });
    });

    describe('update', function () {
        it('no lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindVars, options, callback) {
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
            connection.baseExecute = function (sql, bindVars, options, callback) {
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

            connection.baseExecute = function (sql, bindVars, options, callback) {
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

            connection.baseExecute = function (sql, bindVars, options, callback) {
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

        it('only options provided', function (done) {
            var releaseCalled = false;
            var connection = {
                release: function (cb) {
                    if (releaseCalled) {
                        assert.fail();
                    } else {
                        assert.isFunction(cb);
                        cb();

                        done();
                    }
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({});
        });

        it('options and callback provided', function (done) {
            var counter = 0;
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    counter++;
                    if (counter > 1) {
                        cb();
                    } else {
                        cb(new Error('test'));
                    }
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryCount: 5
            }, function (error) {
                assert.isUndefined(error);
                assert.equal(counter, 2);

                done();
            });
        });

        it('retries maxed out', function (done) {
            var counter = 0;
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryCount: 5,
                retryInterval: 10
            }, function (error) {
                assert.isDefined(error);
                assert.equal(counter, 5);

                done();
            });
        });

        it('default retry count validation', function (done) {
            var counter = 0;
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryInterval: 10
            }, function (error) {
                assert.isDefined(error);
                assert.equal(counter, 10);

                done();
            });
        });
    });

    describe('close', function () {
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
            connection.close(function () {
                return undefined;
            });
        });

        it('options and callback provided', function (done) {
            var counter = 0;
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    counter++;
                    if (counter > 1) {
                        cb();
                    } else {
                        cb(new Error('test'));
                    }
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.close({
                retryCount: 5
            }, function (error) {
                assert.isUndefined(error);
                assert.equal(counter, 2);

                done();
            });
        });

        it('default retry count validation', function (done) {
            var counter = 0;
            var connection = {
                release: function (cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.close({
                retryInterval: 10
            }, function (error) {
                assert.isDefined(error);
                assert.equal(counter, 10);

                done();
            });
        });
    });

    describe('rollback', function () {
        it('callback provided', function (done) {
            var connection = {
                rollback: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRollback);
            connection.rollback(function () {
                return undefined;
            });
        });

        it('callback undefined', function (done) {
            var connection = {
                rollback: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRollback);
            connection.rollback();
        });
    });

    describe('queryJSON', function () {
        it('error in query', function () {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(new Error('test error'));
            };

            connection.queryJSON(1, 2, 3, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
            });
        });

        it('error in parse', function () {
            var connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(null, [{
                    data: 'not json text'
                }]);
            };

            connection.queryJSON(1, 2, 3, function (error) {
                assert.isDefined(error);
            });
        });

        it('empty', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function () {
                var argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(null, []);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(0, results.rowCount);
                assert.deepEqual([], results.json);
            });
        });

        it('undefined', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(0, results.rowCount);
                assert.deepEqual([], results.json);
            });
        });

        it('null', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, null);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(0, results.rowCount);
                assert.deepEqual([], results.json);
            });
        });

        it('single row empty data', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [{
                    data: ''
                }]);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(1, results.rowCount);
                assert.deepEqual({}, results.json);
            });
        });

        it('single row undefined data', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [{
                    data: undefined
                }]);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(1, results.rowCount);
                assert.deepEqual({}, results.json);
            });
        });

        it('single row not json data', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [{
                    data: 'some text'
                }]);
            };

            connection.queryJSON(function (error) {
                assert.isDefined(error);
            });
        });

        it('multiple rows empty data', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [
                    {
                        data: ''
                    },
                    {
                        data: ''
                    }
                ]);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(2, results.rowCount);
                assert.deepEqual([{}, {}], results.json);
            });
        });

        it('multiple rows undefined data', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [
                    {
                        data: undefined
                    },
                    {
                        data: undefined
                    }
                ]);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(2, results.rowCount);
                assert.deepEqual([{}, {}], results.json);
            });
        });

        it('single row', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [
                    {
                        data: JSON.stringify({
                            a: 1,
                            test: true,
                            array: [1, 2, 3],
                            subObject: {
                                key1: 'value1'
                            }
                        })
                    }
                ]);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(1, results.rowCount);
                assert.deepEqual({
                    a: 1,
                    test: true,
                    array: [1, 2, 3],
                    subObject: {
                        key1: 'value1'
                    }
                }, results.json);
            });
        });

        it('multiple rows', function () {
            var connection = {};
            Connection.extend(connection);

            connection.query = function (callback) {
                callback(null, [
                    {
                        data: JSON.stringify({
                            a: 1,
                            test: true,
                            array: [1, 2, 3],
                            subObject: {
                                key1: 'value1'
                            }
                        })
                    },
                    {
                        data: JSON.stringify({
                            a: 2,
                            test: true,
                            array: ['a', true],
                            subObject: {
                                key1: 'value1',
                                arr: [true, false, {}]
                            }
                        })
                    }
                ]);
            };

            connection.queryJSON(function (error, results) {
                assert.isNull(error);
                assert.equal(2, results.rowCount);
                assert.deepEqual([
                    {
                        a: 1,
                        test: true,
                        array: [1, 2, 3],
                        subObject: {
                            key1: 'value1'
                        }
                    },
                    {
                        a: 2,
                        test: true,
                        array: ['a', true],
                        subObject: {
                            key1: 'value1',
                            arr: [true, false, {}]
                        }
                    }
                ], results.json);
            });
        });
    });

    describe('batchInsert', function () {
        it('no lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            var vars = [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {}
                });
            };

            connection.batchInsert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ], {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            });
        });

        it('multiple lobs', function (done) {
            var commitCalled = false;
            var connection = {
                commit: function (callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            var lobsWritten = 0;
            var vars = [
                {
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
                },
                {
                    id: 2,
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
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
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

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(counter, 2);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            var rollbackCalled = false;
            var connection = {
                rollback: function (cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            var vars = [
                {
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
                },
                {
                    id: 2,
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
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
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

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on execute', function (done) {
            var rollbackCalled = false;
            var connection = {
                rollback: function (cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            var vars = [
                {
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
                },
                {
                    id: 2,
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
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                if (counter < 2) {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                } else {
                    callback(new Error('execute error test'));
                }
            };

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on commit', function (done) {
            var connection = {
                rollback: function (cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            connection.commit = function (callback) {
                callback(new Error('commit error'));
            };

            var lobsWritten = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
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

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'commit error');
                assert.equal(lobsWritten, 6);

                done();
            });
        });
    });

    describe('batchUpdate', function () {
        it('no lobs', function (done) {
            var connection = {};
            Connection.extend(connection);

            var vars = [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {}
                });
            };

            connection.batchUpdate('UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3', [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ], {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            });
        });

        it('multiple lobs', function (done) {
            var commitCalled = false;
            var connection = {
                commit: function (callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            var lobsWritten = 0;
            var vars = [
                {
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
                },
                {
                    id: 2,
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
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
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

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            var rollbackCalled = false;
            var connection = {
                rollback: function (cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            var vars = [
                {
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
                },
                {
                    id: 2,
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
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
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

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on execute', function (done) {
            var rollbackCalled = false;
            var connection = {
                rollback: function (cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            var vars = [
                {
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
                },
                {
                    id: 2,
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
                }
            ];
            var counter = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindVars, vars[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                if (counter < 2) {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                } else {
                    callback(new Error('execute error test'));
                }
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on commit', function (done) {
            var connection = {
                rollback: function (cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            connection.commit = function (callback) {
                callback(new Error('commit error'));
            };

            var lobsWritten = 0;
            connection.baseExecute = function (sql, bindVars, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
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

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: new Buffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'commit error');
                assert.equal(lobsWritten, 6);

                done();
            });
        });
    });

    describe('transaction', function () {
        it('single action', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.transaction(function (callback) {
                assert.isFalse(commitDone);

                callback(null, 'my result');
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual(['my result'], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('multiple actions', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            var secondStarted = false;
            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    setTimeout(function () {
                        assert.isTrue(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('parallel', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            var secondStarted = false;
            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    setTimeout(function () {
                        assert.isTrue(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], {
                sequence: false
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('sequence', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            var secondStarted = false;
            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    setTimeout(function () {
                        assert.isFalse(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], {
                sequence: true
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('prevent autoCommit', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };
            connection.baseExecute = function (sql, bindParams, options, cb) {
                assert.deepEqual({
                    autoCommit: false,
                    otherOption: 'test123'
                }, options);

                cb();
            };

            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    connection.execute('sql', [], {
                        autoCommit: true,
                        otherOption: 'test123'
                    }, function () {
                        callback(null, 'my first');
                    });
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    connection.batchInsert('sql', [{}], {
                        autoCommit: true,
                        otherOption: 'test123'
                    }, function () {
                        callback(null, 'my second');
                    });
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('rollback in middle of transaction', function (done) {
            var connection = {
                rollback: function (cb) {
                    cb();
                }
            };

            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.transaction(function (callback) {
                connection.rollback(callback);
            }, function (error) {
                assert.isDefined(error);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('commit in middle of transaction', function (done) {
            var commitDone = false;
            var connection = {
                rollback: function (cb) {
                    cb();
                },
                commit: function (cb) {
                    commitDone = true;
                    cb();
                }
            };

            Connection.extend(connection);

            connection.transaction(function (callback) {
                connection.commit(callback);
            }, function (error) {
                assert.isDefined(error);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('transaction in transaction', function (done) {
            var connection = {
                rollback: function (cb) {
                    cb();
                }
            };

            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.transaction(function (callback) {
                connection.transaction(function (cb) {
                    cb();
                }, callback);
            }, function (error) {
                assert.isDefined(error);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('error in actions', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            var rollbackDone = false;
            connection.rollback = function (callback) {
                rollbackDone = true;
                callback();
            };

            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my first');
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(new Error('test error'));
                }
            ], function (error) {
                assert.isDefined(error);
                assert.equal('test error', error.message);
                assert.isFalse(commitDone);
                assert.isTrue(rollbackDone);

                done();
            });
        });

        it('error in commit', function (done) {
            var connection = {};
            Connection.extend(connection);

            var commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback(new Error('commit error'));
            };

            var rollbackDone = false;
            connection.rollback = function (callback) {
                rollbackDone = true;
                callback();
            };

            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my first');
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], function (error) {
                assert.isDefined(error);
                assert.equal('commit error', error.message);
                assert.isTrue(commitDone);
                assert.isTrue(rollbackDone);

                done();
            });
        });
    });
});
