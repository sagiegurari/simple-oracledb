'use strict';

var asyncLib = require('async');
var stream = require('./stream');
var constants = require('./constants');

/*jslint debug: true */
/**
 * Record reading helper functions.
 *
 * @author Sagie Gur-Ari
 * @class RecordReader
 * @private
 */
function RecordReader() {
    //should not be called
}
/*jslint debug: false */

/**
 * Returns the value of the field from the row.
 *
 * @function
 * @memberof! RecordReader
 * @private
 * @param {object} field - The field value
 * @param {AsyncCallback} callback - called when the value is fully read or in case of an error
 */
RecordReader.prototype.getValue = function (field, callback) {
    if ((field !== null) && (field !== undefined)) {
        switch (field.type) {
        case constants.clobType:
            stream.read(field, false, callback);
            break;
        case constants.blobType:
            stream.read(field, true, callback);
            break;
        default:
            callback(null, field);
        }
    } else {
        callback();
    }
};

/**
 * Returns a handler function.
 *
 * @function
 * @memberof! RecordReader
 * @private
 * @param {object} jsObject - The result object holder to populate
 * @param {string} columnName - The field name
 * @param {object} value - The field value
 * @returns {function} The handler function
 */
RecordReader.prototype.createFieldHandler = function (jsObject, columnName, value) {
    var self = this;

    return function handleField(asyncCallback) {
        var callback = asyncCallback;
        asyncCallback = function onCallback(error, data) {
            process.nextTick(function invokeCallback() {
                callback(error, data);
            });
        };

        self.getValue(value, function onValue(error, jsValue) {
            if (error) {
                asyncCallback(error);
            } else {
                jsObject[columnName] = jsValue;

                asyncCallback(null, jsObject);
            }
        });
    };
};

/**
 * Reads all data from the provided oracle record.
 *
 * @function
 * @memberof! RecordReader
 * @public
 * @param {Array} columnNames - Array of strings holding the column names of the results
 * @param {object|Array} row - The oracle row object
 * @param {AsyncCallback} callback - called when the row is fully read or in case of an error
 */
RecordReader.prototype.read = function (columnNames, row, callback) {
    var self = this;

    var jsObject = {};
    var functions = [];
    if (Array.isArray(row)) {
        columnNames.forEach(function handleColumn(columnName, index) {
            var value = row[index];

            functions.push(self.createFieldHandler(jsObject, columnName.name, value));
        });
    } else {
        columnNames.forEach(function handleColumn(columnName) {
            var value = row[columnName.name];

            functions.push(self.createFieldHandler(jsObject, columnName.name, value));
        });
    }

    asyncLib.parallelLimit(functions, constants.parallelLimit, function onAyncDone(error) {
        callback(error, jsObject);
    });
};

/**
 * Read a JSON record.
 *
 * @function
 * @memberof! RecordReader
 * @public
 * @param {object} jsRow - The JS object holding the row data.
 * @param {string} column - The column name
 * @returns {object} The JSON object
 */
RecordReader.prototype.readJSON = function (jsRow, column) {
    var json;
    if (jsRow && column) {
        var jsonStr = jsRow[column];

        if (jsonStr) {
            json = JSON.parse(jsonStr);
        } else {
            json = {};
        }
    }

    return json;
};

module.exports = new RecordReader();
