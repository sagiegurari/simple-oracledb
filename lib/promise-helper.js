'use strict';

/**
 * Calls the provided function with a callback.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} run - The async function to call (callback will be provided)
 * @returns {object} The promise
 */
module.exports = function runPromise(run) {
    var promise;
    var callback;

    if (global.Promise) {
        promise = new global.Promise(function runViaPromise(resolve, reject) {
            callback = function promiseCallback(error, output) {
                if (error) {
                    reject(error);
                } else {
                    resolve(output);
                }
            };

            run(callback);
        });
    } else {
        throw new Error('No callback provided and promise not supported.');
    }

    return promise;
};
