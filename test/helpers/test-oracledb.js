'use strict';

var chai = require('chai');
var assert = chai.assert;
var EventEmitter = require('events').EventEmitter;

/*jslint debug: true */
function TestConnection() {
}

function TestPool() {
}
/*jslint debug: false */

TestConnection.prototype.execute = function () {
    arguments[arguments.length - 1]();
};

TestPool.prototype.getConnection = function (callback) {
    if (this.throwError) {
        callback(new Error());
    } else {
        callback(null, new TestConnection());
    }
};

module.exports = {
    create: function () {
        return {
            createPool: function (invalid, callback) {
                if (invalid) {
                    callback(new Error());
                } else {
                    callback(null, new TestPool());
                }
            },
            getConnection: TestPool.prototype.getConnection,
            execute: TestConnection.prototype.execute
        };
    },
    createPool: function () {
        return new TestPool();
    },
    createCLOB: function () {
        var testStream = new EventEmitter();
        testStream.type = require('../../lib/constants').clobType;
        testStream.setEncoding = function (encoding) {
            assert.equal(encoding, 'utf8');
        };
        testStream.end = function (data, encoding, callback) {
            assert.deepEqual(data, testStream.testData);
            assert.equal(encoding, 'utf8');
            assert.isFunction(callback);

            this.emit('end');

            callback();
        };

        return testStream;
    },
    createBLOB: function () {
        var testStream = new EventEmitter();
        testStream.type = require('../../lib/constants').blobType;
        testStream.end = function (data, callback) {
            assert.deepEqual(data, new Buffer(testStream.testData));
            assert.isFunction(callback);

            this.emit('end');

            callback();
        };

        return testStream;
    }
};
