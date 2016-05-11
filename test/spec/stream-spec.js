'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var EventEmitter = require('events').EventEmitter;
var stream = require('../../lib/stream');

describe('stream Tests', function () {
    describe('read Tests', function () {
        it('read valid test', function (done) {
            var testStream = new EventEmitter();
            testStream.setEncoding = function (encoding) {
                assert.equal(encoding, 'utf8');
            };

            stream.read(testStream, false, function (error, data) {
                assert.isNull(error);
                assert.equal(data, 'first line\nsecond line, second part.');

                assert.equal(0, testStream.listeners('data').length);
                assert.equal(0, testStream.listeners('end').length);
                assert.equal(0, testStream.listeners('error').length);

                done();
            });

            assert.equal(1, testStream.listeners('data').length);
            assert.equal(1, testStream.listeners('end').length);
            assert.equal(1, testStream.listeners('error').length);

            testStream.emit('data', 'first line\n');
            testStream.emit('data', 'second line');
            testStream.emit('data', ', second part.');
            testStream.emit('end');
            testStream.emit('close');
        });

        it('read error test', function (done) {
            var testStream = new EventEmitter();
            testStream.setEncoding = function (encoding) {
                assert.equal(encoding, 'utf8');
            };

            stream.read(testStream, false, function (error, data) {
                assert.isDefined(error);
                assert.isUndefined(data);

                assert.equal(0, testStream.listeners('data').length);
                assert.equal(0, testStream.listeners('end').length);
                assert.equal(0, testStream.listeners('error').length);

                done();
            });

            assert.equal(1, testStream.listeners('data').length);
            assert.equal(1, testStream.listeners('end').length);
            assert.equal(1, testStream.listeners('error').length);

            testStream.emit('data'); //empty data
            testStream.emit('data', 'first line\n');
            testStream.emit('data', 'second line');
            testStream.emit('data', ', second part.');
            testStream.emit('error', new Error('test'));
        });

        it('read close test', function (done) {
            var testStream = new EventEmitter();
            testStream.setEncoding = function (encoding) {
                assert.equal(encoding, 'utf8');
            };

            stream.read(testStream, false, function (error, data) {
                assert.isNull(error);
                assert.equal(data, 'My Data.');

                assert.equal(0, testStream.listeners('data').length);
                assert.equal(0, testStream.listeners('end').length);
                assert.equal(0, testStream.listeners('error').length);

                done();
            });

            assert.equal(1, testStream.listeners('data').length);
            assert.equal(1, testStream.listeners('end').length);
            assert.equal(1, testStream.listeners('error').length);

            testStream.emit('data', 'My Data.');
            testStream.emit('close');
            testStream.emit('end');
        });
    });

    describe('write Tests', function () {
        it('write string test', function (done) {
            var writable = new EventEmitter();
            writable.end = function (data, encoding, callback) {
                assert.equal(data, 'TEST STRING DATA');
                assert.equal(encoding, 'utf8');
                assert.isFunction(callback);

                callback();
            };

            stream.write(writable, 'TEST STRING DATA', function (error) {
                assert.isUndefined(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('write Buffer test', function (done) {
            var writable = new EventEmitter();
            writable.end = function (data, callback) {
                assert.deepEqual(data, new Buffer('TEST STRING DATA'));
                assert.isFunction(callback);

                callback();
            };

            stream.write(writable, new Buffer('TEST STRING DATA'), function (error) {
                assert.isUndefined(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('write null data test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                assert.fail();
            };

            stream.write(writable, null, function (error) {
                assert.isUndefined(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('write undefined data test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                assert.fail();
            };

            stream.write(writable, undefined, function (error) {
                assert.isUndefined(error);
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });

        it('write null writable test', function (done) {
            stream.write(null, 'data', function (error) {
                assert.isUndefined(error);

                done();
            });
        });

        it('write undefined writable test', function (done) {
            stream.write(undefined, 'data', function (error) {
                assert.isUndefined(error);

                done();
            });
        });

        it('write error test', function (done) {
            var writable = new EventEmitter();
            writable.end = function () {
                var callback = Array.prototype.pop.call(arguments);
                writable.emit('error', new Error('test'));

                setTimeout(callback, 10);
            };

            stream.write(writable, 'TEST STRING DATA', function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test');
                assert.equal(0, writable.listeners('error').length);

                done();
            });
        });
    });
});
