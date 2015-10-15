'use strict';
/*global describe: false, it: false */

var EventEmitter = require('events').EventEmitter;
var chai = require('chai');
var assert = chai.assert;
var helper = require('../helper/test-oracledb');
var RecordReader = require('../../lib/record-reader');

describe('RecordReader Tests', function () {
    describe('getValue tests', function () {
        it('null', function (done) {
            RecordReader.getValue(null, function (error, value) {
                assert.isUndefined(error);
                assert.isUndefined(value);

                done();
            });
        });

        it('undefined', function (done) {
            RecordReader.getValue(undefined, function (error, value) {
                assert.isUndefined(error);
                assert.isUndefined(value);

                done();
            });
        });

        it('boolean - true', function (done) {
            RecordReader.getValue(true, function (error, value) {
                assert.isNull(error);
                assert.isTrue(value);

                done();
            });
        });

        it('boolean - false', function (done) {
            RecordReader.getValue(false, function (error, value) {
                assert.isNull(error);
                assert.isFalse(value);

                done();
            });
        });

        it('number - 0', function (done) {
            RecordReader.getValue(0, function (error, value) {
                assert.isNull(error);
                assert.equal(0, value);

                done();
            });
        });

        it('number - int', function (done) {
            RecordReader.getValue(1, function (error, value) {
                assert.isNull(error);
                assert.equal(1, value);

                done();
            });
        });

        it('number - float', function (done) {
            RecordReader.getValue(1.5, function (error, value) {
                assert.isNull(error);
                assert.equal(1.5, value);

                done();
            });
        });

        it('string - empty', function (done) {
            RecordReader.getValue('', function (error, value) {
                assert.isNull(error);
                assert.equal('', value);

                done();
            });
        });

        it('string - with text', function (done) {
            RecordReader.getValue('TEST', function (error, value) {
                assert.isNull(error);
                assert.equal('TEST', value);

                done();
            });
        });

        it('date', function (done) {
            var date = new Date();
            RecordReader.getValue(date, function (error, value) {
                assert.isNull(error);
                assert.equal(date, value);

                done();
            });
        });

        it('LOB', function (done) {
            var testStream = helper.createCLOB();

            RecordReader.getValue(testStream, function (error, value) {
                assert.isNull(error);
                assert.equal('first line\nsecond line, second part.', value);

                done();
            });

            testStream.emit('data', 'first line\n');
            testStream.emit('data', 'second line');
            testStream.emit('data', ', second part.');
            testStream.emit('end');
        });

        it('error', function (done) {
            var testStream = helper.createCLOB();

            RecordReader.getValue(testStream, function (error, value) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
                assert.isUndefined(value);

                done();
            });

            testStream.emit('data', 'first line\n');
            testStream.emit('data', 'second line');
            testStream.emit('data', ', second part.');
            testStream.emit('error', new Error('test error'));
        });
    });

    describe('read tests', function () {
        it('empty', function (done) {
            RecordReader.read([], [], function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({}, jsObject);

                done();
            });
        });

        it('array - basic js types', function (done) {
            RecordReader.read([
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
            ], [1, 'test', 50, undefined], function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                }, jsObject);

                done();
            });
        });

        it('object - basic js types', function (done) {
            RecordReader.read([
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
            ], {
                COL1: 1,
                COL2: 'test',
                COL3: 50,
                COL4: undefined
            }, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                }, jsObject);

                done();
            });
        });

        it('array - LOB types', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            RecordReader.read([
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
            ], [1, 'test', 50, undefined, lob1, lob2], function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined,
                    LOB1: 'test1\ntest2',
                    LOB2: '123456'
                }, jsObject);

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

        it('object - LOB types', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            RecordReader.read([
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
            ], {
                COL1: 1,
                COL2: 'test',
                COL3: 50,
                COL4: undefined,
                LOB1: lob1,
                LOB2: lob2
            }, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined,
                    LOB1: 'test1\ntest2',
                    LOB2: '123456'
                }, jsObject);

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

        it('array - error', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            RecordReader.read([
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
            ], [1, 'test', 50, undefined, lob1, lob2], function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob1 error');

                done();
            });

            setTimeout(function () {
                lob1.emit('data', 'test1');
                lob1.emit('error', new Error('lob1 error'));

                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }, 10);
        });

        it('object - error', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            RecordReader.read([
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
            ], {
                COL1: 1,
                COL2: 'test',
                COL3: 50,
                COL4: undefined,
                LOB1: lob1,
                LOB2: lob2
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob1 error');

                done();
            });

            setTimeout(function () {
                lob1.emit('data', 'test1');
                lob1.emit('error', new Error('lob1 error'));

                lob2.emit('data', '123');
                lob2.emit('data', '456');
                lob2.emit('end');
            }, 10);
        });
    });
});
