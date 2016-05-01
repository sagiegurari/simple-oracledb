'use strict';
/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var oracledb = require('../helpers/test-oracledb');
var Pool = require('../../lib/pool');
var SimpleOracleDB = require('../..');
var extensions = require('../../lib/extensions');
var emitter = require('../../lib/emitter');

describe('Pool Tests', function () {
    var noop = function () {
        return undefined;
    };

    describe('extend tests', function () {
        it('valid', function () {
            var testPool = oracledb.createPool();

            Pool.extend(testPool);

            assert.isTrue(testPool.simplified);
            assert.isFunction(testPool.getConnectionOrg);
        });

        it('with extensions', function () {
            SimpleOracleDB.addExtension('pool', 'testPoolFunc', function () {
                return undefined;
            });
            SimpleOracleDB.addExtension('pool', 'coreFunc', function () {
                return false;
            });

            var testPool = oracledb.createPool();
            testPool.coreFunc = function () {
                return true;
            };

            Pool.extend(testPool);

            assert.isTrue(testPool.simplified);
            assert.isFunction(testPool.getConnectionOrg);
            assert.isFunction(testPool.testPoolFunc);
            assert.isTrue(testPool.coreFunc());

            extensions.extensions.pool = {};
        });

        it('no input', function () {
            Pool.extend(); //ensure no error
        });
    });

    describe('getConnection tests', function () {
        it('getConnection simple', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            var output = testPool.getConnection(function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                assert.isDefined(connection.diagnosticInfo.id);

                testPool.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });

            assert.isUndefined(output);
        });

        it('getConnection error', function (done) {
            var testPool = oracledb.createPool();

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.throwError = true;
            testPool.getConnection(function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);

                done();
            });
        });

        it('getConnection error with valid retry', function (done) {
            var testPool = oracledb.createPool();

            var counter = 0;
            testPool.getConnection = function (callback) {
                counter++;

                if (counter < 2) {
                    callback(new Error());
                } else if (counter === 2) {
                    callback(null, {});
                } else {
                    assert.fail();
                }
            };

            Pool.extend(testPool, {
                retryCount: 5,
                runValidationSQL: false
            });

            testPool.getConnection(function (error, connection) {
                assert.equal(counter, 2);
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);

                done();
            });
        });

        it('getConnection error with error retry', function (done) {
            var testPool = oracledb.createPool();

            var counter = 0;
            testPool.getConnection = function (callback) {
                counter++;

                if (counter > 5) {
                    assert.fail();
                }

                callback(new Error());
            };

            Pool.extend(testPool, {
                retryInterval: 5,
                retryCount: 5
            });

            testPool.getConnection(function (error) {
                assert.equal(counter, 5);
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection sql error', function (done) {
            var testPool = oracledb.createPool();
            var orgGetConnection = testPool.getConnection;

            testPool.getConnection = function (callback) {
                orgGetConnection.call(testPool, function (connError, connection) {
                    connection.throwError = true;

                    callback(null, connection);
                });
            };

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.getConnection(function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);

                done();
            });
        });

        it('getConnection sql and release error', function (done) {
            var testPool = oracledb.createPool();
            var orgGetConnection = testPool.getConnection;

            testPool.getConnection = function (callback) {
                orgGetConnection.call(testPool, function (connError, connection) {
                    connection.throwError = true;
                    connection.release = function (cb) {
                        cb(new Error('test'));
                    };

                    callback(null, connection);
                });
            };

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.getConnection(function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);

                done();
            });
        });

        it('getConnection sql error with valid retry', function (done) {
            var testPool = oracledb.createPool();
            var orgGetConnection = testPool.getConnection;

            var counter = 0;
            testPool.getConnection = function (callback) {
                counter++;

                orgGetConnection.call(testPool, function (connError, connection) {
                    connection.throwError = true;

                    if (counter > 5) {
                        assert.fail();
                    } else if (counter === 4) {
                        connection.throwError = false;
                    }

                    callback(null, connection);
                });
            };

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.getConnection(function (error, connection) {
                assert.equal(counter, 4);
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);

                done();
            });
        });
    });

    describe('run', function () {
        it('missing callback with options', function () {
            var pool = {};
            Pool.extend(pool);

            try {
                pool.run(noop, {});
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });

        it('missing callback without options', function () {
            var pool = {};
            Pool.extend(pool);

            try {
                pool.run(noop);
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });

        it('missing action with options', function () {
            var pool = {};
            Pool.extend(pool);

            try {
                pool.run(null, {}, noop);
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });

        it('action not a function', function () {
            var pool = {};
            Pool.extend(pool);

            try {
                pool.run('test', {}, noop);
                assert.fail();
            } catch (error) {
                assert.isDefined(error);
            }
        });

        it('get connection error', function (done) {
            var pool = {
                getConnection: function (cb) {
                    cb(new Error('test connection'));
                }
            };
            Pool.extend(pool, {
                retryCount: 1,
                retryInterval: 1
            });

            pool.run(function (connection, cb) {
                cb();
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test connection');

                done();
            });
        });

        it('sync action error', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        },
                        release: function (callback) {
                            releaseCalled = true;
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function () {
                throw new Error('test sync');
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'test sync');

                done();
            });
        });

        it('async action error', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        break: function (breakCB) {
                            breakCB();
                        },
                        execute: function () {
                            arguments[arguments.length - 1]();
                        },
                        release: function (callback) {
                            releaseCalled = true;
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                setTimeout(function () {
                    callback(new Error('test async'));
                }, 5);
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'test async');

                done();
            });
        });

        it('async action error and release error with no options', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                connection.release = function (options, callback) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    callback(new Error('release error'));
                };

                setTimeout(function () {
                    callback(new Error('test async2'));
                }, 5);
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'test async2');

                done();
            });
        });

        it('async action error and release error with options and ignore release error', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                connection.release = function (options, callback) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    callback(new Error('release error'));
                };

                setTimeout(function () {
                    callback(new Error('test async2'));
                }, 5);
            }, {
                ignoreReleaseErrors: true
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'test async2');

                done();
            });
        });

        it('async action error and release error with options and not ignore release error', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                connection.release = function (options, callback) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    callback(new Error('release error'));
                };

                setTimeout(function () {
                    callback(new Error('test async2'));
                }, 5);
            }, {
                ignoreReleaseErrors: false
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'test async2');

                done();
            });
        });

        it('release error with no options', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                connection.release = function (options, callback) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    callback(new Error('release error'));
                };

                setTimeout(function () {
                    callback();
                }, 5);
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'release error');

                done();
            });
        });

        it('release error with options and ignore release error', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                connection.release = function (options, callback) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    callback(new Error('release error'));
                };

                setTimeout(function () {
                    callback(null, 'my output');
                }, 5);
            }, {
                ignoreReleaseErrors: true
            }, function (error, result) {
                assert.isTrue(releaseCalled);
                assert.isNull(error);
                assert.equal(result, 'my output');

                done();
            });
        });

        it('release error with options and not ignore release error', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        execute: function () {
                            arguments[arguments.length - 1]();
                        }
                    });
                }
            };
            Pool.extend(pool);

            pool.run(function (connection, callback) {
                assert.isDefined(connection);
                connection.release = function (options, callback) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    callback(new Error('release error'));
                };

                setTimeout(function () {
                    callback();
                }, 5);
            }, {
                ignoreReleaseErrors: false
            }, function (error) {
                assert.isTrue(releaseCalled);
                assert.isDefined(error);
                assert.equal(error.message, 'release error');

                done();
            });
        });

        it('release options', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        break: function (breakCB) {
                            breakCB();
                        },
                        execute: function () {
                            arguments[arguments.length - 1]();
                        },
                        release: function (callback) {
                            releaseCalled = true;
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            var releaseOptionsFound = false;
            pool.run(function (connection, callback) {
                assert.isDefined(connection);

                var orgRelease = connection.release;
                connection.release = function (options, cb) {
                    assert.deepEqual(options, {
                        retryCount: 270,
                        test: 123,
                        force: true
                    });
                    releaseOptionsFound = true;

                    orgRelease.call(connection, options, cb);
                };

                setTimeout(function () {
                    callback(null, 'valid output');
                }, 5);
            }, {
                ignoreReleaseErrors: false,
                releaseOptions: {
                    retryCount: 270,
                    test: 123
                }
            }, function (error, result) {
                assert.isTrue(releaseCalled);
                assert.isTrue(releaseOptionsFound);
                assert.isNull(error);
                assert.equal(result, 'valid output');

                done();
            });
        });

        it('release options - force false', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        break: function (breakCB) {
                            breakCB();
                        },
                        execute: function () {
                            arguments[arguments.length - 1]();
                        },
                        release: function (callback) {
                            releaseCalled = true;
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            var releaseOptionsFound = false;
            pool.run(function (connection, callback) {
                assert.isDefined(connection);

                var orgRelease = connection.release;
                connection.release = function (options, cb) {
                    assert.deepEqual(options, {
                        retryCount: 270,
                        test: 123,
                        force: false
                    });
                    releaseOptionsFound = true;

                    orgRelease.call(connection, options, cb);
                };

                setTimeout(function () {
                    callback(null, 'valid output');
                }, 5);
            }, {
                ignoreReleaseErrors: false,
                releaseOptions: {
                    retryCount: 270,
                    test: 123,
                    force: false
                }
            }, function (error, result) {
                assert.isTrue(releaseCalled);
                assert.isTrue(releaseOptionsFound);
                assert.isNull(error);
                assert.equal(result, 'valid output');

                done();
            });
        });

        it('valid', function (done) {
            var releaseCalled = false;
            var pool = {
                getConnection: function (cb) {
                    cb(null, {
                        break: function (breakCB) {
                            breakCB();
                        },
                        execute: function () {
                            arguments[arguments.length - 1]();
                        },
                        release: function (callback) {
                            releaseCalled = true;
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            var output = pool.run(function (connection, callback) {
                assert.isDefined(connection);

                setTimeout(function () {
                    callback(null, 'valid output');
                }, 5);
            }, {
                ignoreReleaseErrors: false
            }, function (error, result) {
                assert.isTrue(releaseCalled);
                assert.isNull(error);
                assert.equal(result, 'valid output');

                done();
            });

            assert.isUndefined(output);
        });
    });

    describe('terminate', function () {
        it('callback provided', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Pool.extend(pool);

            pool.on('release', function () {
                done();
            });

            assert.isFunction(pool.baseTerminate);
            var output = pool.terminate(function () {
                return undefined;
            });

            assert.isUndefined(output);
        });

        it('callback undefined', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);
            pool.terminate();
        });
    });

    describe('close', function () {
        it('callback provided', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);
            var output = pool.close(function () {
                return undefined;
            });

            assert.isUndefined(output);
        });

        it('callback undefined', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);
            pool.close();
        });
    });

    describe('setupEvents tests', function () {
        it('setupEvents undefined', function () {
            var pool = {};
            Pool.extend(pool);

            pool.setupEvents();
        });

        it('setupEvents valid', function () {
            var pool = {};
            Pool.extend(pool);

            var connection = {};
            emitter(connection);
            pool.setupEvents(connection);
            assert.isFunction(connection.on);
        });
    });
});
