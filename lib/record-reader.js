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
 * @param {Object} field - The field value
 * @param {Object} info - Internal info holder
 * @param {AsyncCallback} callback - called when the value is fully read or in case of an error
 */
RecordReader.prototype.getValue = function (field, info, callback) {
    if ((field === null) || (field === undefined)) {
        callback(null, field);
    } else {
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
                info.lobFound = true;
                stream.read(field, binary, callback);
            } else {
                callback(new Error('Unsupported type provided: ' + (typeof field) + ' value: ' + field));
            }
        }
    }
};

/**
 * Returns a handler function.
 *
 * @function
 * @memberof! RecordReader
 * @private
 * @param {Object} jsObject - The result object holder to populate
 * @param {String} columnName - The field name
 * @param {Object} value - The field value
 * @param {Object} info - Internal info holder
 * @returns {function} The handler function
 */
RecordReader.prototype.createFieldHandler = function (jsObject, columnName, value, info) {
    var self = this;

    return function handleField(asyncCallback) {
        self.getValue(value, info, function onValue(error, jsValue) {
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
 * @param {Object|Array} row - The oracle row object
 * @param {Object} info - Internal info holder
 * @param {AsyncCallback} callback - called when the row is fully read or in case of an error
 */
RecordReader.prototype.read = function (columnNames, row, info, callback) {
    var self = this;

    var jsObject = {};
    var functions = [];
    var columnName;
    var index;
    var value;
    if (Array.isArray(row)) {
        for (index = 0; index < columnNames.length; index++) {
            columnName = columnNames[index];

            value = row[index];

            functions.push(self.createFieldHandler(jsObject, columnName.name, value, info));
        }
    } else {
        for (index = 0; index < columnNames.length; index++) {
            columnName = columnNames[index];

            value = row[columnName.name];

            functions.push(self.createFieldHandler(jsObject, columnName.name, value, info));
        }
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
 * @param {Object} jsRow - The JS object holding the row data.
 * @param {String} column - The column name
 * @returns {Object} The JSON object
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
