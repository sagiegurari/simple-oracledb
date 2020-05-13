'use strict';

const asyncLib = require('async');
const stream = require('./stream');

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
    const functions = [];
    const bindconstiableNames = Object.keys(lobData);

    const createWriteFieldFunction = function (lobStream, value) {
        return function writeField(asyncCallback) {
            stream.write(lobStream, value, asyncCallback);
        };
    };

    for (let index = 0; index < bindconstiableNames.length; index++) {
        const bindconstiableName = bindconstiableNames[index];

        const value = lobData[bindconstiableName];

        if (value && bindconstiableName && outBindings[bindconstiableName] && (outBindings[bindconstiableName].length === 1)) {
            const lobStream = outBindings[bindconstiableName][0];

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
    const functions = [];
    const bindconstiableNames = Object.keys(lobData);

    const createWriteFieldFunction = function (lobStream, value) {
        return function writeField(asyncCallback) {
            stream.write(lobStream, value, asyncCallback);
        };
    };

    for (let bindIndex = 0; bindIndex < bindconstiableNames.length; bindIndex++) {
        const bindconstiableName = bindconstiableNames[bindIndex];

        const value = lobData[bindconstiableName];

        if (value && bindconstiableName && outBindings[bindconstiableName] && outBindings[bindconstiableName].length) {
            const lobStreams = outBindings[bindconstiableName];

            for (let streamIndex = 0; streamIndex < lobStreams.length; streamIndex++) {
                const lobStream = lobStreams[streamIndex];

                functions.push(createWriteFieldFunction(lobStream, value));
            }
        }
    }

    asyncLib.series(functions, callback);
};

module.exports = new RecordWriter();
