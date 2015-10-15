'use strict';

var async = require('async');
var recordReader = require('./record-reader');

/**
 * Rows array reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @namespace RowsReader
 */
module.exports = {
    /**
     * Reads all data from the provided oracle records array.
     *
     * @function
     * @memberof! RowsReader
     * @public
     * @param {Array} columnNames - Array of strings holding the column names of the results
     * @param {Array} rows - The oracle rows array
     * @param {AsyncCallback} callback - called when all rows are fully read or in case of an error
     */
    read: function read(columnNames, rows, callback) {
        var jsRows = [];

        if (rows && rows.length) {
            var functions = [];

            rows.forEach(function handleRow(row, index) {
                functions.push(function callRecordReader(asyncCallback) {
                    recordReader.read(columnNames, row, function (error, jsObject) {
                        if (error) {
                            asyncCallback(error);
                        } else {
                            jsRows[index] = jsObject;
                            asyncCallback(null, jsRows);
                        }
                    });
                });
            });

            async.parallel(functions, function onAyncDone(error) {
                callback(error, jsRows);
            });
        } else {
            callback(null, jsRows);
        }
    }
};
