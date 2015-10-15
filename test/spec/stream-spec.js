'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var EventEmitter = require('events').EventEmitter;
var stream = require('../../lib/stream');

describe('stream Tests', function () {
    describe('readFully Tests', function () {
        it('readFully valid test', function (done) {
            var testStream = new EventEmitter();
            testStream.setEncoding = function (encoding) {
                assert.equal(encoding, 'utf8');
            };

            stream.readFully(testStream, false, function (error, data) {
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

        it('readFully error test', function (done) {
            var testStream = new EventEmitter();
            testStream.setEncoding = function (encoding) {
                assert.equal(encoding, 'utf8');
            };

            stream.readFully(testStream, false, function (error, data) {
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

            testStream.emit('data', 'first line\n');
            testStream.emit('data', 'second line');
            testStream.emit('data', ', second part.');
            testStream.emit('error', new Error('test'));
        });

        it('readFully close test', function (done) {
            var testStream = new EventEmitter();
            testStream.setEncoding = function (encoding) {
                assert.equal(encoding, 'utf8');
            };

            stream.readFully(testStream, false, function (error, data) {
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
});
