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

    describe('read tests', function () {
        it('empty', function (done) {
            ResultSetReader.read(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 100);
                    callback(null, []);
                }
            }, function (error, jsRows) {
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

            ResultSetReader.read(columnNames, {
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

            ResultSetReader.read(columnNames, {
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

            ResultSetReader.read(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob2 error');

                done();
            });
        });

        it('object - error', function (done) {
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

            ResultSetReader.read(columnNames, {
                getRows: function (number, callback) {
                    assert.equal(number, 100);

                    var events = dbEvents.shift();
                    if (events) {
                        setTimeout(events, 10);
                    }

                    callback(null, dbData.shift());
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob2 error');

                done();
            });
        });
    });
});
