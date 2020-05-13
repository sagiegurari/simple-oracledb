'use strict';

const chai = require('chai');
const assert = chai.assert;
const emitter = require('../../lib/emitter');

describe('emitter Tests', function () {
    describe('extend', function () {
        it('undefined object', function () {
            emitter();
        });

        it('null object', function () {
            emitter(null);
        });

        it('has on', function () {
            const object = {
                on: true
            };
            emitter(object);

            assert.isUndefined(object.emit);
        });

        it('has emit', function () {
            const object = {
                emit: true
            };
            emitter(object);

            assert.isUndefined(object.on);
        });

        it('valid', function () {
            const object = {};
            emitter(object);

            assert.isFunction(object.on);
            assert.isFunction(object.emit);
        });
    });
});
