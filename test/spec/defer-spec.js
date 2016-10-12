'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var defer = require('../../lib/defer');

describe('Defer Tests', function () {
    describe('get Tests', function () {
        it('undefined', function (done) {
            var later = defer();
            later(done);
        });

        it('null', function (done) {
            var later = defer(null);
            later(done);
        });

        it('ioSafe', function (done) {
            var later = defer(true);
            assert.strictEqual(setImmediate, later);
            later(done);
        });

        it('0.12.0', function (done) {
            var later = defer('0.12.0');
            assert.strictEqual(process.nextTick, later);
            later(done);
        });

        it('0.12.1', function (done) {
            var later = defer('0.12.1');
            assert.strictEqual(process.nextTick, later);
            later(done);
        });

        it('0.10.x', function (done) {
            var later = defer('0.10.1000');
            assert.strictEqual(setImmediate, later);
            later(done);
        });
    });
});
