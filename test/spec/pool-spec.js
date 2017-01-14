'use strict';

/*global describe: false, it: false */

var chai = require('chai');
var assert = chai.assert;
var PromiseLib = global.Promise || require('promiscuous');
var oracledb = require('../helpers/test-oracledb');
var Pool = require('../../lib/pool');
var Connection = require('../../lib/connection');
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
            assert.isFunction(testPool.baseGetConnection);
        });

        it('with extensions', function (done) {
            SimpleOracleDB.addExtension('pool', 'testPoolFunc', function (callback) {
                setTimeout(function () {
                    callback(null, true);
                }, 0);
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
            assert.isFunction(testPool.baseGetConnection);
            assert.isFunction(testPool.testPoolFunc);
            assert.isTrue(testPool.coreFunc());

            var output = testPool.testPoolFunc(function (error, result) {
                assert.isNull(error);
                assert.isTrue(result);

                extensions.extensions.pool = {};

                done();
            });

            assert.isUndefined(output);
        });

        it('with extensions, using promise', function (done) {
            SimpleOracleDB.addExtension('pool', 'testPoolFunc', function (callback) {
                setTimeout(function () {
                    callback(null, true);
                }, 0);
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
            assert.isFunction(testPool.baseGetConnection);
            assert.isFunction(testPool.testPoolFunc);
            assert.isTrue(testPool.coreFunc());

            global.Promise = PromiseLib;

            var promise = testPool.testPoolFunc();

            promise.then(function (result) {
                assert.isTrue(result);

                extensions.extensions.pool = {};

                done();
            }).catch(function () {
                assert.fail();
            });
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

        it('getConnection simple promise', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            global.Promise = PromiseLib;

            testPool.getConnection().then(function (connection) {
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                assert.isDefined(connection.diagnosticInfo.id);

                testPool.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });
        });

        it('getConnection error promise then', function (done) {
            var testPool = oracledb.createPool();

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.throwError = true;

            global.Promise = PromiseLib;

            testPool.getConnection().then(function () {
                assert.fail();
            }, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection error promise catch', function (done) {
            var testPool = oracledb.createPool();

            Pool.extend(testPool, {
                retryInterval: 5
            });

            testPool.throwError = true;

            global.Promise = PromiseLib;

            testPool.getConnection().then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection promise not supported', function () {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            delete global.Promise;

            var errorFound = false;

            try {
                testPool.getConnection().then(function () {
                    assert.fail();
                }).catch(function () {
                    assert.fail();
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
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
        it('missing callback with options with promise', function (done) {
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
                        },
                        rollback: function (callback) {
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            global.Promise = PromiseLib;

            var promise = pool.run(function (connection, callback) {
                assert.isDefined(connection);

                callback();
            }, {});

            promise.then(function () {
                assert.isTrue(releaseCalled);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('missing callback with options, no promise support', function () {
            var pool = {};
            Pool.extend(pool);

            delete global.Promise;

            var errorFound = false;

            try {
                pool.run(noop, {});
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('missing callback without options, using promise', function (done) {
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
                        },
                        rollback: function (callback) {
                            callback();
                        }
                    });
                }
            };
            Pool.extend(pool);

            global.Promise = PromiseLib;

            var promise = pool.run(function (connection, callback) {
                assert.isDefined(connection);

                setTimeout(function () {
                    callback(null, 'valid output');
                }, 5);
            }, {
                ignoreReleaseErrors: false
            });

            promise.then(function (result) {
                assert.isTrue(releaseCalled);
                assert.equal(result, 'valid output');

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('missing callback without options, no promise support', function () {
            var pool = {};
            Pool.extend(pool);

            delete global.Promise;

            var errorFound = false;

            try {
                pool.run(noop);
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('missing action with options', function (done) {
            var pool = {};
            Pool.extend(pool);

            pool.run(null, {}, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('action not a function with callback', function (done) {
            var pool = {};
            Pool.extend(pool);

            pool.run('test', {}, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('action not a function without callback', function () {
            var pool = {};
            Pool.extend(pool);

            delete global.Promise;

            var errorFound = false;

            try {
                pool.run('test', {});
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
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
                        },
                        break: function (callback) {
                            callback();
                        },
                        rollback: function (callback) {
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
                        },
                        rollback: function (callback) {
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
                connection.release = function (options, cb) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    cb(new Error('release error'));
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
                connection.release = function (options, cb) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    cb(new Error('release error'));
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
                connection.release = function (options, cb) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    cb(new Error('release error'));
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
                connection.release = function (options, cb) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    cb(new Error('release error'));
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
                connection.release = function (options, cb) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    cb(new Error('release error'));
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
                connection.release = function (options, cb) {
                    assert.isDefined(options);
                    releaseCalled = true;
                    cb(new Error('release error'));
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
                        },
                        rollback: function (callback) {
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
                        },
                        rollback: function (callback) {
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

        it('actions are a promise chain', function (done) {
            var releaseCalled = false;
            var pool = {};
            Pool.extend(pool);

            pool.getConnection = function (cb) {
                var connection = {
                    execute: function (sql) {
                        var callback = arguments[arguments.length - 1];

                        setTimeout(function () {
                            if (sql === 'lastSQL') {
                                return callback(null, {
                                    metaData: [
                                        {
                                            name: 'COL1'
                                        },
                                        {
                                            name: 'COL2'
                                        },
                                        {
                                            name: 'COL3'
                                        },
                                        {
                                            name: 'COL4'
                                        }
                                    ],
                                    rows: [
                                        {
                                            COL1: 1,
                                            COL2: 'test',
                                            COL3: 50,
                                            COL4: undefined
                                        },
                                        {
                                            COL1: 'a',
                                            COL2: 123456,
                                            COL3: undefined,
                                            COL4: undefined
                                        }
                                    ]
                                });
                            }

                            callback(null, {
                                metaData: [],
                                rows: []
                            });
                        }, 5);
                    }
                };

                Connection.extend(connection);

                connection.release = function (options, callback) {
                    releaseCalled = true;

                    setTimeout(callback, 5);
                };

                cb(null, connection);
            };

            global.Promise = PromiseLib;

            var promise = pool.run(function (connection) {
                assert.isDefined(connection);

                global.Promise = PromiseLib;

                return connection.query('firstSQL').then(function () {
                    global.Promise = PromiseLib;

                    return connection.query('lastSQL');
                });
            });

            assert.isDefined(promise);
            assert.isFunction(promise.then);
            assert.isFunction(promise.catch);

            promise.then(function (result) {
                assert.isTrue(releaseCalled);
                assert.deepEqual([
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: 123456,
                        COL3: undefined,
                        COL4: undefined
                    }
                ], result);

                done();
            }).catch(function () {
                assert.fail();
            });
        });
    });

    describe('parallelQuery', function () {
        it('callback not provided', function () {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            delete global.Promise;

            var errorFound = false;

            try {
                testPool.parallelQuery([
                    {
                        sql: 'test'
                    }
                ]);
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('callback not provided, with options', function () {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            delete global.Promise;

            var errorFound = false;

            try {
                testPool.parallelQuery([
                    {
                        sql: 'test'
                    }
                ], {});
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('query spec not provided', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            testPool.parallelQuery(undefined, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('query spec not provided, with options', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            testPool.parallelQuery(undefined, {}, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('empty query spec', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            testPool.parallelQuery([], function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('multiple queries, no options', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            testPool.poolAttributes.runValidationSQL = false;

            testPool.modifyTestConnection = function (connection) {
                connection.query = function (sql, bindParams, options, callback) {
                    if (sql === 'test1') {
                        assert.deepEqual(bindParams, [1, 2, 3]);
                        assert.deepEqual(options, {
                            test: '1'
                        });

                        callback(null, 'good1');
                    } else if (sql === 'test2') {
                        assert.deepEqual(bindParams, ['a', 'b', 'c']);
                        assert.deepEqual(options, {
                            test: '2'
                        });

                        callback(null, 'good2');
                    } else {
                        callback(new Error('invalid sql'));
                    }
                };

                return connection;
            };

            testPool.parallelQuery([
                {
                    sql: 'test1',
                    options: {
                        test: '1'
                    },
                    bindParams: [1, 2, 3]
                },
                {
                    sql: 'test2',
                    options: {
                        test: '2'
                    },
                    bindParams: ['a', 'b', 'c']
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual(results, [
                    'good1',
                    'good2'
                ]);

                done();
            });
        });

        it('multiple queries, limit option provided', function (done) {
            var testPool = oracledb.createPool();
            testPool.extendConnection = true;

            Pool.extend(testPool);

            testPool.poolAttributes.runValidationSQL = false;

            testPool.modifyTestConnection = function (connection) {
                connection.query = function (sql, bindParams, options, callback) {
                    if (sql === 'test1') {
                        assert.deepEqual(bindParams, [1, 2, 3]);
                        assert.deepEqual(options, {
                            test: '1'
                        });

                        callback(null, 'good1');
                    } else if (sql === 'test2') {
                        assert.deepEqual(bindParams, ['a', 'b', 'c']);
                        assert.deepEqual(options, {
                            test: '2'
                        });

                        callback(null, 'good2');
                    } else {
                        callback(new Error('invalid sql'));
                    }
                };

                return connection;
            };

            testPool.parallelQuery([
                {
                    sql: 'test1',
                    options: {
                        test: '1'
                    },
                    bindParams: [1, 2, 3]
                },
                {
                    sql: 'test2',
                    options: {
                        test: '2'
                    },
                    bindParams: ['a', 'b', 'c']
                }
            ], {
                limit: 7
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual(results, [
                    'good1',
                    'good2'
                ]);

                done();
            });
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

        it('callback undefined with promise', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);

            global.Promise = PromiseLib;

            var promise = pool.terminate();

            promise.then(done);
        });

        it('callback undefined, no promise support', function (done) {
            var pool = {
                terminate: function (cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Pool.extend(pool);

            assert.isFunction(pool.baseTerminate);

            delete global.Promise;

            var promise = pool.terminate();
            assert.isUndefined(promise);

            global.Promise = PromiseLib;
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
