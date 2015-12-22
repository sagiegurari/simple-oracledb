'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var helper = require('../helpers/test-oracledb');
var ResultSetReader = require('../../lib/resultset-reader');

describe('ResultSetReader Tests', function () {
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
        }
    ];

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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }];

            ResultSetReader.readNextRows(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }];

            ResultSetReader.readNextRows(columnNames, {
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
            ResultSetReader.readFully(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }];

            ResultSetReader.readFully(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }];

            ResultSetReader.readFully(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('error', new Error('lob2 error'));
            }];

            ResultSetReader.readFully(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('error', new Error('lob2 error'));
            }];

            ResultSetReader.readFully(columnNames, {
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
            ResultSetReader.readFully(columnNames, {
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
            ResultSetReader.readBulks(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }];

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

            ResultSetReader.readBulks(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }];

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

            ResultSetReader.readBulks(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('error', new Error('lob2 error'));
            }];

            var counter = 0;
            ResultSetReader.readBulks(columnNames, {
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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('error', new Error('lob2 error'));
            }];

            var counter = 0;
            ResultSetReader.readBulks(columnNames, {
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
            ResultSetReader.readBulks(columnNames, {
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
            ResultSetReader.stream(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 1);
                    callback(null, []);
                }
            }, function (error, stream) {
                assert.isNull(error);

                stream.on('data', function () {
                    assert.fail();
                });

                stream.on('end', done);
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
                    [1, 'test', 50, lob1]
                ],
                [
                    ['a', date, undefined, null]
                ],
                [
                    [10, true, lob2, 100]
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
                    COL4: undefined
                },
                {
                    COL1: 10,
                    COL2: true,
                    COL3: '123456',
                    COL4: 100
                }
            ];

            ResultSetReader.stream(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 1);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, function (error, stream) {
                assert.isNull(error);

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
            var dbEvents = [null, function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');
            }, function () {
                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('error', new Error('lob2 error'));
            }];

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
                    COL4: undefined
                }
            ];

            ResultSetReader.stream(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 1);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, function (error, stream) {
                assert.isNull(error);

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
        });

        it('error getRows', function (done) {
            ResultSetReader.stream(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 1);

                    callback(new Error('getrows'));
                }
            }, function (error, stream) {
                assert.isNull(error);

                stream.on('data', function () {
                    assert.fail();
                });

                stream.on('error', function (streamError) {
                    assert.equal(streamError.message, 'getrows');

                    done();
                });
            });
        });
    });
});
