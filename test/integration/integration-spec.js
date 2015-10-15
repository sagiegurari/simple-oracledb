'use strict';
/*global describe: false, it: false */

var asyncLib = require('async');
var chai = require('chai');
var assert = chai.assert;

describe('Integration Tests', function () {
    var oracledb;
    var integrated = true;
    try {
        oracledb = require('oracledb');} catch (error) {
        integrated = false;
    }

    var connAttrs = {};
    if (integrated && oracledb) {
        if (integrated) {
            connAttrs.user = process.env.TEST_ORACLE_USER;
            connAttrs.password = process.env.TEST_ORACLE_PASSWORD;
            connAttrs.connectString = process.env.TEST_ORACLE_CONNECTION_STRING;

            if ((!connAttrs.user) || (!connAttrs.password) || (!connAttrs.connectString)) {
                integrated = false;
            }
        }
    }

    if (integrated) {
        oracledb.autoCommit = true;

        var simpleOracleDB = require('../../');
        simpleOracleDB.extend(oracledb);

        var end = function (done, connection) {
            if (connection) {
                connection.release();
            }

            setTimeout(done, 10);
        };

        var pool;
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
                                        })
                                    });
                                });

                                asyncLib.series(func, function (asynErr) {
                                    connection.release(function (rerr) {
                                        if (asynErr) {
                                            console.error(err);
                                            assert.fail('UNABLE TO CREATE DB POOL.');
                                        } else if (rerr) {
                                            console.error('release error: ', rerr);
                                        } else {
                                            if (pool) {
                                                cb(pool);
                                            } else {
                                                oracledb.createPool(connAttrs, function (perr, newPool) {
                                                    if (perr) {
                                                        console.error(perr);
                                                        assert.fail('UNABLE TO CREATE DB POOL.');
                                                    } else {
                                                        pool = newPool;
                                                        cb(pool)
                                                    }
                                                });
                                            }
                                        }
                                    });
                                })
                            }
                        });
                    });
                }
            });
        };

        describe('query', function () {
            var columnNames = [
                {
                    name: 'COL1'
                },
                {
                    name: 'COL2'
                }, {
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

            it('error', function (done) {
                var table = 'TEST_ORA1';
                initDB(table, null, function (pool) {
                    pool.getConnection(function (err, connection) {
                        assert.isUndefined(err);

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
                var table = 'TEST_ORA2';
                initDB(table, null, function (pool) {
                    pool.getConnection(function (err, connection) {
                        assert.isUndefined(err);

                        connection.query('SELECT * FROM ' + table, [], function (error, jsRows) {
                            assert.isNull(error);
                            assert.deepEqual([], jsRows);

                            end(done, connection);
                        });
                    });
                });
            });

            it('resultset - empty', function (done) {
                var table = 'TEST_ORA3';
                initDB(table, null, function (pool) {
                    pool.getConnection(function (err, connection) {
                        assert.isUndefined(err);

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
                var table = 'TEST_ORA4';
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
                        assert.isUndefined(err);

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
                var table = 'TEST_ORA5';
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
                        assert.isUndefined(err);

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

            it('rows - lob data', function (done) {
                var table = 'TEST_ORA6';
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
                        assert.isUndefined(err);

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
        });
    }
});
