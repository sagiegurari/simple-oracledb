'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var emitter = require('../../lib/emitter');

describe('emitter Tests', function () {
    describe('extend', function () {
        it('undefined object', function () {
            emitter();
        });

        it('null object', function () {
            emitter(null);
        });

        it('has on', function () {
            var object = {
                on: true
            };
            emitter(object);

            assert.isUndefined(object.emit);
        });

        it('has emit', function () {
            var object = {
                emit: true
            };
            emitter(object);

            assert.isUndefined(object.on);
        });

        it('valid', function () {
            var object = {};
            emitter(object);

            assert.isFunction(object.on);
            assert.isFunction(object.emit);
        });
    });
});
