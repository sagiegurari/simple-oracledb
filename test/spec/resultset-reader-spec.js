'use strict';

const chai = require('chai');
const assert = chai.assert;
const helper = require('../helpers/test-oracledb');
const resultSetReader = require('../../lib/resultset-reader');
const ResultSetReadStream = require('../../lib/resultset-read-stream');

describe('resultSetReader Tests', function () {
    const columnNames = [
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
                close(releaseCallback) {
                    releaseCallback();
                }
            }, true, function (error) {
                assert.isUndefined(error);

                done();
            });
        });

        it('error no ignore', function (done) {
            resultSetReader.releaseResultSet({
                close(releaseCallback) {
                    releaseCallback(new Error('test'));
                }
            }, false, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('error ignore', function (done) {
            resultSetReader.releaseResultSet({
                close(releaseCallback) {
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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
                getRows(number, callback) {
                    assert.equal(number, 5);

                    const events = dbEvents.shift();
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
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
                close(releaseCallback) {
                    releaseCallback(new Error('test close'));
                },
                getRows(number, callback) {
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            const outputData = [
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 2);

                    const events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 2
            }, function (error, jsRows) {
                assert.isNull(error);

                if (outputData.length) {
                    assert.deepEqual(outputData.shift(), jsRows);

                    if (!outputData.length) {
                        done();
                    }
                }
            });
        });

        it('object - all types', function (done) {
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            const outputData = [
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 2);

                    const events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 2
            }, function (error, jsRows) {
                assert.isNull(error);

                if (outputData.length) {
                    assert.deepEqual(outputData.shift(), jsRows);

                    if (outputData.length === 0) {
                        done();
                    }
                }
            });
        });

        it('array - error', function (done) {
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            let counter = 0;
            resultSetReader.readBulks(columnNames, {
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            let counter = 0;
            resultSetReader.readBulks(columnNames, {
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
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
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
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
            const stream = new ResultSetReadStream();

            resultSetReader.stream(columnNames, {
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            const resultData = [
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

            const stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 250);

                    const events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, {
                bulkRowsAmount: 250
            }, stream);

            let eventCounter = 0;
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            const resultData = [
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

            const stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, stream);

            let eventCounter = 0;
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
            const stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close(releaseCallback) {
                    releaseCallback();
                },
                getRows(number, callback) {
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
            const date = new Date();
            const lob1 = helper.createCLOB();
            const lob2 = helper.createCLOB();

            const dbData = [
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
            const dbEvents = [
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

            const resultData = [
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

            const stream = new ResultSetReadStream();
            resultSetReader.stream(columnNames, {
                close(releaseCallback) {
                    releaseCallback(new Error('test close'));
                },
                getRows(number, callback) {
                    assert.equal(number, 100);

                    const events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, stream);

            let eventCounter = 0;
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
            const stream = new ResultSetReadStream();

            resultSetReader.stream(columnNames, {
                close(releaseCallback) {
                    setTimeout(function () {
                        releaseCallback(new Error('test close'));
                    }, 10);
                },
                getRows(number, callback) {
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
