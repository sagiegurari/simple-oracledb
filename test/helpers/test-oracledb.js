'use strict';

var chai = require('chai');
var assert = chai.assert;
var EventEmitter = require('events').EventEmitter;
var Connection = require('../../lib/connection');

/*jslint debug: true */
function TestConnection() {
}

function TestPool() {
}
/*jslint debug: false */

TestConnection.prototype.execute = function () {
    var callback = arguments[arguments.length - 1];

    if (this.throwError) {
        callback(new Error());
    } else {
        callback(null, {});
    }
};

TestConnection.prototype.break = function (callback) {
    callback();
};

TestConnection.prototype.rollback = function (callback) {
    callback();
};

TestConnection.prototype.release = function () {
    var callback = arguments[arguments.length - 1];
    callback();
};

TestPool.prototype.modifyTestConnection = function (connection) {
    return connection;
};

TestPool.prototype.getConnection = function (callback) {
    if (this.throwError) {
        callback(new Error());
    } else {
        var connection = new TestConnection();

        if (this.extendConnection) {
            Connection.extend(connection);
        }

        connection = this.modifyTestConnection(connection);

        callback(null, connection);
    }
};

TestPool.prototype.terminate = function () {
    var callback = arguments[arguments.length - 1];
    callback();
};

module.exports = {
    create: function () {
        return {
            createPool: function (invalid, callback) {
                if (callback === undefined) {
                    callback = invalid;
                    invalid = false;
                }

                if (invalid) {
                    callback(new Error());
                } else {
                    callback(null, new TestPool());
                }
            },
            getConnection: function (connAttrs, callback) {
                if (this.throwError) {
                    callback(new Error());
                } else if (!arguments.length) {
                    callback(new Error());
                } else {
                    assert.isObject(connAttrs);

                    var connection = new TestConnection();

                    if (this.extendConnection) {
                        Connection.extend(connection);
                    }

                    callback(null, connection);
                }
            },
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
