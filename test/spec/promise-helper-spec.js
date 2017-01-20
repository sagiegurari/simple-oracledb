'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var PromiseLib = global.Promise || require('promiscuous');
var promiseHelper = require('../../lib/promise-helper');

describe('PromiseHelper Tests', function () {
    describe('isPromise', function () {
        it('undefined', function () {
            var output = promiseHelper.isPromise();
            assert.isFalse(output);
        });

        it('null', function () {
            var output = promiseHelper.isPromise(null);
            assert.isFalse(output);
        });

        it('not an object', function () {
            var output = promiseHelper.isPromise(1);
            assert.isFalse(output);
        });

        it('missing then', function () {
            var output = promiseHelper.isPromise({
                catch: promiseHelper.noop
            });
            assert.isFalse(output);
        });

        it('missing catch', function () {
            var output = promiseHelper.isPromise({
                then: promiseHelper.noop
            });
            assert.isFalse(output);
        });

        it('then not a function', function () {
            var output = promiseHelper.isPromise({
                then: true,
                catch: promiseHelper.noop
            });
            assert.isFalse(output);
        });

        it('catch not a function', function () {
            var output = promiseHelper.isPromise({
                then: promiseHelper.noop,
                catch: true
            });
            assert.isFalse(output);
        });

        it('valid', function () {
            var output = promiseHelper.isPromise({
                then: promiseHelper.noop,
                catch: promiseHelper.noop
            });
            assert.isTrue(output);
        });
    });

    describe('runAsync', function () {
        it('async valid', function (done) {
            promiseHelper.runAsync(function (callback) {
                callback(null, 'test output');
            }, function (error, output) {
                assert.isNull(error);
                assert.strictEqual(output, 'test output');

                done();
            });
        });

        it('async error', function (done) {
            promiseHelper.runAsync(function (callback) {
                callback(new Error('test'));
            }, function (error, output) {
                assert.isDefined(error);
                assert.strictEqual(error.message, 'test');
                assert.isUndefined(output);

                done();
            });
        });

        it('promise valid', function (done) {
            promiseHelper.runAsync(function () {
                return new PromiseLib(function (resolve) {
                    resolve('test output');
                });
            }, function (error, output) {
                assert.isNull(error);
                assert.strictEqual(output, 'test output');

                done();
            });
        });

        it('promise error', function (done) {
            promiseHelper.runAsync(function () {
                return new PromiseLib(function (resolve, reject) {
                    reject(new Error('test'));
                });
            }, function (error, output) {
                assert.isDefined(error);
                assert.strictEqual(error.message, 'test');
                assert.isUndefined(output);

                done();
            });
        });
    });

    describe('runPromise', function () {
        it('Promise not supported', function () {
            delete global.Promise;

            var errorFound = false;

            try {
                promiseHelper.runPromise(function () {
                    assert.fail();
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('valid', function (done) {
            global.Promise = PromiseLib;

            var promise = promiseHelper.runPromise(function (callback) {
                assert.isFunction(callback);

                callback(null, {
                    test: true
                });
            });

            promise.then(function (output) {
                assert.deepEqual(output, {
                    test: true
                });

                done();
            }, function () {
                assert.fail();
            });
        });

        it('error then', function (done) {
            global.Promise = PromiseLib;

            var promise = promiseHelper.runPromise(function (callback) {
                assert.isFunction(callback);

                callback(new Error('test'));
            });

            promise.then(function () {
                assert.fail();
            }, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('error catch', function (done) {
            global.Promise = PromiseLib;

            var promise = promiseHelper.runPromise(function (callback) {
                assert.isFunction(callback);

                callback(new Error('test'));
            });

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);

                done();
            });
        });
    });

    describe('run', function () {
        var action = function (callback) {
            assert.isFunction(callback);

            setTimeout(callback, 0);
        };

        it('callback provided', function (done) {
            var promise = promiseHelper.run(action, done);

            assert.isUndefined(promise);
        });

        it('no callback, using promise', function (done) {
            delete global.Promise;

            global.Promise = PromiseLib;

            var promise = promiseHelper.run(action);

            promise.then(function () {
                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('no callback, no promise support', function () {
            delete global.Promise;

            var errorFound = false;

            try {
                promiseHelper.run(action);
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('no callback, no promise support with force', function () {
            delete global.Promise;

            var errorFound = false;

            try {
                promiseHelper.run(action, undefined, true);
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });
    });

    describe('promisify', function () {
        it('no options', function () {
            global.Promise = PromiseLib;

            var func = promiseHelper.promisify(function (num, callback) {
                assert.equal(num, 15);

                callback(null, 20);
            });

            func(15).then(function (result) {
                assert.equal(result, 20);
            }).catch(function () {
                assert.fail();
            });
        });

        it('no promise support, no default, no force', function () {
            var func = promiseHelper.promisify(function (num, callback) {
                assert.equal(num, 15);

                callback(null, 20);
            }, {
                force: false,
                defaultCallback: false
            });

            delete global.Promise;

            var errorFound = false;

            try {
                func(15);
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });
    });
});
