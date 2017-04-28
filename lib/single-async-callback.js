'use strict';

var funcs = require('funcs-js');

/**
 * Wraps the provided callback and ensures it is called only once.
 *
 * @function
 * @memberof! SingleAsyncCallback
 * @private
 * @param {AsyncCallback} callback - The callback to wrap
 * @returns {AsyncCallback} A new wrapper callback
 */
module.exports = function wrap(callback) {
    var onAsyncCallback;
    if (callback) {
        onAsyncCallback = funcs.once(callback);
    }

    return onAsyncCallback;
};
