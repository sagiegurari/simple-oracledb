'use strict';

var asyncLib = require('async');
var stream = require('./stream');

/*jslint debug: true */
/**
 * Record writing helper functions.
 *
 * @author Sagie Gur-Ari
 * @class RecordWriter
 * @private
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
 * @param {Object} outBindings - The output bindings of the INSERT/UPDATE result
 * @param {Object} lobData - The LOB data holder (key column name, value column value)
 * @param {AsyncCallback} callback - called when the row is fully written to or in case of an error
 */
RecordWriter.prototype.write = function (outBindings, lobData, callback) {
    var functions = [];
    var bindVariableNames = Object.keys(lobData);

    var createWriteFieldFunction = function (lobStream, value) {
        return function writeField(asyncCallback) {
            stream.write(lobStream, value, asyncCallback);
        };
    };

    var index;
    var bindVariableName;
    var value;
    var lobStream;
    for (index = 0; index < bindVariableNames.length; index++) {
        bindVariableName = bindVariableNames[index];

        value = lobData[bindVariableName];

        if (value && bindVariableName && outBindings[bindVariableName] && (outBindings[bindVariableName].length === 1)) {
            lobStream = outBindings[bindVariableName][0];

            functions.push(createWriteFieldFunction(lobStream, value));
        }
    }

    asyncLib.series(functions, callback);
};

/**
 * Writes all LOBs columns via out bindings of the INSERT/UPDATE command with support of multiple rows.
 *
 * @function
 * @memberof! RecordWriter
 * @public
 * @param {Object} outBindings - The output bindings of the INSERT/UPDATE result
 * @param {Object} lobData - The LOB data holder (key column name, value column value)
 * @param {AsyncCallback} callback - called when the row is fully written to or in case of an error
 */
RecordWriter.prototype.writeMultiple = function (outBindings, lobData, callback) {
    var functions = [];
    var bindVariableNames = Object.keys(lobData);

    var createWriteFieldFunction = function (lobStream, value) {
        return function writeField(asyncCallback) {
            stream.write(lobStream, value, asyncCallback);
        };
    };

    var bindIndex;
    var streamIndex;
    var bindVariableName;
    var lobStream;
    var value;
    var lobStreams;
    for (bindIndex = 0; bindIndex < bindVariableNames.length; bindIndex++) {
        bindVariableName = bindVariableNames[bindIndex];

        value = lobData[bindVariableName];

        if (value && bindVariableName && outBindings[bindVariableName] && outBindings[bindVariableName].length) {
            lobStreams = outBindings[bindVariableName];

            for (streamIndex = 0; streamIndex < lobStreams.length; streamIndex++) {
                lobStream = lobStreams[streamIndex];

                functions.push(createWriteFieldFunction(lobStream, value));
            }
        }
    }

    asyncLib.series(functions, callback);
};

module.exports = new RecordWriter();
