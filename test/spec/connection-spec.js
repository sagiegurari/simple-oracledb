'use strict';

/*jslint stupid: true*/
/*eslint-disable no-sync*/

const chai = require('chai');
const assert = chai.assert;
const PromiseLib = global.Promise || require('promiscuous');
const path = require('path');
const fs = require('fs');
const helper = require('../helpers/test-oracledb');
const utils = require('../helpers/utils');
const constants = require('../../lib/constants');
const Connection = require('../../lib/connection');
const SimpleOracleDB = require('../..');
const extensions = require('../../lib/extensions');

describe('Connection Tests', function () {
    const asArray = function (args) {
        return Array.prototype.slice.call(args, 0);
    };

    const noop = function () {
        return undefined;
    };

    describe('extend', function () {
        it('valid', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            assert.isTrue(testConnection.simplified);
        });

        it('with extensions', function (done) {
            SimpleOracleDB.addExtension('connection', 'testConnFunc', function (callback) {
                setTimeout(function () {
                    callback(null, true);
                }, 0);
            });
            SimpleOracleDB.addExtension('connection', 'coreFunc', function () {
                return false;
            });

            const testConnection = {};
            testConnection.coreFunc = function () {
                return true;
            };
            Connection.extend(testConnection);

            assert.isTrue(testConnection.simplified);
            assert.isFunction(testConnection.testConnFunc);
            assert.isTrue(testConnection.coreFunc());

            const output = testConnection.testConnFunc(function (error, result) {
                assert.isNull(error);
                assert.isTrue(result);

                extensions.extensions.connection = {};

                done();
            });

            assert.isUndefined(output);
        });

        it('with extensions, using promise', function (done) {
            SimpleOracleDB.addExtension('connection', 'testConnFunc', function (callback) {
                setTimeout(function () {
                    callback(null, true);
                }, 0);
            });
            SimpleOracleDB.addExtension('connection', 'coreFunc', function () {
                return false;
            });

            const testConnection = {};
            testConnection.coreFunc = function () {
                return true;
            };
            Connection.extend(testConnection);

            assert.isTrue(testConnection.simplified);
            assert.isFunction(testConnection.testConnFunc);
            assert.isTrue(testConnection.coreFunc());

            global.Promise = PromiseLib;

            const promise = testConnection.testConnFunc();

            promise.then(function (result) {
                assert.isTrue(result);

                extensions.extensions.connection = {};

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('no input', function () {
            Connection.extend(); //ensure no error
        });
    });

    describe('setupDefaultOptions', function () {
        it('undefined', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            testConnection.setupDefaultOptions();
        });

        it('null', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            testConnection.setupDefaultOptions();
        });

        describe('batch', function () {
            it('empty', function () {
                const testConnection = {};
                Connection.extend(testConnection);

                const options = {};
                testConnection.setupDefaultOptions(options, {
                    batch: true
                });

                assert.deepEqual(options, {
                    useExecuteMany: true
                });
            });

            it('useExecuteMany is true', function () {
                const testConnection = {};
                Connection.extend(testConnection);

                const options = {
                    useExecuteMany: true
                };
                testConnection.setupDefaultOptions(options, {
                    batch: true
                });

                assert.deepEqual(options, {
                    useExecuteMany: true
                });
            });

            it('useExecuteMany is false', function () {
                const testConnection = {};
                Connection.extend(testConnection);

                const options = {
                    useExecuteMany: false
                };
                testConnection.setupDefaultOptions(options, {
                    batch: true
                });

                assert.deepEqual(options, {
                    useExecuteMany: false
                });
            });

            it('useExecuteMany is null', function () {
                const testConnection = {};
                Connection.extend(testConnection);

                const options = {
                    useExecuteMany: null
                };
                testConnection.setupDefaultOptions(options, {
                    batch: true
                });

                assert.deepEqual(options, {
                    useExecuteMany: true
                });
            });

            it('useExecuteMany is undefined', function () {
                const testConnection = {};
                Connection.extend(testConnection);

                const options = {
                    useExecuteMany: undefined
                };
                testConnection.setupDefaultOptions(options, {
                    batch: true
                });

                assert.deepEqual(options, {
                    useExecuteMany: true
                });
            });

            it('useExecuteMany is true other', function () {
                const testConnection = {};
                Connection.extend(testConnection);

                const options = {
                    useExecuteMany: 1
                };
                testConnection.setupDefaultOptions(options, {
                    batch: true
                });

                assert.deepEqual(options, {
                    useExecuteMany: 1
                });
            });
        });
    });

    describe('getMetaData', function () {
        it('undefined', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData();
            assert.isUndefined(output);
        });

        it('null', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData(null);
            assert.isUndefined(output);
        });

        it('on top object', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData({
                metaData: [1, 2, 3]
            });
            assert.deepEqual(output, [1, 2, 3]);
        });

        it('empty array on top object', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData({
                metaData: []
            });
            assert.deepEqual(output, []);
        });

        it('empty array on top object with empty resultSet', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData({
                metaData: [],
                resultSet: {}
            });
            assert.deepEqual(output, []);
        });

        it('empty array on top object with metaData in resultSet', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData({
                metaData: [],
                resultSet: {
                    metaData: [1, 2, 3]
                }
            });
            assert.deepEqual(output, [1, 2, 3]);
        });

        it('on top object with empty resultSet', function () {
            const testConnection = {};
            Connection.extend(testConnection);

            const output = testConnection.getMetaData({
                metaData: [1, 2, 3],
                resultSet: {}
            });
            assert.deepEqual(output, [1, 2, 3]);
        });
    });

    describe('execute', function () {
        it('keep sql', function () {
            const testConnection = {
                execute: noop
            };
            Connection.extend(testConnection);

            testConnection.execute('test sql');
            assert.equal(testConnection.diagnosticInfo.lastSQL, 'test sql');
        });

        it('empty sql', function () {
            const testConnection = {
                execute: noop
            };
            Connection.extend(testConnection);

            testConnection.execute('');
            assert.equal(testConnection.diagnosticInfo.lastSQL, '');
        });

        it('no args', function () {
            const testConnection = {
                execute: noop
            };
            Connection.extend(testConnection);

            testConnection.execute();
            assert.isUndefined(testConnection.diagnosticInfo.lastSQL);
        });
    });

    describe('executeMany', function () {
        it('keep sql', function () {
            const testConnection = {
                executeMany: noop
            };
            Connection.extend(testConnection);

            testConnection.executeMany('test sql');
            assert.equal(testConnection.diagnosticInfo.lastSQL, 'test sql');
        });

        it('empty sql', function () {
            const testConnection = {
                executeMany: noop
            };
            Connection.extend(testConnection);

            testConnection.executeMany('');
            assert.equal(testConnection.diagnosticInfo.lastSQL, '');
        });

        it('no args', function () {
            const testConnection = {
                executeMany: noop
            };
            Connection.extend(testConnection);

            testConnection.executeMany();
            assert.isUndefined(testConnection.diagnosticInfo.lastSQL);
        });
    });

    describe('query', function () {
        const columnNames = [
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
            },
            {
                name: 'LOB1'
            },
            {
                name: 'LOB2'
            }
        ];

        it('error', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(new Error('test error'));
            };

            connection.query(1, 2, {}, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
            });
        });

        it('no callback (without streaming) using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                arguments[arguments.length - 1](null, {
                    metaData: columnNames,
                    rows: []
                });
            };

            global.Promise = PromiseLib;

            const promise = connection.query('sql', [], {});

            promise.then(function () {
                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('no callback (without streaming), no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            let errorFound = false;

            delete global.Promise;

            try {
                connection.query('sql', [], {
                    splitResults: true
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('rows - empty', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.deepEqual(argumentsArray.shift(), {
                    maxRows: 5
                });

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    rows: []
                });
            };

            connection.query(1, 2, {
                maxRows: 5
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);
            });
        });

        it('resultset - empty without stream', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.deepEqual(argumentsArray.shift(), {
                    resultSet: true
                });

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close(releaseCallback) {
                            releaseCallback();
                        },
                        getRows(number, callback) {
                            assert.equal(number, 100);
                            callback(null, []);
                        }
                    }
                });
            };

            connection.query(1, 2, {}, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);
            });
        });

        it('resultset - empty with split', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 1);
                assert.equal(argumentsArray.shift(), 2);
                assert.deepEqual(argumentsArray.shift(), {
                    splitResults: true,
                    resultSet: true
                });

                argumentsArray.shift()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close(releaseCallback) {
                            releaseCallback();
                        },
                        getRows(number, callback) {
                            assert.equal(number, 100);
                            callback(null, []);
                        }
                    }
                });
            };

            connection.query(1, 2, {
                splitResults: true
            }, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([], jsRows);
            });
        });

        it('resultset - no result with stream', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                assert.equal(argumentsArray.length, 4);
                assert.equal(argumentsArray.shift(), 'sql');
                assert.deepEqual(argumentsArray.shift(), [1, 2, 3]);

                argumentsArray.shift();

                argumentsArray.shift()();
            };

            const stream = connection.query('sql', [1, 2, 3], {
                streamResults: true
            }, function (error) {
                assert.isDefined(error);

                setTimeout(function () {
                    assert.isDefined(stream);

                    done();
                });
            });
        });

        it('rows - data no optional params', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const cb = arguments[arguments.length - 1];
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        rows: [
                            {
                                COL1: lob1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: undefined,
                                LOB1: undefined,
                                LOB2: undefined
                            },
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: lob2,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    });

                    setTimeout(function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');

                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }, 10);
                }, 5);
            };

            const output = connection.query('sql', function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456',
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            });

            assert.isUndefined(output);
        });

        it('rows - data, options is null', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const cb = arguments[arguments.length - 1];
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        rows: [
                            {
                                COL1: lob1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: undefined,
                                LOB1: undefined,
                                LOB2: undefined
                            },
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: lob2,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    });

                    setTimeout(function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');

                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }, 10);
                }, 5);
            };

            const output = connection.query('sql', [], null, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456',
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            });

            assert.isUndefined(output);
        });

        it('rows - data, no options arg', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const cb = arguments[arguments.length - 1];
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        rows: [
                            {
                                COL1: lob1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: undefined,
                                LOB1: undefined,
                                LOB2: undefined
                            },
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: lob2,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    });

                    setTimeout(function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');

                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }, 10);
                }, 5);
            };

            const output = connection.query('sql', [], function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456',
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            });

            assert.isUndefined(output);
        });

        it('rows - data', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const cb = arguments[arguments.length - 1];
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        rows: [
                            {
                                COL1: lob1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: undefined,
                                LOB1: undefined,
                                LOB2: undefined
                            },
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: lob2,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    });

                    setTimeout(function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');

                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }, 10);
                }, 5);
            };

            const output = connection.query('sql', [], {}, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456',
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            });

            assert.isUndefined(output);
        });

        it('rows - data using promise', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const cb = arguments[arguments.length - 1];
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        rows: [
                            {
                                COL1: lob1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: undefined,
                                LOB1: undefined,
                                LOB2: undefined
                            },
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: lob2,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    });

                    setTimeout(function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');

                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }, 10);
                }, 5);
            };

            global.Promise = PromiseLib;

            const promise = connection.query('sql', [], {});

            promise.then(function (jsRows) {
                assert.deepEqual([
                    {
                        COL1: 'test1\ntest2',
                        COL2: 'test',
                        COL3: 50,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: '123456',
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);
            }).catch(function () {
                assert.fail();
            });
        });

        it('rows - data no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const cb = arguments[arguments.length - 1];
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        rows: [
                            {
                                COL1: lob1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: undefined,
                                LOB1: undefined,
                                LOB2: undefined
                            },
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: lob2,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    });

                    setTimeout(function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');

                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }, 10);
                }, 5);
            };

            let errorFound = false;

            delete global.Promise;

            try {
                connection.query('sql', [], {});
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('resultset - data', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        },
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                const dbEvents = [
                    null,
                    function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');
                    },
                    function () {
                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }
                ];

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                setTimeout(function () {
                    argumentsArray.pop()(null, {
                        metaData: columnNames,
                        resultSet: {
                            close(releaseCallback) {
                                releaseCallback();
                            },
                            getRows(number, callback) {
                                assert.equal(number, 100);

                                const events = dbEvents.shift();
                                if (events) {
                                    setTimeout(events, 10);
                                }

                                callback(null, dbData.shift());
                            }
                        }
                    });
                }, 5);
            };

            const output = connection.query(1, 2, {}, function (error, jsRows) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2',
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);

                done();
            });

            assert.isUndefined(output);
        });

        it('resultset - data using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        },
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                const dbEvents = [
                    null,
                    function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');
                    },
                    function () {
                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }
                ];

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                setTimeout(function () {
                    argumentsArray.pop()(null, {
                        metaData: columnNames,
                        resultSet: {
                            close(releaseCallback) {
                                releaseCallback();
                            },
                            getRows(number, callback) {
                                assert.equal(number, 100);

                                const events = dbEvents.shift();
                                if (events) {
                                    setTimeout(events, 10);
                                }

                                callback(null, dbData.shift());
                            }
                        }
                    });
                }, 5);
            };

            global.Promise = PromiseLib;

            const promise = connection.query(1, 2, {});

            promise.then(function (jsRows) {
                assert.deepEqual([
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2',
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ], jsRows);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('resultset - data split', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const args = asArray(arguments);
                assert.isUndefined(args[2].stream);
                assert.isTrue(args[2].splitResults);

                const dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        },
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                const dbEvents = [
                    null,
                    function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');
                    },
                    function () {
                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }
                ];

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                const cb = argumentsArray.pop();
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        resultSet: {
                            close(callback) {
                                setTimeout(callback, 1);
                            },
                            getRows(number, callback) {
                                assert.equal(number, 100);

                                const events = dbEvents.shift();
                                if (events) {
                                    setTimeout(events, 10);
                                }

                                callback(null, dbData.shift());
                            }
                        }
                    });
                }, 5);
            };

            const outputData = [
                [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ],
                [
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: 'test1\ntest2',
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ],
                [
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: '123456',
                        COL4: 100,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ]
            ];

            const output = connection.query('sql', [1, 2, 3], {
                splitResults: true,
                stream: true
            }, function (error, jsRows) {
                assert.isNull(error);

                if (outputData.length) {
                    assert.deepEqual(outputData.shift(), jsRows);

                    if (!outputData.length) {
                        done();
                    }
                }
            });

            assert.isUndefined(output);
        });

        it('resultset - data split, no callback with promise', function () {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const args = asArray(arguments);
                assert.isUndefined(args[2].stream);
                assert.isTrue(args[2].splitResults);

                const dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        },
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                const dbEvents = [
                    null,
                    function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');
                    },
                    function () {
                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }
                ];

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                const cb = argumentsArray.pop();
                setTimeout(function () {
                    cb(null, {
                        metaData: columnNames,
                        resultSet: {
                            getRows(number, callback) {
                                assert.equal(number, 100);

                                const events = dbEvents.shift();
                                if (events) {
                                    setTimeout(events, 10);
                                }

                                callback(null, dbData.shift());
                            }
                        }
                    });
                }, 5);
            };

            let errorFound = false;

            global.Promise = PromiseLib;

            try {
                connection.query('sql', [1, 2, 3], {
                    splitResults: true,
                    stream: true
                });
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });

        it('resultset - data stream', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const args = asArray(arguments);
                assert.isUndefined(args[2].stream);
                assert.isTrue(args[2].streamResults);

                const dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        }
                    ],
                    [
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                const dbEvents = [
                    null,
                    function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');
                    },
                    function () {
                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }
                ];

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                argumentsArray.pop()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close(releaseCallback) {
                            releaseCallback();
                        },
                        getRows(number, callback) {
                            const events = dbEvents.shift();
                            if (events) {
                                setTimeout(events, 10);
                            }

                            callback(null, dbData.shift());
                        }
                    }
                });
            };

            const outputData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date,
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: 'test1\ntest2',
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: undefined,
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 10,
                    COL2: true,
                    COL3: '123456',
                    COL4: 100,
                    LOB1: undefined,
                    LOB2: undefined
                }
            ];

            const stream = connection.query('my sql', [1, 2, 3], {
                streamResults: true,
                stream: true
            });

            let gotMetaData = false;
            stream.on('metadata', function (metaData) {
                gotMetaData = true;

                assert.deepEqual(metaData, [
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
                    },
                    {
                        name: 'LOB1'
                    },
                    {
                        name: 'LOB2'
                    }
                ]);
            });

            let eventCounter = 0;
            stream.on('data', function (row) {
                assert.deepEqual(outputData[eventCounter], row);
                eventCounter++;
            });

            stream.on('end', function () {
                assert.isTrue(gotMetaData);
                assert.equal(eventCounter, outputData.length);

                done();
            });
        });

        it('resultset - data stream (core flag)', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const args = asArray(arguments);
                assert.isUndefined(args[2].stream);
                assert.isUndefined(args[2].streamResults);

                const dbData = [
                    [
                        {
                            COL1: 'first row',
                            COL2: 1,
                            COL3: false,
                            COL4: date,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ],
                    [
                        {
                            COL1: 1,
                            COL2: 'test',
                            COL3: 50,
                            COL4: lob1
                        }
                    ],
                    [
                        {
                            COL1: 'a',
                            COL2: date,
                            COL3: undefined,
                            COL4: undefined
                        }
                    ],
                    [
                        {
                            COL1: 10,
                            COL2: true,
                            COL3: lob2,
                            COL4: 100,
                            LOB1: undefined,
                            LOB2: undefined
                        }
                    ]
                ];
                const dbEvents = [
                    null,
                    function () {
                        lob1.emit('data', 'test1');
                        lob1.emit('data', '\ntest2');
                        lob1.emit('end');
                    },
                    function () {
                        lob2.emit('data', '123');
                        lob2.emit('data', '456');
                        lob2.emit('end');
                    }
                ];

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                argumentsArray.pop()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close(releaseCallback) {
                            releaseCallback();
                        },
                        getRows(number, callback) {
                            const events = dbEvents.shift();
                            if (events) {
                                setTimeout(events, 10);
                            }

                            callback(null, dbData.shift());
                        }
                    }
                });
            };

            const outputData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date,
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: 'test1\ntest2',
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: undefined,
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 10,
                    COL2: true,
                    COL3: '123456',
                    COL4: 100,
                    LOB1: undefined,
                    LOB2: undefined
                }
            ];

            connection.query('my sql', [1, 2, 3], {
                stream: true
            }, function (error, stream) {
                assert.isNull(error);

                let eventCounter = 0;
                stream.on('data', function (row) {
                    assert.deepEqual(outputData[eventCounter], row);
                    eventCounter++;
                });

                stream.on('end', function () {
                    assert.equal(eventCounter, outputData.length);

                    done();
                });
            });
        });

        it('resultset - data stream no callback', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                setTimeout(function () {
                    const lob1 = helper.createCLOB();
                    const lob2 = helper.createCLOB();

                    const dbData = [
                        [
                            {
                                COL1: 'first row',
                                COL2: 1,
                                COL3: false,
                                COL4: date,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ],
                        [
                            {
                                COL1: 1,
                                COL2: 'test',
                                COL3: 50,
                                COL4: lob1
                            }
                        ],
                        [
                            {
                                COL1: 'a',
                                COL2: date,
                                COL3: undefined,
                                COL4: undefined
                            }
                        ],
                        [
                            {
                                COL1: 10,
                                COL2: true,
                                COL3: lob2,
                                COL4: 100,
                                LOB1: undefined,
                                LOB2: undefined
                            }
                        ]
                    ];
                    const dbEvents = [
                        null,
                        function () {
                            lob1.emit('data', 'test1');
                            lob1.emit('data', '\ntest2');
                            lob1.emit('end');
                        },
                        function () {
                            lob2.emit('data', '123');
                            lob2.emit('data', '456');
                            lob2.emit('end');
                        }
                    ];

                    argumentsArray.pop()(null, {
                        metaData: columnNames,
                        resultSet: {
                            close(releaseCallback) {
                                releaseCallback();
                            },
                            getRows(number, callback) {
                                const events = dbEvents.shift();
                                if (events) {
                                    setTimeout(events, 10);
                                }

                                callback(null, dbData.shift());
                            }
                        }
                    });
                }, 10);
            };

            const outputData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date,
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 1,
                    COL2: 'test',
                    COL3: 50,
                    COL4: 'test1\ntest2',
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 'a',
                    COL2: date,
                    COL3: undefined,
                    COL4: undefined,
                    LOB1: undefined,
                    LOB2: undefined
                },
                {
                    COL1: 10,
                    COL2: true,
                    COL3: '123456',
                    COL4: 100,
                    LOB1: undefined,
                    LOB2: undefined
                }
            ];

            const stream = connection.query('sql', [], {
                streamResults: true
            });

            let eventCounter = 0;
            stream.on('data', function (row) {
                assert.deepEqual(outputData[eventCounter], row);
                eventCounter++;
            });

            stream.on('end', function () {
                assert.equal(eventCounter, outputData.length);

                done();
            });
        });

        it('resultset - error stream no callback', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                setTimeout(function () {
                    argumentsArray.pop()(new Error('test error'));
                }, 10);
            };

            const stream = connection.query('sql', [], {
                streamResults: true
            });

            stream.on('data', function () {
                assert.fail();
            });

            stream.on('error', function (error) {
                assert.equal(error.message, 'test error');

                done();
            });
        });

        it('resultset - stream close', function (done) {
            const connection = {};
            Connection.extend(connection);

            const date = new Date(500);
            connection.baseExecute = function () {
                const lob1 = helper.createCLOB();
                const lob2 = helper.createCLOB();

                const args = asArray(arguments);
                assert.isUndefined(args[2].stream);
                assert.isTrue(args[2].streamResults);

                const dbData = [
                    {
                        COL1: 'first row',
                        COL2: 1,
                        COL3: false,
                        COL4: date,
                        LOB1: undefined,
                        LOB2: undefined
                    },
                    {
                        COL1: 1,
                        COL2: 'test',
                        COL3: 50,
                        COL4: lob1
                    },
                    {
                        COL1: 'a',
                        COL2: date,
                        COL3: undefined,
                        COL4: undefined
                    },
                    {
                        COL1: 10,
                        COL2: true,
                        COL3: lob2,
                        COL4: 100,
                        LOB1: undefined,
                        LOB2: undefined
                    }
                ];

                const lobEvents = function () {
                    lob1.emit('end');
                    lob2.emit('end');
                };

                const argumentsArray = Array.prototype.slice.call(arguments, 0);
                argumentsArray.pop()(null, {
                    metaData: columnNames,
                    resultSet: {
                        close(releaseCallback) {
                            releaseCallback();
                        },
                        getRows(number, callback) {
                            process.nextTick(function () {
                                callback(null, dbData);

                                setTimeout(lobEvents, 10);
                            });
                        }
                    }
                });
            };

            const outputData = [
                {
                    COL1: 'first row',
                    COL2: 1,
                    COL3: false,
                    COL4: date,
                    LOB1: undefined,
                    LOB2: undefined
                }
            ];

            const stream = connection.query('my sql', [1, 2, 3], {
                streamResults: true,
                stream: true
            });

            stream.on('error', function (error) {
                assert.fail(error);
            });

            let dataFound = false;
            stream.once('data', function (row) {
                stream.close();

                assert.deepEqual(outputData[0], row);
                dataFound = true;
            });

            stream.on('end', function () {
                assert.isTrue(dataFound);

                done();
            });
        });
    });

    describe('insert', function () {
        it('no lobs to insert, no optional params', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (1, 2)');

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.insert('INSERT INTO nolobs (id, id2) VALUES (1, 2)', function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindconsts, {
                    id1: 1,
                    id2: 2
                });
                assert.deepEqual(options, {
                    lobMetaInfo: {}
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.insert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', {
                id1: 1,
                id2: 2
            }, {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);

                done();
            });

            assert.isUndefined(output);
        });

        it('no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindconsts, {
                    id1: 1,
                    id2: 2
                });
                assert.deepEqual(options, {
                    lobMetaInfo: {}
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            let errorFound = false;

            delete global.Promise;

            try {
                connection.insert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', {
                    id1: 1,
                    id2: 2
                }, {
                    lobMetaInfo: {}
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('multiple lobs', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);
                assert.equal(lobsWritten, 3);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('multiple lobs using promise', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            global.Promise = PromiseLib;

            const promise = connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            });

            promise.then(function (results) {
                assert.equal(results.rowsAffected, 1);
                assert.equal(lobsWritten, 3);
                assert.isTrue(commitCalled);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('multiple lobs with additional returning info', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:myid, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b, id INTO :lob1, :lob2, :lob3, :myid');
                assert.deepEqual(bindconsts, {
                    myid: {
                        type: 123456,
                        dir: constants.bindOut,
                        val: 1
                    },
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    },
                    returningInfo: {
                        id: 'myid'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:myid, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                myid: {
                    type: 123456,
                    dir: constants.bindOut,
                    val: 1
                },
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                },
                returningInfo: {
                    id: 'myid'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);
                assert.equal(lobsWritten, 3);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    const cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);

                done();
            });
        });

        it('error on execute', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                callback(new Error('execute error test'));
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);

                done();
            });
        });

        it('error on execute using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                callback(new Error('execute error test'));
            };

            global.Promise = PromiseLib;

            const promise = connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            });

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');

                done();
            });
        });

        it('error on commit', function (done) {
            const connection = {
                rollback(cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            connection.commit = function (callback) {
                callback(new Error('commit error'));
            };

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.insert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'commit error');
                assert.equal(lobsWritten, 3);

                done();
            });
        });
    });

    describe('update', function () {
        it('no lobs to update, no optional params', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = 1, id2 = 2');

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.update('UPDATE nolobs SET id = 1, id2 = 2', function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);

                done();
            });

            assert.isUndefined(output);
        });

        it('no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2');
                assert.deepEqual(bindconsts, {
                    id1: 1,
                    id2: 2
                });
                assert.deepEqual(options, {
                    lobMetaInfo: {}
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            let errorFound = false;

            delete global.Promise;

            try {
                connection.update('UPDATE nolobs SET id = :id1, id2 = :id2', {
                    id1: 1,
                    id2: 2
                }, {
                    lobMetaInfo: {}
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('no lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2');
                assert.deepEqual(bindconsts, {
                    id1: 1,
                    id2: 2
                });
                assert.deepEqual(options, {
                    lobMetaInfo: {}
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.update('UPDATE nolobs SET id = :id1, id2 = :id2', {
                id1: 1,
                id2: 2
            }, {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 1);

                done();
            });

            assert.isUndefined(output);
        });

        it('multiple lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.on('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.on('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.on('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 3,
                    outBinds: {
                        lob1: [lob1, lob1, lob1],
                        lob2: [lob2, lob2, lob2],
                        lob3: [lob3, lob3, lob3]
                    }
                });
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 3);
                assert.equal(lobsWritten, 9);

                done();
            });
        });

        it('multiple lobs using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.on('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.on('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.on('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 3,
                    outBinds: {
                        lob1: [lob1, lob1, lob1],
                        lob2: [lob2, lob2, lob2],
                        lob3: [lob3, lob3, lob3]
                    }
                });
            };

            global.Promise = PromiseLib;

            const promise = connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            });

            promise.then(function (results) {
                assert.equal(results.rowsAffected, 3);
                assert.equal(lobsWritten, 9);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('multiple lobs, no rows', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                callback(null, {
                    rowsAffected: 0
                });
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(results.rowsAffected, 0);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    const cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 3,
                    outBinds: {
                        lob1: [lob1, lob1, lob1],
                        lob2: [lob2, lob2, lob2],
                        lob3: [lob3, lob3, lob3]
                    }
                });
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);

                done();
            });
        });

        it('error while writing lobs using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    const cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 3,
                    outBinds: {
                        lob1: [lob1, lob1, lob1],
                        lob2: [lob2, lob2, lob2],
                        lob3: [lob3, lob3, lob3]
                    }
                });
            };

            const promise = connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            });

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');

                done();
            });
        });

        it('error on execute', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB() RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                });
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                callback(new Error('execute error test'));
            };

            connection.update('UPDATE mylobs SET id = :id, c1 = EMPTY_CLOB(), c2 = EMPTY_CLOB(), b = EMPTY_CLOB()', {
                id: 1,
                lob1: 'clob text',
                lob2: 'second clob text',
                lob3: utils.createBuffer('binary data')
            }, {
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);

                done();
            });
        });
    });

    describe('release', function () {
        it('callback provided', function (done) {
            const connection = {
                release(cb) {
                    assert.isFunction(cb);

                    setTimeout(function () {
                        cb();

                        done();
                    }, 5);
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            const output = connection.release(function () {
                return undefined;
            });

            assert.isUndefined(output);
        });

        it('callback undefined', function (done) {
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);

            global.Promise = PromiseLib;

            const promise = connection.release();

            promise.then(function () {
                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('callback undefined, no promise support', function (done) {
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);

            delete global.Promise;

            const output = connection.release();

            global.Promise = PromiseLib;

            assert.isUndefined(output);
        });

        it('only options provided', function (done) {
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Connection.extend(connection);

            global.Promise = PromiseLib;

            assert.isFunction(connection.baseRelease);

            const promise = connection.release({});

            promise.then(function () {
                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('options and callback provided', function (done) {
            let counter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    counter++;
                    if (counter > 1) {
                        cb();
                    } else {
                        cb(new Error('test'));
                    }
                }
            };
            connection.break = function (cb) {
                assert.fail();
                cb();
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryCount: 5,
                force: false
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);

                done();
            });
        });

        it('retries maxed out', function (done) {
            let counter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryCount: 5,
                retryInterval: 10
            }, function (error) {
                assert.isDefined(error);
                assert.equal(counter, 5);

                done();
            });
        });

        it('retries maxed out, using promise', function (done) {
            let counter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            const promise = connection.release({
                retryCount: 5,
                retryInterval: 10
            });

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal(counter, 5);

                done();
            });
        });

        it('default retry count validation', function (done) {
            let counter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                },
                rollback(cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryInterval: 10
            }, function (error) {
                assert.isDefined(error);
                assert.equal(counter, 10);

                done();
            });
        });

        it('force', function (done) {
            let releaseCalled;
            let breakCalled;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);

                    if (releaseCalled) {
                        assert.fail();
                    } else {
                        releaseCalled = true;

                        cb();
                    }
                },
                rollback(cb) {
                    cb();
                }
            };
            connection.break = function (cb) {
                assert.isFunction(cb);

                if (breakCalled) {
                    assert.fail();
                } else {
                    breakCalled = true;

                    cb();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryCount: 5,
                retryInterval: 10,
                force: true
            }, function (error) {
                assert.isNull(error);
                assert.isTrue(releaseCalled);
                assert.isTrue(breakCalled);

                done();
            });
        });

        it('force maxed out', function (done) {
            let releaseCounter = 0;
            let breakCounter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    releaseCounter++;
                    cb(new Error('test-release'));
                },
                rollback(cb) {
                    cb();
                }
            };
            connection.break = function (cb) {
                breakCounter++;

                cb(new Error('test-break'));
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.release({
                retryCount: 5,
                retryInterval: 10,
                force: true
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test-release');
                assert.equal(breakCounter, 5);
                assert.equal(releaseCounter, 5);

                done();
            });
        });
    });

    describe('close', function () {
        it('callback provided', function (done) {
            const connection = {
                release(cb) {
                    assert.isFunction(cb);

                    setTimeout(function () {
                        cb();

                        done();
                    }, 5);
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            const output = connection.close(function () {
                return undefined;
            });

            assert.isUndefined(output);
        });

        it('options and callback provided', function (done) {
            let counter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    counter++;
                    if (counter > 1) {
                        cb();
                    } else {
                        cb(new Error('test'));
                    }
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.close({
                retryCount: 5
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);

                done();
            });
        });

        it('default retry count validation', function (done) {
            let counter = 0;
            const connection = {
                release(cb) {
                    assert.isFunction(cb);
                    counter++;
                    cb(new Error('test'));
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRelease);
            connection.close({
                retryInterval: 10
            }, function (error) {
                assert.isDefined(error);
                assert.equal(counter, 10);

                done();
            });
        });
    });

    describe('commit', function () {
        it('callback provided', function (done) {
            const connection = {
                commit(cb) {
                    assert.isFunction(cb);

                    setTimeout(function () {
                        cb();
                    }, 5);
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseCommit);
            const output = connection.commit(function () {
                done();
            });

            assert.isUndefined(output);
        });

        it('callback undefined', function (done) {
            const connection = {
                commit(cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseCommit);

            global.Promise = PromiseLib;

            const promise = connection.commit();

            promise.then(function () {
                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('callback undefined, no promise support', function () {
            const connection = {
                commit(cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseCommit);

            delete global.Promise;

            let errorFound = false;

            try {
                connection.commit();
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('in middle of transaction', function (done) {
            const connection = {
                commit(cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Connection.extend(connection);

            connection.inTransaction = true;

            connection.commit(function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('in middle of transaction, using promise', function (done) {
            const connection = {
                commit(cb) {
                    assert.isFunction(cb);
                    cb();
                }
            };
            Connection.extend(connection);

            connection.inTransaction = true;

            global.Promise = PromiseLib;

            const promise = connection.commit();

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);

                done();
            });
        });
    });

    describe('rollback', function () {
        it('callback provided', function (done) {
            const connection = {
                rollback(cb) {
                    assert.isFunction(cb);

                    setTimeout(function () {
                        cb();

                        done();
                    }, 5);
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRollback);
            const output = connection.rollback(function () {
                return undefined;
            });

            assert.isUndefined(output);
        });

        it('callback undefined', function (done) {
            const connection = {
                rollback(cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRollback);

            global.Promise = PromiseLib;

            connection.rollback();
        });

        it('callback undefined, no promise support', function (done) {
            const connection = {
                rollback(cb) {
                    assert.isFunction(cb);
                    cb();

                    done();
                }
            };
            Connection.extend(connection);

            assert.isFunction(connection.baseRollback);

            delete global.Promise;

            connection.rollback();

            global.Promise = PromiseLib;
        });
    });

    describe('queryJSON', function () {
        it('error in query', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(new Error('test error'));
            };

            connection.queryJSON(1, 2, {}, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
            });
        });

        it('error in query, using promise', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function () {
                const argumentsArray = Array.prototype.slice.call(arguments, 0);

                argumentsArray.pop()(new Error('test error'));
            };

            global.Promise = PromiseLib;

            const promise = connection.queryJSON(1, 2, {});

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'test error');
            });
        });

        it('error in parse', function () {
            const connection = {};
            Connection.extend(connection);

            connection.baseExecute = function (sql, bindParams, options, callback) {
                assert.strictEqual('test', sql);
                assert.deepEqual(bindParams, {
                    bind: true
                });
                assert.deepEqual(options, {
                    options: true,
                    resultSet: true
                });

                callback(['JSON'], [
                    {
                        data: 'not json text'
                    }
                ]);
            };

            connection.queryJSON('test', {
                bind: true
            }, {
                options: true
            }, function (error) {
                assert.isDefined(error);
            });
        });

        it('empty', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, bindParams, callback) {
                assert.strictEqual('test', sql);
                assert.deepEqual(bindParams, {
                    bind: true
                });

                callback(null, []);
            };

            connection.queryJSON('test', {
                bind: true
            }, function (error, results) {
                assert.isNull(error);
                assert.equal(0, results.rowCount);
                assert.deepEqual([], results.json);
            });
        });

        it('undefined', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(0, results.rowCount);
                assert.deepEqual([], results.json);
            });
        });

        it('null', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, null);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(0, results.rowCount);
                assert.deepEqual([], results.json);
            });
        });

        it('single row empty data', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, [
                    {
                        data: ''
                    }
                ]);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(1, results.rowCount);
                assert.deepEqual({}, results.json);
            });
        });

        it('single row undefined data', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, [
                    {
                        data: undefined
                    }
                ]);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(1, results.rowCount);
                assert.deepEqual({}, results.json);
            });
        });

        it('single row not json data', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, [
                    {
                        data: 'some text'
                    }
                ]);
            };

            connection.queryJSON('test', function (error) {
                assert.isDefined(error);
            });
        });

        it('multiple rows empty data', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, [
                    {
                        data: ''
                    },
                    {
                        data: ''
                    }
                ]);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(2, results.rowCount);
                assert.deepEqual([{}, {}], results.json);
            });
        });

        it('multiple rows undefined data', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, [
                    {
                        data: undefined
                    },
                    {
                        data: undefined
                    }
                ]);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(2, results.rowCount);
                assert.deepEqual([{}, {}], results.json);
            });
        });

        it('single row', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                setTimeout(function () {
                    callback(null, [
                        {
                            data: JSON.stringify({
                                abc: 1,
                                test: true,
                                array: [1, 2, 3],
                                subObject: {
                                    key1: 'value1'
                                }
                            })
                        }
                    ]);
                }, 5);
            };

            const output = connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(1, results.rowCount);
                assert.deepEqual({
                    abc: 1,
                    test: true,
                    array: [1, 2, 3],
                    subObject: {
                        key1: 'value1'
                    }
                }, results.json);
            });

            assert.isUndefined(output);
        });

        it('single row, using promise', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                setTimeout(function () {
                    callback(null, [
                        {
                            data: JSON.stringify({
                                abc: 1,
                                test: true,
                                array: [1, 2, 3],
                                subObject: {
                                    key1: 'value1'
                                }
                            })
                        }
                    ]);
                }, 5);
            };

            global.Promise = PromiseLib;

            const promise = connection.queryJSON('test');

            promise.then(function (results) {
                assert.equal(1, results.rowCount);
                assert.deepEqual({
                    abc: 1,
                    test: true,
                    array: [1, 2, 3],
                    subObject: {
                        key1: 'value1'
                    }
                }, results.json);
            }).catch(function () {
                assert.fail();
            });
        });

        it('single row, no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                setTimeout(function () {
                    callback(null, [
                        {
                            data: JSON.stringify({
                                abc: 1,
                                test: true,
                                array: [1, 2, 3],
                                subObject: {
                                    key1: 'value1'
                                }
                            })
                        }
                    ]);
                }, 5);
            };

            delete global.Promise;

            let errorFound = false;

            try {
                connection.queryJSON('test');
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('multiple rows', function () {
            const connection = {};
            Connection.extend(connection);

            connection.query = function (sql, callback) {
                assert.strictEqual('test', sql);

                callback(null, [
                    {
                        data: JSON.stringify({
                            a: 1,
                            test: true,
                            array: [1, 2, 3],
                            subObject: {
                                key1: 'value1'
                            }
                        })
                    },
                    {
                        data: JSON.stringify({
                            a: 2,
                            test: true,
                            array: ['a', true],
                            subObject: {
                                key1: 'value1',
                                arr: [true, false, {}]
                            }
                        })
                    }
                ]);
            };

            connection.queryJSON('test', function (error, results) {
                assert.isNull(error);
                assert.equal(2, results.rowCount);
                assert.deepEqual([
                    {
                        a: 1,
                        test: true,
                        array: [1, 2, 3],
                        subObject: {
                            key1: 'value1'
                        }
                    },
                    {
                        a: 2,
                        test: true,
                        array: ['a', true],
                        subObject: {
                            key1: 'value1',
                            arr: [true, false, {}]
                        }
                    }
                ], results.json);
            });
        });
    });

    describe('batchInsert', function () {
        it('no lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.batchInsert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ], {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs using executeMany', function (done) {
            const consts = [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ];

            const connection = {
                executeMany(sql, bindconsts, options, callback) {
                    assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                    assert.deepEqual(bindconsts, consts);
                    assert.deepEqual(options, {
                        lobMetaInfo: {},
                        autoCommit: true,
                        useExecuteMany: true,
                        forceUseExecuteMany: true,
                        bindDefs: {
                            id1: {
                                type: 2010
                            },
                            id2: {
                                type: 2010
                            }
                        }
                    });

                    setTimeout(function () {
                        callback(null, {
                            rowsAffected: 2,
                            outBinds: [
                                {},
                                {}
                            ]
                        });
                    }, 5);
                }
            };
            Connection.extend(connection);

            const output = connection.batchInsert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ], {
                lobMetaInfo: {},
                autoCommit: true,
                useExecuteMany: true,
                forceUseExecuteMany: true
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs using executeMany as default', function (done) {
            const consts = [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ];

            const connection = {
                executeMany(sql, bindconsts, options, callback) {
                    assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                    assert.deepEqual(bindconsts, consts);
                    assert.deepEqual(options, {
                        lobMetaInfo: {},
                        autoCommit: true,
                        useExecuteMany: true,
                        bindDefs: {
                            id1: {
                                type: 2010
                            },
                            id2: {
                                type: 2010
                            }
                        }
                    });

                    setTimeout(function () {
                        callback(null, {
                            rowsAffected: 2,
                            outBinds: [
                                {},
                                {}
                            ]
                        });
                    }, 5);
                }
            };
            Connection.extend(connection);

            const output = connection.batchInsert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ], {
                lobMetaInfo: {},
                autoCommit: true
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            global.Promise = PromiseLib;

            const promise = connection.batchInsert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ], {
                lobMetaInfo: {}
            });

            promise.then(function (results) {
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('no lobs, no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2
                },
                {
                    id1: 3,
                    id2: 4
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            delete global.Promise;

            let errorFound = false;

            try {
                connection.batchInsert('INSERT INTO nolobs (id, id2) VALUES (:id1, :id2)', [
                    {
                        id1: 1,
                        id2: 2
                    },
                    {
                        id1: 3,
                        id2: 4
                    }
                ], {
                    lobMetaInfo: {}
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('multiple lobs', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('multiple lobs executeMany', function (done) {
            let lobsWritten = 0;
            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];

            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                },
                executeMany(sql, bindconsts, options, callback) {
                    assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                    assert.deepEqual(bindconsts, [
                        {
                            id: 1,
                            lob1: undefined,
                            lob2: undefined,
                            lob3: undefined
                        },
                        {
                            id: 2,
                            lob1: undefined,
                            lob2: undefined,
                            lob3: undefined
                        }
                    ]);
                    assert.deepEqual(options, {
                        autoCommit: false,
                        lobMetaInfo: {
                            c1: 'lob1',
                            c2: 'lob2',
                            b: 'lob3'
                        },
                        sqlModified: true,
                        useExecuteMany: true,
                        forceUseExecuteMany: true,
                        bindDefs: {
                            id: {
                                type: 2010
                            },
                            lob1: {
                                dir: 3003,
                                type: 2017
                            },
                            lob2: {
                                dir: 3003,
                                type: 2017
                            },
                            lob3: {
                                dir: 3003,
                                type: 2019
                            }
                        }
                    });

                    const outBinds = [];
                    consts.forEach(function () {
                        const lob1 = helper.createCLOB();
                        lob1.testData = 'clob text';
                        lob1.once('end', function () {
                            lobsWritten++;
                        });
                        const lob2 = helper.createCLOB();
                        lob2.testData = 'second clob text';
                        lob2.once('end', function () {
                            lobsWritten++;
                        });
                        const lob3 = helper.createBLOB();
                        lob3.testData = 'binary data';
                        lob3.once('end', function () {
                            lobsWritten++;
                        });

                        outBinds.push({
                            lob1: [lob1],
                            lob2: [lob2],
                            lob3: [lob3]
                        });
                    });

                    callback(null, {
                        rowsAffected: consts.length,
                        outBinds
                    });
                }
            };
            Connection.extend(connection);

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                useExecuteMany: true,
                forceUseExecuteMany: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isNull(error);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('multiple lobs executeMany as default', function (done) {
            let lobsWritten = 0;
            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];

            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                },
                executeMany(sql, bindconsts, options, callback) {
                    assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                    assert.deepEqual(bindconsts, [
                        {
                            id: 1,
                            lob1: undefined,
                            lob2: undefined,
                            lob3: undefined
                        },
                        {
                            id: 2,
                            lob1: undefined,
                            lob2: undefined,
                            lob3: undefined
                        }
                    ]);
                    assert.deepEqual(options, {
                        autoCommit: false,
                        lobMetaInfo: {
                            c1: 'lob1',
                            c2: 'lob2',
                            b: 'lob3'
                        },
                        sqlModified: true,
                        useExecuteMany: true,
                        bindDefs: {
                            id: {
                                type: 2010
                            },
                            lob1: {
                                dir: 3003,
                                type: 2017
                            },
                            lob2: {
                                dir: 3003,
                                type: 2017
                            },
                            lob3: {
                                dir: 3003,
                                type: 2019
                            }
                        }
                    });

                    const outBinds = [];
                    consts.forEach(function () {
                        const lob1 = helper.createCLOB();
                        lob1.testData = 'clob text';
                        lob1.once('end', function () {
                            lobsWritten++;
                        });
                        const lob2 = helper.createCLOB();
                        lob2.testData = 'second clob text';
                        lob2.once('end', function () {
                            lobsWritten++;
                        });
                        const lob3 = helper.createBLOB();
                        lob3.testData = 'binary data';
                        lob3.once('end', function () {
                            lobsWritten++;
                        });

                        outBinds.push({
                            lob1: [lob1],
                            lob2: [lob2],
                            lob3: [lob3]
                        });
                    });

                    callback(null, {
                        rowsAffected: consts.length,
                        outBinds
                    });
                }
            };
            Connection.extend(connection);

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isNull(error);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            let rollbackCalled = false;
            const connection = {
                rollback(cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    const cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on execute', function (done) {
            let rollbackCalled = false;
            const connection = {
                rollback(cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                if (counter < 2) {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                } else {
                    callback(new Error('execute error test'));
                }
            };

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on execute, using promise', function (done) {
            let rollbackCalled = false;
            const connection = {
                rollback(cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                if (counter < 2) {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                } else {
                    callback(new Error('execute error test'));
                }
            };

            global.Promise = PromiseLib;

            const promise = connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            });

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on commit', function (done) {
            const connection = {
                rollback(cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            connection.commit = function (callback) {
                callback(new Error('commit error'));
            };

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB()) RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchInsert('INSERT INTO mylobs (id, c1, c2, b) VALUES (:id, EMPTY_CLOB(), EMPTY_CLOB(), EMPTY_CLOB())', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'commit error');
                assert.equal(lobsWritten, 6);

                done();
            });
        });
    });

    describe('batchUpdate', function () {
        it('no lobs', function (done) {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.batchUpdate('UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3', [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ], {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs using executeMany', function (done) {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false,
                    forceUseExecuteMany: true
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.batchUpdate('UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3', [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ], {
                lobMetaInfo: {},
                useExecuteMany: true,
                forceUseExecuteMany: true
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs using executeMany as default', function (done) {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            const output = connection.batchUpdate('UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3', [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ], {
                lobMetaInfo: {}
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            });

            assert.isUndefined(output);
        });

        it('no lobs, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            global.Promise = PromiseLib;

            const promise = connection.batchUpdate('UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3', [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ], {
                lobMetaInfo: {}
            });

            promise.then(function (results) {
                assert.deepEqual([
                    {
                        outBinds: {},
                        rowsAffected: 1
                    },
                    {
                        outBinds: {},
                        rowsAffected: 1
                    }
                ], results);
                assert.equal(counter, 2);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('no lobs, no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            const consts = [
                {
                    id1: 1,
                    id2: 2,
                    id3: 'a'
                },
                {
                    id1: 3,
                    id2: 4,
                    id3: 'b'
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    lobMetaInfo: {},
                    autoCommit: false
                });

                setTimeout(function () {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                }, 5);
            };

            let errorFound = false;

            delete global.Promise;

            try {
                connection.batchUpdate('UPDATE nolobs SET id = :id1, id2 = :id2 where id3 = :id3', [
                    {
                        id1: 1,
                        id2: 2,
                        id3: 'a'
                    },
                    {
                        id1: 3,
                        id2: 4,
                        id3: 'b'
                    }
                ], {
                    lobMetaInfo: {}
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('multiple lobs', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('multiple lobs using executeMany', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    },
                    forceUseExecuteMany: true
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                },
                useExecuteMany: true,
                forceUseExecuteMany: true
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('multiple lobs using executeMany as default', function (done) {
            let commitCalled = false;
            const connection = {
                commit(callback) {
                    commitCalled = true;
                    callback();
                }
            };
            Connection.extend(connection);

            let lobsWritten = 0;
            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isNull(error);
                assert.equal(counter, 2);
                assert.equal(lobsWritten, 6);
                assert.isTrue(commitCalled);

                done();
            });
        });

        it('error while writing lobs', function (done) {
            let rollbackCalled = false;
            const connection = {
                rollback(cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.end = function () {
                    const cb = Array.prototype.pop.call(arguments);
                    lob2.emit('error', new Error('lob test error'));

                    setTimeout(cb, 10);
                };
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'lob test error');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on execute', function (done) {
            let rollbackCalled = false;
            const connection = {
                rollback(cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                if (counter < 2) {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                } else {
                    callback(new Error('execute error test'));
                }
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error, results) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isUndefined(results);
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on execute, using promise', function (done) {
            let rollbackCalled = false;
            const connection = {
                rollback(cb) {
                    rollbackCalled = true;
                    cb();
                }
            };
            Connection.extend(connection);

            const consts = [
                {
                    id: 1,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                },
                {
                    id: 2,
                    lob1: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob2: {
                        type: constants.clobType,
                        dir: constants.bindOut
                    },
                    lob3: {
                        type: constants.blobType,
                        dir: constants.bindOut
                    }
                }
            ];
            let counter = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(bindconsts, consts[counter]);
                counter++;
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                if (counter < 2) {
                    callback(null, {
                        rowsAffected: 1,
                        outBinds: {}
                    });
                } else {
                    callback(new Error('execute error test'));
                }
            };

            global.Promise = PromiseLib;

            const promise = connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            });

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'execute error test');
                assert.isTrue(rollbackCalled);

                done();
            });
        });

        it('error on commit', function (done) {
            const connection = {
                rollback(cb) {
                    cb();
                }
            };
            Connection.extend(connection);

            connection.commit = function (callback) {
                callback(new Error('commit error'));
            };

            let lobsWritten = 0;
            connection.baseExecute = function (sql, bindconsts, options, callback) {
                assert.equal(sql, 'UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id RETURNING c1, c2, b INTO :lob1, :lob2, :lob3');
                assert.deepEqual(options, {
                    autoCommit: false,
                    lobMetaInfo: {
                        c1: 'lob1',
                        c2: 'lob2',
                        b: 'lob3'
                    }
                });

                const lob1 = helper.createCLOB();
                lob1.testData = 'clob text';
                lob1.once('end', function () {
                    lobsWritten++;
                });
                const lob2 = helper.createCLOB();
                lob2.testData = 'second clob text';
                lob2.once('end', function () {
                    lobsWritten++;
                });
                const lob3 = helper.createBLOB();
                lob3.testData = 'binary data';
                lob3.once('end', function () {
                    lobsWritten++;
                });

                callback(null, {
                    rowsAffected: 1,
                    outBinds: {
                        lob1: [lob1],
                        lob2: [lob2],
                        lob3: [lob3]
                    }
                });
            };

            connection.batchUpdate('UPDATE mylobs SET c1 = EMPTY_CLOB(), c2: EMPTY_CLOB(), b = EMPTY_CLOB() WHERE id = :id', [
                {
                    id: 1,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                },
                {
                    id: 2,
                    lob1: 'clob text',
                    lob2: 'second clob text',
                    lob3: utils.createBuffer('binary data')
                }
            ], {
                autoCommit: true,
                lobMetaInfo: {
                    c1: 'lob1',
                    c2: 'lob2',
                    b: 'lob3'
                }
            }, function (error) {
                assert.isDefined(error);
                assert.equal(error.message, 'commit error');
                assert.equal(lobsWritten, 6);

                done();
            });
        });
    });

    describe('run', function () {
        it('no actions', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.run(undefined, function () {
                assert.fail();
            });

            setTimeout(done, 50);
        });

        it('single action', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.run(function (callback) {
                assert.isFalse(commitDone);

                callback(null, 'my result');
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual(['my result'], results);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('single action, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            global.Promise = PromiseLib;

            const promise = connection.run(function (callback) {
                assert.isFalse(commitDone);

                callback(null, 'my result');
            });

            promise.then(function (results) {
                assert.deepEqual(['my result'], results);
                assert.isFalse(commitDone);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('single promise action, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            global.Promise = PromiseLib;

            const promise = connection.run(function () {
                assert.isFalse(commitDone);

                return new PromiseLib(function (resolve) {
                    resolve('my result');
                });
            });

            promise.then(function (results) {
                assert.deepEqual(['my result'], results);
                assert.isFalse(commitDone);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('single action, no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let errorFound = false;

            delete global.Promise;

            try {
                connection.run(function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my result');
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('multiple actions', function (done) {
            const connection = {};
            Connection.extend(connection);

            let secondStarted = false;
            connection.run([
                function (callback) {
                    setTimeout(function () {
                        assert.isFalse(secondStarted); //sequence is default

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;

                    callback(null, 'my second');
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);

                done();
            });
        });

        it('multiple actions with mix aysnc/promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            let secondStarted = false;
            connection.run([
                function (callback) {
                    setTimeout(function () {
                        assert.isFalse(secondStarted); //sequence is default

                        callback(null, 'my first');
                    }, 10);
                },
                function () {
                    secondStarted = true;

                    return new PromiseLib(function (resolve) {
                        resolve('my second');
                    });
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);

                done();
            });
        });

        it('parallel', function (done) {
            const connection = {};
            Connection.extend(connection);

            let secondStarted = false;
            connection.run([
                function (callback) {
                    setTimeout(function () {
                        assert.isTrue(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;

                    callback(null, 'my second');
                }
            ], {
                sequence: false
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);

                done();
            });
        });

        it('sequence', function (done) {
            const connection = {};
            Connection.extend(connection);

            let secondStarted = false;
            connection.run([
                function (callback) {
                    setTimeout(function () {
                        assert.isFalse(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;

                    callback(null, 'my second');
                }
            ], {
                sequence: true
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);

                done();
            });
        });

        it('run in run', function (done) {
            const connection = {};

            Connection.extend(connection);

            connection.run(function (callback) {
                connection.run(function (cb) {
                    cb(null, 2);
                }, callback);
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual(results, [[2]]);

                done();
            });
        });

        it('error in actions', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.run([
                function (callback) {
                    callback(null, 'my first');
                },
                function (callback) {
                    callback(new Error('test error'));
                }
            ], function (error) {
                assert.isDefined(error);
                assert.equal('test error', error.message);

                done();
            });
        });

        it('error in actions, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            const promise = connection.run([
                function (callback) {
                    callback(null, 'my first');
                },
                function (callback) {
                    callback(new Error('test error'));
                }
            ]);

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal('test error', error.message);

                done();
            });
        });

        it('error in promise actions, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            const promise = connection.run([
                function (callback) {
                    callback(null, 'my first');
                },
                function () {
                    return new PromiseLib(function (resolve, reject) {
                        reject(new Error('test error'));
                    });
                }
            ]);

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal('test error', error.message);

                done();
            });
        });
    });

    describe('transaction', function () {
        it('execute ensure autocommit false', function (done) {
            const connection = {
                execute(sql, bindings, options, cb) {
                    assert.equal(sql, 'sql');
                    assert.deepEqual(bindings, []);
                    assert.deepEqual(options, {
                        autoCommit: false
                    });

                    setTimeout(cb, 5);
                }
            };
            Connection.extend(connection);

            connection.inTransaction = true;
            const output = connection.execute('sql', [], {
                autoCommit: true
            }, done);

            assert.isUndefined(output);
        });

        it('executeMany ensure autocommit false', function (done) {
            const connection = {
                executeMany(sql, bindings, options, cb) {
                    assert.equal(sql, 'sql');
                    assert.deepEqual(bindings, []);
                    assert.deepEqual(options, {
                        autoCommit: false
                    });

                    setTimeout(cb, 5);
                }
            };
            Connection.extend(connection);

            connection.inTransaction = true;
            const output = connection.executeMany('sql', [], {
                autoCommit: true
            }, done);

            assert.isUndefined(output);
        });

        it('execute no options', function (done) {
            const connection = {
                execute(sql, bindings, cb) {
                    assert.equal(sql, 'sql');
                    assert.deepEqual(bindings, []);

                    cb();
                }
            };
            Connection.extend(connection);

            connection.inTransaction = true;
            connection.execute('sql', [], done);
        });

        it('executeMany no options', function (done) {
            const connection = {
                executeMany(sql, bindings, cb) {
                    assert.equal(sql, 'sql');
                    assert.deepEqual(bindings, []);

                    cb();
                }
            };
            Connection.extend(connection);

            connection.inTransaction = true;
            connection.executeMany('sql', [], done);
        });

        it('no actions', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.transaction(undefined, function () {
                assert.fail();
            });

            setTimeout(done, 50);
        });

        it('single action', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.transaction(function (callback) {
                assert.isFalse(commitDone);

                callback(null, 'my result');
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual(['my result'], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('single action, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            global.Promise = PromiseLib;

            const promise = connection.transaction(function (callback) {
                assert.isFalse(commitDone);

                callback(null, 'my result');
            });

            promise.then(function (results) {
                assert.deepEqual(['my result'], results);
                assert.isTrue(commitDone);

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('single action, no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let errorFound = false;

            delete global.Promise;

            try {
                connection.transaction(function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my result');
                });
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('multiple actions', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let secondStarted = false;
            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    setTimeout(function () {
                        assert.isFalse(secondStarted); //sequence is default

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('parallel', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let secondStarted = false;
            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    setTimeout(function () {
                        assert.isTrue(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], {
                sequence: false
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('sequence', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let secondStarted = false;
            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    setTimeout(function () {
                        assert.isFalse(secondStarted);

                        callback(null, 'my first');
                    }, 10);
                },
                function (callback) {
                    secondStarted = true;
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], {
                sequence: true
            }, function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('prevent autoCommit', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };
            connection.baseExecute = function (sql, bindParams, options, cb) {
                assert.deepEqual({
                    autoCommit: false,
                    otherOption: 'test123'
                }, options);

                cb();
            };

            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    connection.execute('sql', [], {
                        autoCommit: true,
                        otherOption: 'test123'
                    }, function () {
                        callback(null, 'my first');
                    });
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    connection.batchInsert('sql', [{}], {
                        autoCommit: true,
                        otherOption: 'test123'
                    }, function () {
                        callback(null, 'my second');
                    });
                }
            ], function (error, results) {
                assert.isNull(error);
                assert.deepEqual([
                    'my first',
                    'my second'
                ], results);
                assert.isTrue(commitDone);

                done();
            });
        });

        it('rollback in middle of transaction', function (done) {
            const connection = {
                rollback(cb) {
                    cb();
                }
            };

            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.transaction(function (callback) {
                connection.rollback(callback);
            }, function (error) {
                assert.isDefined(error);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('commit in middle of transaction', function (done) {
            let commitDone = false;
            const connection = {
                rollback(cb) {
                    cb();
                },
                commit(cb) {
                    commitDone = true;
                    cb();
                }
            };

            Connection.extend(connection);

            connection.transaction(function (callback) {
                connection.commit(callback);
            }, function (error) {
                assert.isDefined(error);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('transaction in transaction', function (done) {
            const connection = {
                rollback(cb) {
                    cb();
                }
            };

            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            connection.transaction(function (callback) {
                connection.transaction(function (cb) {
                    cb();
                }, callback);
            }, function (error) {
                assert.isDefined(error);
                assert.isFalse(commitDone);

                done();
            });
        });

        it('error in actions', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let rollbackDone = false;
            connection.rollback = function (callback) {
                rollbackDone = true;
                callback();
            };

            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my first');
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(new Error('test error'));
                }
            ], function (error) {
                assert.isDefined(error);
                assert.equal('test error', error.message);
                assert.isFalse(commitDone);
                assert.isTrue(rollbackDone);

                done();
            });
        });

        it('error in actions, using promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback();
            };

            let rollbackDone = false;
            connection.rollback = function (callback) {
                rollbackDone = true;
                callback();
            };

            const promise = connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my first');
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(new Error('test error'));
                }
            ]);

            promise.then(function () {
                assert.fail();
            }).catch(function (error) {
                assert.isDefined(error);
                assert.equal('test error', error.message);
                assert.isFalse(commitDone);
                assert.isTrue(rollbackDone);

                done();
            });
        });

        it('error in commit', function (done) {
            const connection = {};
            Connection.extend(connection);

            let commitDone = false;
            connection.commit = function (callback) {
                commitDone = true;
                callback(new Error('commit error'));
            };

            let rollbackDone = false;
            connection.rollback = function (callback) {
                rollbackDone = true;
                callback();
            };

            connection.transaction([
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my first');
                },
                function (callback) {
                    assert.isFalse(commitDone);

                    callback(null, 'my second');
                }
            ], function (error) {
                assert.isDefined(error);
                assert.equal('commit error', error.message);
                assert.isTrue(commitDone);
                assert.isTrue(rollbackDone);

                done();
            });
        });
    });

    describe('executeFile', function () {
        const sqlFile = path.join(__dirname, '../helpers/test.sql');
        let sqlStatement = fs.readFileSync(sqlFile, {
            encoding: 'utf8'
        });
        sqlStatement = sqlStatement.trim();

        it('no file', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.executeFile(function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('no file', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.executeFile(function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('all params', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindParams, options, callback) {
                assert.strictEqual(sql, sqlStatement);
                assert.deepEqual(bindParams, []);
                assert.deepEqual(options, {
                    test: 1,
                    another: 'test'
                });

                callback(null, 'done');
            };

            connection.executeFile(sqlFile, {
                test: 1,
                another: 'test'
            }, function (error, output) {
                assert.isNull(error);
                assert.strictEqual(output, 'done');

                done();
            });
        });

        it('all params - promise', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindParams, options, callback) {
                assert.strictEqual(sql, sqlStatement);
                assert.deepEqual(bindParams, []);
                assert.deepEqual(options, {
                    test: 1,
                    another: 'test'
                });

                callback(null, 'done');
            };

            global.Promise = PromiseLib;

            const promise = connection.executeFile(sqlFile, {
                test: 1,
                another: 'test'
            });

            promise.then(function (output) {
                assert.strictEqual(output, 'done');

                done();
            }).catch(function () {
                assert.fail();
            });
        });

        it('no callback, no promise support', function () {
            const connection = {};
            Connection.extend(connection);

            let errorFound = false;

            delete global.Promise;

            try {
                connection.executeFile(sqlFile, {});
            } catch (error) {
                errorFound = true;
            }

            global.Promise = PromiseLib;

            assert.isTrue(errorFound);
        });

        it('no options', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindParams, options, callback) {
                assert.strictEqual(sql, sqlStatement);
                assert.deepEqual(bindParams, []);
                assert.isNull(options);

                callback(null, 'done');
            };

            connection.executeFile(sqlFile, function (error, output) {
                assert.isNull(error);
                assert.strictEqual(output, 'done');

                done();
            });
        });

        it('error during file read', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.readFile = function (file, callback) {
                assert.strictEqual(file, sqlFile);

                callback(new Error('test'));
            };

            connection.executeFile(sqlFile, function (error) {
                assert.isDefined(error);

                done();
            });
        });

        it('error during execute', function (done) {
            const connection = {};
            Connection.extend(connection);

            connection.execute = function (sql, bindParams, options, callback) {
                assert.strictEqual(sql, sqlStatement);
                assert.deepEqual(bindParams, []);

                callback(new Error('test'));
            };

            connection.executeFile(sqlFile, function (error) {
                assert.isDefined(error);

                done();
            });
        });
    });

    describe('generateBindDefinitions', function () {
        it('no options', function () {
            const connection = {};
            Connection.extend(connection);

            connection.generateBindDefinitions(null, [1, 2, 3]);
        });

        it('undefined bind params', function () {
            const connection = {};
            Connection.extend(connection);

            const options = {};
            connection.generateBindDefinitions(options);

            assert.isUndefined(options.bindDefs);
        });

        it('null bind params', function () {
            const connection = {};
            Connection.extend(connection);

            const options = {};
            connection.generateBindDefinitions(options, null);

            assert.isUndefined(options.bindDefs);
        });

        it('empty bind params', function () {
            const connection = {};
            Connection.extend(connection);

            const options = {};
            connection.generateBindDefinitions(options, []);

            assert.isUndefined(options.bindDefs);
        });

        it('bind definitions already set', function () {
            const connection = {};
            Connection.extend(connection);

            const options = {
                bindDefs: true
            };
            connection.generateBindDefinitions(options, [1, 2, 3]);

            assert.isTrue(options.bindDefs);
        });

        it('full', function () {
            const connection = {};
            Connection.extend(connection);

            const options = {};
            const bindParams = [
                {
                    null1: {
                        type: 2001,
                        maxSize: 450,
                        val: null
                    },
                    string1: 'text1',
                    string2: 'text2',
                    string3: {
                        val: 'text3',
                        dir: 1,
                        type: 2
                    },
                    number1: 1,
                    number2: {
                        val: 2,
                        dir: 10,
                        type: 20
                    },
                    date1: new Date(500),
                    date2: {
                        val: new Date(500),
                        dir: 100,
                        type: 200
                    },
                    lob: {
                        dir: 1000,
                        type: 2000
                    }
                },
                {
                    null1: null,
                    string1: '_text1',
                    string2: '_text2',
                    string3: {
                        val: '_text3',
                        dir: 1,
                        type: 2
                    },
                    number1: 10,
                    number2: {
                        val: 20,
                        dir: 10,
                        type: 20
                    },
                    date1: new Date(500),
                    date2: {
                        val: new Date(500),
                        dir: 100,
                        type: 200
                    },
                    lob: {
                        dir: 1000,
                        type: 2000
                    }
                }
            ];
            connection.generateBindDefinitions(options, bindParams);

            assert.deepEqual(options.bindDefs, {
                null1: {
                    type: 2001,
                    maxSize: 450
                },
                string1: {
                    type: 2001,
                    maxSize: 100000
                },
                string2: {
                    type: 2001,
                    maxSize: 100000
                },
                string3: {
                    dir: 1,
                    type: 2001,
                    maxSize: 100000
                },
                number1: {
                    type: 2010
                },
                number2: {
                    dir: 10,
                    type: 20
                },
                date1: {
                    type: 2011
                },
                date2: {
                    dir: 100,
                    type: 200
                },
                lob: {
                    dir: 1000,
                    type: 2000
                }
            });
            assert.deepEqual(bindParams, [
                {
                    null1: null,
                    string1: 'text1',
                    string2: 'text2',
                    string3: 'text3',
                    number1: 1,
                    number2: 2,
                    date1: new Date(500),
                    date2: new Date(500),
                    lob: undefined
                },
                {
                    null1: null,
                    string1: '_text1',
                    string2: '_text2',
                    string3: '_text3',
                    number1: 10,
                    number2: 20,
                    date1: new Date(500),
                    date2: new Date(500),
                    lob: undefined
                }
            ]);
        });

        it('error', function () {
            const connection = {};
            Connection.extend(connection);

            const options = {};
            const bindParams = [
                {
                    bool: true
                }
            ];

            let errorFound = false;

            try {
                connection.generateBindDefinitions(options, bindParams);
            } catch (error) {
                errorFound = true;
            }

            assert.isTrue(errorFound);
        });
    });
});
