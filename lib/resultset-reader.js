'use strict';

var debug = require('debuglog')('simple-oracledb');
var rowsReader = require('./rows-reader');

/*jslint debug: true */
/**
 * ResultSet object reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @class ResultSetReader
 * @private
 */
function ResultSetReader() {
    //should not be called
}
/*jslint debug: false */

/**
 * Releases the resultset.
 *
 * @function
 * @memberof! ResultSetReader
 * @private
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {Boolean} ignoreErrors - True to ignore errors
 * @param {AsyncCallback} callback - called when the result set is released
 */
ResultSetReader.prototype.releaseResultSet = function (resultSet, ignoreErrors, callback) {
    if (resultSet) {
        resultSet.close(function onClose(error) {
            if (error && (!ignoreErrors)) {
                callback(error);
            } else {
                if (error) {
                    debug('Unable to close resultset, ', error.stack);
                }

                callback();
            }
        });
    } else {
        callback();
    }
};

/**
 * Reads the next rows data from the provided oracle ResultSet object.
 *
 * @function
 * @memberof! ResultSetReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {Object} [options] - Any options
 * @param {Number} [options.bulkRowsAmount=100] - The amount of rows to fetch
 * @param {Number} [options.flattenStackEveryRows=Math.max(1, Math.floor(100 / columnNames.length))] - The amount of rows after which the JS stack is flattened, low number can result in performance impact, high number can result in stack overflow error
 * @param {AsyncCallback} callback - called when the next rows have been read
 */
ResultSetReader.prototype.readNextRows = function (columnNames, resultSet, options, callback) {
    var self = this;
    var bulkRowsAmount = 100;

    if (arguments.length === 3) {
        callback = options;
        options = null;
    } else if (options) {
        bulkRowsAmount = options.bulkRowsAmount || bulkRowsAmount;
    }

    resultSet.getRows(bulkRowsAmount, function onRows(error, rows) {
        if (error) {
            self.releaseResultSet(resultSet, true, function onClose() {
                callback(error);
            });
        } else if ((!rows) || (rows.length === 0)) {
            self.releaseResultSet(resultSet, false, function onClose(releaseError) {
                callback(releaseError, []);
            });
        } else {
            rowsReader.read(columnNames, rows, callback);
        }
    });
};

/**
 * Reads all data from the provided oracle ResultSet object into the provided buffer.
 *
 * @function
 * @memberof! ResultSetReader
 * @private
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {Object} options - Any options
 * @param {Number} [options.bulkRowsAmount=100] - The amount of rows to fetch
 * @param {Number} [options.flattenStackEveryRows] - The amount of rows after which the JS stack is flattened, low number can result in performance impact, high number can result in stack overflow error
 * @param {AsyncCallback} callback - called when all rows are fully read or in case of an error
 * @param {Array} [jsRowsBuffer] - The result buffer, if not provided, the callback will be called for each bulk
 */
ResultSetReader.prototype.readAllRows = function (columnNames, resultSet, options, callback, jsRowsBuffer) {
    var self = this;

    self.readNextRows(columnNames, resultSet, options, function onNextRows(error, jsRows) {
        if (error) {
            callback(error);
        } else if (jsRows && jsRows.length) {
            if (jsRowsBuffer) {
                Array.prototype.push.apply(jsRowsBuffer, jsRows);
            } else { //split results
                callback(null, jsRows);
            }

            self.readAllRows(columnNames, resultSet, options, callback, jsRowsBuffer);
        } else {
            var lastResult = jsRowsBuffer || [];
            callback(null, lastResult);
        }
    });
};

/**
 * Reads all data from the provided oracle ResultSet object.
 *
 * @function
 * @memberof! ResultSetReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {Object} options - Any options
 * @param {AsyncCallback} callback - called when all rows are fully read or in case of an error
 */
ResultSetReader.prototype.readFully = function (columnNames, resultSet, options, callback) {
    this.readAllRows(columnNames, resultSet, options, callback, []);
};

/**
 * Reads all data from the provided oracle ResultSet object to the callback in bulks.<br>
 * The last callback call will have an empty result.
 *
 * @function
 * @memberof! ResultSetReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {Object} options - Any options
 * @param {AsyncCallback} callback - called for each read bulk of rows or in case of an error
 */
ResultSetReader.prototype.readBulks = function (columnNames, resultSet, options, callback) {
    this.readAllRows(columnNames, resultSet, options, callback);
};

/**
 * Reads all data from the provided oracle ResultSet object to the callback in bulks.<br>
 * The last callback call will have an empty result.
 *
 * @function
 * @memberof! ResultSetReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {Object} [options] - Any options
 * @param {ResultSetReadStream} stream - The stream used to read the results from
 */
ResultSetReader.prototype.stream = function (columnNames, resultSet, options, stream) {
    var self = this;

    if (!stream) {
        stream = options;
        options = null;
    }

    options = options || {};

    var rowsData;

    stream.metaData = columnNames;

    /*eslint-disable func-name-matching*/
    /**
     * Reads the next rows from the resultset and pushes via events.
     *
     * @function
     * @memberof! ResultSetReadStream
     * @alias ResultSetReadStream.nextRow
     * @variation 1
     * @private
     * @param {function} streamCallback - The callback function
     */
    stream.nextRow = function readNextRow(streamCallback) {
        if (!stream.closed) {
            if (rowsData && rowsData.length) {
                streamCallback(null, rowsData.shift());
            } else {
                self.readNextRows(columnNames, resultSet, options, function onRead(error, rows) {
                    var rowData;
                    if (!error) {
                        rowsData = rows;

                        if (rowsData && rowsData.length) {
                            rowData = rowsData.shift();
                        }
                    }

                    streamCallback(error, rowData);
                });
            }
        }
    };
    /*eslint-enable func-name-matching*/
};

module.exports = new ResultSetReader();
