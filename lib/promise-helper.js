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
 * Empty function.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @returns {undefined} Empty return
 */
PromiseHelper.prototype.noop = function () {
    return undefined;
};

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
    var promiseCallback;

    if (global.Promise) {
        promise = new global.Promise(function runViaPromise(resolve, reject) {
            promiseCallback = function (error, output) {
                if (error) {
                    reject(error);
                } else {
                    resolve(output);
                }
            };

            run(promiseCallback);
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

/**
 * Adds promise support for the provided function.
 *
 * @function
 * @memberof! PromiseHelper
 * @private
 * @param {function} func - The function to promisify
 * @param {object} [options] - Holds various behaviour options
 * @param {boolean} [options.force=false] - If true, do not check if promise is supported
 * @param {boolean} [options.defaultCallback=false] - If true and no callback provided, generate an empty callback
 * @param {number} [options.callbackMinIndex=0] - The minimum index in the arguments that the callback is found in
 * @returns {function} The wrapper function
 * @example
 * ```js
 * Connection.prototype.query = promiseHelper.promisify(Connection.prototype.query);
 * ```
 */
PromiseHelper.prototype.promisify = function (func, options) {
    //jscs:disable safeContextKeyword
    var promiseHelper = this;
    //jscs:enable safeContextKeyword

    options = options || {};

    return function promiseWrapper() {
        /*eslint-disable no-invalid-this*/
        var self = this;
        /*eslint-enable no-invalid-this*/

        var argumentsArray = Array.prototype.slice.call(arguments, 0);

        //if last element is callback but undefined was provided
        var continueRemove = true;
        do {
            if (argumentsArray.length && (argumentsArray[argumentsArray.length - 1] === undefined)) {
                argumentsArray.pop();
            } else {
                continueRemove = false;
            }
        } while (continueRemove);

        var minArgs = (options.callbackMinIndex || 0) + 1;

        var callback;
        var output;
        if ((argumentsArray.length >= minArgs) && (typeof argumentsArray[argumentsArray.length - 1] === 'function')) {
            output = func.apply(self, argumentsArray);
        } else { //promise
            if ((!options.force) && (!options.defaultCallback) && (!global.Promise)) {
                throw new Error('No callback provided and promise not supported.');
            }

            output = promiseHelper.run(function asyncFunction(promiseCallback) {
                callback = callback || promiseCallback;

                if ((!callback) && options.defaultCallback) {
                    callback = promiseHelper.noop;
                }

                argumentsArray.push(callback);

                func.apply(self, argumentsArray);
            }, callback, options.force);
        }

        return output;
    };
};

module.exports = new PromiseHelper();
