'use strict';

var async = require('async');
var stream = require('./stream');

/*jslint debug: true */
/**
 * Record writing helper functions.
 *
 * @author Sagie Gur-Ari
 * @class RecordWriter
 * @public
 */
function RecordWriter() {
    //should not be called
}
/*jslint debug: false */

/**
 * Writes all LOBs columns via out bindings of the INSERT/UPDATE command.
 *
 * @function
 * @memberof! RecordWriter
 * @public
 * @param {object} outBindings - The output bindings of the INSERT/UPDATE result
 * @param {object} lobData - The LOB data holder (key column name, value column value)
 * @param {AsyncCallback} callback - called when the row is fully written to or in case of an error
 */
RecordWriter.prototype.write = function (outBindings, lobData, callback) {
    var functions = [];
    var bindVariableNames = Object.keys(lobData);

    bindVariableNames.forEach(function handleColumn(bindVariableName) {
        var value = lobData[bindVariableName];

        if (value && bindVariableName && outBindings[bindVariableName] && (outBindings[bindVariableName].length === 1)) {
            var lobStream = outBindings[bindVariableName][0];

            functions.push(function writeField(asyncCallback) {
                stream.write(lobStream, value, asyncCallback);
            });
        }
    });

    async.parallel(functions, callback);
};

/**
 * Writes all LOBs columns via out bindings of the INSERT/UPDATE command with support of multiple rows.
 *
 * @function
 * @memberof! RecordWriter
 * @public
 * @param {object} outBindings - The output bindings of the INSERT/UPDATE result
 * @param {object} lobData - The LOB data holder (key column name, value column value)
 * @param {AsyncCallback} callback - called when the row is fully written to or in case of an error
 */
RecordWriter.prototype.writeMultiple = function (outBindings, lobData, callback) {
    var functions = [];
    var bindVariableNames = Object.keys(lobData);

    bindVariableNames.forEach(function handleColumn(bindVariableName) {
        var value = lobData[bindVariableName];

        if (value && bindVariableName && outBindings[bindVariableName] && outBindings[bindVariableName].length) {
            var lobStreams = outBindings[bindVariableName];

            lobStreams.forEach(function (lobStream) {
                functions.push(function writeField(asyncCallback) {
                    stream.write(lobStream, value, asyncCallback);
                });
            });
        }
    });

    async.parallel(functions, callback);
};

module.exports = new RecordWriter();
