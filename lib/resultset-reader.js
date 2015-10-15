'use strict';

var rowsReader = require('./rows-reader');

/**
 * ResultSet object reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @namespace ResultSetReader
 */
module.exports = {
    /**
     * Reads the next rows data from the provided oracle ResultSet object.
     *
     * @function
     * @memberof! ResultSetReader
     * @private
     * @param {Array} columnNames - Array of strings holding the column names of the results
     * @param {Array} resultSet - The oracle ResultSet object
     * @param {AsyncCallback} callback - called when the next rows have been read
     */
    readNextRows: function readNextRows(columnNames, resultSet, callback) {
        resultSet.getRows(100, function onRows(error, rows) {
            if (error) {
                callback(error);
            } else if ((!rows) || (rows.length === 0)) {
                callback(null, []);
            } else if (rows.length > 0) {
                rowsReader.read(columnNames, rows, callback);
            }
        });
    },
    /**
     * Reads all data from the provided oracle ResultSet object into the provided buffer.
     *
     * @function
     * @memberof! ResultSetReader
     * @private
     * @param {Array} columnNames - Array of strings holding the column names of the results
     * @param {Array} resultSet - The oracle ResultSet object
     * @param {AsyncCallback} callback - called when all rows are fully read or in case of an error
     * @param {Array} jsRowsBuffer - The result buffer
     */
    readAllRows: function readNextRows(columnNames, resultSet, callback, jsRowsBuffer) {
        var self = this;

        self.readNextRows(columnNames, resultSet, function onNextRows(error, jsRows) {
            if (error) {
                callback(error);
            } else if (jsRows && jsRows.length) {
                Array.prototype.push.apply(jsRowsBuffer, jsRows);

                process.nextTick(function fetchNextRows() {
                    self.readAllRows(columnNames, resultSet, callback, jsRowsBuffer);
                });
            } else {
                callback(null, jsRowsBuffer);
            }
        });
    },
    /**
     * Reads all data from the provided oracle ResultSet object.
     *
     * @function
     * @memberof! ResultSetReader
     * @public
     * @param {Array} columnNames - Array of strings holding the column names of the results
     * @param {Array} resultSet - The oracle ResultSet object
     * @param {AsyncCallback} callback - called when all rows are fully read or in case of an error
     */
    read: function read(columnNames, resultSet, callback) {
        this.readAllRows(columnNames, resultSet, callback, []);
    }
};
