'use strict';

var asyncLib = require('async');
var recordReader = require('./record-reader');
var constants = require('./constants');

/*jslint debug: true */
/**
 * Rows array reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @class RowsReader
 * @private
 */
function RowsReader() {
    //should not be called
}
/*jslint debug: false */

/**
 * Reads all data from the provided oracle records array.
 *
 * @function
 * @memberof! RowsReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {Array} row - The row to read
 * @param {number} index - The row index
 * @param {Array} jsRows - The rows output holder
 * @returns {function} The handler function
 */
RowsReader.prototype.createRecordHandler = function (columnNames, row, index, jsRows) {
    return function callRecordReader(asyncCallback) {
        recordReader.read(columnNames, row, function onRowRead(error, jsObject) {
            //ensure async to prevent max stack size error
            var orgAsyncCallback = asyncCallback;
            asyncCallback = function onCallback(rowError, data) {
                setImmediate(function invokeCallback() {
                    orgAsyncCallback(rowError, data);
                });
            };

            if (error) {
                asyncCallback(error);
            } else {
                jsRows[index] = jsObject;
                asyncCallback(null, jsRows);
            }
        });
    };
};

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
RowsReader.prototype.read = function (columnNames, rows, callback) {
    var jsRows = [];

    if (rows && rows.length) {
        var functions = [];

        var index;
        for (index = 0; index < rows.length; index++) {
            functions.push(this.createRecordHandler(columnNames, rows[index], index, jsRows));
        }

        asyncLib.parallelLimit(functions, constants.parallelLimit, function onAyncDone(error) {
            callback(error, jsRows);
        });
    } else {
        callback(null, jsRows);
    }
};

/**
 * Read a JSON rows.
 *
 * @function
 * @memberof! RowsReader
 * @public
 * @param {Array} jsRows - The JS objects holding the row data.
 * @returns {object} The JSON object
 */
RowsReader.prototype.readJSON = function (jsRows) {
    var json;
    if (jsRows) {
        if (jsRows.length) {
            var keys = Object.keys(jsRows[0]);
            if (keys.length !== 1) {
                throw new Error('Expected exactly 1 column in response, found: ' + keys.length);
            }

            json = [];
            var column = keys[0];

            var index;
            for (index = 0; index < jsRows.length; index++) {
                json.push(recordReader.readJSON(jsRows[index], column));
            }
        } else {
            json = [];
        }
    }

    return json;
};

module.exports = new RowsReader();
