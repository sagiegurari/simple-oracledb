'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var helper = require('../helpers/test-oracledb');
var resultSetReader = require('../../lib/resultset-reader');
var ResultSetReadStream = require('../../lib/resultset-read-stream');

describe('resultSetReader Tests', function () {
    var columnNames = [
        {
            name: 'COL1'
        },
        {
            name: 'COL2'
        },
        {
            name: 'COL3'
        },
        {
            name: 'COL4'
        }
    ];

    describe('releaseResultSet tests', function () {
        it('no resultset', function (done) {
            resultSetReader.releaseResultSet(undefined, true, function (error) {
                assert.isUndefined(error);

                done();
            });
        });

        it('valid', function (done) {
            resultSetReader.releaseResultSet({
                close: function (releaseCallback) {
                    releaseCallback();
                }
            }, true, function (error) {
                assert.isUndefined(error);

                done();
            });
        });

        it('error no ignore', function (done) {
            resultSetReader.releaseResultSet({
                close: function (releaseCallback) {
                    releaseCallback(new Error('test'));
                }
            }, false, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('error ignore', function (done) {
            resultSetReader.releaseResultSet({
                close: function (releaseCallback) {
                    releaseCallback(new Error('test'));
                }
            }, true, function (error) {
                assert.isUndefined(error);

                done();
            });
        });
    });

    describe('readNextRows tests', function () {
        it('array - all types without bulk size', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1],
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            resultSetReader.readNextRows(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
                    }
                ], jsRows);

                done();
            });
        });

        it('array - all types with bulk size', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1],
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            resultSetReader.readNextRows(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 5);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 5
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
                    }
                ], jsRows);

                done();
            });
        });
    });

    describe('readFully tests', function () {
        it('empty', function (done) {
            resultSetReader.readFully(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);
                    callback(null, []);
                }
            }, null, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);

                done();
            });
        });

        it('empty error in close', function (done) {
            resultSetReader.readFully(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback(new Error('test close'));
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);
                    callback(null, []);
                }
            }, null, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test close');

                done();
            });
        });

        it('array - all types', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1],
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            resultSetReader.readFully(columnNames, {
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
            }, null, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
                    },
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2'
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: null
                    },
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100
                    }
                ], jsRows);

                done();
            });
        });

        it('object - all types', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
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
                        COL4: 100
                    }
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            resultSetReader.readFully(columnNames, {
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
            }, null, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
                    },
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2'
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined
                    },
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100
                    }
                ], jsRows);

                done();
            });
        });

        it('array - error', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1],
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('error', new Error('lob2 error'));
                }
            ];

            resultSetReader.readFully(columnNames, {
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
            }, null, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob2 error');

                done();
            });
        });

        it('object - error lob', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
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
                        COL4: 100
                    }
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('error', new Error('lob2 error'));
                }
            ];

            resultSetReader.readFully(columnNames, {
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
            }, null, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob2 error');

                done();
            });
        });

        it('error getRows', function (done) {
            resultSetReader.readFully(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    callback(new Error('getrows'));
                }
            }, null, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'getrows');

                done();
            });
        });
    });

    describe('readBulks tests', function () {
        it('empty', function (done) {
            resultSetReader.readBulks(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);
                    callback(null, []);
                }
            }, null, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);

                done();
            });
        });

        it('array - all types', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1],
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            var outputData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
                    }
                ],
                [
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2'
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: null
                    }
                ],
                [
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100
                    }
                ]
            ];

            resultSetReader.readBulks(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 2);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 2
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

        it('object - all types', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
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
                        COL4: 100
                    }
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            var outputData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
                    }
                ],
                [
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2'
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
                        COL3: '123456',
                        COL4: 100
                    }
                ]
            ];

            resultSetReader.readBulks(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 2);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 2
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

        it('array - error', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1],
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('error', new Error('lob2 error'));
                }
            ];

            var counter = 0;
            resultSetReader.readBulks(columnNames, {
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
            }, null, function (error) {
                counter++;

                if (counter === 3) {
                    assert.isDefined(error);
                    assert.isNotNull(error);
                    assert.equal(error.message, 'lob2 error');

                    done();
                } else {
                    assert.isNull(error);
                }
            });
        });

        it('object - error lob', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date
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
                        COL4: 100
                    }
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('error', new Error('lob2 error'));
                }
            ];

            var counter = 0;
            resultSetReader.readBulks(columnNames, {
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
            }, null, function (error) {
                counter++;

                if (counter === 3) {
                    assert.isDefined(error);
                    assert.equal(error.message, 'lob2 error');

                    done();
                } else {
                    assert.isNull(error);
                }
            });
        });

        it('error getRows', function (done) {
            resultSetReader.readBulks(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    callback(new Error('getrows'));
                }
            }, null, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'getrows');

                done();
            });
        });
    });

    describe('stream tests', function () {
        it('empty', function (done) {
            var stream = new ResultSetReadStream();

            resultSetReader.stream(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);
                    callback(null, []);
                }
            }, stream);

            stream.on('data', function () {
                assert.fail();
            });

            stream.on('end', done);
        });

        it('array - all types', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date],
                    ['second row', 2, true, date]
                ],
                [
                    [1, 'test', 50, lob1]
                ],
                [
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            var resultData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date
                },
                {
                    COL1: 'second row',
                    COL2: 2,
                    COL3: true,
                    COL4: date
                },
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: 'test1\ntest2'
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: null
                },
                {
                    COL1: 10,
                    COL2: true,
                    COL3: '123456',
                    COL4: 100
                }
            ];

            var stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 250);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 250
            }, stream);

            var eventCounter = 0;
            stream.on('data', function (row) {
                assert.deepEqual(resultData[eventCounter], row);
                eventCounter++;
            });

            stream.on('end', function () {
                assert.equal(eventCounter, resultData.length);

                done();
            });
        });

        it('array - error', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1]
                ],
                [
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('error', new Error('lob2 error'));
                }
            ];

            var resultData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date
                },
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: 'test1\ntest2'
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: null
                }
            ];

            var stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
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
            }, stream);

            var eventCounter = 0;
            stream.on('data', function (row) {
                assert.deepEqual(resultData[eventCounter], row);
                eventCounter++;
            });

            stream.on('error', function (streamError) {
                assert.equal(eventCounter, resultData.length);
                assert.equal(streamError.message, 'lob2 error');

                done();
            });
        });

        it('error getRows', function (done) {
            var stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback();
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    process.nextTick(function () {
                        callback(new Error('getrows'));
                    });
                }
            }, stream);

            stream.on('error', function (streamError) {
                assert.equal(streamError.message, 'getrows');

                done();
            });

            stream.on('data', function () {
                assert.fail();
            });
        });

        it('error in close after data read', function (done) {
            var date = new Date();
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var dbData = [
                [
                    ['first row', 1, false, date]
                ],
                [
                    [1, 'test', 50, lob1]
                ],
                [
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
                ]
            ];
            var dbEvents = [
                null,
                function () {
                    lob1.emit('data', 'test1');
                    lob1.emit('data', '\ntest2');
                    lob1.emit('end');
                },
                function () {
                    lob2.emit('data', '123');
                    lob2.emit('data', '456');
                    lob2.emit('end');
                }
            ];

            var resultData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date
                },
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: 'test1\ntest2'
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: null
                },
                {
                    COL1: 10,
                    COL2: true,
                    COL3: '123456',
                    COL4: 100
                }
            ];

            var stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close: function (releaseCallback) {
                    releaseCallback(new Error('test close'));
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, stream);

            var eventCounter = 0;
            stream.on('data', function (row) {
                assert.deepEqual(resultData[eventCounter], row);
                eventCounter++;
            });

            stream.on('error', function (streamError) {
                assert.equal(streamError.message, 'test close');

                done();
            });
        });

        it('empty error in close', function (done) {
            var stream = new ResultSetReadStream();

            resultSetReader.stream(columnNames, {
                close: function (releaseCallback) {
                    setTimeout(function () {
                        releaseCallback(new Error('test close'));
                    }, 10);
                },
                getRows: function (number, callback) {
                    assert.equal(number, 100);
                    callback(null, []);
                }
            }, stream);

            stream.on('data', function () {
                assert.fail();
            });

            stream.on('error', function (streamError) {
                assert.equal(streamError.message, 'test close');

                done();
            });
        });
    });
});
