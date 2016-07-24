'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var PromiseLib = global.Promise || require('promiscuous');
var promiseHelper = require('../../lib/promise-helper');

describe('PromiseHelper Tests', function () {
    describe('runPromise', function () {
        it('Promise not supported', function () {
            delete global.Promise;

            try {
                promiseHelper(function () {
                    assert.fail();
                });

                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }

            global.Promise = PromiseLib;
        });

        it('valid', function (done) {
            global.Promise = PromiseLib;

            var promise = promiseHelper(function (callback) {
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

            var promise = promiseHelper(function (callback) {
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

            var promise = promiseHelper(function (callback) {
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
});
