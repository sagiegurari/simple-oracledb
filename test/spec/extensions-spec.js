'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var extensions = require('../../lib/extensions');

describe('Extensions Tests', function () {
    var noop = function () {
        return undefined;
    };
    var noop2 = function () {
        return undefined;
    };

    describe('add', function () {
        it('undefined', function () {
            var output = extensions.add();
            assert.isFalse(output);
        });

        it('missing type', function () {
            var output = extensions.add(undefined, 'myfunc', noop);
            assert.isFalse(output);
        });

        it('type not string', function () {
            var output = extensions.add(123, 'myfunc', noop);
            assert.isFalse(output);
        });

        it('invalid type', function () {
            var output = extensions.add('test', 'myfunc', noop);
            assert.isFalse(output);
        });

        it('missing name', function () {
            var output = extensions.add('connection', undefined, noop);
            assert.isFalse(output);
        });

        it('name not string', function () {
            var output = extensions.add('connection', 123, noop);
            assert.isFalse(output);
        });

        it('missing function', function () {
            var output = extensions.add('connection', 'myfunc');
            assert.isFalse(output);
        });

        it('invalid function type', function () {
            var output = extensions.add('connection', 'myfunc', 123);
            assert.isFalse(output);
        });

        it('valid', function () {
            var output = extensions.add('connection', 'myfunc1', noop);
            assert.isTrue(output);

            output = extensions.add('connection', 'myfunc2', noop2);
            assert.isTrue(output);

            output = extensions.add('pool', 'myfunc1', noop);
            assert.isTrue(output);

            assert.isFunction(extensions.extensions.connection.myfunc1);
            assert.isFunction(extensions.extensions.connection.myfunc2);

            output = extensions.add('connection', 'myfunc2', noop);
            assert.isTrue(output);

            assert.isFunction(extensions.extensions.connection.myfunc1);
            assert.isFunction(extensions.extensions.connection.myfunc2);

            assert.isFunction(extensions.get('connection').myfunc1);
            assert.isFunction(extensions.get('connection').myfunc2);

            assert.isFunction(extensions.get('pool').myfunc1);
        });

        it('valid, no promise', function () {
            var output = extensions.add('connection', 'myfunc1', noop, {
                promise: {
                    noPromise: true
                }
            });
            assert.isTrue(output);

            output = extensions.add('connection', 'myfunc2', noop2, {
                promise: {
                    noPromise: true
                }
            });
            assert.isTrue(output);

            output = extensions.add('pool', 'myfunc1', noop, {
                promise: {
                    noPromise: true
                }
            });
            assert.isTrue(output);

            assert.deepEqual(extensions.extensions.connection, {
                myfunc1: noop,
                myfunc2: noop2
            });

            output = extensions.add('connection', 'myfunc2', noop, {
                promise: {
                    noPromise: true
                }
            });
            assert.isTrue(output);

            assert.deepEqual(extensions.extensions.connection, {
                myfunc1: noop,
                myfunc2: noop
            });

            assert.deepEqual(extensions.get('connection'), {
                myfunc1: noop,
                myfunc2: noop
            });

            assert.deepEqual(extensions.get('pool'), {
                myfunc1: noop
            });
        });
    });

    describe('get', function () {
        it('undefined', function () {
            var output = extensions.get();
            assert.isUndefined(output);
        });

        it('null', function () {
            var output = extensions.get(null);
            assert.isUndefined(output);
        });

        it('empty', function () {
            extensions.extensions.connection = {};
            var output = extensions.get('connection');
            assert.deepEqual(output, {});
        });

        it('functions exist', function () {
            extensions.extensions.connection = {
                test: noop,
                test2: noop2
            };
            var output = extensions.get('connection');
            assert.deepEqual(output, {
                test: noop,
                test2: noop2
            });
        });
    });
});
