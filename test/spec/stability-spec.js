'use strict';

/*global describe: false, it: false*/

var chai = require('chai');
var assert = chai.assert;
var integrationHelper = require('../helpers/integration-helper');

if (process.env.TEST_STABILITY) {
    integrationHelper(function (oracledb, connAttrs, initDB, end) {
        if (oracledb && connAttrs && initDB && end) {
            describe('Stability Tests', function () {
                var self = this;

                self.timeout(600000);

                it('batchInsert and query - LOB data', function (done) {
                    var table = 'TEST_ORA_STB1';

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

                            var rowData = [];
                            for (index = 0; index < 100; index++) {
                                rowData.push({
                                    value1: 'test' + index,
                                    value2: index,
                                    clob1: longClobText,
                                    blob2: new Buffer('blob text here')
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

                                    for (index = 0; index < 100; index++) {
                                        assert.deepEqual({
                                            COL1: 'test' + index,
                                            COL2: index,
                                            COL3: null,
                                            COL4: null,
                                            LOB1: longClobText,
                                            LOB2: new Buffer('blob text here')
                                        }, jsRows[index]);
                                    }

                                    end(done, connection);
                                });
                            });
                        });
                    });
                });
            });
        }
    });
}
