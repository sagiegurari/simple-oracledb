'use strict';

const asyncLib = require('async');
const chai = require('chai');
const assert = chai.assert;

module.exports = function (setup) {
    let integrated = true;
    const connAttrs = {
        user: process.env.TEST_ORACLE_USER,
        password: process.env.TEST_ORACLE_PASSWORD,
        connectString: process.env.TEST_ORACLE_CONNECTION_STRING
    };

    if ((!connAttrs.user) || (!connAttrs.password) || (!connAttrs.connectString)) {
        integrated = false;
    }

    if (!integrated) {
        setup();
    } else {
        const oracledb = require('oracledb');

        oracledb.autoCommit = true;

        const simpleOracleDB = require('../../');
        simpleOracleDB.extend(oracledb);

        const end = function (done, connection) {
            if (connection) {
                connection.release();
            }

            setTimeout(done, 10);
        };

        let testPool;
        const initDB = function (tableName, data, cb) {
            oracledb.getConnection(connAttrs, function (connErr, connection) {
                data = data || [];

                if (connErr) {
                    console.error(connErr);
                    setTimeout(function () {
                        assert.fail('UNABLE TO OPEN DB CONNECTION.');
                    }, 100);
                } else {
                    connection.execute('DROP TABLE ' + tableName, [], function () {
                        connection.execute('CREATE TABLE ' + tableName + ' (COL1 constCHAR2(250) PRIMARY KEY, COL2 NUMBER, COL3 NUMBER, COL4 constCHAR2(250), LOB1 CLOB, LOB2 BLOB)', [], function (createError) {
                            if (createError) {
                                console.error(createError);
                                assert.fail('UNABLE TO CREATE DB TABLE: ' + tableName);
                            } else {
                                const func = [];
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

        setup(oracledb, connAttrs, initDB, end);
    }
};
