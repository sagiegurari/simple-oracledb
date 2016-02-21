'use strict';

/**
 * Async callback which ensures that the callback is only called once.
 *
 * @author Sagie Gur-Ari
 * @namespace SingleAsyncCallback
 * @private
 */
module.exports = {
    /**
     * Wraps the provided callback and ensures it is called only once.
     *
     * @function
     * @memberof! SingleAsyncCallback
     * @public
     * @param {AsyncCallback} callback - The callback to wrap
     * @returns {AsyncCallback} A new wrapper callback
     */
    wrap: function wrap(callback) {
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
    }
};
