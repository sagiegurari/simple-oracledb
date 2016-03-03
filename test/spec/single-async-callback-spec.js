'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var singleAsyncCallback = require('../../lib/single-async-callback');

describe('SingleAsyncCallback Tests', function () {
    describe('wrap Tests', function () {
        it('undefined callback', function () {
            var callback = singleAsyncCallback();
            assert.isUndefined(callback);
        });

        it('null callback', function () {
            var callback = singleAsyncCallback(null);
            assert.isUndefined(callback);
        });

        it('multiple callback calls', function (done) {
            var called = false;
            var cb = function (error, data) {
                assert.isDefined(error);
                assert.equal(error.message, 'test1');
                assert.isDefined(data);

                assert.isFalse(called);
                called = true;
            };

            var callback = singleAsyncCallback(cb);
            assert.isFunction(callback);

            callback(new Error('test1'), {});
            callback(new Error('test2'), {});
            callback(new Error('test3'), {});
            callback(new Error('test4'), {});

            setTimeout(done, 50);
        });
    });
});
