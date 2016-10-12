'use strict';

var semver = require('semver');

var nodejsVersion = process.version.substring(1);

/*eslint-disable valid-jsdoc*/
//jscs:disable jsDoc
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
 *
 * @also
 *
 * Returns a defer type function.
 *
 * @function
 * @memberof! Defer
 * @private
 * @param {boolean} [ioSafe=false] - Ensure IO safe
 * @returns {function} A defer function
 * @example
 * ```js
 * //get a defer function that is IO safe
 * var deferCallback = defer(true);
 *
 * //use defer function
 * defer(onCallback() {
 *   //do something
 * });
 * ```
 */
module.exports = function get(comptibleVersionOrIOSafe) {
    var deferCallback = process.nextTick;

    /*istanbul ignore else*/
    if (comptibleVersionOrIOSafe) {
        if (typeof comptibleVersionOrIOSafe === 'boolean') {
            deferCallback = setImmediate;
        } else if (semver.lt(comptibleVersionOrIOSafe, '0.12.0')) {
            deferCallback = setImmediate;
        }
    } else if (semver.lt(nodejsVersion, '0.12.0')) {
        deferCallback = setImmediate;
    }

    return deferCallback;
};
//jscs:enable jsDoc
/*eslint-enable valid-jsdoc*/
