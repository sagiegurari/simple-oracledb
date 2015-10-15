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

TestPool.prototype.getConnection = function (invalid, callback) {
    if (invalid) {
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
        testStream.type = 10;
        testStream.setEncoding = function (encoding) {
            assert.equal(encoding, 'utf8');
        };

        return testStream;
    },
    createBLOB: function () {
        var testStream = new EventEmitter();
        testStream.type = require('../../lib/record-reader').blobType;

        return testStream;
    }
};
