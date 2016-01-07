'use strict';

var rowsReader = require('./rows-reader');

/*jslint debug: true */
/**
 * ResultSet object reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @class ResultSetReader
 * @public
 */
function ResultSetReader() {
    //should not be called
}
/*jslint debug: false */

/**
 * Reads the next rows data from the provided oracle ResultSet object.
 *
 * @function
 * @memberof! ResultSetReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} resultSet - The oracle ResultSet object
 * @param {object} [options] - Any options
 * @param {number} [options.bulkRowsAmount=100] - The amount of rows to fetch
 * @param {AsyncCallback} callback - called when the next rows have been read
 */
ResultSetReader.prototype.readNextRows = function (columnNames, resultSet, options, callback) {
    var bulkRowsAmount = 100;

    if (arguments.length === 3) {
        callback = options;
        options = null;
    } else if (options) {
        bulkRowsAmount = options.bulkRowsAmount || bulkRowsAmount;
    }

    resultSet.getRows(bulkRowsAmount, function onRows(error, rows) {
        if (error) {
            callback(error);
        } else if ((!rows) || (rows.length === 0)) {
            callback(null, []);
        } else if (rows.length > 0) {
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
 * @param {object} options - Any options
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

            process.nextTick(function fetchNextRows() {
                self.readAllRows(columnNames, resultSet, options, callback, jsRowsBuffer);
            });
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
 * @param {object} options - Any options
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
 * @param {object} options - Any options
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
 * @param {ResultSetReadStream} stream - The stream used to read the results from
 */
ResultSetReader.prototype.stream = function (columnNames, resultSet, stream) {
    var self = this;

    var readOptions = {
        bulkRowsAmount: 1
    };

    //create new read stream
    /**
     * Reads the next rows from the resultset and pushes via events.
     *
     * @function
     * @memberof! ResultSetReadStream
     * @alias ResultSetReadStream.nextRow
     * @private
     * @param {function} streamCallback - The callback function
     */
    stream.nextRow = function readNextRow(streamCallback) {
        self.readNextRows(columnNames, resultSet, readOptions, streamCallback);
    };
};

module.exports = new ResultSetReader();
