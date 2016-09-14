'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var EventEmitter = require('events').EventEmitter;
var recordWriter = require('../../lib/record-writer');

describe('RecordWriter Tests', function () {
    describe('write Tests', function () {
        it('string test', function (done) {
            var writable = new EventEmitter();
            writable.end = function (data, encoding, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.equal(encoding, 'utf8');
                assert.isFunction(callback);

                callback();
            };

            recordWriter.write({
                LOBCOL1: [
                    writable
                ]
            }, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('Buffer test', function (done) {
            var writable = new EventEmitter();
            writable.end = function (data, callback) {
                assert.deepEqual(data, new Buffer('TEST STRING DATA'));
                assert.isFunction(callback);

                callback();
            };

            recordWriter.write({
                LOBCOL1: [
                    writable
                ]
            }, {
                BIND1: new Buffer('TEST STRING DATA')
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('null data test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                assert.fail();
            };

            recordWriter.write({
                LOBCOL1: [
                    writable
                ]
            }, {
                BIND1: null
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('undefined data test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                assert.fail();
            };

            recordWriter.write({
                LOBCOL1: [
                    writable
                ]
            }, {
                BIND1: null
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('empty array outbindings test', function (done) {
            recordWriter.write({
                LOBCOL1: []
            }, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);

                done();
            });
        });

        it('undefined outbindings test', function (done) {
            recordWriter.write({}, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);

                done();
            });
        });

        it('multiple array outbindings test', function (done) {
            recordWriter.write({
                LOBCOL1: [
                    {},
                    {}
                ]
            }, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);

                done();
            });
        });

        it('multiple columns test', function (done) {
            var lobsWritten = 0;

            var writable1 = new EventEmitter();
            writable1.end = function (data, encoding, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.equal(encoding, 'utf8');
                assert.isFunction(callback);

                lobsWritten++;

                callback();
            };

            var writable2 = new EventEmitter();
            writable2.end = function (data, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.isFunction(callback);

                lobsWritten++;

                callback();
            };

            recordWriter.write({
                BIND1: [writable1],
                BIND2: [writable1],
                BIND3: [writable2],
                BIND4: [writable2]
            }, {
                BIND1: 'TEST STRING DATA',
                BIND2: 'TEST STRING DATA',
                BIND3: new Buffer('TEST STRING DATA'),
                BIND4: new Buffer('TEST STRING DATA')
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable1.listeners('error').length);
                assert.equal(lobsWritten, 4);

                done();
            });
        });
    });

    describe('writeMultiple Tests', function () {
        it('string test', function (done) {
            var writable = new EventEmitter();
            writable.end = function (data, encoding, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.equal(encoding, 'utf8');
                assert.isFunction(callback);

                callback();
            };

            recordWriter.writeMultiple({
                LOBCOL1: [
                    writable,
                    writable
                ]
            }, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('Buffer test', function (done) {
            var writable = new EventEmitter();
            writable.end = function (data, callback) {
                assert.deepEqual(data, new Buffer('TEST STRING DATA'));
                assert.isFunction(callback);

                callback();
            };

            recordWriter.writeMultiple({
                LOBCOL1: [
                    writable,
                    writable
                ]
            }, {
                BIND1: new Buffer('TEST STRING DATA')
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('null data test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                assert.fail();
            };

            recordWriter.writeMultiple({
                LOBCOL1: [
                    writable,
                    writable
                ]
            }, {
                BIND1: null
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('undefined data test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                assert.fail();
            };

            recordWriter.writeMultiple({
                LOBCOL1: [
                    writable,
                    writable
                ]
            }, {
                BIND1: null
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('empty array outbindings test', function (done) {
            recordWriter.writeMultiple({
                LOBCOL1: []
            }, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);

                done();
            });
        });

        it('undefined outbindings test', function (done) {
            recordWriter.writeMultiple({}, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);

                done();
            });
        });

        it('multiple array outbindings test', function (done) {
            recordWriter.writeMultiple({
                LOBCOL1: [
                    {},
                    {}
                ]
            }, {
                BIND1: 'TEST STRING DATA'
            }, function (error) {
                assert.isNull(error);

                done();
            });
        });

        it('multiple columns test', function (done) {
            var lobsWritten = 0;

            var writable1 = new EventEmitter();
            writable1.end = function (data, encoding, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.equal(encoding, 'utf8');
                assert.isFunction(callback);

                lobsWritten++;

                callback();
            };

            var writable2 = new EventEmitter();
            writable2.end = function (data, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.isFunction(callback);

                lobsWritten++;

                callback();
            };

            recordWriter.writeMultiple({
                BIND1: [
                    writable1,
                    writable1,
                    writable1,
                    writable1
                ],
                BIND2: [
                    writable1,
                    writable1,
                    writable1,
                    writable1
                ],
                BIND3: [
                    writable2,
                    writable2,
                    writable2,
                    writable2
                ],
                BIND4: [
                    writable2,
                    writable2,
                    writable2,
                    writable2
                ]
            }, {
                BIND1: 'TEST STRING DATA',
                BIND2: 'TEST STRING DATA',
                BIND3: new Buffer('TEST STRING DATA'),
                BIND4: new Buffer('TEST STRING DATA')
            }, function (error) {
                assert.isNull(error);
                assert.equal(0, writable1.listeners('error').length);
                assert.equal(lobsWritten, 16);

                done();
            });
        });
    });
});
