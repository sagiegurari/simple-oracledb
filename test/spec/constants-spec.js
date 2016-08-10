'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var constants = require('../../lib/constants');

describe('constants Tests', function () {
    describe('getParallelLimit', function () {
        it('undefined', function () {
            delete process.env.UV_THREADPOOL_SIZE;
            var output = constants.getParallelLimit();

            assert.equal(output, 2);
        });

        it('defined even number', function () {
            process.env.UV_THREADPOOL_SIZE = '6';
            var output = constants.getParallelLimit();

            assert.equal(output, 3);
        });

        it('defined uneven number', function () {
            process.env.UV_THREADPOOL_SIZE = '9';
            var output = constants.getParallelLimit();

            assert.equal(output, 4);
        });

        it('below min', function () {
            process.env.UV_THREADPOOL_SIZE = '0';
            var output = constants.getParallelLimit();

            assert.equal(output, 1);
        });

        it('negative number', function () {
            process.env.UV_THREADPOOL_SIZE = '-8';
            var output = constants.getParallelLimit();

            assert.equal(output, 1);
        });

        it('not a number', function () {
            process.env.UV_THREADPOOL_SIZE = 'abc';
            var output = constants.getParallelLimit();

            assert.equal(output, 2);
        });
    });
});
