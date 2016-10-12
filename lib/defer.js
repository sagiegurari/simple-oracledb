'use strict';

var semver = require('semver');

/**
 * Returns a defer type function.
 *
 * @function
 * @memberof! Defer
 * @private
 * @param {string} [comptibleVersion=process.version] - The nodejs version the defer function should be compatible with
 * @returns {function} A defer function
 * @example
 * ```js
 * //get a defer function based on current nodejs version
 * var deferCallback = defer();
 *
 * //use defer function
 * defer(onCallback() {
 *   //do something
 * });
 * ```
 */
module.exports = function get(comptibleVersion) {
    var deferCallback = process.nextTick;

    var version = comptibleVersion || process.version.substring(1);
    if (semver.lt(version, '0.12.0')) {
        deferCallback = setImmediate;
    }

    return deferCallback;
};
