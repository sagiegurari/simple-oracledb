'use strict';

var asyncLib = require('async');
var recordReader = require('./record-reader');
var constants = require('./constants');
var defer = require('./defer');

/**
 * Rows array reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @class RowsReader
 * @private
 */
function RowsReader() {
    this.deferCallback = defer();
}

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
 * @param {boolean} [flattenStack=false] - True to flatten the stack to prevent stack overflow issues
 * @returns {function} The handler function
 */
RowsReader.prototype.createRecordHandler = function (columnNames, row, index, jsRows, flattenStack) {
    var self = this;

    return function callRecordReader(asyncCallback) {
        recordReader.read(columnNames, row, function onRowRead(error, jsObject) {
            //ensure async to prevent max stack size error
            if (flattenStack) {
                var orgAsyncCallback = asyncCallback;
                asyncCallback = function onCallback(rowError, data) {
                    self.deferCallback(function invokeCallback() {
                        orgAsyncCallback(rowError, data);
                    });
                };
            }

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
 * @param {object} [options] - Options holder
 * @param {number} [options.flattenStackEveryRows=20] - The amount of rows after which the JS stack is flattened, low number can result in performance impact, high number can result in stack overflow error
 * @param {AsyncCallback} callback - called when all rows are fully read or in case of an error
 */
RowsReader.prototype.read = function (columnNames, rows, options, callback) {
    var jsRows = [];

    if ((!callback) && (typeof options === 'function')) {
        callback = options;
        options = null;
    }

    options = options || {};
    var flattenStackEveryRows = options.flattenStackEveryRows || 20;

    if (rows && rows.length) {
        var functions = [];

        var index;
        for (index = 0; index < rows.length; index++) {
            functions.push(this.createRecordHandler(columnNames, rows[index], index, jsRows, (index % flattenStackEveryRows) === 0));
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
