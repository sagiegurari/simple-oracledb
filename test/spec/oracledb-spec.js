'use strict';

const chai = require('chai');
const assert = chai.assert;
const PromiseLib = global.Promise || require('promiscuous');
const OracleDB = require('../../lib/oracledb');
const emitter = require('../../lib/emitter');

describe('OracleDB Tests', function () {
    const noop = function () {
        return undefined;
    };

    const createOracleDB = function (extend) {
        const oracledb = {
            getConnection() {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                const callback = argumentsArray.pop();

                setTimeout(function () {
                    callback(null, {
                        release() {
                            setTimeout(arguments[arguments.length - 1], 0);
                        }
                    });
                }, 0);
            }
        };

        emitter(oracledb);

        if (extend) {
            OracleDB.extend(oracledb);
        }

        global.Promise = PromiseLib;

        return oracledb;
    };

    describe('extend tests', function () {
        it('valid', function () {
            const oracledb = {
                getConnection: noop
            };

            OracleDB.extend(oracledb);

            assert.isTrue(oracledb.simplified);
            assert.isFunction(oracledb.baseGetConnection);
        });

        it('no input', function () {
            OracleDB.extend(); //ensure no error
        });
    });

    describe('getConnection tests', function () {
        it('getConnection simple', function (done) {
            const oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            const output = oracledb.getConnection({}, function (error, connection) {
                assert.isNull(error);
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                assert.isDefined(connection.diagnosticInfo.id);

                oracledb.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });

            assert.isUndefined(output);
        });

        it('getConnection error', function (done) {
            const oracledb = createOracleDB();

            OracleDB.extend(oracledb);
            oracledb.baseGetConnection = function (attrs, callback) {
                callback(new Error('test'));
            };

            oracledb.getConnection({}, function (error, connection) {
                assert.isDefined(error);
                assert.isUndefined(connection);

                done();
            });
        });

        it('getConnection simple promise', function (done) {
            const oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            oracledb.getConnection({}).then(function (connection) {
                assert.isDefined(connection);
                assert.isTrue(connection.simplified);
                assert.isDefined(connection.diagnosticInfo.id);

                oracledb.once('connection-released', function (releasedConnection) {
                    assert.isTrue(releasedConnection === connection);

                    done();
                });

                connection.release();
            });
        });

        it('getConnection error promise then', function (done) {
            const oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            oracledb.baseGetConnection = function (attrs, callback) {
                callback(new Error('test'));
            };

            oracledb.getConnection({}).then(function () {
                assert.fail();
            }, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection error promise catch', function (done) {
            const oracledb = createOracleDB();

            OracleDB.extend(oracledb);

            oracledb.baseGetConnection = function (attrs, callback) {
                callback(new Error('test'));
            };

            oracledb.getConnection({}).then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('getConnection promise not supported', function () {
            const oracledb = createOracleDB(true);

            delete global.Promise;

            let errorFound = false;

            try {
                oracledb.getConnection({}).then(function () {
                    assert.fail();
                }).catch(function () {
                    assert.fail();
                });
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });
    });

    describe('run', function () {
        it('missing callback with connection attributes with promise', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb();
                        }
                    });
                }, 0);
            };

            const promise = oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function (connection, callback) {
                assert.isDefined(connection);

                callback();
            });

            promise.then(function () {
                assert.isTrue(releaseCalled);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('missing callback with connection attributes, no promise support', function () {
            const oracledb = createOracleDB(true);

            delete global.Promise;

            let errorFound = false;

            try {
                oracledb.run({}, noop);
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('no connection attributes', function () {
            const oracledb = createOracleDB(true);

            delete global.Promise;

            let errorFound = false;

            try {
                oracledb.run(noop, function () {
                    assert.fail();
                });
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('action not a function', function () {
            const oracledb = createOracleDB(true);

            let errorFound = false;

            try {
                oracledb.run({}, 'test', function () {
                    assert.fail();
                });
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('get connection error', function (done) {
            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                setTimeout(function () {
                    callback(new Error('test'));
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function () {
                assert.fail();
            }, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('sync action error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                callback(null, {
                    release(options, cb) {
                        assert.isDefined(options);
                        releaseCalled = true;

                        setTimeout(cb);
                    }
                });
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function () {
                throw new Error('test');
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);

                done();
            });
        });

        it('async action error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb();
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function (connection, callback) {
                setTimeout(function () {
                    callback(new Error('test'));
                }, 0);
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);
                assert.strictEqual(error.message, 'test');

                done();
            });
        });

        it('async action error and release error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb(new Error('release'));
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function (connection, callback) {
                setTimeout(function () {
                    callback(new Error('test'));
                }, 0);
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);
                assert.strictEqual(error.message, 'test');

                done();
            });
        });

        it('async action error and release error and ignore release error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb',
                    ignoreReleaseErrors: true
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb(new Error('release'));
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb',
                ignoreReleaseErrors: true
            }, function (connection, callback) {
                setTimeout(function () {
                    callback(new Error('test'));
                }, 0);
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);
                assert.strictEqual(error.message, 'test');

                done();
            });
        });

        it('async action error and release error and not ignore release error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb',
                    ignoreReleaseErrors: false
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb(new Error('release'));
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb',
                ignoreReleaseErrors: false
            }, function (connection, callback) {
                setTimeout(function () {
                    callback(new Error('test'));
                }, 0);
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);
                assert.strictEqual(error.message, 'test');

                done();
            });
        });

        it('release error and no ignore release error definition', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb(new Error('release'));
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function (connection, callback) {
                assert.isDefined(connection);
                setTimeout(callback, 0);
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);
                assert.strictEqual(error.message, 'release');

                done();
            });
        });

        it('release error and ignore release error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb',
                    ignoreReleaseErrors: true
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb(new Error('release'));
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb',
                ignoreReleaseErrors: true
            }, function (connection, callback) {
                assert.isDefined(connection);
                setTimeout(callback, 0);
            }, function (error) {
                assert.isNull(error);
                assert.isTrue(releaseCalled);

                done();
            });
        });

        it('release error and not ignore release error', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb',
                    ignoreReleaseErrors: false
                });

                setTimeout(function () {
                    callback(null, {
                        release(options, cb) {
                            assert.isDefined(options);
                            releaseCalled = true;

                            cb(new Error('release'));
                        }
                    });
                }, 0);
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb',
                ignoreReleaseErrors: false
            }, function (connection, callback) {
                assert.isDefined(connection);
                setTimeout(callback, 0);
            }, function (error) {
                assert.isDefined(error);
                assert.isTrue(releaseCalled);
                assert.strictEqual(error.message, 'release');

                done();
            });
        });

        it('release options', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb',
                    releaseOptions: {
                        force: true,
                        test: true
                    }
                });

                callback(null, {
                    release(options, cb) {
                        assert.deepEqual(options, {
                            force: true,
                            test: true
                        });

                        releaseCalled = true;

                        cb();
                    }
                });
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb',
                releaseOptions: {
                    test: true
                }
            }, function (connection, callback) {
                assert.isDefined(connection);

                callback();
            }, function (error) {
                assert.isNull(error);
                assert.isTrue(releaseCalled);

                done();
            });
        });

        it('release options, force false', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb',
                    releaseOptions: {
                        force: false,
                        test: true
                    }
                });

                callback(null, {
                    release(options, cb) {
                        assert.deepEqual(options, {
                            force: false,
                            test: true
                        });

                        releaseCalled = true;

                        cb();
                    }
                });
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb',
                releaseOptions: {
                    force: false,
                    test: true
                }
            }, function (connection, callback) {
                assert.isDefined(connection);

                callback();
            }, function (error) {
                assert.isNull(error);
                assert.isTrue(releaseCalled);

                done();
            });
        });

        it('valid', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                callback(null, {
                    release(options, cb) {
                        assert.deepEqual(options, {
                            force: true
                        });

                        releaseCalled = true;

                        setTimeout(cb, 0);
                    }
                });
            };

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function (connection, callback) {
                assert.isDefined(connection);

                setTimeout(function () {
                    callback(null, {
                        result: true,
                        number: 123
                    });
                }, 0);
            }, function (error, result) {
                assert.isNull(error);
                assert.isTrue(releaseCalled);
                assert.deepEqual(result, {
                    result: true,
                    number: 123
                });

                done();
            });
        });

        it('valid full promise support', function (done) {
            let releaseCalled = false;

            const oracledb = createOracleDB(true);

            oracledb.getConnection = function (connectionAttributes, callback) {
                assert.deepEqual(connectionAttributes, {
                    user: 'test',
                    password: 'mypass',
                    connectString: 'mydb'
                });

                callback(null, {
                    release(options, cb) {
                        assert.deepEqual(options, {
                            force: true
                        });

                        releaseCalled = true;

                        setTimeout(cb, 0);
                    }
                });
            };

            global.Promise = PromiseLib;

            oracledb.run({
                user: 'test',
                password: 'mypass',
                connectString: 'mydb'
            }, function (connection) {
                assert.isDefined(connection);

                return new PromiseLib(function (resolve) {
                    setTimeout(function () {
                        resolve({
                            result: true,
                            number: 123
                        });
                    }, 0);
                });
            }).then(function (result) {
                assert.isTrue(releaseCalled);
                assert.deepEqual(result, {
                    result: true,
                    number: 123
                });

                done();
            }).catch(function () {
                assert.fail();
            });
        });
    });
});
