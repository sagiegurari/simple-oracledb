'use strict';

const chai = require('chai');
const assert = chai.assert;
const constants = require('../../lib/constants');

describe('constants Tests', function () {
    describe('getParallelLimit', function () {
        it('undefined', function () {
            delete process.env.UV_THREADPOOL_SIZE;
            const output = constants.getParallelLimit();

            assert.equal(output, 2);
        });

        it('defined even number', function () {
            process.env.UV_THREADPOOL_SIZE = '6';
            const output = constants.getParallelLimit();

            assert.equal(output, 3);
        });

        it('defined uneven number', function () {
            process.env.UV_THREADPOOL_SIZE = '9';
            const output = constants.getParallelLimit();

            assert.equal(output, 4);
        });

        it('below min', function () {
            process.env.UV_THREADPOOL_SIZE = '0';
            const output = constants.getParallelLimit();

            assert.equal(output, 1);
        });

        it('negative number', function () {
            process.env.UV_THREADPOOL_SIZE = '-8';
            const output = constants.getParallelLimit();

            assert.equal(output, 1);
        });

        it('not a number', function () {
            process.env.UV_THREADPOOL_SIZE = 'abc';
            const output = constants.getParallelLimit();

            assert.equal(output, 2);
        });
    });

    describe('stringMaxSize', function () {
        it('no env override', function () {
            assert.strictEqual(constants.stringMaxSize, 100000);
        });
    });
});
