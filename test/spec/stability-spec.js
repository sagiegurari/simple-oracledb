'use strict';

const chai = require('chai');
const assert = chai.assert;
const integrationHelper = require('../helpers/integration-helper');
const utils = require('../helpers/utils');

if (process.env.TEST_STABILITY) {
    integrationHelper(function (oracledb, connAttrs, initDB, end) {
        if (oracledb && connAttrs && initDB && end) {
            describe('Stability Tests', function () {
                const self = this;

                self.timeout(600000);

                it('batchInsert and query - LOB data', function (done) {
                    const table = 'TEST_ORA_STB1';

                    let longClobText = 'this is a really long line of test data\n';
                    const buffer = [];
                    for (let index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            const rowData = [];
                            for (let index = 0; index < 100; index++) {
                                rowData.push({
                                    value1: 'test' + index,
                                    value2: index,
                                    clob1: longClobText,
                                    blob2: utils.createBuffer('blob text here')
                                });
                            }

                            connection.batchInsert('INSERT INTO ' + table + ' (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())', rowData, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                }
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(rowData.length, results.length);
                                assert.equal(1, results[0].rowsAffected);

                                connection.query('SELECT * FROM ' + table + ' ORDER BY COL2 ASC', function (queryError, jsRows) {
                                    assert.isNull(queryError);
                                    assert.equal(jsRows.length, rowData.length);

                                    for (let index = 0; index < 100; index++) {
                                        assert.deepEqual({
                                            COL1: 'test' + index,
                                            COL2: index,
                                            COL3: null,
                                            COL4: null,
                                            LOB1: longClobText,
                                            LOB2: utils.createBuffer('blob text here')
                                        }, jsRows[index]);
                                    }

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });

                it('update - LOB data', function (done) {
                    const table = 'TEST_ORA_STB2';

                    let longClobText = 'this is a really long line of test data\n';
                    const buffer = [];
                    for (let index = 0; index < 1000; index++) {
                        buffer.push(longClobText);
                    }
                    longClobText = buffer.join('');

                    initDB(table, [], function (pool) {
                        pool.getConnection(function (err, connection) {
                            assert.isNull(err);

                            connection.insert(`INSERT INTO ${table} (COL1, COL2, LOB1, LOB2) values (:value1, :value2, EMPTY_CLOB(), EMPTY_BLOB())`, {
                                value1: 'test',
                                value2: 123,
                                clob1: longClobText,
                                blob2: utils.createBuffer('blob text here')
                            }, {
                                autoCommit: true,
                                lobMetaInfo: {
                                    LOB1: 'clob1',
                                    LOB2: 'blob2'
                                }
                            }, function (error, results) {
                                assert.isNull(error);
                                assert.equal(1, results.rowsAffected);

                                connection.release(() => {
                                    pool.run(function (runConnection, cb) {
                                        runConnection.update(`UPDATE ${table} SET LOB1 = EMPTY_CLOB() WHERE COL1 = :value1`, {
                                            newclob1: 'NEW CLOB TEXT VALUE',
                                            value1: 'test',
                                        }, {
                                            autoCommit: true,
                                            lobMetaInfo: {
                                                LOB1: 'newclob1'
                                            }
                                        }, cb);
                                    }, function onUpdate(updateError, updateResults) {
                                        assert.isNull(updateError);
                                        assert.isDefined(updateResults);

                                        pool.run(function (runConnection, cb) {
                                            runConnection.query(`SELECT * FROM ${table}`, [], {
                                                resultSet: false
                                            }, cb);
                                        }, function (queryError, jsRows) {
                                            assert.isNull(queryError);
                                            assert.deepEqual([
                                                {
                                                    COL1: 'test',
                                                    COL2: 123,
                                                    COL3: null,
                                                    COL4: null,
                                                    LOB1: 'NEW CLOB TEXT VALUE',
                                                    LOB2: utils.createBuffer('blob text here')
                                                }
                                            ], jsRows);

                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    });
}
