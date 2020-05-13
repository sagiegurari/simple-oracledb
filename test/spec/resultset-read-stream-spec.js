'use strict';

const chai = require('chai');
const assert = chai.assert;
const EventEmitterEnhancer = require('event-emitter-enhancer');
const ResultSetReadStream = require('../../lib/resultset-read-stream');

describe('ResultSetReadStream Tests', function () {
    const failListener = function (eventName) {
        return function () {
            assert.fail(eventName);
        };
    };

    describe('read tests', function () {
        it('no data', function (done) {
            const stream = new ResultSetReadStream();
            EventEmitterEnhancer.modifyInstance(stream);
            stream.nextRow = function (callback) {
                process.nextTick(function () {
                    callback();
                });
            };

            ['data', 'error'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            const remove = stream.onAny(['end', 'close'], function () {
                remove();
                done();
            });
        });

        it('null data', function (done) {
            const stream = new ResultSetReadStream();
            EventEmitterEnhancer.modifyInstance(stream);
            stream.nextRow = function (callback) {
                process.nextTick(function () {
                    callback(null, null);
                });
            };

            ['data', 'error'].forEach(function (eventName) {
                stream.on(eventName, failListener(eventName));
            });

            const remove = stream.onAny(['end', 'close'], function () {
                remove();
                done();
            });
        });

        it('multiple rows', function (done) {
            const stream = new ResultSetReadStream();
            EventEmitterEnhancer.modifyInstance(stream);
            let nextCounter = 0;
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

            stream.on('error', failListener('error'));

            let dataFound = 0;
            stream.on('data', function (data) {
                dataFound++;

                assert.deepEqual(data, {
                    row: dataFound
                });
            });

            const remove = stream.onAny(['end', 'close'], function () {
                assert.equal(dataFound, 5);

                remove();
                done();
            });
        });

        it('error on start', function (done) {
            const stream = new ResultSetReadStream();
            stream.nextRow = function (callback) {
                process.nextTick(function () {
                    callback(new Error('test'));
                });
            };

            stream.on('data', failListener('data'));

            stream.on('error', function (error) {
                assert.equal(error.message, 'test');

                done();
            });
        });

        it('error after few data events', function (done) {
            let counter = 0;
            const stream = new ResultSetReadStream();
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
            let counter = 0;
            const stream = new ResultSetReadStream();
            EventEmitterEnhancer.modifyInstance(stream);
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

            stream.on('error', failListener('error'));

            let dataFound = 0;
            stream.on('data', function (data) {
                dataFound++;

                assert.isTrue(data.id < 5);
            });

            const remove = stream.onAny(['end', 'close'], function () {
                assert.equal(dataFound, 4);

                remove();
                done();
            });
        });
    });
});
