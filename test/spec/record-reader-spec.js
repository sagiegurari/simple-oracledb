'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var helper = require('../helpers/test-oracledb');
var RecordReader = require('../../lib/record-reader');

describe('RecordReader Tests', function () {
    describe('getValue tests', function () {
        it('null', function (done) {
            var info = {};
            RecordReader.getValue(null, info, function (error, value) {
                assert.isNull(error);
                assert.isNull(value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('undefined', function (done) {
            var info = {};
            RecordReader.getValue(undefined, info, function (error, value) {
                assert.isNull(error);
                assert.isUndefined(value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('boolean - true', function (done) {
            var info = {};
            RecordReader.getValue(true, info, function (error, value) {
                assert.isNull(error);
                assert.isTrue(value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('boolean - false', function (done) {
            var info = {};
            RecordReader.getValue(false, info, function (error, value) {
                assert.isNull(error);
                assert.isFalse(value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('number - 0', function (done) {
            var info = {};
            RecordReader.getValue(0, info, function (error, value) {
                assert.isNull(error);
                assert.equal(0, value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('number - int', function (done) {
            var info = {};
            RecordReader.getValue(1, info, function (error, value) {
                assert.isNull(error);
                assert.equal(1, value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('number - float', function (done) {
            var info = {};
            RecordReader.getValue(1.5, info, function (error, value) {
                assert.isNull(error);
                assert.equal(1.5, value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('string - empty', function (done) {
            var info = {};
            RecordReader.getValue('', info, function (error, value) {
                assert.isNull(error);
                assert.equal('', value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('string - with text', function (done) {
            var info = {};
            RecordReader.getValue('TEST', info, function (error, value) {
                assert.isNull(error);
                assert.equal('TEST', value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('date', function (done) {
            var info = {};
            var date = new Date();
            RecordReader.getValue(date, info, function (error, value) {
                assert.isNull(error);
                assert.equal(date, value);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('LOB', function (done) {
            var testStream = helper.createCLOB();

            var info = {};
            RecordReader.getValue(testStream, info, function (error, value) {
                assert.isNull(error);
                assert.equal('first line\nsecond line, second part.', value);

                assert.isTrue(info.lobFound);

                done();
            });

            testStream.emit('data', 'first line\n');
            testStream.emit('data', 'second line');
            testStream.emit('data', ', second part.');
            testStream.emit('end');
        });

        it('unsupported', function (done) {
            var info = {};
            RecordReader.getValue({}, info, function (error) {
                assert.isDefined(error);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('error', function (done) {
            var testStream = helper.createCLOB();

            var info = {};
            RecordReader.getValue(testStream, info, function (error, value) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
                assert.isUndefined(value);

                assert.isTrue(info.lobFound);

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
            var info = {};
            RecordReader.read([], [], info, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({}, jsObject);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('array - basic js types', function (done) {
            var info = {};
            RecordReader.read([
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
                1,
                'test',
                50,
                undefined
            ], info, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                }, jsObject);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('object - basic js types', function (done) {
            var info = {};
            RecordReader.read([
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
            ], {
                COL1: 1,
                COL2: 'test',
                COL3: 50,
                COL4: undefined
            }, info, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined
                }, jsObject);

                assert.isUndefined(info.lobFound);

                done();
            });
        });

        it('array - LOB types', function (done) {
            var lob1 = helper.createCLOB();
            var lob2 = helper.createCLOB();

            var info = {};
            RecordReader.read([
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
                },
                {
                    name: 'LOB1'
                },
                {
                    name: 'LOB2'
                }
            ], [
                1,
                'test',
                50,
                undefined,
                lob1,
                lob2
            ], info, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined,
                    LOB1: 'test1\ntest2',
                    LOB2: '123456'
                }, jsObject);

                assert.isTrue(info.lobFound);

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

            var info = {};
            RecordReader.read([
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
            }, info, function (error, jsObject) {
                assert.isNull(error);
                assert.deepEqual({
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: undefined,
                    LOB1: 'test1\ntest2',
                    LOB2: '123456'
                }, jsObject);

                assert.isTrue(info.lobFound);

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

            var info = {};
            RecordReader.read([
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
                },
                {
                    name: 'LOB1'
                },
                {
                    name: 'LOB2'
                }
            ], [
                1,
                'test',
                50,
                undefined,
                lob1,
                lob2
            ], info, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob1 error');

                assert.isTrue(info.lobFound);

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

            var info = {};
            RecordReader.read([
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
            }, info, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob1 error');

                assert.isTrue(info.lobFound);

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

    describe('readJSON tests', function () {
        it('undefined no column', function () {
            var json = RecordReader.readJSON();
            assert.isUndefined(json);
        });

        it('undefined with column', function () {
            var json = RecordReader.readJSON(undefined, 'data');
            assert.isUndefined(json);
        });

        it('not json no column', function () {
            var json = RecordReader.readJSON('some text');

            assert.isUndefined(json);
        });

        it('not json with column', function () {
            var json = RecordReader.readJSON('some text', 'data');

            assert.isObject(json);
        });

        it('not json field', function () {
            var errorFound = false;

            try {
                RecordReader.readJSON({
                    data: 'some text'
                }, 'data');
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('not json in data with column', function () {
            var errorFound = false;

            try {
                RecordReader.readJSON({
                    data: 'some text'
                }, 'data');
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('json no column', function () {
            var output = RecordReader.readJSON({
                data: JSON.stringify({
                    a: 1
                })
            });

            assert.isUndefined(output);
        });

        it('json with column', function () {
            var output = RecordReader.readJSON({
                data: JSON.stringify({
                    a: 1,
                    test: true,
                    array: [
                        1,
                        2,
                        3
                    ],
                    subObject: {
                        key1: 'value1'
                    }
                })
            }, 'data');

            assert.deepEqual(output, {
                a: 1,
                test: true,
                array: [
                    1,
                    2,
                    3
                ],
                subObject: {
                    key1: 'value1'
                }
            });
        });

        it('json wrong column', function () {
            var output = RecordReader.readJSON({
                data: JSON.stringify({
                    a: 1,
                    test: true,
                    array: [
                        1,
                        2,
                        3
                    ],
                    subObject: {
                        key1: 'value1'
                    }
                })
            }, 'wrong');

            assert.deepEqual(output, {});
        });
    });
});
