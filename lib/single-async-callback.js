'use strict';

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
    var wrapper;
    if (callback) {
        var callbackCalled = false;

        wrapper = function onAsyncCallback(error, data) {
            if (!callbackCalled) {
                callbackCalled = true;

                process.nextTick(function invokeCallback() {
                    callback(error, data);
                });
            }
        };
    }

    return wrapper;
};
