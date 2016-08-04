'use strict';

/**
 * Promise utility class.
 *
 * @author Sagie Gur-Ari
 * @class PromiseHelper
 * @private
 */
function PromiseHelper() {
    this.extensions = {
        pool: {},
        connection: {}
    };
}

/**
 * Calls the provided function with a callback.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} run - The async function to call (callback will be provided)
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 */
PromiseHelper.prototype.runPromise = function (run) {
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

/**
 * Calls the provided function with a callback and if needed, return a promise.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} run - The async function to call (callback will be provided)
 * @param {function} [callback] - An optional callback function
 * @param {boolean} [force=false] - If true, do not check if promise is supported
 * @returns {Promise} In case of no callback provided in input, this function will return a promise
 * @example
 * ```js
 * promiseHelper.run(function myFunc(promiseCallback) {
 *   //do some async activity...
 * }, function onFuncDone(error, result) {
 *   if (error) {
 *     //function failed.
 *   } else {
 *     //function done
 *   }
 * });
 * ```
 */
PromiseHelper.prototype.run = function (run, callback, force) {
    //if promise requested and supported by current platform
    var promise;
    if ((force || global.Promise) && (!callback)) {
        promise = this.runPromise(run);
    } else {
        run(callback);
    }

    return promise;
};

module.exports = new PromiseHelper();
