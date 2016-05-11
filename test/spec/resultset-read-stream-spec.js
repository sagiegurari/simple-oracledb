'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var ResultSetReadStream = require('../../lib/resultset-read-stream');

describe('ResultSetReadStream Tests', function () {
    var failListener = function (eventName) {
        return function () {
            assert.fail(eventName);
        };
    };

    describe('read tests', function () {
        it('no data', function (done) {
            var stream = new ResultSetReadStream();
            stream.nextRow = function (callback) {
                process.nextTick(function () {
                    callback();
                });
            };

            ['data', 'error', 'close'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            stream.on('end', done);
        });

        it('null data', function (done) {
            var stream = new ResultSetReadStream();
            stream.nextRow = function (callback) {
                process.nextTick(function () {
                    callback(null, null);
                });
            };

            ['data', 'error', 'close'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            stream.on('end', done);
        });

        it('multiple rows', function (done) {
            var stream = new ResultSetReadStream();
            var nextCounter = 0;
            stream.nextRow = function (callback) {
                if (nextCounter >= 5) {
                    process.nextTick(function () {
                        callback();
                    });
                } else {
                    process.nextTick(function () {
                        nextCounter++;

                        callback(null, {
                            row: nextCounter
                        });
                    });
                }
            };

            ['error', 'close'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            var dataFound = 0;
            stream.on('data', function (data) {
                dataFound++;

                assert.deepEqual(data, {
                    row: dataFound
                });
            });

            stream.on('end', function () {
                assert.equal(dataFound, 5);

                done();
            });
        });

        it('error on start', function (done) {
            var stream = new ResultSetReadStream();
            stream.nextRow = function (callback) {
                process.nextTick(function () {
                    callback(new Error('test'));
                });
            };

            ['data', 'end', 'close'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            stream.on('error', function (error) {
                assert.equal(error.message, 'test');

                done();
            });
        });

        it('error after few data events', function (done) {
            var counter = 0;
            var stream = new ResultSetReadStream();
            stream.nextRow = function (callback) {
                counter++;

                if (counter < 5) {
                    process.nextTick(function () {
                        callback(null, {
                            id: counter
                        });
                    });
                } else if (counter === 5) {
                    process.nextTick(function () {
                        callback(new Error('test'));
                    });
                } else {
                    process.nextTick(function () {
                        callback(new Error('fail'));
                    });
                }
            };

            ['end', 'close'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            stream.on('data', function (data) {
                assert.isTrue(data.id < 5);
            });

            stream.on('error', function (error) {
                assert.equal(error.message, 'test');

                done();
            });
        });

        it('all data read', function (done) {
            var counter = 0;
            var stream = new ResultSetReadStream();
            stream.nextRow = function (callback) {
                counter++;

                if (counter < 5) {
                    process.nextTick(function () {
                        callback(null, {
                            id: counter
                        });
                    });
                } else if (counter === 5) {
                    process.nextTick(function () {
                        callback();
                    });
                } else {
                    process.nextTick(function () {
                        callback(new Error('fail'));
                    });
                }
            };

            ['close', 'error'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            var dataFound = 0;
            stream.on('data', function (data) {
                dataFound++;

                assert.isTrue(data.id < 5);
            });

            stream.on('end', function () {
                assert.equal(dataFound, 4);

                done();
            });
        });
    });
});
