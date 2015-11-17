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
 * @public
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
        var type = typeof field;
        switch (type) {
        case 'number':
        case 'string':
        case 'boolean':
            callback(null, field);
            break;
        default:
            if (field instanceof Date) {
                callback(null, field);
            } else if (field.type !== undefined) { //LOB
                var binary = (field.type === constants.blobType);
                stream.read(field, binary, callback);
            } else {
                callback(new Error('Unsupported type provided: ' + field));
            }
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

    asyncLib.parallel(functions, function onAyncDone(error) {
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
