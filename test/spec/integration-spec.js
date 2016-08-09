'use strict';
/*global describe: false, it: false */

var asyncLib = require('async');
var chai = require('chai');
var assert = chai.assert;

describe('Integration Tests', function () {
    var self = this;

    var integrated = true;
    var connAttrs = {
        user: process.env.TEST_ORACLE_USER,
        password: process.env.TEST_ORACLE_PASSWORD,
        connectString: process.env.TEST_ORACLE_CONNECTION_STRING
    };

    if ((!connAttrs.user) || (!connAttrs.password) || (!connAttrs.connectString)) {
        integrated = false;
    }

    if (!integrated) {
        it('empty', function () {
            return undefined;
        });
    } else {
        var oracledb = require('oracledb');

        oracledb.autoCommit = true;

        var simpleOracleDB = require('../../');
        simpleOracleDB.extend(oracledb);

        var end = function (done, connection) {
            if (connection) {
                connection.release();
            }

            setTimeout(done, 10);
        };

        var testPool;
        var initDB = function (tableName, data, cb) {
            oracledb.getConnection(connAttrs, function (connErr, connection) {
                data = data || [];

                if (connErr) {
                    console.error(connErr);
                    setTimeout(function () {
                        assert.fail('UNABLE TO OPEN DB CONNECTION.');
                    }, 100);
                } else {
                    connection.execute('DROP TABLE ' + tableName, [], function () {
                        connection.execute('CREATE TABLE ' + tableName + ' (COL1 VARCHAR2(250) PRIMARY KEY, COL2 NUMBER, COL3 NUMBER, COL4 VARCHAR2(250), LOB1 CLOB, LOB2 BLOB)', [], function (createError) {
                            if (createError) {
                                console.error(createError);
                                assert.fail('UNABLE TO CREATE DB TABLE: ' + tableName);
                            } else {
                                var func = [];
                                data.forEach(function (rowData) {
                                    func.push(function (asyncCB) {
                                        if (!rowData.COL4) {
                                            rowData.COL4 = undefined;
                                        }
                                        if (!rowData.LOB1) {
                                            rowData.LOB1 = undefined;
                                        }
                                        if (!rowData.LOB2) {
                                            rowData.LOB2 = undefined;
                                        }

                                        connection.execute('INSERT INTO ' + tableName + ' (COL1, COL2, COL3, COL4, LOB1, LOB2) VALUES (:COL1, :COL2, :COL3, :COL4, :LOB1, :LOB2)', rowData, function (insertErr) {
                                            if (insertErr) {
                                                asyncCB(insertErr);
                                            } else {
                                                asyncCB(null, rowData);
                                            }
                                        });
                                    });
                                });

                                asyncLib.series(func, function (asynErr) {
                                    connection.release(function (rerr) {
                                        if (asynErr) {
                                            console.error(data, asynErr);
                                            assert.fail('UNABLE TO CREATE DB POOL.');
                                        } else if (rerr) {
                                            console.error('release error: ', rerr);
                                        } else if (testPool) {
                                            cb(testPool);
                                        } else {
                                            oracledb.createPool(connAttrs, function (perr, newPool) {
                                                if (perr) {
                                                    console.error(perr);
                                                    assert.fail('UNABLE TO CREATE DB POOL.');
                                                } else {
                                                    testPool = newPool;
                                                    cb(testPool);
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            });
        };

        self.timeout(60000);

        describe('oracledb', function () {
            describe('getConnection', function () {
                it('promise', function (done) {
                    var table = 'TEST_ORA_CONN1';
                    initDB(table, null, function () {
                        oracledb.getConnection(connAttrs).then(function (connection) {
                            assert.isDefined(connection);

                            end(done, connection);
                        });
                    });
                });
            });
        });

        describe('pool', function () {
            describe('getConnection', function () {
                it('promise', function (done) {
                    var table = 'TEST_ORA_POOL1';
                    initDB(table, null, function (pool) {
                        pool.getConnection().then(function (connection) {
                            assert.isDefined(connection);

                            end(done, connection);
                        });
                    });
                });

                it('error', function (done) {
                    var table = 'TEST_ORA_POOL1';
                    initDB(table, null, function (pool) {
                        var sql = pool.poolAttributes.validationSQL;
                        pool.poolAttributes.validationSQL = 'SOME BAD SQL';
                        pool.getConnection(function (err, connection) {
                            assert.isDefined(err);

                            pool.poolAttributes.validationSQL = sql;

                            end(done, connection);
                        });
                    });
                });
            });

            describe('run', function () {
                it('query', function (done) {
                    var table = 'TEST_ORA_POOL2';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30
                        }
                    ], function (pool) {
                        pool.run(function (connection, callback) {
                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: false
                            }, callback);
                        }, function (error, jsRows) {
                            assert.isNull(error);
                            assert.deepEqual([
                                {
                                    COL1: 'PK1',
                                    COL2: 2,
                                    COL3: 30,
                                    COL4: undefined,
                                    LOB1: undefined,
                                    LOB2: undefined
                                },
                                {
                                    COL1: 'PK2',
                                    COL2: 200,
                                    COL3: 30,
                                    COL4: undefined,
                                    LOB1: undefined,
                                    LOB2: undefined
                                }
                            ], jsRows);

                            done();
                        });
                    });
                });
            });
        });

        describe('connection', function () {
            describe('promise', function () {
                it('query', function (done) {
                    var table = 'TEST_ORA_PRMS1';
                    initDB(table, null, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.execute('SELECT * FROM TEST_ORA_PRMS1').then(function (results) {
                                assert.isDefined(results);
                                assert.deepEqual(results.metaData, [
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

                                end(done, connection);
                            });
                        });
                    });
                });
            });

            describe('query', function () {
                it('error', function (done) {
                    var table = 'TEST_ORA_QRY1';
                    initDB(table, null, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT TEST1, TEST2 FROM TEST_TBL WHERE TEST3 = :value', {
                                value: 'valid'
                            }, function (error) {
                                assert.isDefined(error);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('rows - empty', function (done) {
                    var table = 'TEST_ORA_QRY2';
                    initDB(table, null, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('resultset - empty', function (done) {
                    var table = 'TEST_ORA_QRY3';
                    initDB(table, null, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: true
                            }, function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('rows - simple data', function (done) {
                    var table = 'TEST_ORA_QRY4';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123'
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30,
                            COL4: 'SOME TEST HERE'
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: false
                            }, function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([
                                    {
                                        COL1: 'PK1',
                                        COL2: 2,
                                        COL3: 30,
                                        COL4: '123',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    },
                                    {
                                        COL1: 'PK2',
                                        COL2: 200,
                                        COL3: 30,
                                        COL4: 'SOME TEST HERE',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    }
                                ], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('resultset - simple data', function (done) {
                    var table = 'TEST_ORA_QRY5';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123'
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30,
                            COL4: 'SOME TEST HERE'
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: true
                            }, function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([
                                    {
                                        COL1: 'PK1',
                                        COL2: 2,
                                        COL3: 30,
                                        COL4: '123',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    },
                                    {
                                        COL1: 'PK2',
                                        COL2: 200,
                                        COL3: 30,
                                        COL4: 'SOME TEST HERE',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    }
                                ], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('resultset - split', function (done) {
                    var table = 'TEST_ORA_QRY6';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123'
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30,
                            COL4: 'SOME TEST HERE'
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: true,
                                splitResults: true
                            }, function (error, jsRows) {
                                assert.isNull(error);

                                if (jsRows.length) {
                                    assert.deepEqual([
                                        {
                                            COL1: 'PK1',
                                            COL2: 2,
                                            COL3: 30,
                                            COL4: '123',
                                            LOB1: undefined,
                                            LOB2: undefined
                                        },
                                        {
                                            COL1: 'PK2',
                                            COL2: 200,
                                            COL3: 30,
                                            COL4: 'SOME TEST HERE',
                                            LOB1: undefined,
                                            LOB2: undefined
                                        }
                                    ], jsRows);
                                } else { //end of bulks
                                    end(done, connection);
                                }
                            });
                        });
                    });
                });

                it('resultset - stream', function (done) {
                    var table = 'TEST_ORA_QRY7';

                    var dbData = [];

                    var index;
                    for (index = 0; index < 100; index++) {
                        dbData.push({
                            COL1: 'PK' + index,
                            COL2: index,
                            COL3: index * 100,
                            COL4: 'MORE DATA HERE!!!',
                            LOB1: 'THIS IS SOME CLOB TEST TEXT: ' + index,
                            LOB2: new Buffer('BLOB - ' + index)
                        });
                    }

                    initDB(table, dbData, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT COUNT(*) count FROM ' + table, function (countError, countResults) {
                                assert.isNull(countError);
                                assert.equal(countResults[0].COUNT, 100);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL2', function (rowsError, rowsData) {
                                    assert.isNull(rowsError);
                                    assert.deepEqual(dbData, rowsData);

                                    var stream = connection.query('SELECT * FROM ' + table + ' ORDER BY COL2', [], {
                                        streamResults: true,
                                        bulkRowsAmount: 5
                                    });

                                    var eventCounter = 0;
                                    stream.on('data', function (row) {
                                        assert.deepEqual(dbData[eventCounter], row);
                                        eventCounter++;
                                    });

                                    stream.on('end', function () {
                                        assert.equal(eventCounter, dbData.length);

                                        end(done, connection);
                                    });
                                });
                            });
                        });
                    });
                });

                it('resultset - stream no callback', function (done) {
                    var table = 'TEST_ORA_QRY8';

                    var dbData = [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123'
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30,
                            COL4: 'SOME TEST HERE'
                        },
                        {
                            COL1: 'PK3',
                            COL2: 5000,
                            COL3: 1,
                            COL4: 'MORE DATA HERE!!!',
                            LOB1: 'THIS IS SOME CLOB TEST TEXT',
                            LOB2: new Buffer('BLOB - 123456')
                        }
                    ];

                    initDB(table, dbData, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            var stream = connection.query('SELECT * FROM ' + table, [], {
                                streamResults: true
                            });

                            var eventCounter = 0;
                            stream.on('data', function (row) {
                                assert.deepEqual(dbData[eventCounter], row);
                                eventCounter++;
                            });

                            stream.on('end', function () {
                                assert.equal(eventCounter, dbData.length);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('rows - lob data', function (done) {
                    var table = 'TEST_ORA_QRY9';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123',
                            LOB1: 'THIS IS SOME CLOB TEST TEXT',
                            LOB2: new Buffer('BLOB - 123456')
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: false
                            }, function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([
                                    {
                                        COL1: 'PK1',
                                        COL2: 2,
                                        COL3: 30,
                                        COL4: '123',
                                        LOB1: 'THIS IS SOME CLOB TEST TEXT',
                                        LOB2: new Buffer('BLOB - 123456')
                                    }
                                ], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('rows - simple data - extendedMetaData', function (done) {
                    var table = 'TEST_ORA_QRY10';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123'
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30,
                            COL4: 'SOME TEST HERE'
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: false,
                                extendedMetaData: true
                            }, function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([
                                    {
                                        COL1: 'PK1',
                                        COL2: 2,
                                        COL3: 30,
                                        COL4: '123',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    },
                                    {
                                        COL1: 'PK2',
                                        COL2: 200,
                                        COL3: 30,
                                        COL4: 'SOME TEST HERE',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    }
                                ], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('resultset - simple data - extendedMetaData', function (done) {
                    var table = 'TEST_ORA_QRY11';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123'
                        },
                        {
                            COL1: 'PK2',
                            COL2: 200,
                            COL3: 30,
                            COL4: 'SOME TEST HERE'
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.query('SELECT * FROM ' + table, [], {
                                resultSet: true,
                                extendedMetaData: true
                            }, function (error, jsRows) {
                                assert.isNull(error);
                                assert.deepEqual([
                                    {
                                        COL1: 'PK1',
                                        COL2: 2,
                                        COL3: 30,
                                        COL4: '123',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    },
                                    {
                                        COL1: 'PK2',
                                        COL2: 200,
                                        COL3: 30,
                                        COL4: 'SOME TEST HERE',
                                        LOB1: undefined,
                                        LOB2: undefined
                                    }
                                ], jsRows);

                                end(done, connection);
                            });
                        });
                    });
                });
            });

            describe('insert', function () {
                it('error', function (done) {
                    var table = 'TEST_ORA_INST1';
                    initDB(table, null, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('INSERT INTO TEST_NOTHING (SOMEFIELD), (:value)', {
                                value: 'valid'
                            }, {}, function (error) {
                                assert.isDefined(error);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('insert - simple data', function (done) {
                    var table = 'TEST_ORA_INST2';
                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('INSERT INTO ' + table + ' (COL1, COL2) values (:value1, :value2)', {
                                value1: 'test',
                                value2: 123
                            }, {}, function (error, results) {
                                assert.isNull(error);
                                assert.equal(1, results.rowsAffected);

                                connection.query('SELECT * FROM ' + table, [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: undefined,
                                            LOB2: undefined
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });

                it('insert - LOB data', function (done) {
                    var table = 'TEST_ORA_INST3';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', {
                                value1: 'test',
                                value2: 123,
                                clob1: longClobText,
                                blob2: new Buffer('blob text here')
                            }, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                }
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(1, results.rowsAffected);

                                connection.query('SELECT * FROM ' + table, [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });

                it('insert - returning info', function (done) {
                    var table = 'TEST_ORA_INST4';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('INSERT INTO ' + table + ' (COL1, LOB1, LOB2) values (:value1, EMPTY_CLOB(), EMPTY_BLOB())', {
                                value1: '123',
                                value2: {
                                    type: oracledb.NUMBER,
                                    dir: oracledb.BIND_OUT
                                },
                                clob1: longClobText,
                                blob2: new Buffer('blob text here')
                            }, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                },
                                returningInfo: {
                                    COL2: 'value2'
                                }
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(1, results.rowsAffected);

                                connection.query('SELECT * FROM ' + table, [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: '123',
                                            COL2: undefined,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });

            describe('update', function () {
                it('error', function (done) {
                    var table = 'TEST_ORA_UDT1';
                    initDB(table, null, function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('UPDATE TEST_NOTHING SET SOMEFIELD = 1', {
                                value: 'valid'
                            }, {}, function (error) {
                                assert.isDefined(error);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('update - simple data', function (done) {
                    var table = 'TEST_ORA_UDT2';
                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('INSERT INTO ' + table + ' (COL1, COL2) values (:value1, :value2)', {
                                value1: 'test',
                                value2: 123
                            }, {}, function (error1, results1) {
                                assert.isNull(error1);
                                assert.equal(1, results1.rowsAffected);

                                connection.insert('INSERT INTO ' + table + ' (COL1, COL2) values (:value1, :value2)', {
                                    value1: 'test2',
                                    value2: 234
                                }, {}, function (error2, results2) {
                                    assert.isNull(error2);
                                    assert.equal(1, results2.rowsAffected);

                                    connection.query('SELECT * FROM ' + table, [], {
                                        resultSet: false
                                    }, function (queryError, jsRows) {
                                        assert.isNull(queryError);
                                        assert.deepEqual([
                                            {
                                                COL1: 'test',
                                                COL2: 123,
                                                COL3: undefined,
                                                COL4: undefined,
                                                LOB1: undefined,
                                                LOB2: undefined
                                            },
                                            {
                                                COL1: 'test2',
                                                COL2: 234,
                                                COL3: undefined,
                                                COL4: undefined,
                                                LOB1: undefined,
                                                LOB2: undefined
                                            }
                                        ], jsRows);

                                        connection.update('UPDATE ' + table + ' SET COL3 = :newcol1 WHERE COL2 > :value', {
                                            newcol1: 1000,
                                            value: 5
                                        }, {}, function onUpdate(updateError, updateResults) {
                                            assert.isNull(updateError);
                                            assert.isDefined(updateResults);

                                            connection.query('SELECT * FROM ' + table, [], {
                                                resultSet: false
                                            }, function (queryError2, jsRows2) {
                                                assert.isNull(queryError2);
                                                assert.deepEqual([
                                                    {
                                                        COL1: 'test',
                                                        COL2: 123,
                                                        COL3: 1000,
                                                        COL4: undefined,
                                                        LOB1: undefined,
                                                        LOB2: undefined
                                                    },
                                                    {
                                                        COL1: 'test2',
                                                        COL2: 234,
                                                        COL3: 1000,
                                                        COL4: undefined,
                                                        LOB1: undefined,
                                                        LOB2: undefined
                                                    }
                                                ], jsRows2);

                                                end(done, connection);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                it('update - LOB data', function (done) {
                    var table = 'TEST_ORA_UPDT3';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', {
                                value1: 'test',
                                value2: 123,
                                clob1: longClobText,
                                blob2: new Buffer('blob text here')
                            }, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                }
                            }, function (error1, results1) {
                                assert.isNull(error1);
                                assert.equal(1, results1.rowsAffected);

                                connection.insert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, :clob1, :blob2)', {
                                    value1: 'test2',
                                    value2: 333,
                                    clob1: longClobText,
                                    blob2: new Buffer('second blob text here')
                                }, {}, function (error2, results2) {
                                    assert.isNull(error2);
                                    assert.equal(1, results2.rowsAffected);

                                    connection.query('SELECT * FROM ' + table, [], {
                                        resultSet: false
                                    }, function (queryError, jsRows) {
                                        assert.isNull(queryError);
                                        assert.deepEqual([
                                            {
                                                COL1: 'test',
                                                COL2: 123,
                                                COL3: undefined,
                                                COL4: undefined,
                                                LOB1: longClobText,
                                                LOB2: new Buffer('blob text here')
                                            },
                                            {
                                                COL1: 'test2',
                                                COL2: 333,
                                                COL3: undefined,
                                                COL4: undefined,
                                                LOB1: longClobText,
                                                LOB2: new Buffer('second blob text here')
                                            }
                                        ], jsRows);

                                        connection.update('UPDATE ' + table + ' SET COL3 = :newcol1, LOB1 = EMPTY_CLOB() WHERE COL2 > :value', {
                                            newcol1: 7777,
                                            newclob1: 'NEW CLOB TEXT VALUE',
                                            value: 5
                                        }, {
                                            lobMetaInfo: {
                                                LOB1: 'newclob1'
                                            }
                                        }, function onUpdate(updateError, updateResults) {
                                            assert.isNull(updateError);
                                            assert.isDefined(updateResults);

                                            connection.query('SELECT * FROM ' + table, [], {
                                                resultSet: false
                                            }, function (queryError2, jsRows2) {
                                                assert.isNull(queryError2);
                                                assert.deepEqual([
                                                    {
                                                        COL1: 'test',
                                                        COL2: 123,
                                                        COL3: 7777,
                                                        COL4: undefined,
                                                        LOB1: 'NEW CLOB TEXT VALUE',
                                                        LOB2: new Buffer('blob text here')
                                                    },
                                                    {
                                                        COL1: 'test2',
                                                        COL2: 333,
                                                        COL3: 7777,
                                                        COL4: undefined,
                                                        LOB1: 'NEW CLOB TEXT VALUE',
                                                        LOB2: new Buffer('second blob text here')
                                                    }
                                                ], jsRows2);

                                                end(done, connection);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

            describe('queryJSON', function () {
                it('single row', function (done) {
                    var table = 'TEST_ORA_JSON1';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123',
                            LOB1: JSON.stringify({
                                json: true,
                                oracle: true,
                                text: 'test',
                                subObj: {
                                    array: [1, 2, 3, '4']
                                }
                            })
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.queryJSON('SELECT LOB1 FROM ' + table, function (error, results) {
                                assert.isNull(error);
                                assert.equal(results.rowCount, 1);
                                assert.deepEqual({
                                    json: true,
                                    oracle: true,
                                    text: 'test',
                                    subObj: {
                                        array: [1, 2, 3, '4']
                                    }
                                }, results.json);

                                end(done, connection);
                            });
                        });
                    });
                });

                it('multiple row', function (done) {
                    var table = 'TEST_ORA_JSON1';
                    initDB(table, [
                        {
                            COL1: 'PK1',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123',
                            LOB1: JSON.stringify({
                                json: true,
                                oracle: true,
                                text: 'test',
                                subObj: {
                                    array: [1, 2, 3, '4']
                                }
                            })
                        },
                        {
                            COL1: 'PK2',
                            COL2: 2,
                            COL3: 30,
                            COL4: '123',
                            LOB1: JSON.stringify({
                                json: 100,
                                oracle: 'oracledb',
                                text: 'test',
                                subObj: {
                                    array: [1, 2, 3, '4', {
                                        works: 'yes'
                                    }]
                                }
                            })
                        }
                    ], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.queryJSON('SELECT LOB1 FROM ' + table, function (error, results) {
                                assert.isNull(error);
                                assert.equal(results.rowCount, 2);
                                assert.deepEqual([
                                    {
                                        json: true,
                                        oracle: true,
                                        text: 'test',
                                        subObj: {
                                            array: [1, 2, 3, '4']
                                        }
                                    },
                                    {
                                        json: 100,
                                        oracle: 'oracledb',
                                        text: 'test',
                                        subObj: {
                                            array: [1, 2, 3, '4', {
                                                works: 'yes'
                                            }]
                                        }
                                    }
                                ], results.json);

                                end(done, connection);
                            });
                        });
                    });
                });
            });

            describe('batchInsert', function () {
                it('batchInsert - LOB data', function (done) {
                    var table = 'TEST_ORA_BTCH_INST1';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                {
                                    value1: 'test',
                                    value2: 123,
                                    clob1: longClobText,
                                    blob2: new Buffer('blob text here')
                                },
                                {
                                    value1: 'test2',
                                    value2: 455,
                                    clob1: longClobText,
                                    blob2: new Buffer('second row')
                                }
                            ], {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                }
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(2, results.length);
                                assert.equal(1, results[0].rowsAffected);
                                assert.equal(1, results[1].rowsAffected);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        },
                                        {
                                            COL1: 'test2',
                                            COL2: 455,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('second row')
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });

                it('batchInsert - arrays', function (done) {
                    var table = 'TEST_ORA_BTCH_INST2';

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2) values (:0, :1)', [
                                ['test', 123],
                                ['test2', 455]
                            ], {
                                autoCommit: true
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(2, results.length);
                                assert.equal(1, results[0].rowsAffected);
                                assert.equal(1, results[1].rowsAffected);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: undefined,
                                            LOB2: undefined
                                        },
                                        {
                                            COL1: 'test2',
                                            COL2: 455,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: undefined,
                                            LOB2: undefined
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });

            describe('batchUpdate', function () {
                it('batchUpdate - LOB data', function (done) {
                    var table = 'TEST_ORA_BTCH_UPD1';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                {
                                    value1: 'test',
                                    value2: 123,
                                    clob1: longClobText,
                                    blob2: new Buffer('blob text here')
                                },
                                {
                                    value1: 'test2',
                                    value2: 455,
                                    clob1: longClobText,
                                    blob2: new Buffer('second row')
                                }
                            ], {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                }
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(2, results.length);
                                assert.equal(1, results[0].rowsAffected);
                                assert.equal(1, results[1].rowsAffected);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        },
                                        {
                                            COL1: 'test2',
                                            COL2: 455,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('second row')
                                        }
                                    ], jsRows);

                                    connection.batchUpdate('UPDATE ' + table + ' SET COL1 = :value1, LOB1 = EMPTY_CLOB(), LOB2 = EMPTY_BLOB() WHERE COL2 = :value2', [
                                        {
                                            value1: 'testU1',
                                            value2: 123,
                                            clob1: 'NEW CLOB1',
                                            blob2: new Buffer('NEW BLOB')
                                        },
                                        {
                                            value1: 'testU2',
                                            value2: 455,
                                            clob1: 'NEW CLOB2',
                                            blob2: new Buffer('AND ANOTHER NEW BLOB')
                                        }
                                    ], {
                                        autoCommit: true,
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, function (updateError, updateResults) {
                                        assert.isNull(updateError);
                                        assert.equal(2, updateResults.length);
                                        assert.equal(1, updateResults[0].rowsAffected);
                                        assert.equal(1, updateResults[1].rowsAffected);

                                        connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                            resultSet: false
                                        }, function (queryError, jsRows) {
                                            assert.isNull(queryError);
                                            assert.deepEqual([
                                                {
                                                    COL1: 'testU1',
                                                    COL2: 123,
                                                    COL3: undefined,
                                                    COL4: undefined,
                                                    LOB1: 'NEW CLOB1',
                                                    LOB2: new Buffer('NEW BLOB')
                                                },
                                                {
                                                    COL1: 'testU2',
                                                    COL2: 455,
                                                    COL3: undefined,
                                                    COL4: undefined,
                                                    LOB1: 'NEW CLOB2',
                                                    LOB2: new Buffer('AND ANOTHER NEW BLOB')
                                                }
                                            ], jsRows);

                                            end(done, connection);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

            describe('transaction', function () {
                it('multiple actions', function (done) {
                    var table = 'TEST_ORA_TRNS1';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.transaction([
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'test',
                                            value2: 123,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'test2',
                                            value2: 455,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                },
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'testI2',
                                            value2: 1000,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'testI3',
                                            value2: 2000,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                }
                            ], function (transactionError) {
                                assert.isNull(transactionError);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        },
                                        {
                                            COL1: 'test2',
                                            COL2: 455,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('second row')
                                        },
                                        {
                                            COL1: 'testI2',
                                            COL2: 1000,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        },
                                        {
                                            COL1: 'testI3',
                                            COL2: 2000,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('second row')
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });

                it('error in action', function (done) {
                    var table = 'TEST_ORA_TRNS2';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.transaction([
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'test',
                                            value2: 123,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'test2',
                                            value2: 455,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        },
                                        autoCommit: true
                                    }, cb);
                                },
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'testI2',
                                            value2: 1000,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'testI3',
                                            value2: 2000,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                },
                                function (cb) {
                                    setTimeout(function () {
                                        cb(new Error('test error'));
                                    }, 250);
                                }
                            ], function (transactionError) {
                                assert.isDefined(transactionError);
                                assert.equal(transactionError.message, 'test error');

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.equal(jsRows.length, 0);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });

            describe('run', function () {
                it('multiple actions', function (done) {
                    var table = 'TEST_ORA_RUN1';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.run([
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'test',
                                            value2: 123,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'test2',
                                            value2: 455,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        autoCommit: true,
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                },
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'testI2',
                                            value2: 1000,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'testI3',
                                            value2: 2000,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        autoCommit: true,
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                }
                            ], function (actionsError) {
                                assert.isNull(actionsError);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.deepEqual([
                                        {
                                            COL1: 'test',
                                            COL2: 123,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        },
                                        {
                                            COL1: 'test2',
                                            COL2: 455,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('second row')
                                        },
                                        {
                                            COL1: 'testI2',
                                            COL2: 1000,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        },
                                        {
                                            COL1: 'testI3',
                                            COL2: 2000,
                                            COL3: undefined,
                                            COL4: undefined,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('second row')
                                        }
                                    ], jsRows);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });

                it('error in action', function (done) {
                    var table = 'TEST_ORA_RUN2';

                    var longClobText = 'this is a really long line of test data\n';
                    var index;
                    var buffer = [];
                    for (index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.run([
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'test',
                                            value2: 123,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'test2',
                                            value2: 455,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        autoCommit: false,
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                },
                                function (cb) {
                                    connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', [
                                        {
                                            value1: 'testI2',
                                            value2: 1000,
                                            clob1: longClobText,
                                            blob2: new Buffer('blob text here')
                                        },
                                        {
                                            value1: 'testI3',
                                            value2: 2000,
                                            clob1: longClobText,
                                            blob2: new Buffer('second row')
                                        }
                                    ], {
                                        autoCommit: false,
                                        lobMetaInfo: {
                                            LOB1: 'clob1',
                                            LOB2: 'blob2'
                                        }
                                    }, cb);
                                },
                                function (cb) {
                                    setTimeout(function () {
                                        cb(new Error('test error'));
                                    }, 250);
                                },
                                function (cb) {
                                    connection.commit(cb);
                                }
                            ], {
                                sequence: true
                            }, function (actionsError) {
                                assert.isDefined(actionsError);
                                assert.equal(actionsError.message, 'test error');

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL1 ASC', [], {
                                    resultSet: false
                                }, function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.equal(jsRows.length, 0);

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });
        });
    }
});
