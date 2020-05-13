'use strict';

const chai = require('chai');
const assert = chai.assert;
const EventEmitter = require('events').EventEmitter;
const Connection = require('../../lib/connection');

/*jslint debug: true */
function TestConnection() {
}

function TestPool() {
}
/*jslint debug: false */

TestConnection.prototype.execute = function () {
    const callback = arguments[arguments.length - 1];

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
    const callback = arguments[arguments.length - 1];
    callback();
};

TestPool.prototype.modifyTestConnection = function (connection) {
    return connection;
};

TestPool.prototype.getConnection = function (callback) {
    if (this.throwError) {
        callback(new Error());
    } else {
        let connection = new TestConnection();

        if (this.pingSupport) {
            if (this.pingError) {
                connection.ping = function (cb) {
                    setTimeout(function () {
                        cb(new Error());
                    }, 0);
                };
            } else {
                connection.ping = function (cb) {
                    setTimeout(cb, 0);
                };
            }
        }

        if (this.extendConnection) {
            Connection.extend(connection);
        }

        connection = this.modifyTestConnection(connection);

        callback(null, connection);
    }
};

TestPool.prototype.terminate = function () {
    const callback = arguments[arguments.length - 1];
    callback();
};

module.exports = {
    create() {
        return {
            createPool(invalid, callback) {
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
            getConnection(connAttrs, callback) {
                if (this.throwError) {
                    callback(new Error());
                } else if (!arguments.length) {
                    callback(new Error());
                } else {
                    assert.isObject(connAttrs);

                    const connection = new TestConnection();

                    if (this.extendConnection) {
                        Connection.extend(connection);
                    }

                    callback(null, connection);
                }
            },
            execute: TestConnection.prototype.execute
        };
    },
    createPool() {
        return new TestPool();
    },
    createCLOB() {
        const testStream = new EventEmitter();
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
    createBLOB() {
        const testStream = new EventEmitter();
        testStream.type = require('../../lib/constants').blobType;
        testStream.end = function (data, callback) {
            assert.deepEqual(data.toJSON(), (new Buffer(testStream.testData)).toJSON());
            assert.isFunction(callback);

            this.emit('end');

            callback();
        };

        return testStream;
    }
};
