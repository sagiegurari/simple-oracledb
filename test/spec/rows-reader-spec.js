'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var helper = require('../helpers/test-oracledb');
var RowsReader = require('../../lib/rows-reader');

describe('RowsReader Tests', function () {
    describe('getFlattenRowsCount', function () {
        it('no flattenStackEveryRows value', function () {
            var count = RowsReader.getFlattenRowsCount(['test'], {});
            assert.strictEqual(count, 100);
        });

        it('flattenStackEveryRows value provided', function () {
            var count = RowsReader.getFlattenRowsCount(['test'], {
                flattenStackEveryRows: 5000
            });
            assert.strictEqual(count, 5000);
        });

        it('lots of columns', function () {
            var columnNames = [];
            var index;
            for (index = 0; index < 6000; index++) {
                columnNames.push('test' + index);
            }

            var count = RowsReader.getFlattenRowsCount(columnNames, {});
            assert.strictEqual(count, 1);
        });

        it('fews columns', function () {
            var columnNames = [];
            var index;
            for (index = 0; index < 23; index++) {
                columnNames.push('test' + index);
            }

            var count = RowsReader.getFlattenRowsCount(columnNames, {});
            assert.strictEqual(count, 4);
        });

        it('exact check columns amount', function () {
            var columnNames = [];
            var index;
            for (index = 0; index < 100; index++) {
                columnNames.push('test' + index);
            }

            var count = RowsReader.getFlattenRowsCount(columnNames, {});
            assert.strictEqual(count, 1);
        });

        it('almost exact check columns amount', function () {
            var columnNames = [];
            var index;
            for (index = 0; index < 99; index++) {
                columnNames.push('test' + index);
            }

            var count = RowsReader.getFlattenRowsCount(columnNames, {});
            assert.strictEqual(count, 1);
        });
    });

    describe('read', function () {
        it('empty', function (done) {
            RowsReader.read([], [], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);

                done();
            });
        });

        it('array - basic js types', function (done) {
            var date = new Date();
            RowsReader.read([
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
            ], [
                [
                    1,
                    'test',
                    50,
                    undefined
                ],
                [
                    'a',
                    date,
                    undefined,
                    null
                ]
            ], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: null
                    }
                ], jsRows);

                done();
            });
        });

        it('object - basic js types', function (done) {
            var date = new Date();
            RowsReader.read([
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
            ], [
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: undefined
                }
            ], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined
                    }
                ], jsRows);

                done();
            });
        });

        it('array - basic js types, huge size', function (done) {
            this.timeout(5000);

            var data = [];
            var result = [];
            var rowData;
            var index;
            var numValue;
            for (index = 0; index < 5000; index++) {
                numValue = (index % 20);

                rowData = [
                    index,
                    'test-' + index,
                    numValue,
                    undefined
                ];

                data.push(rowData);
                result.push({
                    COL1: rowData[0],
                    COL2: rowData[1],
                    COL3: rowData[2],
                    COL4: rowData[3]
                });
            }

            RowsReader.read([
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
            ], data, {
                flattenStackEveryRows: 50
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual(result, jsRows);

                done();
            });
        });

        it('array - CLOB types', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var date = new Date();
            RowsReader.read([
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
            ], [
                [
                    lob1,
                    'test',
                    50,
                    undefined
                ],
                [
                    'a',
                    date,
                    undefined,
                    lob2
                ]
            ], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456'
                    }
                ], jsRows);

                done();
            });

            setTimeout(function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');

                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }, 10);
        });

        it('object - CLOB types', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var date = new Date();
            RowsReader.read([
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
            ], [
                {
                    COL1: lob1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: lob2
                }
            ], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456'
                    }
                ], jsRows);

                done();
            });

            setTimeout(function () {
                lob1.emit('data', 'test1');
                lob1.emit('data', '\ntest2');
                lob1.emit('end');

                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }, 10);
        });

        it('array - BLOB types', function (done) {
            var lob1 = helper.createBLOB();
            var lob2 = helper.createBLOB();

            var date = new Date();
            RowsReader.read([
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
            ], [
                [
                    lob1,
                    'test',
                    50,
                    undefined
                ],
                [
                    'a',
                    date,
                    undefined,
                    lob2
                ]
            ], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: new Buffer('test1\ntest2', 'utf8'),
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: new Buffer('123456', 'utf8')
                    }
                ], jsRows);

                done();
            });

            setTimeout(function () {
                lob1.emit('data', new Buffer('test1', 'utf8'));
                lob1.emit('data', new Buffer('\ntest2', 'utf8'));
                lob1.emit('end');

                lob2.emit('data', new Buffer('123', 'utf8'));
                lob2.emit('data', new Buffer('456', 'utf8'));
                lob2.emit('end');
            }, 10);
        });

        it('object - BLOB types', function (done) {
            var lob1 = helper.createBLOB();
            var lob2 = helper.createBLOB();

            var date = new Date();
            RowsReader.read([
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
            ], [
                {
                    COL1: lob1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: lob2
                }
            ], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: new Buffer('test1\ntest2', 'utf8'),
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: new Buffer('123456', 'utf8')
                    }
                ], jsRows);

                done();
            });

            setTimeout(function () {
                lob1.emit('data', new Buffer('test1', 'utf8'));
                lob1.emit('data', new Buffer('\ntest2', 'utf8'));
                lob1.emit('end');

                lob2.emit('data', new Buffer('123', 'utf8'));
                lob2.emit('data', new Buffer('456', 'utf8'));
                lob2.emit('end');
            }, 10);
        });

        it('array - error', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var date = new Date();
            RowsReader.read([
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
            ], [
                [
                    lob1,
                    'test',
                    50,
                    undefined
                ],
                [
                    'a',
                    date,
                    undefined,
                    lob2
                ]
            ], function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test lob error');

                done();
            });

            setTimeout(function () {
                lob1.emit('data', 'test1');
                lob1.emit('error', new Error('test lob error'));

                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }, 10);
        });

        it('object - error', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var date = new Date();
            RowsReader.read([
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
            ], [
                {
                    COL1: lob1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: lob2
                }
            ], function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test lob error');

                done();
            });

            setTimeout(function () {
                lob1.emit('data', 'test1');
                lob1.emit('error', new Error('test lob error'));

                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }, 10);
        });
    });

    describe('readJSON', function () {
        it('undefined', function () {
            var json = RowsReader.readJSON();
            assert.isUndefined(json);
        });

        it('multiple keys', function () {
            var errorFound = false;

            try {
                RowsReader.readJSON([
                    {
                        key1: JSON.stringify({
                            test: true
                        }),
                        key2: JSON.stringify({
                            test: true
                        })
                    }
                ]);
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('no rows', function () {
            var json = RowsReader.readJSON([]);
            assert.deepEqual([], json);
        });

        it('multiple json rows', function () {
            var output = RowsReader.readJSON([
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
                        test: false,
                        array: [1, 'b', 3],
                        subObject: {
                            key1: 'value1'
                        }
                    })
                }
            ]);

            assert.deepEqual(output, [
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
                    test: false,
                    array: [1, 'b', 3],
                    subObject: {
                        key1: 'value1'
                    }
                }
            ]);
        });
    });
});
